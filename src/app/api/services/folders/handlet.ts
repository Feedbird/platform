import { supabase } from "@/lib/supabase/client";
import { ApiHandlerError } from "../../shared";

export class ServiceFolderHandler {
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from("service_folders")
        .select(
          "*, services(*, service_plans(*), channels:service_channels(*))"
        );

      if (error) {
        throw new ApiHandlerError("Database error: " + error.message);
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
