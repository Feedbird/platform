import { supabase } from '@/lib/supabase/client';
import { User } from '@/lib/store/types';

export class UserHandler {
  static async getUserById(userId: string, selection = '*'): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select(selection)
      .eq('id', userId)
      .single();

    if (!data || error) {
      throw new Error(`User not found: ${error?.message || 'Unknown error'}`);
    }

    return data as unknown as User;
  }
}
