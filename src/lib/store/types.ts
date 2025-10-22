// Import types from platform-types
import type { 
  Platform, 
  Status, 
  FileKind, 
  ContentFormat,
  SocialAccount, 
  SocialPage,
  PostHistory,
  PostSettings
} from "@/lib/social/platforms/platform-types";
import type { RowHeightType } from "@/lib/utils";
import type { ConditionGroup } from "@/components/content/post-table/FilterPopover";

// Shared types for all stores
export interface BoardRules {
  autoSchedule: boolean;
  revisionRules: boolean;
  approvalDeadline: boolean;
  groupBy: string | null;
  sortBy: string | null;
  rowHeight: RowHeightType;
  firstMonth?: number;
  ongoingMonth?: number;
  approvalDays?: number;
}

export interface GroupMessage {
  id: string;
  author: string;
  authorEmail?: string;
  authorImageUrl?: string;
  text: string;
  createdAt: Date;
  updatedAt?: Date;
  replies: GroupMessage[]; // Recursive structure for nested replies
}

export interface GroupComment {
  id: string;
  author: string;
  authorEmail?: string;
  authorImageUrl?: string;
  text: string;
  createdAt: Date;
  updatedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  aiSummary?: string[];
  /** Emails of users who have read this comment */
  readBy?: string[];
  messages: GroupMessage[]; // Direct replies to this comment
}

export interface BoardGroupData {
  month: number; // 1-50
  comments: GroupComment[];
  revisionCount: number;
}

export interface NavLink {
  id: string;
  label: string;
  image?: string;    // e.g. "/images/public/approvals.svg"
  selectedImage?: string;
  href?: string;
  rules?: BoardRules;
  color?: string;    // Board color for styling
  onClick?: () => void;
}

export type ColumnType =
  | "singleLine"
  | "longText"
  | "attachment"
  | "checkbox"
  | "feedback"
  | "singleSelect"
  | "multiSelect"
  | "date"
  | "lastUpdatedTime"
  | "createdBy"
  | "lastUpdatedBy";

export interface UserColumn {
  id: string;
  label: string;
  type: ColumnType;
  options?: Array<{ id: string; value: string; color: string }> | string[];
}

export interface BaseComment {
  id: string;
  parentId?: string;
  createdAt: Date;
  author: string;
  authorEmail?: string;
  authorImageUrl?: string;
  text: string;
  revisionRequested?: boolean;
}

export interface VersionComment extends BaseComment {
  rect?: { x: number; y: number; w: number; h: number };
}

export interface Version {
  id: string;
  createdAt: Date;
  by: string;
  caption: string;
  file: {
    kind: FileKind;
    url: string;
    thumbnailUrl?: string;
  };
  media?: {
    kind: FileKind;
    name: string;
    src: string;
  }[];
  comments: VersionComment[];
}

export interface Block {
  id: string;
  kind: FileKind;
  currentVersionId: string;
  versions: Version[];
  comments: BaseComment[]; 
}

export interface CaptionData {
  synced: boolean;
  default: string;
  perPlatform?: Partial<Record<Platform, string>>;
}

export interface Activity {
  id: string;
  workspaceId: string;
  postId?: string;
  type: 'revision_request' | 'revised' | 'approved' | 'scheduled' | 'published' | 'failed_publishing' | 'comment' | 'workspace_invited_sent' | 'board_invited_sent';
  actorId: string; // User ID of the person who performed the action
  actor?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  metadata?: {
    versionNumber?: number;
    comment?: string;
    publishTime?: Date;
    revisionComment?: string;
    commentId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  workspaceId: string;
  board_id: string; // <- NEW: permanently associates post with a board
  caption: CaptionData;
  status: Status;
  format: string;
  publish_date: Date | null;
  updatedAt: Date | null;
  platforms: Platform[];  // Array of platforms this post is for
  pages: string[];  // Array of social page IDs
  billingMonth?: string;
  month: number;  // Month number (1-50)
  /** Array of user defined column values saved as id/value pairs */
  user_columns?: Array<{ id: string; value: string }>;
  /** Per-post settings such as location tag, tagged accounts, custom thumbnail, and platform-specific options */
  settings?: PostSettings;

  /** Hashtags data with sync/unsync functionality */
  hashtags?: CaptionData;

  /** User who created the post (email) */
  created_by?: string;
  /** User who last updated the post (email) */
  last_updated_by?: string;

  blocks: Block[];
  comments: BaseComment[];
  activities: Activity[];
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  styleGuide?: {
    fonts?: string[];
    colors?: string[];
  };
  link?: string;
  voice?: string;
  prefs?: string;
}

export interface Workspace {
  id: string;
  name: string;
  logo?: string;
  clerk_organization_id?: string;
  createdby?: string; // ID of the user who created this workspace
  /**
   * User role within this workspace. "admin" for creator, "member" for invitee.
   */
  role?: 'admin' | 'member';
  channels?: MessageChannel[];
  boards: Board[];
  brand?: Brand; // Single brand per workspace (one-to-one relationship)
  socialAccounts?: SocialAccount[];
  socialPages?: SocialPage[];
  default_board_rules?: Record<string, any>;
  timezone?: string;
  week_start?: 'monday' | 'sunday';
  time_format?: '24h' | '12h';
  allowed_posting_time?: Record<string, any>;
}

export interface Board {
  id: string;
  name: string;
  image?: string;
  selectedImage?: string;
  description?: string;
  color?: string;
  rules?: BoardRules;
  groupData?: BoardGroupData[]; // Array of group data for months 1-50
  columns?: Array<{ name: string; id?: string; is_default: boolean; order: number; type?: ColumnType; options?: any }>;
  createdAt: Date;
  posts: Post[]; // Posts now belong to boards, not brands
  /** Board-specific filtering conditions */
  filterConditions?: ConditionGroup;
}

export interface BoardTemplate {
  id: string;
  name: string;
  image?: string;
  description?: string;
  color?: string;
  rules?: BoardRules;
}

export interface MessageChannel {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  description?: string;
  members?: any;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  unread_msg?: string[];
  unread_notification?: string[];
  notification_settings?: NotificationSettings;
  createdAt: Date;
}

// Re-export types from platform-types.ts for backward compatibility
export type { Platform, Status, FileKind, ContentFormat, SocialAccount, SocialPage, PostHistory, PostSettings };
export type { RowHeightType };
export type { ConditionGroup };
