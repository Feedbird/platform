import { supabase } from "@/lib/supabase/client";
import { ApiHandlerError } from "../../shared";
import { FormSubmission } from "@/lib/supabase/interfaces";

export type CreateSubmissionPayload = {
  workspaceId: string;
  formId: string;
  email: string;
  answers: Record<string, any>;
  snapshot: Record<string, any>;
};

export class SubmissionsHandler {
  static async submitForm(payload: CreateSubmissionPayload) {
    try {
      const { data, error } = await supabase
        .from("form_submissions")
        .insert({
          workspace_id: payload.workspaceId,
          form_id: payload.formId,
          submitted_by: payload.email,
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

  static async getSubmissions(formId: string): Promise<FormSubmission[]> {
    try {
      const { data, error } = await supabase
        .from("form_submissions")
        .select("*")
        .eq("form_id", formId);

      if (error) {
        throw new ApiHandlerError(
          "Failed to fetch submissions: " + error.message,
          500
        );
      }

      return data;
    } catch (e) {
      console.error("Error fetching submissions:", e);
      throw new ApiHandlerError("Failed to fetch submissions", 500);
    }
  }
}
