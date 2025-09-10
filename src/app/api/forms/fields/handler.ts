import { CanvasFormField } from "@/components/forms/FormCanvas";
import { supabase } from "@/lib/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { ApiHandlerError } from "../../shared";

export class FormFieldsHandler {
  supabase: SupabaseClient;
  constructor() {
    this.supabase = supabase;
  }

  // TODO Type on client
  static async fetchFormFields(formId: string): Promise<any[]> {
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
    // TODO This is hardcode to remove all forms and re-write.
    // THIS SHOULD USE A DIFFERENT APPROACH
    // Done only for testing purposes

    try {
      //! Deleting all current fields
      const { error: deleteError } = await supabase
        .from("form_fields")
        .delete()
        .eq("form_id", formId);

      if (deleteError) {
        throw new ApiHandlerError("Database error: " + deleteError.message);
      }

      const fieldsToInsert = formFields.map((field, index) => ({
        id: crypto.randomUUID(),
        form_id: formId,
        type: field.type,
        position: field.order,
        config: field.config || {},
        title: field.config?.title?.value || "",
        description: field.config?.description?.value || "",
        required: field.config?.required?.value || false,
      }));

      const { error: insertError } = await supabase
        .from("form_fields")
        .insert(fieldsToInsert);

      if (insertError) {
        throw new ApiHandlerError("Database error: " + insertError.message);
      }
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError("Internal server error: " + e);
    }
  }
}
