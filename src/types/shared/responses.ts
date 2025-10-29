import { Icon } from '@/lib/supabase/interfaces';

export interface FetchIconsResponse {
  defaultIcons: Icon[];
  workspaceIcons: Icon[];
  userIcons: Icon[];
}
