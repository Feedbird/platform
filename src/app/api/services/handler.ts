import { Service, supabase } from "@/lib/supabase/client";
import { ApiHandlerError } from "../shared";

export class ServicesHandler {
  static async getServices(
    workspaceId: string,
    available?: boolean
  ): Promise<Service[]> {
    //! TODO: Type on @client
    try {
      let query = supabase
        .from("services")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (available === true) {
        query = query.is("form_id", null);
      }

      const { data, error } = await query;

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

  static async verifyServicesExists(
    serviceIds: string[],
    workspaceId: string
  ): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .in("id", serviceIds)
        .eq("workspace_id", workspaceId);

      if (error) {
        throw new ApiHandlerError("Database error: " + error.message);
      }

      // Check if all services exist
      if (data.length !== serviceIds.length) {
        throw new ApiHandlerError(
          `Some services not found. Expected ${serviceIds.length}, found ${data.length}`
        );
      }

      return data;
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError("Internal server error: " + e);
    }
  }

  static async assignFormToServices(
    formId: string | null,
    serviceIds: string[]
  ) {
    try {
      const { error } = await supabase
        .from("services")
        .update({ form_id: formId })
        .in("id", serviceIds);

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
}
