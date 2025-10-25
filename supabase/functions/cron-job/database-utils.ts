// database-utils.ts
import { supabase } from "./supabase-client.ts";

// User-related database operations
export class UserService {
  static async getAllUsers(limit: number = 50) {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, created_at, updated_at')
      .limit(limit);
    
    return { users, error };
  }

  static async getUserById(id: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    return { user, error };
  }

  static async getUsersByWorkspace(workspaceId: string) {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id, email, first_name, last_name, created_at,
        members!inner(workspace_id)
      `)
      .eq('members.workspace_id', workspaceId);
    
    return { users, error };
  }

  static async getUserCount() {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    return { count, error };
  }
}

// Workspace-related database operations
export class WorkspaceService {
  static async getAllWorkspaces() {
    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select('id, name, createdby, created_at');
    
    return { workspaces, error };
  }

  static async getWorkspaceById(id: string) {
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single();
    
    return { workspace, error };
  }
}
