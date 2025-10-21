import { ApiHandlerError } from "@/app/api/shared";
import { FormSubmission, supabase } from "@/lib/supabase/client";

export class SubmissionHandler {
  static async getSubmission(submissionId: string): Promise<FormSubmission> {
    try {
      const { data, error } = await supabase
        .from("form_submissions")
        .select(`*`)
        .eq("id", submissionId)
        .single();

      if (error) {
        throw new ApiHandlerError(
          `Failed to fetch submission: ${(error as Error).message}`,
          500
        );
      }

      return data;
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError("Failed to fetch submission", 500);
    }
  }
}
