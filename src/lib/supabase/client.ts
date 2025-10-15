import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on the schema
export interface NotificationSettings {
  communication: {
    enabled: boolean;
    commentsAndMentions: boolean;
  };
  boards: {
    enabled: boolean;
    pendingApproval: boolean;
    scheduled: boolean;
    published: boolean;
    boardInviteSent: boolean;
    boardInviteAccepted: boolean;
  };
  workspaces: {
    enabled: boolean;
    workspaceInviteSent: boolean;
    workspaceInviteAccepted: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  unread_msg?: string[];
  unread_notification: string[];
  notification_settings?: NotificationSettings;
  default_board_rules?: any;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  logo?: string;
  clerk_organization_id?: string;
  created_at: string;
  updated_at: string;
  /**
   * Client-side augmentation – user role within this workspace.
   * "admin" when the workspace was created by the user,
   * "member" when the user was invited.
   */
  role?: "admin" | "member";

  /**
   * Boards visible to the current user. Empty when not prefetched by the API.
   */
  boards?: Board[];
  default_board_rules?: Record<string, any>;
  timezone?: string;
  week_start?: "monday" | "sunday";
  time_format?: "24h" | "12h";
  allowed_posting_time?: Record<string, any>;
}

export interface Brand {
  id: string;
  workspace_id: string;
  name: string;
  logo?: string;
  style_guide?: any;
  link?: string;
  voice?: string;
  prefs?: string;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  workspace_id: string;
  name: string;
  image?: string;
  selected_image?: string;
  description?: string;
  color?: string;
  rules?: any;
  group_data?: any;
  columns?: Array<{
    name: string;
    is_default: boolean;
    order: number;
    type?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  description?: string;
  members?: any;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelMessage {
  id: string;
  workspace_id: string;
  channel_id: string;
  content: string;
  parent_id?: string | null;
  addon?: any;
  readby?: any;
  author_email: string;
  emoticons?: any;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  workspace_id: string;
  board_id: string;
  caption: any;
  status: string;
  format: string;
  publish_date?: string;
  platforms?: string[];
  pages?: string[];
  billing_month?: string;
  month?: number;
  settings?: any;
  hashtags?: any;
  blocks?: any[];
  comments?: any[];
  activities?: any[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_updated_by?: string;
}

export interface Member {
  id: string;
  email: string;
  workspace_id: string;
  board_id?: string | null;
  is_workspace: boolean;
  role: "client" | "team";
  accept: boolean;
  created_at: string;
  updated_at: string;
}

export interface Form {
  id: string;
  type: "intake" | "template";
  title: string;
  status: "draft" | "published";
  workspace_id: string;
  share_uri?: string | null;
  has_been_submitted: boolean;
  thumbnail_url?: string | null;
  cover_url?: string | null;
  description?: string | null;
  published_at?: string | null;
  location_tags?: string[] | null;
  account_tags?: string[] | null;
  created_at: string;
  updated_at: string;
  has_branding: boolean;
  cover_offset: number | null;
  services?: Service[];
}

//? Placeholder for forms feature. This is not final entity structure.
export interface Service {
  id: string;
  workspace_id: string;
  form_id: string | null;
  name: string;
  brief: string | null;
  description: string | null;
  folder_id: string;
  social_channels: boolean;
  internal_icon: string;
  channels?: ServiceChannel[];
  service_plans?: ServicePlan[];
}

export interface ServicePlan {
  id: string;
  created_at: string;
  period: string;
  price: number;
  service_id: string;
  quantity: number;
  qty_indicator: string;
  currency: string;
  updated_at: string;
}

export interface ServiceChannel {
  id: string;
  service_id: string;
  created_at: string;
  social_channel: string;
  pricing: number;
  updated_at: string;
}

export interface ServiceFolder {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  workspace_id: string;
  order: number;
  services?: Service[];
}

export interface FormField {
  id: string;
  form_id: string;
  position: number;
  type: string;
  config: any;
  title: string;
  description: string;
  required: boolean;
}

export interface Coupon {
  id: string;
  created_at: string;
  updated_at: string;
  discount: number;
  code: string;
  expires_at: string | null;
  usage_count: number;
  usage_limit: number | null;
}

export interface CheckoutForm {
  id: string;
  created_at: string;
  workspace_id: string;
  title: string;
  description: string | null;
  general_discount: number | null;
  payment_configuration: string | null;
  updated_at: string;
  folders?: CheckoutFormFolder[];
}

export interface CheckoutFormFolder {
  id: string;
  created_at: string;
  service_folder_id: string;
  is_activated: boolean;
  checkout_form_id: string;
  show_tooltip: boolean;
  description: string | null;
  folder?: ServiceFolder;
  services?: CheckoutFormService[];
}

export interface CheckoutFormService {
  id: string;
  created_at: string;
  service_id: string;
  is_active: boolean;
  title_override: string | null;
  description_override: string | null;
  icon_override: string | null;
  discount: number | null;
  service?: Service;
  checkout_folder?: CheckoutFormFolder;
}
