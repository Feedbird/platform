import { supabase } from "@/lib/supabase/client";
import { ApiHandlerError } from "../../shared";

export type CreateSubmissionPayload = {
  workspaceId: string;
  formId: string;
  answers: Record<string, any>;
  snapshot: Record<string, any>;
};

export class SubmissionHandler {
  static async submitForm(payload: CreateSubmissionPayload) {
    try {
      const { data, error } = await supabase
        .from("form_submissions")
        .insert({
          workspace_id: payload.workspaceId,
          form_id: payload.formId,
          answers: payload.answers,
          schema_snapshot: payload.snapshot,
        })
        .select(`id`)
        .single();

      if (error) {
        throw new ApiHandlerError(
          "Failed to submit form: " + JSON.stringify(error),
          500
        );
      }

      return data;
    } catch (e) {
      console.error("Error submitting form:", e);
      throw new ApiHandlerError("Failed to submit form", 500);
    }
  }
}
