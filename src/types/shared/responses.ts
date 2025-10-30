import { Icon } from '@/lib/store/types';

export interface FetchIconsResponse {
  defaultIcons: Icon[];
  workspaceIcons: Icon[];
  userIcons: Icon[];
}
