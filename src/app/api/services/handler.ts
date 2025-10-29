import { supabase } from '@/lib/supabase/client';
import { Service } from '@/lib/store/types';
import { ApiHandlerError } from '../shared';

export class ServicesHandler {
  static async getServices(
    workspaceId: string,
    available?: boolean
  ): Promise<Service[]> {
    try {
      let query = supabase
        .from('services')
        .select(
          '*, service_plans(*), channels:service_channels(*), icon:icons(*)'
        )
        .eq('workspace_id', workspaceId);

      if (available === true) {
        query = query.is('form_id', null);
      }

      const { data, error } = await query;

      if (error) {
        throw new ApiHandlerError('Database error: ' + error.message);
      }

      return data;
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError('Internal server error: ' + e);
    }
  }

  static async getServicesByFormId(formId: string): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('form_id', formId);
      if (error) {
        throw new ApiHandlerError('Database error: ' + error.message);
      }
      return data;
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError('Internal server error: ' + e);
    }
  }

  static async verifyServicesExists(
    serviceIds: string[],
    workspaceId: string
  ): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id')
        .in('id', serviceIds)
        .eq('workspace_id', workspaceId);

      if (error) {
        throw new ApiHandlerError('Database error: ' + error.message);
      }

      // Check if all services exist
      if (data.length !== serviceIds.length) {
        throw new ApiHandlerError(
          `Some services not found. Expected ${serviceIds.length}, found ${data.length}`
        );
      }
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError('Internal server error: ' + e);
    }
  }

  static async assignFormToServices(
    formId: string | null,
    serviceIds: string[]
  ) {
    try {
      const { error } = await supabase
        .from('services')
        .update({ form_id: formId })
        .in('id', serviceIds);

      if (error) {
        throw new ApiHandlerError('Database error: ' + error.message);
      }
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError('Internal server error: ' + e);
    }
  }
}
