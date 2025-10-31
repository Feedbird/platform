import { supabase } from '@/lib/supabase/client';
import { Service } from '@/lib/store/types';
import { ApiHandlerError } from '../shared';

type ServiceUpdatePayload = {
  name?: string;
  description?: string;
  is_recurring?: boolean;
  image_url?: string;
  is_draft_save: boolean;
};

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

  static async createDraftService({
    workspaceId,
  }: {
    workspaceId: string;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          id: crypto.randomUUID(),
          workspace_id: workspaceId,
          name: 'New Service',
        })
        .select('id')
        .single();

      if (error) {
        throw new ApiHandlerError('Database error: ' + error.message);
      }

      return data.id;
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError('Internal server error: ' + e);
    }
  }

  static async getServiceById(serviceId: string): Promise<Service> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(
          '*, service_plans(*), channels:service_channels(*), icon:icons(*)'
        )
        .eq('id', serviceId)
        .single();

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

  static async updateServiceById(
    serviceId: string,
    payload: ServiceUpdatePayload
  ): Promise<Service> {
    try {
      const { is_draft_save, ...updateData } = payload;
      if (is_draft_save === undefined || Object.keys(updateData).length === 0) {
        throw new ApiHandlerError(`Not enough data to update service.`, 400);
      }

      const { error, data } = await supabase
        .from('services')
        .update({
          ...updateData,
          ...(is_draft_save ? { status: 2 } : { status: 1 }),
        })
        .eq('id', serviceId)
        .select(
          '*, service_plans(*), channels:service_channels(*), icon:icons(*)'
        )
        .single();
      if (error || !data) {
        throw new ApiHandlerError('Database error: ' + error?.message);
      }

      return data;
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError('Internal server error: ' + e);
    }
  }
}
