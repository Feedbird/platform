import { Workspace } from '@/lib/store';
import { supabase } from '@/lib/supabase/client';

export class WorkspaceHandler {
  static async getWorkspaceById(
    workspaceId: string,
    selections = '*'
  ): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .select(selections)
      .eq('id', workspaceId)
      .single();

    if (!data || error) {
      throw new Error(
        `Workspace not found: ${error?.message || 'Unknown error'}`
      );
    }

    return data as unknown as Workspace;
  }
}
