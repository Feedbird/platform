import { CanvasFormField } from "@/components/forms/form-canvas";
import { supabase } from "@/lib/supabase/client";
import { FormField, FormFieldConfig } from "@/lib/store/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { ApiHandlerError } from "../../shared";
import { nestedObjectEqual } from "@/lib/utils/transformers";

export class FormFieldsHandler {
  supabase: SupabaseClient;
  constructor() {
    this.supabase = supabase;
  }

  // TODO Type on client
  static async fetchFormFields(formId: string): Promise<FormField[]> {
    try {
      const { data, error } = await supabase
        .from("form_fields")
        .select("*")
        .eq("form_id", formId)
        .order("position", { ascending: true });
      if (error) {
        if (error.code === "PGRST116") {
          throw new ApiHandlerError("Form fields not found", 404);
        }
        throw new ApiHandlerError("Database error: " + error.message);
      }

      return data || [];
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError("Internal server error: " + e);
    }
  }

  static async updateFormFields(
    formId: string,
    formFields: CanvasFormField[]
  ): Promise<void> {
    try {
      const { error, data } = await supabase
        .from("form_fields")
        .select("*")
        .eq("form_id", formId);

      if (error) {
        throw new ApiHandlerError("Database error: " + error.message);
      }

      const currentFieldIds = data.map((field) => field.id);

      const newFields = formFields.filter(
        (field) => !currentFieldIds.includes(field.id)
      );

      const existingFields = formFields.filter((field) =>
        currentFieldIds.includes(field.id)
      );

      const fieldsToRemove = data?.filter(
        (dbField) => !formFields.map((f) => f.id).includes(dbField.id)
      );

      await this.removeFields(formId, fieldsToRemove);
      const fieldsToUpdate = this.validateUpdates(formId, data, existingFields);
      const fieldsToInsert = this.mapInsertionFields(formId, newFields);

      await supabase
        .from("form_fields")
        .upsert([...fieldsToUpdate, ...fieldsToInsert]);
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError("Internal server error: " + e);
    }
  }

  private static mapInsertionFields(
    formId: string,
    fieldsToInsert: CanvasFormField[]
  ): FormField[] {
    if (fieldsToInsert.length === 0) return [];

    const mappedFields: FormField[] = fieldsToInsert.map((field) => ({
      id: field.id,
      formId: formId,
      type: field.type,
      position: field.position,
      config: field.config || {},
      title: field.config?.title?.value || "",
      description: field.config?.description?.value || "",
      required: field.config?.isRequired?.value || false,
    } as FormField));

    return mappedFields;
  }

  private static validateUpdates(
    formId: string,
    currentFields: FormField[],
    fieldsToUpdate: CanvasFormField[]
  ) {
    if (fieldsToUpdate.length === 0) return [];
    const currentFieldsIds = fieldsToUpdate.map((f) => f.id);
    const matchedFields = currentFields.filter((f) =>
      currentFieldsIds.includes(f.id)
    );

    if (matchedFields.length !== fieldsToUpdate.length) {
      throw new ApiHandlerError("Some form fields were not found", 404);
    }

    const updates: FormField[] = [];

    for (const field of fieldsToUpdate) {
      const currentField = matchedFields.find((f) => f.id === field.id);
      if (!currentField)
        throw new ApiHandlerError(
          `Form field under ${field.id} was not found as existent`,
          404
        );

      const mappedField: CanvasFormField = {
        id: currentField.id,
        type: currentField.type,
        position: field.position,
        config: field.config,
      };

      // If there's any difference, treat updates as atomic.
      const isDifferent = !nestedObjectEqual(field, mappedField);

      if (isDifferent) {
        updates.push({
          id: field.id,
          type: field.type,
          formId: formId,
          position: field.position,
          config: field.config as FormFieldConfig || {},
          title: field.config?.title?.value as string || "",
          description: field.config?.description?.value as string || "",
          required: field.config?.isRequired?.value as boolean || false,
        });
      }
    }

    return updates;
  }

  private static async removeFields(
    formId: string,
    fieldsToRemove: FormField[]
  ) {
    if (fieldsToRemove.length === 0) return;
    const fieldIds = fieldsToRemove.map((field) => field.id);

    const { error } = await supabase
      .from("form_fields")
      .delete()
      .in("id", fieldIds)
      .eq("form_id", formId);

    if (error) {
      throw new ApiHandlerError("Database error: " + error.message);
    }
  }
}
