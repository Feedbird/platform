"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from "zustand/middleware";
import * as React from "react";
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
import { getPlatformOperations } from "../social/platforms";
import { handleError } from "../utils/error-handler";
import { BaseError } from "../utils/exceptions/base-error";
import { withLoading } from "../utils/loading/loading-store";
import { RowHeightType } from "../utils";
import { storeApi, commentApi, activityApi, socialAccountApi } from '@/lib/api/api-service'
import { getCurrentUserDisplayNameFromStore } from "@/lib/utils/user-utils";
import { mapTikTokSettingsToPublishOptions } from "@/lib/utils/tiktok-settings-mapper";
import { ConsoleEmailService } from "../services/email-service";


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

// New types for BoardGroupData
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

/** A small interface for your centralized nav items. */
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

// Re-export types from platform-types.ts for backward compatibility
export type { Platform, Status, FileKind, ContentFormat };

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

/*─────────────────────────────────────────────────────────────────────*/
/*  Store Interface                                                  */
/*─────────────────────────────────────────────────────────────────────*/
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

export interface FeedbirdStore {
  // User management
  user: User | null;
  
  workspaces: Workspace[];
  /** True while fetching workspaces from database */
  workspacesLoading: boolean;
  /** Set to true after first load attempt completes (success or failure) */
  workspacesInitialized: boolean;
  activeWorkspaceId: string | null;
  activeBrandId: string | null;
  activeBoardId: string | null;
  boardTemplates: BoardTemplate[];

  platformNav: NavLink[];
  boardNav: NavLink[];
  
  /** NEW: Store post history fetched from each social page. Key = pageId. */
  postHistory: Record<string, PostHistory[]>;

  /** NEW: Store next page for each social page. Key = pageId. */
  nextPage: Record<string, number | string | null | undefined>;
  
  /** Loading states for post history sync. Key = pageId. */
  syncingPostHistory: Record<string, boolean>;

  /** Channel messages keyed by channel_id */
  channelMessagesByChannelId: Record<string, Array<{ id: string; author: string; text: string; createdAt: Date; authorImageUrl?: string; authorEmail?: string; parentId?: string | null; addon?: any; readby?: any; emoticons?: any; channelId?: string }>>;

  /** Current channel being viewed */
  currentChannelId?: string;

  /** Form related Out of context */
  unsavedFormChanges: boolean;

  // User management
  setUser: (user: User | null) => void;
  updateUserNotificationSettings: (notificationSettings: NotificationSettings) => void;
  clearUser: () => void;
  setCurrentChannelId: (channelId: string | undefined) => void;
  
  setActiveWorkspace: (id: string) => void;
  setActiveBrand: (id: string) => void;
  setActiveBoard: (id: string) => void;
  connectSocialAccount: (brandId: string, platform: Platform, account: Pick<SocialAccount, "name" | "accountId">) => string;
  stageSocialPages: (brandId: string, platform: Platform, pages: SocialPage[], localAccountId: string) => void;
  confirmSocialPage: (brandId: string, pageId: string) => Promise<void>;
  disconnectSocialPage: (brandId: string, pageId: string) => Promise<void>;
  checkAccountStatus: (brandId: string, accountId: string) => Promise<void>;
  checkPageStatus: (brandId: string, pageId: string) => Promise<void>;
  deletePagePost: (brandId: string, pageId: string, postId: string) => Promise<void>;
  getPageCounts: () => Record<Platform, number>;
  
  // Database-first social account methods
  loadSocialAccounts: (brandId: string) => Promise<void>;
  handleOAuthSuccess: (brandId: string) => Promise<void>;
  getActiveWorkspace: () => Workspace | undefined;
  getActiveBrand: () => Brand | undefined;
  getActivePosts: () => Post[];
  getAllPosts: () => Post[];
  syncPostHistory: (brandId: string, pageId: string, nextPage?: number | string | null | undefined) => Promise<void>;
  // loadMorePostHistory: (brandId: string, pageId: string) => Promise<void>;
  publishPostToAllPages: (postId: string, scheduledTime?: Date) => Promise<void>;
  getPost: (id: string) => Post | undefined;
  updatePost: (pid: string, data: Partial<Post>) => Promise<void>;
  updatePostStatusesBasedOnTime: () => void;
  addWorkspace: (name: string, email: string, logo?: string, default_board_rules?: Record<string, any>) => Promise<string>;
  removeWorkspace: (id: string) => Promise<void>;
  loadUserWorkspaces: (email: string) => Promise<void>;
  addBrand: (name: string, logo?: string, styleGuide?: Brand['styleGuide'], link?: string, voice?: string, prefs?: string) => Promise<string>;
  updateBrand: (id: string, data: Partial<Brand>) => Promise<void>;
  removeBrand: (id: string) => Promise<void>;
  
  // Channels
  addChannel: (name: string, description?: string, icon?: string, members?: any, color?: string) => Promise<string>;
  updateChannel: (id: string, data: Partial<MessageChannel>) => Promise<void>;
  removeChannel: (id: string) => Promise<void>;
  // Channel messages
  loadChannelMessages: (channelId: string) => Promise<void>;
  loadAllWorkspaceMessages: () => Promise<void>;
  sendChannelMessage: (channelId: string, content: string, parentId?: string, addon?: any) => Promise<string>;
  
  // Unread message management
  addUnreadMessage: (messageId: string) => void;
  removeUnreadMessage: (messageId: string) => void;
  hasUnreadMessages: () => boolean;
  markChannelAsRead: (channelId: string) => Promise<void>;
  
  addBoard: (name: string, description?: string, image?: string, color?: string, rules?: BoardRules) => Promise<string>;
  updateBoard: (id: string, data: Partial<Board>) => Promise<void>;
  removeBoard: (id: string) => Promise<void>;
  addBoardTemplate: (template: Omit<BoardTemplate, 'id'>) => string;
  updateBoardTemplate: (id: string, data: Partial<BoardTemplate>) => void;
  removeBoardTemplate: (id: string) => void;
  
  // Group data methods
  addGroupComment: (board_id: string, month: number, text: string, author: string) => string;
  updateGroupComment: (board_id: string, month: number, commentId: string, data: Partial<GroupComment>) => void;
  deleteGroupComment: (board_id: string, month: number, commentId: string) => void;
  resolveGroupComment: (board_id: string, month: number, commentId: string, resolvedBy: string) => void;
  addGroupMessage: (board_id: string, month: number, commentId: string, text: string, author: string, parentMessageId?: string) => string;
  updateGroupMessage: (board_id: string, month: number, commentId: string, messageId: string, data: Partial<GroupMessage>) => void;
  deleteGroupMessage: (board_id: string, month: number, commentId: string, messageId: string) => void;
  updateGroupCommentAiSummary: (board_id: string, month: number, commentId: string, aiSummary: string[]) => void;
  deleteGroupCommentAiSummaryItem: (board_id: string, month: number, commentId: string, summaryIndex: number) => void;
  markGroupCommentRead: (board_id: string, month: number, commentId: string) => void;
  
  deletePost: (postId: string) => Promise<void>;
  bulkDeletePosts: (postIds: string[]) => Promise<void>;
  approvePost: (id: string) => Promise<void>;
  requestChanges: (id: string, comment?: string) => Promise<void>;
  setPostRevised: (id: string) => Promise<void>;
  addPost: (board_id?: string) => Promise<Post | null>;
  bulkAddPosts: (board_id: string, posts: Omit<Post, 'id' | 'workspaceId' | 'board_id' | 'updatedAt'>[]) => Promise<Post[]>;
  duplicatePost: (orig: Post) => Promise<Post | null>;
  setActivePosts: (posts: Post[]) => void;
  sharePostsToBrand: (postIds: string[], targetBrandId: string) => void;
  addBlock: (postId: string, kind: FileKind) => string;
  removeBlock: (postId: string, blockId: string) => void;
  addVersion: (postId: string, blockId: string, ver: Omit<Version, 'id' | 'createdAt' | 'comments'>) => string;
  setCurrentVersion: (postId: string, blockId: string, versionId: string) => void;
  addPostComment: (postId: string, text: string, parentId?: string, revisionRequested?: boolean) => Promise<string>;
  addBlockComment: (postId: string, blockId: string, text: string, parentId?: string, revisionRequested?: boolean) => Promise<string>;
  addVersionComment: (
    postId: string,
    blockId: string,
    verId: string,
    text: string,
    rect?: { x: number; y: number; w: number; h: number },
    parentId?: string,
    revisionRequested?: boolean
  ) => Promise<string>;
  addActivity: (act: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  // Forms
  setUnsavedFormChanges: (unsaved: boolean) => void;
}

const defaultPlatformNav: NavLink[] = [
  {
    id: "messages",
    label: "Messages",
    image: "/images/sidebar/messages-on.svg",
    selectedImage: "/images/sidebar/messages-on-active.svg",
    href: "/messages",
  },
  {
    id: "notifications",
    label: "Notifications",
    image: "/images/sidebar/notifications-on.svg",
    selectedImage: "/images/sidebar/notifications-on-active.svg",
    href: "/notifications",
  },
  {
    id: "approvals",
    label: "Approvals",
    image: "/images/sidebar/approvals.svg",
    selectedImage: "/images/sidebar/approvals-active.svg",
    href: "/approvals",
  },
  // {
  //   id: "brands",
  //   label: "Brands",
  //   image: "/images/sidebar/brands.svg",
  //   href: "/brands",
  // },
  {
    id: "analytics",
    label: "Analytics",
    image: "/images/sidebar/analytics.svg",
    selectedImage: "/images/sidebar/analytics-active.svg",
    href: "/analytics",
  },
  // {
  //   id: "settings",
  //   label: "Settings",
  //   image: "/images/sidebar/settings.svg",
  //   href: "/settings",
  // },
];

const defaultBoards: Board[] = [
  { 
    id: "static-posts", 
    name: "Static Posts", 
    image: "/images/boards/static-posts.svg", 
    color: "#125AFF",
    rules: {
      autoSchedule: true,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: -1,
      ongoingMonth: -1,
      approvalDays: 7,
    },
    createdAt: new Date('2025-01-01'),
    posts: []
  },
  { 
    id: "short-form-videos", 
    name: "Short-Form Videos", 
    image: "/images/boards/short-form-videos.svg", 
    color: "#125AFF",
    rules: {
      autoSchedule: true,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: 3,
      ongoingMonth: 2,
      approvalDays: 7,
    },
    createdAt: new Date('2025-01-01'),
    posts: []
  },
  { 
    id: "email-design", 
    name: "Email Design", 
    image: "/images/boards/email-design.svg", 
    color: "#125AFF",
    rules: {
      autoSchedule: true,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: 3,
      ongoingMonth: 2,
      approvalDays: 7,
    },
    createdAt: new Date('2025-01-01'),
    posts: []
  },
];

const defaultIcons = [
  "/images/boards/icons/icon-1.svg",
  "/images/boards/icons/icon-2.svg",
  "/images/boards/icons/icon-3.svg",
  "/images/boards/icons/icon-4.svg",
  "/images/boards/icons/icon-5.svg",
  "/images/boards/icons/icon-6.svg",
  "/images/boards/icons/icon-7.svg",
  "/images/boards/icons/icon-8.svg",
  "/images/boards/icons/icon-9.svg",
  "/images/boards/icons/icon-10.svg",
  "/images/boards/icons/icon-11.svg",
  "/images/boards/icons/icon-12.svg",
  "/images/boards/icons/icon-13.svg",
  "/images/boards/icons/icon-14.svg",
  "/images/boards/icons/icon-15.svg",
  "/images/boards/icons/icon-16.svg",
];

const defaultColors = [
  "#125AFF", "#7D68D5", "#349DFE", "#3FAFA0", "#39CAFF", "#FFCB57", "#F87934", "#E85E62",
  "#EC5690", "#B45FC1", "#FB8AEE", "#AC8E81", "#1C1C1C", "#97A7A6", "#5374E0", "#E6E4E2"
];

function boardsToNav(boards: Board[], workspaceId?: string): NavLink[] {
  return boards.map((b) => ({ 
    id: b.id, 
    label: b.name, 
    image: b.image, 
    selectedImage: b.selectedImage, 
    href: workspaceId ? `/${workspaceId}/content/${b.id}` : `/content/${b.id}`, 
    rules: b.rules,
    color: b.color // Add color to NavLink
  }));
}



/*─────────────────────────────────────────────────────────────────────*/
/*  The Store                                                        */
/*─────────────────────────────────────────────────────────────────────*/
export const useFeedbirdStore = create<FeedbirdStore>()(
  persist(
    (set, get) => ({
      // User management
      user: null,
      
      workspaces: [],
        workspacesLoading: false,
        workspacesInitialized: false,
      activeWorkspaceId: null,
      activeBrandId: null,
      activeBoardId: null,
      boardTemplates: [
          { 
            id: "t1", 
            name: "Social Media Posts", 
            image: "/images/boards/templates/t1-social-media-post.svg", 
            description: "Social Media Posts", 
            color: "#7262F8",
            rules: {
              autoSchedule: true,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "status",
              rowHeight: "Large",
              firstMonth: 3,
              ongoingMonth: 2,
              approvalDays: 7,
            }
          },
          { 
            id: "t2", 
            name: "Short-Form Videos", 
            image: "/images/boards/templates/t2-short-form-videos.svg", 
            description: "Short-Form Videos", 
            color: "#45568F",
            rules: {
              autoSchedule: false,
              revisionRules: false,
              approvalDeadline: false,
              groupBy: "month",
              sortBy: "status",
              rowHeight: "Small",
            }
          },
          { 
            id: "t3", 
            name: "Email Design", 
            image: "/images/boards/templates/t3-email-design.svg", 
            description: "Email Design", 
            color: "#F56858",
            rules: {
              autoSchedule: true,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "status",
              rowHeight: "X-Large",
              firstMonth: 5,
              ongoingMonth: 3,
              approvalDays: 14,
            }
          },
          { 
            id: "t4", 
            name: "Meta Ads Management", 
            image: "/images/boards/templates/t4-meta-ads.svg", 
            description: "Meta Ads Management", 
            color: "#0280F8",
            rules: {
              autoSchedule: true,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "status",
              rowHeight: "X-Large",
              firstMonth: 6,
              ongoingMonth: 3,
              approvalDays: 60,
            }
          },
          { 
            id: "t5", 
            name: "Google Ads Management", 
            image: "/images/boards/templates/t5-google-ads.svg", 
            description: "Google Ads Management", 
            color: "#4E9BF8",
            rules: {
              autoSchedule: true,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "status",
              rowHeight: "X-Large",
              firstMonth: 6,
              ongoingMonth: 3,
              approvalDays: 60,
            }
          },
          { 
            id: "t6", 
            name: "Video Ads", 
            image: "/images/boards/templates/t6-video-ads.svg", 
            description: "Video Ads", 
            color: "#F97046",
            rules: {
              autoSchedule: false,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "status",
              sortBy: "updatedAt",
              rowHeight: "Large",
              firstMonth: 3,
              ongoingMonth: 1,
              approvalDays: 30,
            }
          },
          { 
            id: "t7", 
            name: "Static Ads", 
            image: "/images/boards/templates/t7-static-ads.svg", 
            description: "Static Ads", 
            color: "#3CBCD9",
            rules: {
              autoSchedule: true,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "status",
              rowHeight: "XX-Large",
              firstMonth: 5,
              ongoingMonth: 2,
              approvalDays: 14,
            }
          },
          { 
            id: "t8", 
            name: "UGC videos", 
            image: "/images/boards/templates/t8-ugc-videos.svg", 
            description: "UGC videos", 
            color: "#656667",
            rules: {
              autoSchedule: false,
              revisionRules: false,
              approvalDeadline: false,
              groupBy: "status",
              sortBy: "status",
              rowHeight: "Large",
            }
          },
          { 
            id: "t9", 
            name: "SEO Backlinks", 
            image: "/images/boards/templates/t9-seo-backlinks.svg", 
            description: "SEO Backlinks", 
            color: "#5CB3A4",
            rules: {
              autoSchedule: false,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "status",
              rowHeight: "Large",
              firstMonth: 2,
              ongoingMonth: 1,
              approvalDays: 30,
            }
          },
          { 
            id: "t10", 
            name: "Product Feed Optimization", 
            image: "/images/boards/templates/t10-product-feed-optimization.svg", 
            description: "Product Feed Optimization", 
            color: "#9AC565",
            rules: {
              autoSchedule: false,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "status",
              rowHeight: "Large",
              firstMonth: 2,
              ongoingMonth: 1,
              approvalDays: 30,
            }
          },
          { 
            id: "t11", 
            name: "Full Email Marketing", 
            image: "/images/boards/templates/t11-full-email-marketing.svg", 
            description: "Full Email Marketing", 
            color: "#6A9DEA",
            rules: {
              autoSchedule: false,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "status",
              rowHeight: "Large",
              firstMonth: 2,
              ongoingMonth: 1,
              approvalDays: 30,
            }
          },
          { 
            id: "t12", 
            name: "SEO Blog Posts", 
            image: "/images/boards/templates/t12-seo-blog-posts.svg", 
            description: "SEO Blog Posts", 
            color: "#7A7E82",
            rules: {
              autoSchedule: false,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "status",
              rowHeight: "Large",
              firstMonth: 2,
              ongoingMonth: 1,
              approvalDays: 30,
            }
          },
          { 
            id: "t13", 
            name: "Conversion Tracking Setup", 
            image: "/images/boards/templates/t13-conversion-tracking-setup.svg", 
            description: "Conversion Tracking Setup", 
            color: "#9A9A9A",
            rules: {
              autoSchedule: false,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "status",
              rowHeight: "Large",
              firstMonth: 2,
              ongoingMonth: 1,
              approvalDays: 30,
            }
          },
          { 
            id: "t14", 
            name: "Instagram Growth", 
            image: "/images/boards/templates/t14-instagram-growth.svg", 
            description: "Instagram Growth", 
            color: "#DF8FFF",
            rules: {
              autoSchedule: false,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "status",
              rowHeight: "Large",
              firstMonth: 2,
              ongoingMonth: 1,
              approvalDays: 30,
            }
          },
        ],

        platformNav: defaultPlatformNav,
        boardNav: [],
        postHistory: {},
        channelMessagesByChannelId: {},
        syncingPostHistory: {},
        nextPage: {},
        unsavedFormChanges: false,
        // getters
        getActiveWorkspace: () => {
          const workspace = get().workspaces.find((w) => w.id === get().activeWorkspaceId);
          if (!workspace) return undefined;
          
          return workspace;
        },

        getActiveBrand: () => {
          const ws = get().getActiveWorkspace();
          return ws?.brand && ws.brand.id === get().activeBrandId ? ws.brand : undefined;
        },

        getActivePosts: () => {
          const workspace = get().getActiveWorkspace();
          const board_id = get().activeBoardId;
          if (!workspace || !board_id) return [];
          
          const board = workspace.boards.find(b => b.id === board_id);
          console.log('board', board);
          return board?.posts ?? [];
        },
        getAllPosts: () => {
          const workspace = get().getActiveWorkspace();
          if (!workspace) return [];
          
          return workspace.boards.flatMap(board => board.posts);
        },

        publishPostToAllPages: (postId, scheduledTime) => {
          return withLoading(
            async () => {
              const { getActiveWorkspace, getPost, updatePost, addActivity } = get();
              const workspace = getActiveWorkspace();
              const post = getPost(postId);

              if (!workspace || !post) {
                throw new Error("Workspace or Post not found");
              }

              updatePost(postId, { status: "Publishing" });
              
              // Add scheduling activity if scheduled
              if (scheduledTime) {
                await addActivity({
                  postId,
                  workspaceId: workspace.id,
                  actorId: get().user?.id || '',
                  type: "scheduled",
                  metadata: {
                    publishTime: scheduledTime
                  }
                });
              }

              // Helper: convert any URL (data: or http(s):) to a File object for FormData upload.
              const urlToFile = async (srcUrl: string, defaultName: string, kind: FileKind): Promise<File> => {
                if (srcUrl.startsWith('data:')) {
                  const arr = srcUrl.split(',');
                  const mimeMatch = arr[0].match(/:(.*);/);
                  if (!mimeMatch) throw new Error('Invalid data URL');
                  const mime = mimeMatch[1];
                  const bstr = atob(arr[1]);
                  let n = bstr.length;
                  const u8arr = new Uint8Array(n);
                  while (n--) u8arr[n] = bstr.charCodeAt(n);
                  return new File([u8arr], defaultName, { type: mime });
                }

                // Remote URL – fetch it and build a File object
                const res = await fetch(srcUrl);
                if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`);
                const blob = await res.blob();
                const ct = blob.type || (kind === 'video' ? 'video/mp4' : 'image/png');
                return new File([blob], defaultName, { type: ct });
              };

              // Helper: upload a single file to R2
              const uploadFile = async (file: File, kind: FileKind): Promise<string> => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('kind', kind);

                const response = await fetch('/api/upload/sign', {
                  method: 'POST',
                  body: formData,
                });

                if (!response.ok) {
                  throw new Error(`Failed to upload ${kind}: ${response.status}`);
                }

                const result = await response.json();
                return result.url;
              };

              // Helper: process all media in a block
              const processBlockMedia = async (block: Block): Promise<Block> => {
                const processedBlock = { ...block };
                
                for (const version of processedBlock.versions) {
                  if (version.media) {
                    const processedMedia: { kind: FileKind; name: string; src: string }[] = [];
                    
                    for (const media of version.media) {
                      if (media.src.startsWith('data:') || media.src.startsWith('http')) {
                        const file = await urlToFile(media.src, media.name, media.kind);
                        const uploadedUrl = await uploadFile(file, media.kind);
                        processedMedia.push({ ...media, src: uploadedUrl });
                      } else {
                        processedMedia.push(media);
                      }
                    }
                    
                    version.media = processedMedia;
                  }
                }
                
                return processedBlock;
              };

              // Process all blocks in the post
              const processedBlocks = await Promise.all(
                post.blocks.map(processBlockMedia)
              );

              // Update post with processed blocks
              updatePost(postId, { blocks: processedBlocks });

              // Publish to all connected pages
              const brand = workspace.brand;
              if (!brand) {
                throw new Error("No brand found for workspace");
              }

              const connectedPages = (workspace.socialPages || []).filter((page: SocialPage) => 
                post.pages.includes(page.id) && page.connected
              );

              if (connectedPages.length === 0) {
                throw new Error("No connected pages found for this post");
              }

              const publishPromises = connectedPages.map(async (page: SocialPage) => {
                const ops = getPlatformOperations(page.platform);
                if (!ops) {
                  throw new Error(`Platform operations not found for ${page.platform}`);
                }

                // Prepare base publish options with settings
                let publishOptions: any = { 
                  scheduledTime,
                  settings: post.settings // Pass the full settings object
                };
                let postContent: any;

                if (['tiktok', 'linkedin', 'facebook', 'instagram', 'google', 'youtube', 'pinterest'].includes(page.platform)) {
                  
                  // Use TikTok settings if available, otherwise use defaults
                  if (post.settings?.tiktok) {
                    const tiktokOptions = mapTikTokSettingsToPublishOptions(post.settings.tiktok);
                    publishOptions = { ...publishOptions, ...tiktokOptions };
                  }
                  
                  // Use YouTube settings if available, otherwise use defaults
                  if (post.settings?.youtube) {
                    const { mapYouTubeSettingsToPublishOptions } = await import('@/lib/utils/youtube-settings-mapper');
                    const youtubeOptions = mapYouTubeSettingsToPublishOptions(post.settings.youtube);
                    publishOptions = { ...publishOptions, ...youtubeOptions };
                  }

                  // Format content for platform API
                  postContent = {
                    id: postId,
                    text: post.caption.default,
                    media: {
                      type: post.format,
                      urls: processedBlocks.flatMap((block: any) => {
                        // from the version i want to pick the latest one
                        const latestVersion = block.versions.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                        return [latestVersion.file?.url]
                      })
                    }
                  };
                } else {
                  // Standard content format for other platforms
                  postContent = {
                    text: post.caption.default,
                    media: {
                      type: "image" as const,
                      urls: processedBlocks.flatMap(block => 
                        block.versions.flatMap(version => version.media?.map(m => m.src) || [])
                      )
                    }
                  };
                }

                const publishResult = await ops.publishPost(page, postContent , publishOptions);

                return {
                  pageId: page.id,
                  result: publishResult
                };
              });

              const results = await Promise.all(publishPromises);
              
              // Update post status based on results
              const hasErrors = results.some((r: any) => r.result.error);
              if (hasErrors) {
                updatePost(postId, { status: "Failed Publishing" });
                throw new Error("Some posts failed to publish");
              } else {
                updatePost(postId, { status: scheduledTime ? "Scheduled" : "Published" });
              }

              // Add success activity
              if (workspace) {
                await addActivity({
                  postId,
                  workspaceId: workspace.id,
                  actorId: get().user?.id || '',
                  type: scheduledTime ? "scheduled" : "published",
                  metadata: {
                    publishTime: scheduledTime
                  }
                });
              }
            },
            {
              loading: scheduledTime ? "Scheduling post..." : "Publishing post...",
              success: scheduledTime ? "Post scheduled successfully!" : "Post published successfully!",
              error: "An error occurred while publishing."
            }
          );
        },

        syncPostHistory: (brandId, pageId, nextPage?: number | string | null | undefined) => {
          return withLoading(
            async () => {
              const workspace = get().getActiveWorkspace();
              if (!workspace?.brand || workspace.brand.id !== brandId) {
                throw new Error("Brand not found");
              }

              const brand = workspace.brand;
              const page = (workspace.socialPages || []).find((p: SocialPage) => p.id === pageId);
              if (!page) throw new Error("Page not found");

              const ops = getPlatformOperations(page.platform);
              if (!ops) throw new Error(`Platform operations not found for ${page.platform}`);

              // Fix: nextPage can be null, but getPostHistory expects string | number | undefined
              const fetched = await ops.getPostHistory(page, 20, nextPage ?? undefined);
              
              set((state) => {
                const existingHistory = state.postHistory[pageId] || [];
                const newHistory = nextPage ? [...existingHistory, ...fetched.posts] : fetched.posts;
                
                return {
                  postHistory: { ...state.postHistory, [pageId]: newHistory },
                  nextPage: { ...state.nextPage, [pageId]: fetched.nextPage },
                  workspaces: state.workspaces.map((w) => ({
                    ...w,
                    socialPages: (w.socialPages || []).map((sp: SocialPage) =>
                      sp.id === pageId ? { ...sp, lastSyncAt: new Date() } : sp
                    ),
                  })),
                };
              });
            },
            {
              loading: "Syncing post history...",
              success: "Post history synced successfully!",
              error: "Failed to sync post history."
            }
          );
        },

        getPost: (id: string) => {
          const workspace = get().getActiveWorkspace();
          if (workspace) {
            for (const board of workspace.boards) {
              const found = board.posts.find((p) => p.id === id);
              if (found) return found;
            }
          }
          return undefined;
        },

        // workspace
        addWorkspace: async (name, email, logo, default_board_rules?) => {
          try {
            const wid = await storeApi.createWorkspaceAndUpdateStore(name, email, logo, default_board_rules)
            return wid
          } catch (error) {
            console.error('Failed to add workspace:', error)
            throw error
          }
        },
        removeWorkspace: async (id) => {
          try {
            await storeApi.deleteWorkspaceAndUpdateStore(id)
          } catch (error) {
            console.error('Failed to remove workspace:', error)
            throw error
          }
        },
        loadUserWorkspaces: async (email) => {
          try {
            await storeApi.loadUserWorkspaces(email)
          } catch (error) {
            console.error('Failed to load user workspaces:', error)
            throw error
          }
        },
        setActiveWorkspace: (id) =>
          set((s) => {
            const ws = s.workspaces.find((w) => w.id === id);
            console.log("activeworkspace:", ws);
            
            // Check if current pathname is a board route and if that board exists in the new workspace
            let newActiveBoardId: string | null = null;
            
            // Try to get the current pathname from window.location if available
            if (typeof window !== 'undefined') {
              const pathname = window.location.pathname;
              
              // Handle new workspace-scoped routes: /[workspaceId]/content/[board_id]
              if (pathname.includes('/content/')) {
                const pathParts = pathname.split('/');
                const contentIndex = pathParts.findIndex(part => part === 'content');
                if (contentIndex !== -1 && pathParts[contentIndex + 1]) {
                  const currentBoardId = pathParts[contentIndex + 1];
                  
                  // Check if this board exists in the new workspace
                  if (currentBoardId && ws?.boards.some(b => b.id === currentBoardId)) {
                    newActiveBoardId = currentBoardId;
                  }
                }
              }
              // Handle old routes for backward compatibility: /content/[board_id]
              else if (pathname.startsWith('/content/')) {
                const currentBoardId = pathname.split('/')[2]; // Extract board_id from /content/[board_id]
                
                // Check if this board exists in the new workspace
                if (currentBoardId && ws?.boards.some(b => b.id === currentBoardId)) {
                  newActiveBoardId = currentBoardId;
                }
              }
            }
            
            // If no board from pathname or board doesn't exist in new workspace, set to null
            if (!newActiveBoardId) {
              newActiveBoardId = null;
            }
            
            return {
              activeWorkspaceId: id,
              activeBrandId: ws?.brand?.id ?? null,
              activeBoardId: newActiveBoardId,
              boardNav: boardsToNav(ws?.boards ?? [], id),
            };
          }),

        // brand
        addBrand: async (
          name: string,
          logo?: string,
          styleGuide?: Brand['styleGuide'],
          link?: string,
          voice?: string,
          prefs?: string
        ) => {
          try {
            const activeWorkspaceId = get().activeWorkspaceId
            if (!activeWorkspaceId) {
              throw new Error('No active workspace')
            }
            const bid = await storeApi.createBrandAndUpdateStore(
              activeWorkspaceId,
              name,
              logo,
              styleGuide,
              link,
              voice,
              prefs
            )
            return bid
          } catch (error) {
            console.error('Failed to add brand:', error)
            throw error
          }
        },
        updateBrand: async (id, data) => {
          try {
            await storeApi.updateBrandAndUpdateStore(id, data)
          } catch (error) {
            console.error('Failed to update brand:', error)
            throw error
          }
        },
        removeBrand: async (id) => {
          try {
            await storeApi.deleteBrandAndUpdateStore(id)
          } catch (error) {
            console.error('Failed to remove brand:', error)
            throw error
          }
        },

        // Channels
        addChannel: async (name: string, description?: string, icon?: string, members?: any, color?: string) => {
          try {
            const activeWorkspaceId = get().activeWorkspaceId
            const email: string | undefined = (get() as any).user?.email
            if (!activeWorkspaceId) throw new Error('No active workspace')
            if (!email) throw new Error('No user email')
            // Apply defaults similar to addBoard
            const finalIcon = icon && icon.trim() ? icon.trim() : '/images/boards/icons/icon-2.svg'
            const finalColor = color === '#FFFFFF' ? '#125AFF' : color
            const cid = await storeApi.createChannelAndUpdateStore(
              activeWorkspaceId,
              email,
              name,
              description,
              members,
              finalIcon,
              finalColor
            )
            return cid
          } catch (error) {
            console.error('Failed to add channel:', error)
            throw error
          }
        },
        loadChannelMessages: async (channelId: string) => {
          try {
            await (storeApi as any).fetchChannelMessagesAndUpdateStore(channelId)
          } catch (error) {
            console.error('Failed to load channel messages:', error)
            throw error
          }
        },
        loadAllWorkspaceMessages: async () => {
          try {
            await (storeApi as any).fetchAllWorkspaceMessagesAndUpdateStore()
          } catch (error) {
            console.error('Failed to load all workspace messages:', error)
            throw error
          }
        },
        sendChannelMessage: async (channelId: string, content: string, parentId?: string, addon?: any) => {
          try {
            const activeWorkspaceId = get().activeWorkspaceId
            const userEmail: string | undefined = (get() as any).user?.email
            if (!activeWorkspaceId) throw new Error('No active workspace')
            if (!userEmail) throw new Error('No user email')
            const id = await (storeApi as any).createChannelMessageAndUpdateStore(activeWorkspaceId, channelId, content, userEmail, parentId, addon)
            return id
          } catch (error) {
            console.error('Failed to send channel message:', error)
            // If it's an API error with validation details, log them
            if (error && typeof error === 'object' && 'message' in error) {
              const apiError = error as any;
              if (apiError.message === 'Validation error' && apiError.details) {
                console.error('Validation error details:', apiError.details);
              }
            }
            throw error
          }
        },
        updateChannel: async (id: string, data: Partial<MessageChannel>) => {
          try {
            await storeApi.updateChannelAndUpdateStore(id, data)
          } catch (error) {
            console.error('Failed to update channel:', error)
            throw error
          }
        },
        removeChannel: async (id: string) => {
          try {
            await storeApi.deleteChannelAndUpdateStore(id)
          } catch (error) {
            console.error('Failed to remove channel:', error)
            throw error
          }
        },
        setActiveBrand: (id: string) =>
          set((s) => {
            const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
            const brand = ws?.brand && ws.brand.id === id ? ws.brand : undefined;
            return { activeBrandId: id };
          }),

        connectSocialAccount: (brandId: string, platform: Platform, account: Pick<SocialAccount, "name" | "accountId">) => {
          let localReturnId = crypto.randomUUID();
          set((state) => ({
            workspaces: state.workspaces.map((w) => ({
              ...w,
              // Update workspace-level accounts
              socialAccounts: (() => {
                const existingAccount = (w.socialAccounts || []).find((a: SocialAccount) => a.accountId === account.accountId);
                if (existingAccount) {
                  localReturnId = existingAccount.id;
                  return (w.socialAccounts || []).map((a: SocialAccount) =>
                    a.accountId === account.accountId ? { ...a, connected: true, status: "active" } : a
                  );
                }
                const newAccount: SocialAccount = {
                  id: localReturnId,
                  name: account.name,
                  accountId: account.accountId,
                  platform,
                  connected: true,
                  status: "active",
                };
                return [ ...(w.socialAccounts || []), newAccount ];
              })(),
            })),
          }));
          return localReturnId;
        },

        stageSocialPages: (brandId, platform, pages, localAccountId) => {
          set((state) => {
            const newWs = state.workspaces.map((ws) => ({
              ...ws,
              // Workspace-level pages
              socialPages: (() => {
                const existing: SocialPage[] = ws.socialPages || [];
                const incoming = pages.map((p: SocialPage) => {
                  const found = existing.find((ex: SocialPage) => ex.pageId === p.pageId);
                  if (found) {
                    return { ...found, accountId: localAccountId, connected: found.connected, status: toPageStatus(found.status) } as SocialPage;
                  } else {
                    return { ...p, accountId: localAccountId, connected: false, status: toPageStatus(p.status) } as SocialPage;
                  }
                });
                const merged = [...existing];
                incoming.forEach((pg: SocialPage) => {
                  const idx = merged.findIndex((m: SocialPage) => m.pageId === pg.pageId);
                  if (idx >= 0) merged[idx] = pg; else merged.push(pg);
                });
                return merged;
              })(),
            }));
            return { workspaces: newWs };
          });
        },

        confirmSocialPage: async (brandId, pageId) => {
          const ws = get().getActiveWorkspace();
          if (!ws) return;

          const page = (ws?.socialPages || []).find((p: SocialPage) => p.id === pageId);
          if (!page) throw new Error(`Page with ID ${pageId} not found.`);
          
          /* TikTok profile == page; no page-level API available in sandbox.
           * We therefore skip the remote connect call and simply flip the
           * staged page to connected=true locally. */
          if (page.platform === 'tiktok') {
            set(s => updatePage(s, brandId, pageId, { connected: true, status: 'active' }));
            return;
          }

          const acct = (ws?.socialAccounts || []).find((a: SocialAccount) => a.id === page.accountId);
          if (!acct) throw new Error(`Account for page ${pageId} not found.`);

          const ops = getPlatformOperations(page.platform);
          if (!ops) throw new Error(`No platform operations for ${page.platform}`);

          try {
            // Actually connect the page at the platform level
            const finalPage = await ops.connectPage(acct, page.pageId);

            // store final results in feedbird store
            set((s) => ({
              workspaces: s.workspaces.map((w) => ({
                ...w,
                socialPages: (w.socialPages || []).map((sp: SocialPage) =>
                  sp.id === pageId ? { ...sp, ...finalPage, connected: true, status: finalPage.status ?? 'active' } : sp
                ),
              })),
            }));
          } catch (error) {
            console.error(`Failed to connect page ${page.name}:`, error);
            // Propagate the error to be caught by the UI
            throw error;
          }
        },

        disconnectSocialPage: async (brandId: string, pageId: string) => {
          try {
            const ws = get().getActiveWorkspace();
            if (!ws) throw new Error('No active workspace');
            // Use proper API service instead of raw fetch
            await socialAccountApi.disconnectSocial({
              workspaceId: ws.id,
              pageId
            });

            // Reload social accounts to get updated data
            await get().loadSocialAccounts(ws.id);
          } catch (error) {
            console.error('Failed to disconnect page:', error);
            throw error;
          }
        },

        checkAccountStatus: async (brandId: string, accountId: string) => {
          set((state) => ({
            workspaces: state.workspaces.map((w) => ({
              ...w,
              socialAccounts: (w.socialAccounts || []).map((a: SocialAccount) => {
                if (a.id === accountId) {
                  return {
                    ...a,
                    status: a.connected ? "active" : "disconnected",
                  } as SocialAccount;
                }
                return a;
              }),
            })),
          }));
        },

        checkPageStatus: async (brandId: string, pageId: string) => {
          const { workspaces } = get();
          const ws = workspaces.find((w: Workspace) => w.brand?.id === brandId);
          const pages = (ws?.socialPages || []) as SocialPage[];
          const page = pages.find(p => p.id === pageId);
          if (!page) return;

          try {
            const ops = getPlatformOperations(page.platform);
            if (!ops?.checkPageStatus) {
              // If checkPageStatus isn't supported, we can't verify, so we'll assume it's active.
              set(state => updatePage(state, brandId, pageId, { status: 'active', statusUpdatedAt: new Date() }));
              return;
            }

            const freshPage = await ops.checkPageStatus(page);
            set(state => updatePage(state, brandId, pageId, { ...freshPage, statusUpdatedAt: new Date() }));
          } catch (error) {
            console.error(`Failed to check status for page ${page.name}:`, error);
            set(state => updatePage(state, brandId, pageId, { status: 'error', statusUpdatedAt: new Date() }));
            throw error; // Re-throw so the UI can catch it
          }
        },

        deletePagePost: async (brandId, pageId, postId) => {
          const st = get();

          // locate page & ops
          const ws = st.getActiveWorkspace();
          const page  = (ws?.socialPages || []).find((p: SocialPage) => p.id === pageId);
          if (!ws || !page) {
            console.error("deletePagePost: page not found");
            return;
          }
          const ops = getPlatformOperations(page.platform);
          if (!ops?.deletePost) {
            console.error("deletePagePost: ops.deletePost not implemented");
            return;
          }

          try {
            await ops.deletePost(page, postId);

            /* remove locally */
            set(state => {
              const old = state.postHistory[pageId] ?? [];
              return {
                postHistory: {
                  ...state.postHistory,
                  [pageId]: old.filter((p: any) => p.postId !== postId)
                }
              };
            });
          } catch (err) {
            console.error("deletePagePost failed:", err);
            throw err;
          }
        },

        // Database-first social account methods
        loadSocialAccounts: async (brandId: string) => {
          try {
            // Use proper API service instead of raw fetch
            const ws = get().getActiveWorkspace();
            if (!ws) throw new Error('No active workspace');
            const accounts = await socialAccountApi.getSocialAccounts(ws.id);
            
            // Extract all pages from all accounts into a flat array (exclude sensitive tokens)
            const allPages = accounts.flatMap((acc: any) => 
              (acc.social_pages || []).map((page: any) => ({
                id: page.id,
                platform: page.platform,
                entityType: page.entity_type || 'page',
                name: page.name,
                pageId: page.page_id,
                connected: page.connected,
                status: page.status,
                accountId: acc.id, // Link to the account
                socialSetId: page.social_set_id ?? null,
                statusUpdatedAt: page.status_updated_at ? new Date(page.status_updated_at) : undefined,
                lastSyncAt: page.last_sync_at ? new Date(page.last_sync_at) : undefined,
                followerCount: page.follower_count,
                postCount: page.post_count,
                metadata: page.metadata
              }))
            );
            
            set((state) => ({
              workspaces: state.workspaces.map(ws => ({
                ...ws,
                socialAccounts: accounts.map((acc: any) => ({
                  id: acc.id,
                  platform: acc.platform,
                  name: acc.name,
                  accountId: acc.account_id,
                  connected: acc.connected,
                  status: acc.status,
                  metadata: acc.metadata,
                socialPages: acc.social_pages || []
                })),
                socialPages: allPages,
                brand: ws.brand
              }))
            }));

            console.log('state.workspaces', get().workspaces.find(w => w.id == ws.id));

          } catch (error) {
            console.error('Failed to load social accounts:', error);
            // You can add toast notification here if needed
          }
        },

        handleOAuthSuccess: async (brandId: string) => {
          try {
            await get().loadSocialAccounts(brandId);
            // You can add success toast here if needed
          } catch (error) {
            console.error('Failed to handle OAuth success:', error);
            // You can add error toast here if needed
          }
        },

        // Forms
        setUnsavedFormChanges: (unsaved: boolean) => {
          set(() => ({ unsavedFormChanges: unsaved }));
        },
        getPageCounts: () => {
          const ws = get().getActiveWorkspace();
          const platforms = [
            "facebook", "instagram", "linkedin", "pinterest",
            "youtube", "tiktok", "google"
          ] as const;
          
          const result: Record<Platform, number> = {
            facebook: 0,
            instagram: 0,
            linkedin: 0,
            pinterest: 0,
            youtube: 0,
            tiktok: 0,
            google: 0,
          };

          (ws?.socialPages || []).forEach((p) => {
            if (p.connected && p.status === "active") {
              const platform = p.platform as Platform;
              result[platform] = (result[platform] ?? 0) + 1;
            }
          });

          return result;
        },

        // posts
        updatePost: async (pid, data) => {
          const st = get();
          const prev = st.getPost(pid);
          const isApproving = data?.status === 'Approved';
          const wasNotScheduled = prev?.status !== 'Scheduled';
          const ws = st.getActiveWorkspace();
          const board = ws?.boards.find(b => b.id === prev?.board_id);
          const shouldAuto = board?.rules?.autoSchedule === true;
          const userEmail = st.user?.email;

          if (isApproving && wasNotScheduled && shouldAuto) {
              await storeApi.autoScheduleAndUpdateStore(pid, "Scheduled");
            } else {
            await storeApi.updatePostAndUpdateStore(pid, data, userEmail);
          }
        }, 
        deletePost: async (postId) => {
          await storeApi.deletePostAndUpdateStore(postId);
        },
        bulkDeletePosts: async (postIds) => {
          await storeApi.bulkDeletePostsAndUpdateStore(postIds);
        },
        approvePost: async (id) => {
          const post = get().getPost(id);
          if (!post) return;
          
          // Define which statuses allow approval actions
          const allowedStatusesForApproval = [
            "Pending Approval",
            "Revised", 
            "Needs Revisions",
            "Approved"
          ];
          
          // Only approve if the status allows it
          if (allowedStatusesForApproval.includes(post.status)) {
            await get().updatePost(id, { status: "Approved" });
            // Add activity
            const workspace = get().getActiveWorkspace();
            if (workspace) {
              await get().addActivity({
                postId: id,
                workspaceId: workspace.id,
                actorId: get().user?.id || '',
                type: "approved"
              });
            }
          }
        },
        requestChanges: async (id, comment?: string) => {
          console.log("requestChanges", id, comment);
          const post = get().getPost(id);
          if (!post) return;
          
          // Define which statuses allow revision actions
          const allowedStatusesForRevision = [
            "Pending Approval",
            "Revised", 
            "Needs Revisions",
            "Approved"
          ];
          
          // Only request changes if the status allows it
          if (allowedStatusesForRevision.includes(post.status)) {
            await get().updatePost(id, { status: "Needs Revisions" });
            console.log("requestChanges", id, comment);
            // Add activity
            const workspace = get().getActiveWorkspace();
            if (workspace) {
              await get().addActivity({
                postId: id,
                workspaceId: workspace.id,
                actorId: get().user?.id || '',
                type: "revision_request",
                metadata: {
                  revisionComment: comment
                }
              });
            }
          }
        },
        setPostRevised: async (id) => {
          const post = get().getPost(id);
          if (!post) return;
          
          // Define which statuses allow setting to revised
          const allowedStatusesForRevised = [
            "Needs Revisions",
          ];
          
          // Only set to revised if the status allows it
          if (allowedStatusesForRevised.includes(post.status)) {
            await get().updatePost(id, { status: "Revised" });
            // Add activity
            const workspace = get().getActiveWorkspace();
            if (workspace) {
              await get().addActivity({
                postId: id,
                workspaceId: workspace.id,
                actorId: get().user?.id || '',
                type: "revised"
              });
            }
          }
        },

        addPost: async (board_id?: string) => {
          const st = get();
          const ws = st.getActiveWorkspace();
          if (!ws) return null;
          const bId = board_id ?? st.activeBoardId ?? (ws?.boards[0]?.id ?? "default");
          const userEmail = st.user?.email;

          if (!userEmail) {
            console.error('No user email available for creating post');
            return null;
          }

          const postId = await storeApi.createPostAndUpdateStore(ws.id, bId, {
            caption: { synced: true, default: "" },
            status: "Draft",
            format: "",

            platforms: [],
            pages: [],
            month: 1,
          }, userEmail);

          return get().getPost(postId) ?? null;
        },
        bulkAddPosts: async (board_id, posts) => {
          const st = get();
          const ws = st.getActiveWorkspace();
          if (!ws) return [];
          const userEmail = st.user?.email;

          if (!userEmail) {
            console.error('No user email available for bulk creating posts');
            return [];
          }

          // Transform posts to API format
          const postsData = posts.map(post => {
            const postData: any = {
              workspace_id: ws.id,
              board_id: board_id,
              caption: post.caption,
              status: post.status,
              format: post.format,
              platforms: post.platforms,
              pages: post.pages,
              month: post.month,
              blocks: post.blocks,
              comments: post.comments,
              activities: post.activities,
            };

            // Only include optional fields if they have values
            if (post.publish_date) {
              postData.publish_date = post.publish_date.toISOString();
            }
            if (post.billingMonth) {
              postData.billing_month = post.billingMonth;
            }
            if (post.settings) {
              postData.settings = post.settings;
            }
            if (post.hashtags) {
              postData.hashtags = post.hashtags;
            }

            return postData;
          });

          const postIds = await storeApi.bulkCreatePostsAndUpdateStore(ws.id, board_id, postsData, userEmail);

          // Get the created posts from store
          const createdPosts = postIds.map(id => st.getPost(id)).filter(Boolean) as Post[];
          return createdPosts;
        },
        duplicatePost: async (orig) => {
          const st = get();
          const workspace = st.getActiveWorkspace();
          if (!workspace) return null;

          const board = workspace.boards.find(b => b.id === orig.board_id);
          if (!board) return null;

          const userEmail = st.user?.email;
          if (!userEmail) {
            console.error('No user email available for duplicating post');
            return null;
          }

          try {
            // Create duplicated post in database
            const postData: any = {
              caption: orig.caption,
              status: orig.status,
              format: orig.format,
              platforms: orig.platforms,
              pages: orig.pages,
              month: orig.month,
              blocks: orig.blocks,
              comments: orig.comments,
              activities: orig.activities,
            };

            // Only include publish_date if it exists
            if (orig.publish_date) {
              postData.publish_date = orig.publish_date.toISOString();
            }

            // Only include optional fields if they have values
            if (orig.billingMonth) {
              postData.billing_month = orig.billingMonth;
            }
            if (orig.settings) {
              postData.settings = orig.settings;
            }
            if (orig.hashtags) {
              postData.hashtags = orig.hashtags;
            }

            const postId = await storeApi.createPostAndUpdateStore(workspace.id, orig.board_id, postData, userEmail);

            // Get the created post from updated store
            const updatedStore = get();
            const duplicatedPost = updatedStore.getPost(postId);
            return duplicatedPost || null;
          } catch (error) {
            console.error('Failed to duplicate post:', error);
            return null;
          }
        },
        setActivePosts: (posts) => {
          set((s) => {
            const workspace = s.getActiveWorkspace();
            const currentBoardId = s.activeBoardId;
            if (!workspace || !currentBoardId) return {};
            
            // Find the current board and update its posts
            const board = workspace.boards.find(b => b.id === currentBoardId);
            if (board) {
              board.posts = posts;
            }
            
            return { workspaces: [...s.workspaces] };
          });
        },
        sharePostsToBrand: (postIds, targetBrandId) => {
          const st = get();
          let targetWorkspace: Workspace | undefined;
          let targetBoard: Board | undefined;
          
          outer: for (const w of st.workspaces) {
            if (w.brand && w.brand.id === targetBrandId) {
              targetWorkspace = w;
              // Use the first board as target for shared posts
              targetBoard = w.boards[0];
              break outer;
            }
          }
          
          if (!targetWorkspace || !targetBoard) return;
          
          const newArr: Post[] = [];
          for (const pid of postIds) {
            const ex = st.getPost(pid);
            if (!ex) continue;
            const cloned: Post = {
              ...ex,
              id: "share-" + uuidv4(),
              workspaceId: targetWorkspace.id,
              board_id: targetBoard.id,
              updatedAt: new Date(),
            };
            
            // Apply business rule to shared post
            const correctStatus = determineCorrectStatus(cloned.status, cloned.publish_date);
            cloned.status = correctStatus;
            
            newArr.push(cloned);
          }
          if (newArr.length) {
            targetBoard.posts.push(...newArr);
            set({ workspaces: [...st.workspaces] });
          }
        },

        // block / version
        addBlock: (postId, kind) => {
          const bid = uuidv4();
          const newBlock: Block = {
            id: bid,
            kind,
            currentVersionId: "",
            versions: [],
            comments: []
          };
          set((s) => ({
            workspaces: s.workspaces.map((ws) => ({
              ...ws,
              boards: ws.boards.map((b) => ({
                ...b,
                posts: b.posts.map((p) => {
                  if (p.id !== postId) return p;
                  return { ...p, blocks: [...p.blocks, newBlock] };
                }),
              })),
            })),
          }));
          return bid;
        },
        removeBlock: (postId, blockId) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => ({
              ...ws,
              boards: ws.boards.map((b) => ({
                ...b,
                posts: b.posts.map((p) => {
                  if (p.id !== postId) return p;
                  return {
                    ...p,
                    blocks: p.blocks.filter((b) => b.id !== blockId),
                  };
                }),
              })),
            })),
          }));
        },
        addVersion: (postId, blockId, ver) => {
          const newVid = uuidv4();
          set((s) => ({
            workspaces: s.workspaces.map((ws) => ({
              ...ws,
              boards: ws.boards.map((b) => ({
                ...b,
                posts: b.posts.map((p) => {
                  if (p.id !== postId) return p;
                  return {
                    ...p,
                    blocks: p.blocks.map((b) => {
                      if (b.id !== blockId) return b;
                      const newV: Version = {
                        ...ver,
                        id: newVid,
                        createdAt: new Date(),
                        comments: []
                      };
                      const cvid = b.currentVersionId || newVid;
                      return {
                        ...b,
                        versions: [...b.versions, newV],
                        currentVersionId: cvid,
                      };
                    })
                  };
                }),
              })),
            })),
          }));
          return newVid;
        },
        setCurrentVersion: (postId, blockId, versionId) => {
          set((s) => {
            const newState = {
              workspaces: s.workspaces.map((ws) => ({
                ...ws,
                boards: ws.boards.map((b) => ({
                  ...b,
                  posts: b.posts.map((p) => {
                    if (p.id !== postId) return p;
                    return {
                      ...p,
                      blocks: p.blocks.map((b) => 
                        b.id === blockId
                          ? { ...b, currentVersionId: versionId }
                          : b
                      ),
                    };
                  }),
                })),
              })),
            };
            
            // Add revision activity
            const post = newState.workspaces
              .flatMap(w => w.boards)
              .flatMap(b => b.posts)
              .find(p => p.id === postId);
            
            if (post) {
              const block = post.blocks.find(b => b.id === blockId);
              if (block) {
                const versionIndex = block.versions.findIndex(v => v.id === versionId);
                if (versionIndex > 0) { // Only add activity if it's not the first version
                  const workspace = s.getActiveWorkspace();
                  if (workspace) {
                    const activity: Activity = {
                      id: uuidv4(),
                      workspaceId: workspace.id,
                      postId,
                      type: "revised",
                      actorId: get().user?.id || '',
                      metadata: {
                        versionNumber: versionIndex + 1
                      },
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    };
                    
                    // Add the activity to the post
                    const updatedState = {
                      workspaces: newState.workspaces.map((ws) => ({
                        ...ws,
                        boards: ws.boards.map((b) => ({
                          ...b,
                          posts: b.posts.map((p) => {
                            if (p.id !== postId) return p;
                            return {
                              ...p,
                              activities: [
                                activity,
                                ...p.activities
                              ],
                            };
                          }),
                        })),
                      })),
                    };
                    
                    return updatedState;
                  }
                }
              }
            }
            
            return newState;
          });
        },

        // Comments
        addPostComment: async (postId, text, parentId, revisionRequested) => {
          const { commentApi } = await import('@/lib/api/api-service');
          const comment = await commentApi.addPostComment({
            post_id: postId,
            text,
            parent_id: parentId,
            revision_requested: revisionRequested,
            author: getCurrentUserDisplayNameFromStore(get()),
            authorEmail: (get() as any).user?.email,
            authorImageUrl: (get() as any).user?.imageUrl,
          });

          if (revisionRequested) {
            const currentPost = get().getPost(postId);
            if (currentPost) {
              const allowedStatusesForRevision = ["Pending Approval", "Revised", "Approved"];
              if (allowedStatusesForRevision.includes(currentPost.status)) {
                set((s) => ({
                  workspaces: s.workspaces.map((ws) => ({
                    ...ws,
                    boards: ws.boards.map((b) => ({
                      ...b,
                      posts: b.posts.map((p) => (
                        p.id !== postId ? p : { ...p, status: "Needs Revisions" as Status }
                      )),
                    })),
                  })),
                }));
              }
            }
          }

          set((s) => ({
            workspaces: s.workspaces.map((ws) => ({
              ...ws,
              boards: ws.boards.map((b) => ({
                ...b,
                posts: b.posts.map((p) => {
                  if (p.id !== postId) return p;
                  const c: BaseComment = {
                    id: comment.id,
                    parentId: comment.parent_id,
                    createdAt: new Date(comment.created_at),
                    author: comment.author,
                    authorEmail: (get() as any).user?.email,
                    authorImageUrl: (get() as any).user?.imageUrl,
                    text: comment.text,
                    revisionRequested: comment.revision_requested,
                  };
                  return { ...p, comments: [...p.comments, c] };
                }),
              })),
            })),
          }));
          return comment.id;
        },
        addBlockComment: async (postId, blockId, text, parentId, revisionRequested) => {
          const { commentApi } = await import('@/lib/api/api-service');
          const comment = await commentApi.addBlockComment({
            post_id: postId,
            block_id: blockId,
            text,
            parent_id: parentId,
            revision_requested: revisionRequested,
            author: getCurrentUserDisplayNameFromStore(get()),
            authorEmail: (get() as any).user?.email,
            authorImageUrl: (get() as any).user?.imageUrl,
          });

          if (revisionRequested) {
            const currentPost = get().getPost(postId);
            if (currentPost) {
              const allowedStatusesForRevision = ["Pending Approval", "Revised", "Approved"];
              if (allowedStatusesForRevision.includes(currentPost.status)) {
                set((s) => ({
                  workspaces: s.workspaces.map((ws) => ({
                    ...ws,
                    boards: ws.boards.map((b) => ({
                      ...b,
                      posts: b.posts.map((p) => (
                        p.id !== postId ? p : { ...p, status: "Needs Revisions" as Status }
                      )),
                    })),
                  })),
                }));
              }
            }
          }

          set((s) => ({
            workspaces: s.workspaces.map((ws) => ({
              ...ws,
              boards: ws.boards.map((b) => ({
                ...b,
                posts: b.posts.map((p) => {
                  if (p.id !== postId) return p;
                  return {
                    ...p,
                    blocks: p.blocks.map((b) => {
                      if (b.id !== blockId) return b;
                      const c: BaseComment = {
                        id: comment.id,
                        parentId: comment.parent_id,
                        createdAt: new Date(comment.created_at),
                        author: comment.author,
                        authorEmail: (get() as any).user?.email,
                        authorImageUrl: (get() as any).user?.imageUrl,
                        text: comment.text,
                        revisionRequested: comment.revision_requested,
                      };
                      return { ...b, comments: [...b.comments, c] };
                    }),
                  };
                }),
              })),
            })),
          }));
          return comment.id;
        },
        addVersionComment: async (
          postId: string,
          blockId: string,
          verId: string,
          text: string,
          rect?: { x: number; y: number; w: number; h: number },
          parentId?: string,
          revisionRequested?: boolean
        ) => {
          const { commentApi } = await import('@/lib/api/api-service');
          const comment = await commentApi.addVersionComment({
            post_id: postId,
            block_id: blockId,
            version_id: verId,
            text,
            parent_id: parentId,
            revision_requested: revisionRequested,
            author: getCurrentUserDisplayNameFromStore(get()),
            authorEmail: (get() as any).user?.email,
            authorImageUrl: (get() as any).user?.imageUrl,
            rect,
          });

          if (revisionRequested) {
            const currentPost = get().getPost(postId);
            if (currentPost) {
              const allowedStatusesForRevision = ["Pending Approval", "Revised", "Approved"];
              if (allowedStatusesForRevision.includes(currentPost.status)) {
                set((s) => ({
                  workspaces: s.workspaces.map((ws) => ({
                    ...ws,
                    boards: ws.boards.map((b) => ({
                      ...b,
                      posts: b.posts.map((p) => (
                        p.id !== postId ? p : { ...p, status: "Needs Revisions" as Status }
                      )),
                    })),
                  })),
                }));
              }
            }
          }

          set((s) => ({
            workspaces: s.workspaces.map((ws) => ({
              ...ws,
              boards: ws.boards.map((b) => ({
                ...b,
                posts: b.posts.map((p) => {
                  if (p.id !== postId) return p;
                  return {
                    ...p,
                    blocks: p.blocks.map((b) => {
                      if (b.id !== blockId) return b;
                      return {
                        ...b,
                        versions: b.versions.map((v) => {
                          if (v.id !== verId) return v;
                          const c: VersionComment = {
                            id: comment.id,
                            parentId: comment.parent_id,
                            createdAt: new Date(comment.created_at),
                            author: comment.author,
                            authorEmail: (get() as any).user?.email,
                            authorImageUrl: (get() as any).user?.imageUrl,
                            text: comment.text,
                            revisionRequested: comment.revision_requested,
                          };
                          if (comment.rect) c.rect = comment.rect;
                          return { ...v, comments: [...v.comments, c] };
                        }),
                      };
                    })
                  };
                }),
              })),
            })),
          }));
          return comment.id;
        },

        // Activities
        addActivity: async (act) => {
          const workspace = get().getActiveWorkspace();
          
          if (!workspace || !act.postId) return;

          try {
            // First, persist to database
            const saved = await activityApi.addActivity({
              workspace_id: workspace.id,
              post_id: act.postId,
              actor_id: act.actorId,
              type: act.type,
              metadata: act.metadata,
            });

            console.log('saved', saved);

            // Then, update the store with the saved activity
            if (saved && saved.id) {
              const activityId = saved.id as string;
              set((s) => ({
                workspaces: s.workspaces.map((ws) => ({
                  ...ws,
                  boards: ws.boards.map((b) => ({
                    ...b,
                    posts: b.posts.map((p) => {
                      if (p.id !== act.postId) return p;
                      return {
                        ...p,
                        activities: [
                          {
                            ...act,
                            id: activityId,
                            actor: saved.actor,
                            createdAt: new Date(saved.created_at),
                            updatedAt: new Date(saved.updated_at),
                          },
                          ...p.activities
                        ],
                      };
                    }),
                  })),
                })),
              }));
            }
          } catch (error) {
            // Handle error - you might want to show a notification or handle it differently
            console.error('Failed to add activity:', error);
            throw error; // Re-throw to let caller handle the error
          }
        },

        // Boards
        setActiveBoard: (id) => set({ activeBoardId: id }),
        addBoard: async (name: string, description?: string, image?: string, color?: string, rules?: BoardRules) => {
          try {
            const activeWorkspaceId = get().activeWorkspaceId
            if (!activeWorkspaceId) {
              throw new Error('No active workspace')
            }
            const bid = await storeApi.createBoardAndUpdateStore(
              activeWorkspaceId,
              name,
              description,
              !image ? '/images/boards/icons/icon-2.svg' : image,
              color == '#FFFFFF' ? '#125AFF' : color,
              rules
            )
            set({ activeBoardId: bid })
            return bid
          } catch (error) {
            console.error('Failed to add board:', error)
            throw error
          }
        },
        updateBoard: async (id: string, data: Partial<Board>) => {
          try {
            await storeApi.updateBoardAndUpdateStore(id, data)
          } catch (error) {
            console.error('Failed to update board:', error)
            throw error
          }
        },
        removeBoard: async (id: string) => {
          try {
            await storeApi.deleteBoardAndUpdateStore(id)
          } catch (error) {
            console.error('Failed to remove board:', error)
            throw error
          }
        },

        // Board Templates
        addBoardTemplate: (template) => {
          const tid = uuidv4();
          const newTemplate: BoardTemplate = { ...template, id: tid };
          set(s => ({ boardTemplates: [...s.boardTemplates, newTemplate] }));
          return tid;
        },
        updateBoardTemplate: (id, data) => {
          set(s => ({
            boardTemplates: s.boardTemplates.map(t => t.id === id ? { ...t, ...data } : t)
          }));
        },
        removeBoardTemplate: (id) => {
          set(s => ({
            boardTemplates: s.boardTemplates.filter(t => t.id !== id)
          }));
        },

        // Group data methods implementation (DB first)
        addGroupComment: (board_id, month, text, author) => {
          const commentId = uuidv4();
          const userEmail: string | null = (get() as any).user?.email ?? null;
          // Optimistic local object to use in case of failure
          const optimisticComment: GroupComment = {
            id: commentId,
            author,
            authorEmail: userEmail || undefined,
            authorImageUrl: (get() as any).user?.imageUrl,
            text,
            createdAt: new Date(),
            resolved: false,
            messages: [],
            readBy: userEmail ? [userEmail] : [],
            aiSummary: [
              "Love the overall vibe, but the first 3 seconds felt a bit slow to grab attention.",
              "Typography is nice but hard to read on mobile due to size.",
              "Maybe reduce the pink saturation slightly—it's overpowering the visuals."
            ]
          };

          // Persist to DB by updating board.group_data, then sync store from server response
          const st = get();
          const ws = st.getActiveWorkspace();
          if (!ws) return commentId;

          const currentBoard = ws.boards.find(b => b.id === board_id);
          const currentGroupData = currentBoard?.groupData || [];
          const nextGroupData: BoardGroupData[] = (() => {
            const monthGroup = currentGroupData.find(gd => gd.month === month);
            if (monthGroup) {
              return currentGroupData.map(gd => gd.month === month ? {
                ...gd,
                comments: [...gd.comments, optimisticComment]
              } : gd);
            }
            return [...currentGroupData, { month, comments: [optimisticComment], revisionCount: 0 }];
          })();

          // DB first: update board.group_data, which will then update the store via storeApi
          storeApi.updateBoardAndUpdateStore(board_id, { group_data: nextGroupData });
          return commentId;
        },

        /** Mark a specific group comment as read by current user (adds email to readBy). DB-first */
        markGroupCommentRead: (board_id: string, month: number, commentId: string) => {
          const st = get();
          const ws = st.getActiveWorkspace();
          if (!ws) return;
          const currentBoard = ws.boards.find(b => b.id === board_id);
          const currentGroupData = currentBoard?.groupData || [];
          const userEmail: string | null = (get() as any).user?.email ?? null;
          if (!userEmail) return;

          const nextGroupData = currentGroupData.map(gd => {
            if (gd.month !== month) return gd;
            return {
              ...gd,
              comments: gd.comments.map(c => c.id === commentId
                ? { ...c, readBy: Array.from(new Set([...(c.readBy || []), userEmail])) }
                : c)
            };
          });
          storeApi.updateBoardAndUpdateStore(board_id, { group_data: nextGroupData });
        },

        updateGroupComment: (board_id, month, commentId, data) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              // Only update the active workspace
              if (ws.id !== s.activeWorkspaceId) return ws;
              
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== board_id) return board;
                  
                  const updatedGroupData = (board.groupData || []).map(gd => {
                    if (gd.month !== month) return gd;
                    
                    return {
                      ...gd,
                      comments: gd.comments.map(comment => 
                        comment.id === commentId 
                          ? { ...comment, ...data, updatedAt: new Date() }
                          : comment
                      )
                    };
                  });
                  
                  return { ...board, groupData: updatedGroupData };
                })
              };
            })
          }));
        },

        deleteGroupComment: (board_id, month, commentId) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              // Only update the active workspace
              if (ws.id !== s.activeWorkspaceId) return ws;
              
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== board_id) return board;
                  
                  const updatedGroupData = (board.groupData || []).map(gd => {
                    if (gd.month !== month) return gd;
                    
                    return {
                      ...gd,
                      comments: gd.comments.filter(comment => comment.id !== commentId)
                    };
                  });
                  
                  return { ...board, groupData: updatedGroupData };
                })
              };
            })
          }));
        },

        resolveGroupComment: (board_id, month, commentId, resolvedBy) => {
          const st = get();
          const ws = st.getActiveWorkspace();
          if (!ws) return;
          const currentBoard = ws.boards.find(b => b.id === board_id);
          const currentGroupData = currentBoard?.groupData || [];
          const nextGroupData = currentGroupData.map(gd => {
            if (gd.month !== month) return gd;
            return {
              ...gd,
              comments: gd.comments.map(c => c.id === commentId ? {
                ...c,
                resolved: true,
                resolvedAt: new Date(),
                resolvedBy,
                updatedAt: new Date(),
              } : c)
            };
          });
          storeApi.updateBoardAndUpdateStore(board_id, { group_data: nextGroupData });
        },

        addGroupMessage: (board_id, month, commentId, text, author, parentMessageId) => {
          const messageId = uuidv4();
          const newMessage: GroupMessage = {
            id: messageId,
            author,
            authorEmail: (get() as any).user?.email,
            authorImageUrl: (get() as any).user?.imageUrl,
            text,
            createdAt: new Date(),
            replies: []
          };

          const st = get();
          const ws = st.getActiveWorkspace();
          if (!ws) return messageId;

          const currentBoard = ws.boards.find(b => b.id === board_id);
          const currentGroupData = currentBoard?.groupData || [];
          const nextGroupData = currentGroupData.map(gd => {
            if (gd.month !== month) return gd;
            return {
              ...gd,
              comments: gd.comments.map(comment => {
                if (comment.id !== commentId) return comment;
                if (!parentMessageId) {
                  return { ...comment, messages: [...comment.messages, newMessage] };
                }
                const addToReplies = (messages: GroupMessage[]): GroupMessage[] => {
                  return messages.map(msg => msg.id === parentMessageId
                    ? { ...msg, replies: [...msg.replies, newMessage] }
                    : { ...msg, replies: addToReplies(msg.replies) }
                  );
                };
                return { ...comment, messages: addToReplies(comment.messages) };
              })
            };
          });
          storeApi.updateBoardAndUpdateStore(board_id, { group_data: nextGroupData });
          return messageId;
        },

        updateGroupMessage: (board_id, month, commentId, messageId, data) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              // Only update the active workspace
              if (ws.id !== s.activeWorkspaceId) return ws;
              
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== board_id) return board;
                  
                  const updatedGroupData = (board.groupData || []).map(gd => {
                    if (gd.month !== month) return gd;
                    
                    const updateMessageInReplies = (messages: GroupMessage[]): GroupMessage[] => {
                      return messages.map(msg => {
                        if (msg.id === messageId) {
                          return { ...msg, ...data, updatedAt: new Date() };
                        } else {
                          return { ...msg, replies: updateMessageInReplies(msg.replies) };
                        }
                      });
                    };
                    
                    return {
                      ...gd,
                      comments: gd.comments.map(comment => {
                        if (comment.id !== commentId) return comment;
                        
                        return {
                          ...comment,
                          messages: updateMessageInReplies(comment.messages)
                        };
                      })
                    };
                  });
                  
                  return { ...board, groupData: updatedGroupData };
                })
              };
            })
          }));
        },

        deleteGroupMessage: (board_id, month, commentId, messageId) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              // Only update the active workspace
              if (ws.id !== s.activeWorkspaceId) return ws;
              
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== board_id) return board;
                  
                  const updatedGroupData = (board.groupData || []).map(gd => {
                    if (gd.month !== month) return gd;
                    
                    const deleteMessageFromReplies = (messages: GroupMessage[]): GroupMessage[] => {
                      return messages
                        .filter(msg => msg.id !== messageId)
                        .map(msg => ({
                          ...msg,
                          replies: deleteMessageFromReplies(msg.replies)
                        }));
                    };
                    
                    return {
                      ...gd,
                      comments: gd.comments.map(comment => {
                        if (comment.id !== commentId) return comment;
                        
                        return {
                          ...comment,
                          messages: deleteMessageFromReplies(comment.messages)
                        };
                      })
                    };
                  });
                  
                  return { ...board, groupData: updatedGroupData };
                })
              };
            })
          }));
        },

        updateGroupCommentAiSummary: (board_id, month, commentId, aiSummary) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              // Only update the active workspace
              if (ws.id !== s.activeWorkspaceId) return ws;
              
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== board_id) return board;
                  
                  const updatedGroupData = (board.groupData || []).map(gd => {
                    if (gd.month !== month) return gd;
                    
                    return {
                      ...gd,
                      comments: gd.comments.map(comment => 
                        comment.id === commentId 
                          ? { ...comment, aiSummary, updatedAt: new Date() }
                          : comment
                      )
                    };
                  });
                  
                  return { ...board, groupData: updatedGroupData };
                })
              };
            })
          }));
        },

        deleteGroupCommentAiSummaryItem: (board_id, month, commentId, summaryIndex) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              if (ws.id !== s.activeWorkspaceId) return ws;
        
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== board_id) return board;
        
                  const updatedGroupData = (board.groupData || []).map((gd) => {
                    if (gd.month !== month) return gd;
        
                    return {
                      ...gd,
                      comments: gd.comments.map((comment) => {
                        if (comment.id === commentId && comment.aiSummary) {
                          const newAiSummary = [...comment.aiSummary];
                          newAiSummary.splice(summaryIndex, 1);
                          return { ...comment, aiSummary: newAiSummary, updatedAt: new Date() };
                        }
                        return comment;
                      }),
                    };
                  });
        
                  return { ...board, groupData: updatedGroupData };
                }),
              };
            }),
          }));
        },

        // User management methods
        setUser: (user: User | null) => {
          set({ user })
          // User is now set, unread messages will be handled through websocket events
        },
        updateUserNotificationSettings: (notificationSettings: NotificationSettings) => {
          set((state) => ({
            user: state.user ? {
              ...state.user,
              notification_settings: notificationSettings
            } : null
          }))
        },
        clearUser: () => set({ user: null }),
        setCurrentChannelId: (channelId) => set({ currentChannelId: channelId }),
        
        updatePostStatusesBasedOnTime: () => {
          set((s) => {
            let updatedCount = 0;
            let hasChanges = false;
            
            const newWs = s.workspaces.map((ws) => ({
              ...ws,
              boards: ws.boards.map((board) => {
                const updatedPosts = board.posts.map((p) => {
                  const correctStatus = determineCorrectStatus(p.status, p.publish_date);
                  if (correctStatus !== p.status) {
                    updatedCount++;
                    hasChanges = true;
                    return { ...p, status: correctStatus };
                  }
                  return p;
                });
                
                // Only create new board object if posts changed
                if (hasChanges) {
                  return { ...board, posts: updatedPosts };
                }
                return board;
              }),
            }));
            
            if (updatedCount > 0) {
              return { workspaces: newWs };
            }
            
            // If no changes, return the same state to prevent unnecessary re-renders
            return s;
          });
        },

        addUnreadMessage: (messageId: string) => {
          set((s) => {
            if (!s.user) return s;
            
            // Check if message is already in unread list
            const currentUnread = s.user.unread_msg || []
            if (currentUnread.includes(messageId)) return s;
            
            return {
              ...s,
              user: {
                ...s.user,
                unread_msg: [...currentUnread, messageId]
              }
            };
          });
        },
        removeUnreadMessage: (messageId: string) => {
          set((s) => {
            if (!s.user) return s;
            
            const currentUnread = s.user.unread_msg || []
            const newUnread = currentUnread.filter(id => id !== messageId)
            
            return {
              ...s,
              user: {
                ...s.user,
                unread_msg: newUnread
              }
            };
          });
        },
        hasUnreadMessages: () => {
          const hasUnread = (get().user?.unread_msg?.length || 0) > 0;
          return hasUnread;
        },
        // Mark all messages in a channel as read
        markChannelAsRead: async (channelId: string) => {
          try {
            const store = get()
            const currentUserEmail = store.user?.email
            if (!currentUserEmail) return

            const result = await (storeApi as any).markChannelAsRead(currentUserEmail, channelId)
            if (result?.unread_msg) {
              set((s) => ({
                ...s,
                user: {
                  ...s.user!,
                  unread_msg: result.unread_msg
                }
              }))
            }
          } catch (error) {
            console.error('Error marking channel as read:', error)
          }
        },

      }),
      {
        name: "feedbird-v5",
        storage: createJSONStorage(() => {
          // Check if we're on the client side
          if (typeof window === 'undefined') {
            // Server-side: return a mock storage
            return {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            };
          }
          // Client-side: use sessionStorage
          return sessionStorage;
        }),
        skipHydration: true,
      }
    )
  );

// Export the default icons and colors for use in components
export { defaultIcons, defaultColors };

// Custom hook to handle hydration
export const useHydration = () => {
  const [hydrated, setHydrated] = React.useState(false);
  
  React.useEffect(() => {
    setHydrated(true);
  }, []);
  
  return hydrated;
};

// Hook to use the store with proper hydration handling
export const useFeedbirdStoreWithHydration = <T>(selector: (state: FeedbirdStore) => T): T | undefined => {
  const hydrated = useHydration();
  const result = useFeedbirdStore(selector);
  
  if (!hydrated) {
    return undefined;
  }
  
  return result;
};

// Hook to periodically update post statuses based on time
export const usePostStatusTimeUpdater = () => {
  const updatePostStatusesBasedOnTime = useFeedbirdStore(s => s.updatePostStatusesBasedOnTime);
  const workspaces = useFeedbirdStore(s => s.workspaces);
  
  // Helper function to check if any posts need status updates
  const checkIfUpdatesNeeded = React.useCallback(() => {
    const now = new Date();
    for (const ws of workspaces) {
      for (const board of ws.boards) {
        for (const post of board.posts) {
          if (post.publish_date) {
            const publish_date = post.publish_date instanceof Date ? post.publish_date : new Date(post.publish_date);
            if (!isNaN(publish_date.getTime())) {
              const isPast = publish_date < now;
              const needsUpdate = (isPast && post.status !== "Published" && post.status !== "Failed Publishing") ||
                                (!isPast && (post.status === "Published" || post.status === "Failed Publishing"));
              if (needsUpdate) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }, [workspaces]);
  
  React.useEffect(() => {
    // Update immediately on mount
    updatePostStatusesBasedOnTime();
    
    // Set up interval to check every 60 seconds (increased from 10 seconds for production)
    const interval = setInterval(() => {
      // Only run the update if there are posts that might need status changes
      if (checkIfUpdatesNeeded()) {
        updatePostStatusesBasedOnTime();
      } else {
        console.log("PostStatusTimeUpdater: No status updates needed, skipping...");
      }
    }, 60000); // 60 seconds for production
    
    return () => {
      clearInterval(interval);
    };
  }, [updatePostStatusesBasedOnTime, checkIfUpdatesNeeded]);
};

/* Helper: Extract URLs from post.blocks that contain images, etc. */
function extractMediaUrls(blocks: Block[]): string[] {
  if (!blocks?.length) return [];

  return blocks.flatMap((block) => {
    // 1 — locate the version we should take
    const version =
      block.versions.find((v) => v.id === block.currentVersionId) ??
      block.versions[block.versions.length - 1]; // fallback: latest

    // 2 — return its URL if present & truthy
    return version?.file?.url ? [version.file.url] : [];
  });
}
// Helper to coerce any value to PageStatus
function toPageStatus(val: any): import("@/lib/social/platforms/platform-types").PageStatus {
  return ["active", "expired", "pending", "disconnected"].includes(val) ? val : "pending";
}

// Helper functions to avoid deep nesting and complex state updates
const findBrand = (workspaces: Workspace[], brandId: string) =>
  workspaces.map(w => w.brand).filter(b => b !== undefined).find(b => b!.id === brandId);

const findPage = (workspace: Workspace | undefined, pageId: string) =>
  workspace?.socialPages?.find((p: SocialPage) => p.id === pageId);

const findAccount = (workspace: Workspace | undefined, accountId: string) =>
  workspace?.socialAccounts?.find((a: SocialAccount) => a.id === accountId);

/**
 * Determines the correct post status based on publish date and current status
 * If publish date is in the past, status should be 'Published' or 'Failed Publishing'
 * If publish date is in the future or null, status should be one of the other statuses
 */
function determineCorrectStatus(currentStatus: Status, publish_date: Date | null): Status {
  // If no publish date, keep current status
  if (!publish_date) {
    return currentStatus;
  }

  // Convert to Date object if it's a string (due to JSON serialization)
  const publishDateObj = publish_date instanceof Date ? publish_date : new Date(publish_date);
  
  // Check if the date is valid
  if (isNaN(publishDateObj.getTime())) {
    return currentStatus;
  }

  const now = new Date();
  const isPast = publishDateObj < now;

  if (isPast) {
    // If publish date is in the past, status should be 'Published' or 'Failed Publishing'
    // Only change if current status is not already one of these
    if (currentStatus === "Published" || currentStatus === "Failed Publishing") {
      return currentStatus; // Keep as is
    }
    // For other statuses, change to Published (unless it was Failed Publishing)
    return "Published";
  } else {
    // If publish date is in the future, keep current status
    // Only change if current status is past-related and publish date is in future
    if (currentStatus === "Published" || currentStatus === "Failed Publishing") {
      return "Scheduled";
    }
    return currentStatus;
  }
}

// A generic function to update a specific page within the nested state
function updatePage(
  state: FeedbirdStore, 
  brandId: string, 
  pageId: string, 
  updates: Partial<SocialPage>
): { workspaces: Workspace[] } {
  return {
    workspaces: state.workspaces.map(w => ({
      ...w,
      socialPages: (w.socialPages || []).map((p: SocialPage) => p.id === pageId
        ? { ...p, ...updates }
        : p),
    }))
  };
}
