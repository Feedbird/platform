import { supabase } from '@/lib/supabase/client';
import { FetchIconsResponse } from '@/types';
import { WorkspaceHandler } from '../workspace/handler';
import { UserHandler } from '../user/handler';
import { ApiHandlerError } from '../shared';
import { IconSection } from '@/lib/store/primary-types';
import { Icon } from '@/lib/store';

type GetAllIconsParams = {
  section: IconSection;
  workspaceId: string | null;
  userId: string | null;
};

type CreateIconParams = {
  section: IconSection;
  workspaceId: string | null;
  userId: string | null;
  common_name: string;
  svg: string;
};

export class IconHandler {
  private static async verifyUserAndWorkspace(
    userId: string | null,
    workspaceId: string | null
  ) {
    // Any errors will be thrown by the handlers in case not found
    if (workspaceId) {
      await WorkspaceHandler.getWorkspaceById(workspaceId, 'id');
    }
    if (userId) {
      await UserHandler.getUserById(userId, 'id');
    }
  }
  static async getAllIcons({
    workspaceId,
    userId,
    section,
  }: GetAllIconsParams): Promise<FetchIconsResponse> {
    try {
      await this.verifyUserAndWorkspace(userId, workspaceId);

      const iconsQuery = supabase
        .from('icons')
        .select('*')
        .eq('section', section);

      if (workspaceId) iconsQuery.eq('workspace_id', workspaceId);
      if (userId) iconsQuery.eq('user_id', userId);

      const baseIcons = await iconsQuery;

      if (baseIcons.error || !baseIcons.data) {
        throw new ApiHandlerError(
          'Failed to fetch icons',
          500,
          baseIcons.error
        );
      }

      const defaultIcons = [];
      const workspaceIcons = [];
      const userIcons = [];

      for (const icon of baseIcons.data) {
        if (icon.user_id) {
          userIcons.push(icon);
        } else if (icon.workspace_id) {
          workspaceIcons.push(icon);
        } else {
          defaultIcons.push(icon);
        }
      }

      return {
        defaultIcons,
        workspaceIcons,
        userIcons,
      };
    } catch (error) {
      if (error instanceof ApiHandlerError) {
        throw error;
      }
      throw new ApiHandlerError('An unexpected error occurred', 500);
    }
  }

  /**
   * Allowing raw text here would depend from FE sanitization.
   * Svg is sanitized on DOM when rendering but FE sanitization would disallow
   * saving malicious data on DB
   */
  static async createIcon({
    svg,
    section,
    workspaceId,
    common_name,
    userId,
  }: CreateIconParams): Promise<Icon> {
    try {
      await this.verifyUserAndWorkspace(userId, workspaceId);

      const { data, error } = await supabase
        .from('icons')
        .insert({
          svg,
          common_name,
          section,
          user_id: userId,
          workspace_id: workspaceId,
        })
        .select('*')
        .single();

      if (error || !data) {
        throw new ApiHandlerError('Failed to create icon', 500, error);
      }

      return data as Icon;
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError('An unexpected error occurred', 500);
    }
  }
}
