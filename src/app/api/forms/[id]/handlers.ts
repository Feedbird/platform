import { Form, supabase } from "@/lib/supabase/client";
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
      const { data, error } = await supabase
        .from("forms")
        .select(`*, services:services(id, name)`)
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
    updates: Partial<Form>
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
}
