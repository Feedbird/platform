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
import type { ConditionGroup } from "@/components/content/post-table/filter-popover";
import { FieldTypeEntitlements } from "../forms/field.config";

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
  image?: React.ReactNode | string;    // e.g. "/images/public/approvals.svg"
  selectedImage?: React.ReactNode;
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

export interface UserColumnOption {
  id: string;
  value: string;
  color: string;
}

export interface UserColumn {
  id: string;
  label: string;
  type: ColumnType;
  options?: Array<UserColumnOption>;
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
    firstName?: string;
    lastName?: string;
    email?: string;
    imageUrl?: string;
  };
  metadata?: {
    versionNumber?: number;
    comment?: string;
    publishTime?: Date;
    revisionComment?: string;
    commentId?: string;
    invitedEmail?: string;
    boardId?: string;
    workspaceId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  workspaceId: string;
  boardId: string; // <- NEW: permanently associates post with a board
  caption: CaptionData;
  status: Status;
  format: string;
  publishDate: Date | null;
  updatedAt: Date | null;
  platforms: Platform[];  // Array of platforms this post is for
  pages: string[];  // Array of social page IDs
  billingMonth?: string;
  month: number;  // Month number (1-50)
  /** Array of user defined column values saved as id/value pairs */
  userColumns?: Array<{ id: string; value: string }>;
  /** Per-post settings such as location tag, tagged accounts, custom thumbnail, and platform-specific options */
  settings?: PostSettings;

  /** Hashtags data with sync/unsync functionality */
  hashtags?: CaptionData;

  /** User who created the post (email) */
  createdBy?: string;
  /** User who last updated the post (email) */
  lastUpdatedBy?: string;

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

export interface SocialSet {
  id: string;
  name: string;
  workspaceId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Workspace {
  id: string;
  name: string;
  logo?: string;
  clerkOrganizationId?: string;
  createdby?: string; // ID of the user who created this workspace
  role?: 'admin' | 'member';
  channels?: MessageChannel[];
  boards: Board[];
  brand?: Brand;
  socialAccounts?: SocialAccount[];
  socialPages?: SocialPage[];
  defaultBoardRules?: BoardRules;
  timezone?: string;
  weekStart?: 'monday' | 'sunday';
  timeFormat?: '24h' | '12h';
  allowedPostingTime?: AllowedPostingTime;
  socialSets?: SocialSet[];
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
  columns?: Array<BoardColumn>;
  createdAt: Date;
  posts: Post[]; // Posts now belong to boards, not brands
  /** Board-specific filtering conditions */
  filterConditions?: ConditionGroup;
}

export interface BoardColumn {
  id: string;
  name: string;
  isDefault: boolean;
  order: number;
  type?: ColumnType;
  options?: UserColumnOption[];
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
  members?: ChannelMember[];
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
  unreadMsg?: string[];
  unreadNotification?: string[];
  notificationSettings?: NotificationSettings;
  defaultBoardRules?: BoardRules;
  createdAt: Date;
  updatedAt: Date;
}

// Database interfaces (originally from supabase/interfaces.ts, now merged here)
export interface ChannelMember {
  email: string;
  firstName?: string;
  imageUrl?: string;
}

export interface ChannelMessageAddon {
  [key: string]: unknown;
}

export interface ChannelMessageReadBy {
  email: string;
  timestamp?: Date;
}

export interface ChannelMessageEmoticon {
  emoji: string;
  users: string[];
}

export interface PostSettingsFull {
  locationTags: string[];
  taggedAccounts: string[];
  thumbnail: boolean;
  tiktok?: {
    privacyLevel: string;
    disableDuet: boolean;
    disableStitch: boolean;
    disableComment: boolean;
    videoCoverTimestampMs?: number;
    commercialContentToggle: boolean;
    brandContentToggle: boolean;
    brandOrganicToggle: boolean;
    autoAddMusic: boolean;
    isAigc: boolean;
    maxVideoDurationSec?: number;
    canPostMore?: boolean;
  };
  google?: {
    postType: string;
    callToAction?: {
      actionType: string;
      url: string;
    };
    event?: Record<string, unknown>;
    offer?: Record<string, unknown>;
  };
  pinterest?: {
    boardId: string;
    boardName: string;
    title?: string;
  };
  youtube?: {
    privacyStatus: string;
    madeForKids: boolean;
    description?: string;
  };
}

export interface PostBlockVersionFile {
  kind: "image" | "video";
  url: string;
  thumbnailUrl?: string;
}

export interface PostBlockVersionComment {
  id: string;
  parentId?: string;
  author: string;
  text: string;
  createdAt: string;
  revisionRequested?: boolean;
  [key: string]: unknown;
}

export interface PostBlockVersion {
  id: string;
  createdAt: string;
  by: string;
  caption: string;
  file: PostBlockVersionFile;
  comments: PostBlockVersionComment[];
}

export interface PostBlockCommentFull {
  id: string;
  parentId?: string;
  author: string;
  authorEmail?: string;
  authorImageUrl?: string;
  text: string;
  createdAt: string;
  revisionRequested?: boolean;
  [key: string]: unknown;
}

export interface PostBlockFull {
  id: string;
  kind: "image" | "video";
  currentVersionId: string;
  versions: PostBlockVersion[];
  comments: PostBlockCommentFull[];
}

export interface PostCommentFull {
  id: string;
  parentId?: string;
  createdAt: string;
  author: string;
  authorEmail?: string;
  authorImageUrl?: string;
  text: string;
  revisionRequested?: boolean;
}

export interface PostActivityMetadata {
  versionNumber?: number;
  comment?: string;
  publishTime?: string | Date;
  revisionComment?: string;
  commentId?: string;
  [key: string]: unknown;
}

export interface PostActivityActor {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface PostActivityFull {
  id: string;
  workspaceId: string;
  postId?: string;
  type: string;
  actorId: string;
  actor?: PostActivityActor;
  metadata?: PostActivityMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface StyleGuide {
  fonts?: string[];
  colors?: string[];
}

export interface AllowedPostingTime {
  [day: string]: {
    start?: string;
    end?: string;
  };
}

export interface FormFieldConfig {
  placeholder?: { value: string };
  title?: { value: string };
  description?: { value: string };
  isRequired?: { value: boolean };
  allowMultipleSelection?: { value: boolean };
  defaultOption?: { value: string; order: number };
  optionItems?: { optionValues: Array<{ value: string; order: number }> };
  dropdownItems?: { dropdownValues: Array<{ value: string; order: number }> };
  helpText?: { value: string };
  spreadsheetColumns?: { columns: Array<{ value: string; order: number }> };
  allowedRows?: { value: number };
  acceptedFileTypes?: { value: string };
  [key: string]: unknown;
}

export interface Channel {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  description?: string;
  members?: ChannelMember[];
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelMessage {
  id: string;
  workspaceId: string;
  channelId: string;
  content: string;
  parentId?: string | null;
  addon?: ChannelMessageAddon;
  readby?: ChannelMessageReadBy[];
  authorEmail: string;
  emoticons?: ChannelMessageEmoticon[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Member {
  id: string;
  email: string;
  workspaceId: string;
  boardId?: string | null;
  isWorkspace: boolean;
  role: "client" | "team";
  accept: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Form {
  id: string;
  type: "intake" | "template";
  title: string;
  status: "draft" | "published";
  workspaceId: string;
  shareUri?: string | null;
  hasBeenSubmitted: boolean;
  thumbnailUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  publishedAt?: Date | null;
  locationTags?: string[] | null;
  accountTags?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  hasBranding: boolean;
  coverOffset: number | null;
  services?: Service[];
}

// Database Service interface
export interface Service {
  id: string;
  workspaceId: string;
  formId: string | null;
  name: string;
  brief: string | null;
  description: string | null;
  folderId: string;
  socialChannels: boolean;
  internalIcon: string;
  channels?: ServiceChannel[];
  servicePlans?: ServicePlan[];
}

export interface ServicePlan {
  id: string;
  createdAt: Date;
  period: string;
  price: number;
  serviceId: string;
  quantity: number;
  qtyIndicator: string;
  currency: string;
  updatedAt: Date;
}

export interface ServiceChannel {
  id: string;
  serviceId: string;
  createdAt: Date;
  socialChannel: string;
  pricing: number;
  updatedAt: Date;
}

export interface ServiceFolder {
  id: string;
  createdAt: Date;
  name: string;
  description: string | null;
  workspaceId: string;
  order: number;
  services?: Service[];
}

export interface FormField {
  id: string;
  formId: string;
  position: number;
  type: string;
  config: FormFieldConfig;
  title: string;
  description: string;
  required: boolean;
}

export interface Coupon {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  discount: number;
  code: string;
  expiresAt: Date | null;
  usageCount: number;
  usageLimit: number | null;
}

export interface CheckoutForm {
  id: string;
  createdAt: Date;
  workspaceId: string;
  title: string;
  description: string | null;
  generalDiscount: number | null;
  paymentConfiguration: string | null;
  updatedAt: Date;
  folders?: CheckoutFormFolder[];
}

export interface CheckoutFormFolder {
  id: string;
  createdAt: Date;
  serviceFolderId: string;
  isActivated: boolean;
  checkoutFormId: string;
  showTooltip: boolean;
  description: string | null;
  folder?: ServiceFolder;
  services?: CheckoutFormService[];
}

export interface CheckoutFormService {
  id: string;
  createdAt: Date;
  serviceId: string;
  isActive: boolean;
  titleOverride: string | null;
  descriptionOverride: string | null;
  iconOverride: string | null;
  discount: number | null;
  service?: Service;
  checkoutFolder?: CheckoutFormFolder;
}

export interface FormSubmission {
  id: string;
  workspaceId: string;
  formId: string;
  formVersion: number;
  submittedBy: string;
  answers: Record<string, { type: string; value: string | string[] }>;
  schemaSnapshot: Record<string, string>;
  createdAt: Date;
}

// Re-export types from platform-types.ts for backward compatibility
export type { Platform, Status, FileKind, ContentFormat, SocialAccount, SocialPage, PostHistory, PostSettings };
export type { RowHeightType };
export type { ConditionGroup };
