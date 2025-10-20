import { Form, FormField, supabase } from "@/lib/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { ApiHandlerError } from "../../shared";
import { ServicesHandler } from "../../services/handler";
import { plainArrayEqual } from "@/lib/utils/transformers";

export class FormHandler {
  supabase: SupabaseClient;
  constructor() {
    this.supabase = supabase;
  }

  static async deleteForm(formId: string): Promise<void> {
    try {
      const formExists = await supabase
        .from("forms")
        .select("id")
        .eq("id", formId)
        .single();
      if (formExists.error || !formExists.data) {
        throw new ApiHandlerError("Form ID was not found", 404);
      }

      await supabase
        .from("services")
        .update({ form_id: null })
        .eq("form_id", formId);
      const { error } = await supabase.from("forms").delete().eq("id", formId);

      if (error) {
        throw new ApiHandlerError("Database error: " + error.message);
      }
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError("Internal server error: " + e);
    }
  }

  static async fetchFormById(formId: string): Promise<Form> {
    try {
      // include nested service_plans for each service and return only the first plan
      const { data, error } = await supabase
        .from("forms")
        .select(
          `*, services:services(id, name, service_plans:service_plans(*))`
        )
        .eq("id", formId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new ApiHandlerError("Form not found", 404);
        }
        throw new ApiHandlerError("Database error: " + error.message);
      }

      if (!data) {
        throw new ApiHandlerError("Form not found", 404);
      }

      return data;
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError("Internal server error: " + e);
    }
  }

  static async updateForm(
    formId: string,
    updates: Partial<Omit<Form, "services"> & { services?: string[] }>
  ): Promise<Form> {
    try {
      const form = await supabase
        .from("forms")
        .select("id, workspace_id")
        .eq("id", formId)
        .single();

      if (form.error || !form.data) {
        throw new ApiHandlerError("Form ID was not found", 404);
      }

      if (updates.services) {
        const currentServices = await ServicesHandler.getServicesByFormId(
          formId
        );
        const currentServiceIds = currentServices.map((s) => s.id.toString());

        if (!plainArrayEqual(currentServiceIds, updates.services)) {
          const additionalServiceIds: string[] = updates.services.filter(
            (id) => !currentServiceIds.includes(id)
          );

          const removedServiceIds: string[] = currentServiceIds.filter(
            (id) => !updates.services!.includes(id)
          );

          if (removedServiceIds.length) {
            await ServicesHandler.assignFormToServices(null, removedServiceIds);
          }

          if (additionalServiceIds.length) {
            await ServicesHandler.verifyServicesExists(
              additionalServiceIds,
              form.data.workspace_id
            );
            await ServicesHandler.assignFormToServices(
              formId,
              additionalServiceIds
            );
          }
        }

        delete updates.services;
      }

      if (updates.status && updates.status === "published") {
        updates.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("forms")
        .update(updates)
        .eq("id", formId)
        .select("*, services:services(id, name)")
        .single();

      if (error) {
        throw new ApiHandlerError("Database error: " + error.message);
      }
      if (!data) {
        throw new ApiHandlerError("Failed to update form", 500);
      }

      return data;
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError("Internal server error: " + e);
    }
  }

  static async duplicateForm(formId: string): Promise<Form> {
    const newFormUUID = crypto.randomUUID();
    try {
      // Fetch current form
      const currentForm = await this.fetchForm(formId);
      const currentFormFields = await this.fetchFormFields(formId);

      // Duplicate the form
      const { data: newForm, error: newFormError } = await supabase
        .from("forms")
        .insert({ ...currentForm, id: newFormUUID })
        .select()
        .single();

      if (newFormError || !newForm) {
        throw new ApiHandlerError("Failed to duplicate form", 500);
      }

      if (currentFormFields.length) {
        const { data: insertedFields, error: newFormFieldsError } =
          await supabase
            .from("form_fields")
            .insert(
              currentFormFields.map((field) => ({
                ...field,
                id: crypto.randomUUID(),
                form_id: newFormUUID,
              }))
            )
            .select();

        if (newFormFieldsError) {
          throw new ApiHandlerError("Failed to duplicate form fields", 500);
        }

        newForm.fields_count = insertedFields.length;
      }

      newForm.submissions_count = 0;
      newForm.fields_count = newForm.fields_count ?? 0;
      newForm.services = [];

      return newForm;
    } catch (e) {
      await this.validateAndRollbackForm(newFormUUID);
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError("Internal server error: " + e);
    }
  }

  private static async fetchForm(
    formId: string,
    baseFetch: boolean = false
  ): Promise<Form> {
    const { data, error } = await supabase
      .from("forms")
      .select(`${baseFetch ? "id" : "*"} `)
      .eq("id", formId)
      .single();

    if (error) {
      throw new ApiHandlerError("Database error: " + error.message);
    }
    if (!data) {
      throw new ApiHandlerError("Form not found", 404);
    }

    delete data.created_at;
    delete data.updated_at;

    data.title = `${data.title} (copy)`;
    data.status = "draft";
    data.published_at = null;

    return data;
  }

  private static async fetchFormFields(
    formId: string,
    baseFetch: boolean = false
  ): Promise<FormField[]> {
    const { data, error } = await supabase
      .from("form_fields")
      .select(`${baseFetch ? "id" : "*"} `)
      .eq("form_id", formId);

    if (error) {
      throw new ApiHandlerError("Database error: " + error.message);
    }
    if (data.length) {
      data.forEach((field) => {
        delete field.created_at;
        delete field.updated_at;
      });
    }

    return data || [];
  }

  private static async validateAndRollbackForm(formId: string): Promise<void> {
    const form = await this.fetchForm(formId, true).catch(() => null);
    if (form) {
      await supabase.from("forms").delete().eq("id", formId);
    }

    const formFields = await this.fetchFormFields(formId, true).catch(
      () => null
    );
    if (formFields && formFields.length > 0) {
      await supabase.from("form_fields").delete().eq("form_id", formId);
    }
  }
}
