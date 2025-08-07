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
  PostHistory
} from "@/lib/social/platforms/platform-types";
import { getPlatformOperations } from "../social/platforms";
import { handleError } from "../utils/error-handler";
import { BaseError } from "../utils/exceptions/base-error";
import { withLoading } from "../utils/loading/loading-store";
import { RowHeightType } from "../utils";
import { storeApi, commentApi } from '@/lib/api/api-service'
import { getCurrentUserDisplayNameFromStore } from "@/lib/utils/user-utils";

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
  text: string;
  createdAt: Date;
  updatedAt?: Date;
  replies: GroupMessage[]; // Recursive structure for nested replies
}

export interface GroupComment {
  id: string;
  author: string;
  text: string;
  createdAt: Date;
  updatedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  aiSummary?: string[];
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
  | "lastUpdatedTime";

export interface UserColumn {
  id: string;
  label: string;
  type: ColumnType;
  options?: string[];
}

// Re-export types from platform-types.ts for backward compatibility
export type { Platform, Status, FileKind, ContentFormat };

export interface BaseComment {
  id: string;
  parentId?: string;
  createdAt: Date;
  author: string;
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
  postId: string;
  actor: string;
  action: string;
  type: 'revision_request' | 'revised' | 'approved' | 'scheduled' | 'published' | 'failed_publishing';
  at: Date;
  metadata?: {
    versionNumber?: number;
    comment?: string;
    publishTime?: Date;
    revisionComment?: string;
    commentId?: string;
  };
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

  /** Per-post settings such as location tag, tagged accounts, custom thumbnail, etc. */
  settings?: {
    /* flags */
    location?: boolean;
    tagAccounts?: boolean;
    thumbnail?: boolean;

    /* actual data */
    locationTags?: string[];
    taggedAccounts?: string[];
  };

  /** Hashtags data with sync/unsync functionality */
  hashtags?: CaptionData;

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
  platforms?: Platform[];
  socialAccounts: SocialAccount[];
  socialPages: SocialPage[];
  link?: string;
  voice?: string;
  prefs?: string;
}

export interface Workspace {
  id: string;
  name: string;
  logo?: string;
  createdby?: string; // ID of the user who created this workspace
  /**
   * User role within this workspace. "admin" for creator, "member" for invitee.
   */
  role?: 'admin' | 'member';
  boards: Board[];
  brand?: Brand; // Single brand per workspace (one-to-one relationship)
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

/*─────────────────────────────────────────────────────────────────────*/
/*  Store Interface                                                  */
/*─────────────────────────────────────────────────────────────────────*/
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface FeedbirdStore {
  // User management
  user: User | null;
  
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeBrandId: string | null;
  activeBoardId: string | null;
  boardTemplates: BoardTemplate[];

  platformNav: NavLink[];
  boardNav: NavLink[];
  
  /** NEW: Store post history fetched from each social page. Key = pageId. */
  postHistory: Record<string, PostHistory[]>;
  
  /** Loading states for post history sync. Key = pageId. */
  syncingPostHistory: Record<string, boolean>;

  // User management
  setUser: (user: User | null) => void;
  clearUser: () => void;
  
  setActiveWorkspace: (id: string) => void;
  setActiveBrand: (id: string) => void;
  setActiveBoard: (id: string) => void;
  connectSocialAccount: (brandId: string, platform: Platform, account: Pick<SocialAccount, "name" | "accountId" | "authToken">) => string;
  disconnectSocialAccount: (brandId: string, accountId: string) => void;
  stageSocialPages: (brandId: string, platform: Platform, pages: SocialPage[], localAccountId: string) => void;
  confirmSocialPage: (brandId: string, pageId: string) => Promise<void>;
  disconnectSocialPage: (brandId: string, pageId: string) => Promise<void>;
  checkAccountStatus: (brandId: string, accountId: string) => Promise<void>;
  checkPageStatus: (brandId: string, pageId: string) => Promise<void>;
  deletePagePost: (brandId: string, pageId: string, postId: string) => Promise<void>;
  getPageCounts: () => Record<Platform, number>;
  getActiveWorkspace: () => Workspace | undefined;
  getActiveBrand: () => Brand | undefined;
  getActivePosts: () => Post[];
  getAllPosts: () => Post[];
  syncPostHistory: (brandId: string, pageId: string) => Promise<void>;
  publishPostToAllPages: (postId: string, scheduledTime?: Date) => Promise<void>;
  getPost: (id: string) => Post | undefined;
  updatePost: (pid: string, data: Partial<Post>) => Promise<void>;
  updatePostStatusesBasedOnTime: () => void;
  addWorkspace: (name: string, email: string, logo?: string) => Promise<string>;
  removeWorkspace: (id: string) => Promise<void>;
  loadUserWorkspaces: (email: string) => Promise<void>;
  addBrand: (name: string, logo?: string, styleGuide?: Brand['styleGuide'], link?: string, voice?: string, prefs?: string) => Promise<string>;
  updateBrand: (id: string, data: Partial<Brand>) => Promise<void>;
  removeBrand: (id: string) => Promise<void>;
  addBoard: (name: string, description?: string, image?: string, color?: string, rules?: BoardRules) => Promise<string>;
  updateBoard: (id: string, data: Partial<Board>) => Promise<void>;
  removeBoard: (id: string) => Promise<void>;
  addBoardTemplate: (template: Omit<BoardTemplate, 'id'>) => string;
  updateBoardTemplate: (id: string, data: Partial<BoardTemplate>) => void;
  removeBoardTemplate: (id: string) => void;
  
  // Group data methods
  addGroupComment: (boardId: string, month: number, text: string, author: string) => string;
  updateGroupComment: (boardId: string, month: number, commentId: string, data: Partial<GroupComment>) => void;
  deleteGroupComment: (boardId: string, month: number, commentId: string) => void;
  resolveGroupComment: (boardId: string, month: number, commentId: string, resolvedBy: string) => void;
  addGroupMessage: (boardId: string, month: number, commentId: string, text: string, author: string, parentMessageId?: string) => string;
  updateGroupMessage: (boardId: string, month: number, commentId: string, messageId: string, data: Partial<GroupMessage>) => void;
  deleteGroupMessage: (boardId: string, month: number, commentId: string, messageId: string) => void;
  updateGroupCommentAiSummary: (boardId: string, month: number, commentId: string, aiSummary: string[]) => void;
  deleteGroupCommentAiSummaryItem: (boardId: string, month: number, commentId: string, summaryIndex: number) => void;
  
  deletePost: (postId: string) => Promise<void>;
  bulkDeletePosts: (postIds: string[]) => Promise<void>;
  approvePost: (id: string) => Promise<void>;
  requestChanges: (id: string, comment?: string) => Promise<void>;
  setPostRevised: (id: string) => Promise<void>;
  addPost: (boardId?: string) => Promise<Post | null>;
  bulkAddPosts: (boardId: string, posts: Omit<Post, 'id' | 'workspaceId' | 'boardId' | 'updatedAt'>[]) => Promise<Post[]>;
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
  addActivity: (act: Omit<Activity, 'id' | 'at'>) => void;
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

function boardsToNav(boards: Board[]): NavLink[] {
  return boards.map((b) => ({ 
    id: b.id, 
    label: b.name, 
    image: b.image, 
    selectedImage: b.selectedImage, 
    href: `/content/${b.id}`, 
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
      activeWorkspaceId: null,
      activeBrandId: null,
      activeBoardId: null,
      boardTemplates: [
          { 
            id: "t1", 
            name: "Social media management", 
            image: "/images/boards/templates/t1-social-media-management.svg", 
            description: "Social media management", 
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
            }
          },
          { 
            id: "t2", 
            name: "Weekly task manager", 
            image: "/images/boards/templates/t2-weekly-task-manager.svg", 
            description: "Weekly task manager", 
            color: "#125AFF",
            rules: {
              autoSchedule: false,
              revisionRules: false,
              approvalDeadline: false,
              groupBy: "month",
              sortBy: "publishDate",
              rowHeight: "Small",
            }
          },
          { 
            id: "t3", 
            name: "Content calendar", 
            image: "/images/boards/templates/t3-content-calendar.svg", 
            description: "Content calendar", 
            color: "#125AFF",
            rules: {
              autoSchedule: true,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "publishDate",
              rowHeight: "X-Large",
              firstMonth: 5,
              ongoingMonth: 3,
              approvalDays: 14,
            }
          },
          { 
            id: "t4", 
            name: "Meetings agenda", 
            image: "/images/boards/templates/t4-meetings-agenda.svg", 
            description: "Meetings agenda", 
            color: "#125AFF",
            rules: {
              autoSchedule: false,
              revisionRules: false,
              approvalDeadline: false,
              groupBy: "status",
              sortBy: "publishDate",
              rowHeight: "Large",
            }
          },
          { 
            id: "t5", 
            name: "Goals & milestones", 
            image: "/images/boards/templates/t5-goals-milestones.svg", 
            description: "Goals & milestones", 
            color: "#125AFF",
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
            id: "t6", 
            name: "Event planning", 
            image: "/images/boards/templates/t6-event-planning.svg", 
            description: "Event planning", 
            color: "#125AFF",
            rules: {
              autoSchedule: true,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "publishDate",
              rowHeight: "X-Large",
              firstMonth: 6,
              ongoingMonth: 3,
              approvalDays: 60,
            }
          },
          { 
            id: "t7", 
            name: "Editorial calendar", 
            image: "/images/boards/templates/t7-editorial-calendar.svg", 
            description: "Editorial calendar", 
            color: "#125AFF",
            rules: {
              autoSchedule: true,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "publishDate",
              rowHeight: "XX-Large",
              firstMonth: 5,
              ongoingMonth: 2,
              approvalDays: 14,
            }
          },
          { 
            id: "t8", 
            name: "Objectives & key results", 
            image: "/images/boards/templates/t8-objectives-key-results.svg", 
            description: "Objectives & key results", 
            color: "#125AFF",
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
            id: "t9", 
            name: "Customer feedback", 
            image: "/images/boards/templates/t9-social-media-campaign.svg", 
            description: "Social media campaign", 
            color: "#125AFF",
            rules: {
              autoSchedule: true,
              revisionRules: true,
              approvalDeadline: true,
              groupBy: "month",
              sortBy: "publishDate",
              rowHeight: "X-Large",
              firstMonth: 4,
              ongoingMonth: 2,
              approvalDays: 7,
            }
          },
        ],

        platformNav: defaultPlatformNav,
        boardNav: [],
        postHistory: {},
        syncingPostHistory: {},
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
          const boardId = get().activeBoardId;
          if (!workspace || !boardId) return [];
          
          const board = workspace.boards.find(b => b.id === boardId);
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
                addActivity({
                  postId,
                  actor: getCurrentUserDisplayNameFromStore(get()),
                  action: "scheduled this post",
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

              const connectedPages = brand.socialPages.filter(page => 
                post.pages.includes(page.id) && page.connected
              );

              if (connectedPages.length === 0) {
                throw new Error("No connected pages found for this post");
              }

              const publishPromises = connectedPages.map(async (page) => {
                const ops = getPlatformOperations(page.platform as Exclude<Platform, 'tiktok'>);
                if (!ops) {
                  throw new Error(`Platform operations not found for ${page.platform}`);
                }

                const publishResult = await ops.publishPost(page, {
                   text: post.caption.default,
                   media: {
                     type: "image" as const,
                     urls: processedBlocks.flatMap(block => 
                       block.versions.flatMap(version => version.media?.map(m => m.src) || [])
                     )
                   }
                 }, { scheduledTime });

                return {
                  pageId: page.id,
                  result: publishResult
                };
              });

              const results = await Promise.all(publishPromises);
              
              // Update post status based on results
              const hasErrors = results.some(r => r.result.error);
              if (hasErrors) {
                updatePost(postId, { status: "Failed Publishing" });
                throw new Error("Some posts failed to publish");
              } else {
                updatePost(postId, { status: scheduledTime ? "Scheduled" : "Published" });
              }

              // Add success activity
              addActivity({
                postId,
                actor: getCurrentUserDisplayNameFromStore(get()),
                action: scheduledTime ? "scheduled this post" : "published this post",
                type: scheduledTime ? "scheduled" : "published",
                metadata: {
                  publishTime: scheduledTime
                }
              });
            },
            {
              loading: scheduledTime ? "Scheduling post..." : "Publishing post...",
              success: scheduledTime ? "Post scheduled successfully!" : "Post published successfully!",
              error: "An error occurred while publishing."
            }
          );
        },

        syncPostHistory: (brandId, pageId) => {
          return withLoading(
            async () => {
              const workspace = get().getActiveWorkspace();
              if (!workspace?.brand || workspace.brand.id !== brandId) {
                throw new Error("Brand not found");
              }

              const brand = workspace.brand;
              const page = brand.socialPages.find(p => p.id === pageId);
              if (!page) throw new Error("Page not found");

              const ops = getPlatformOperations(page.platform as Exclude<Platform, 'tiktok'>);
              if (!ops) throw new Error(`Platform operations not found for ${page.platform}`);

              const fetched = await ops.getPostHistory(page, 20);
              
              set((state) => ({
                postHistory: { ...state.postHistory, [pageId]: fetched },
                workspaces: state.workspaces.map((w) => ({
                  ...w,
                  brand: w.brand && w.brand.id === brandId ? {
                    ...w.brand,
                    socialPages: w.brand.socialPages.map((sp) =>
                      sp.id === pageId ? { ...sp, lastSyncAt: new Date() } : sp
                    ),
                  } : w.brand,
                })),
              }));
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
        addWorkspace: async (name, email, logo) => {
          try {
            const wid = await storeApi.createWorkspaceAndUpdateStore(name, email, logo)
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
            return {
              activeWorkspaceId: id,
              activeBrandId: ws?.brand?.id ?? null,
              activeBoardId: ws?.boards[0]?.id ?? null,
              boardNav: boardsToNav(ws?.boards ?? []),
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
            console.log('@@@@@@@@@@@@@activeWorkspaceId: ', activeWorkspaceId);
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
        setActiveBrand: (id: string) =>
          set((s) => {
            const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
            const brand = ws?.brand && ws.brand.id === id ? ws.brand : undefined;
            return { activeBrandId: id };
          }),

        connectSocialAccount: (brandId: string, platform: Platform, account: Pick<SocialAccount, "name" | "accountId" | "authToken">) => {
          let localReturnId = crypto.randomUUID();
          set((state) => ({
            workspaces: state.workspaces.map((w) => ({
              ...w,
              brand: w.brand && w.brand.id === brandId ? (() => {
                const b = w.brand!;
                // 1) Check if an existing account has the same real accountId
                const existingAccount = b.socialAccounts?.find(
                  (a) => a.accountId === account.accountId
                );
                if (existingAccount) {
                  localReturnId = existingAccount.id;
                  return {
                    ...b,
                    socialAccounts: b.socialAccounts.map((a) =>
                      a.accountId === account.accountId
                        ? {
                            ...a,
                            connected: true,
                            status: "active",
                            authToken: account.authToken,
                          }
                        : a
                    ),
                  };
                }

                // 2) Otherwise, create a new local account
                const newAccount: SocialAccount = {
                  id: localReturnId,
                  name: account.name,
                  accountId: account.accountId,
                  platform,
                  authToken: account.authToken,
                  connected: true,
                  status: "active",
                };
                return {
                  ...b,
                  socialAccounts: [...(b.socialAccounts || []), newAccount],
                };
              })() : w.brand,
            })),
          }));
          return localReturnId;
        },

        disconnectSocialAccount: (brandId: string, accountId: string) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => ({
              ...ws,
              brand: ws.brand && ws.brand.id === brandId ? (() => {
                // Remove the given account & all its pages
                const account = ws.brand!.socialAccounts.find((a) => a.id === accountId);
                if (!account) return ws.brand;

                return {
                  ...ws.brand!,
                  socialAccounts: ws.brand!.socialAccounts.filter(
                    (a) => a.id !== accountId
                  ),
                  // remove pages of that account's platform
                  socialPages: ws.brand!.socialPages.filter(
                    (p) => p.platform !== account.platform
                  ),
                };
              })() : ws.brand,
            })),
          }));
        },

        stageSocialPages: (brandId, platform, pages, localAccountId) => {
          set((state) => {
            const newWs = state.workspaces.map((ws) => ({
              ...ws,
              brand: ws.brand && ws.brand.id === brandId ? (() => {
                const existing = ws.brand!.socialPages ?? [];

                // For each page => if we find a matching pageId, update accountId.
                const incoming = pages.map((p) => {
                  // does brand already have a page w/ pageId === p.pageId?
                  const found = existing.find((ex) => ex.pageId === p.pageId);
                  if (found) {
                    // Reassign this page's accountId
                    return {
                      ...found,
                      accountId: localAccountId,
                      connected: found.connected, 
                      status: toPageStatus(found.status),
                    };
                  } else {
                    // new page => set accountId to localAccountId, connected=false
                    return {
                      ...p,
                      accountId: localAccountId,
                      connected: false,
                      status: toPageStatus(p.status),
                    };
                  }
                });

                // Merge them back into the brand's socialPages
                const merged = [...existing];
                incoming.forEach((pg) => {
                  const idx = merged.findIndex((m) => m.pageId === pg.pageId);
                  if (idx >= 0) {
                    merged[idx] = pg; // update existing
                  } else {
                    merged.push(pg); // new
                  }
                });

                return { ...ws.brand!, socialPages: merged };
              })() : ws.brand,
            }));
            return { workspaces: newWs };
          });
        },

        confirmSocialPage: async (brandId, pageId) => {
          const brand = get().getActiveBrand();
          if (!brand || brand.id !== brandId) return;

          const page = brand.socialPages.find((p) => p.id === pageId);
          if (!page) throw new Error(`Page with ID ${pageId} not found in brand.`);
          
          /* TikTok profile == page; no page-level API available in sandbox.
           * We therefore skip the remote connect call and simply flip the
           * staged page to connected=true locally. */
          if (page.platform === 'tiktok') {
            set(s => updatePage(s, brandId, pageId, { connected: true, status: 'active' }));
            return;
          }

          const acct = brand.socialAccounts.find((a) => a.id === page.accountId);
          if (!acct) throw new Error(`Account for page ${pageId} not found.`);

          const ops = getPlatformOperations(page.platform as Exclude<Platform, 'tiktok'>);
          if (!ops) throw new Error(`No platform operations for ${page.platform}`);

          try {
            // Actually connect the page at the platform level
            const finalPage = await ops.connectPage(acct, page.pageId);

            // store final results in feedbird store
            set((s) => {
              const newWs = s.workspaces.map((ws) => ({
                ...ws,
                brand: ws.brand && ws.brand.id === brandId ? {
                  ...ws.brand,
                  socialPages: ws.brand.socialPages.map((sp) => {
                    if (sp.id === pageId) {
                      // Overwrite with finalPage info
                      return {
                        ...sp,
                        ...finalPage,
                        connected: true,
                        status: finalPage.status ?? 'active',
                      };
                    }
                    return sp;
                  }),
                } : ws.brand,
              }));
              return { workspaces: newWs };
            });
          } catch (error) {
            console.error(`Failed to connect page ${page.name}:`, error);
            // Propagate the error to be caught by the UI
            throw error;
          }
        },

        disconnectSocialPage: async (brandId: string, pageId: string) => {
          const brand = get().getActiveBrand();
          const page = brand?.socialPages.find(p => p.id === pageId);
          if (!page) throw new Error(`Page with ID ${pageId} not found.`);

          const ops = getPlatformOperations(page.platform as Exclude<Platform, 'tiktok'>);
          if (!ops) throw new Error(`No platform operations for ${page.platform}.`);

          try {
            // You might want a disconnect method in your platform operations
            // For now, we just remove it from the store.
            set((s) => ({
              workspaces: s.workspaces.map((ws) => ({
                ...ws,
                brand: ws.brand && ws.brand.id === brandId ? {
                  ...ws.brand,
                  socialPages: (ws.brand.socialPages ?? []).filter(
                    (p) => p.id !== pageId
                  ),
                } : ws.brand,
              })),
            }));
          } catch (error) {
            console.error(`Failed to disconnect page ${page.name}:`, error);
            throw error;
          }
        },

        checkAccountStatus: async (brandId: string, accountId: string) => {
          set((state) => ({
            workspaces: state.workspaces.map((w) => ({
              ...w,
              brand: w.brand && w.brand.id === brandId ? {
                ...w.brand,
                socialAccounts: w.brand.socialAccounts.map((a) => {
                  if (a.id === accountId) {
                    return {
                      ...a,
                      status: a.connected ? "active" : "disconnected",
                    };
                  }
                  return a;
                }),
              } : w.brand,
            })),
          }));
        },

        checkPageStatus: async (brandId: string, pageId: string) => {
          const { workspaces } = get();
          const brand = findBrand(workspaces, brandId);
          const page = findPage(brand, pageId);
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
          const brand = st.workspaces
            .map(w => w.brand)
            .filter(b => b !== undefined)
            .find(b => b!.id === brandId);
          const page  = brand?.socialPages.find(p => p.id === pageId);
          if (!brand || !page) {
            console.error("deletePagePost: page not found");
            return;
          }
          const ops = getPlatformOperations(page.platform as Exclude<Platform, 'tiktok'>);
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
                  [pageId]: old.filter(p => p.postId !== postId)
                }
              };
            });
          } catch (err) {
            console.error("deletePagePost failed:", err);
            throw err;
          }
        },

        getPageCounts: () => {
          const brand = get().getActiveBrand();
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

          brand?.socialPages?.forEach((p) => {
            if (p.connected && p.status === "active") {
              const platform = p.platform as Platform;
              result[platform] = (result[platform] ?? 0) + 1;
            }
          });

          return result;
        },

        // posts
        updatePost: async (pid, data) => {
          await storeApi.updatePostAndUpdateStore(pid, data);
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
            get().addActivity({
              postId: id,
              actor: getCurrentUserDisplayNameFromStore(get()),
              action: "approved this post",
              type: "approved"
            });
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
            get().addActivity({
              postId: id,
              actor: getCurrentUserDisplayNameFromStore(get()),
              action: "requested changes",
              type: "revision_request",
              metadata: {
                revisionComment: comment
              }
            });
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
            get().addActivity({
              postId: id,
              actor: getCurrentUserDisplayNameFromStore(get()),
              action: "marked as revised",
              type: "revised"
            });
          }
        },

        addPost: async (boardId?: string) => {
          const st = get();
          const ws = st.getActiveWorkspace();
          if (!ws) return null;
          const bId = boardId ?? st.activeBoardId ?? (ws?.boards[0]?.id ?? "default");

          const postId = await storeApi.createPostAndUpdateStore(ws.id, bId, {
            caption: { synced: true, default: "" },
            status: "Draft",
            format: "",
            
            platforms: [],
            pages: [],
            month: 1,
          });

          return get().getPost(postId) ?? null;
        },
        bulkAddPosts: async (boardId, posts) => {
          const st = get();
          const ws = st.getActiveWorkspace();
          if (!ws) return [];

          // Transform posts to API format
          const postsData = posts.map(post => {
            const postData: any = {
              workspace_id: ws.id,
              board_id: boardId,
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
            if (post.publishDate) {
              postData.publish_date = post.publishDate.toISOString();
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

          const postIds = await storeApi.bulkCreatePostsAndUpdateStore(ws.id, boardId, postsData);
          
          // Get the created posts from store
          const createdPosts = postIds.map(id => st.getPost(id)).filter(Boolean) as Post[];
          return createdPosts;
        },
        duplicatePost: async (orig) => {
          const st = get();
          const workspace = st.getActiveWorkspace();
          if (!workspace) return null;
          
          const board = workspace.boards.find(b => b.id === orig.boardId);
          if (!board) return null;
          
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
            if (orig.publishDate) {
              postData.publish_date = orig.publishDate.toISOString();
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

            const postId = await storeApi.createPostAndUpdateStore(workspace.id, orig.boardId, postData);
            
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
              boardId: targetBoard.id,
              updatedAt: new Date(),
            };
            
            // Apply business rule to shared post
            const correctStatus = determineCorrectStatus(cloned.status, cloned.publishDate);
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
                  const activity = {
                    postId,
                    actor: getCurrentUserDisplayNameFromStore(get()),
                    action: "created a new revision",
                    type: "revised" as const,
                    metadata: {
                      versionNumber: versionIndex + 1
                    }
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
                              {
                                ...activity,
                                id: uuidv4(),
                                at: new Date(),
                              },
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
            
            return newState;
          });
        },

        // Comments
        addPostComment: async (postId, text, parentId, revisionRequested) => {
          const cid = uuidv4();
          const now = new Date();
          
          try {
            // Call API to add comment to database
            const { commentApi } = await import('@/lib/api/api-service');
            const comment = await commentApi.addPostComment({
              post_id: postId,
              text,
              parent_id: parentId,
              revision_requested: revisionRequested,
              author: getCurrentUserDisplayNameFromStore(get()),
            });

            // If this is a revision comment, update the post status in the store
            if (revisionRequested) {
              const currentPost = get().getPost(postId);
              if (currentPost) {
                const allowedStatusesForRevision = [
                  "Pending Approval",
                  "Revised", 
                  "Approved"
                ];
                
                // If current status is in the allowed list, update to "Needs Revisions"
                if (allowedStatusesForRevision.includes(currentPost.status)) {
                  // Update the post status in the store
                  set((s) => ({
                    workspaces: s.workspaces.map((ws) => ({
                      ...ws,
                      boards: ws.boards.map((b) => ({
                        ...b,
                        posts: b.posts.map((p) => {
                          if (p.id !== postId) return p;
                          return {
                            ...p,
                            status: "Needs Revisions" as Status,
                          };
                        }),
                      })),
                    })),
                  }));
                }
              }
            }

            // Update store with the comment from database
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
                      text: comment.text,
                      revisionRequested: comment.revision_requested
                    };
                    return {
                      ...p,
                      comments: [...p.comments, c],
                    };
                  }),
                })),
              })),
            }));
            return comment.id;
          } catch (error) {
            console.error('Failed to add post comment:', error);
            // Fallback to local-only update if API fails
            set((s) => ({
              workspaces: s.workspaces.map((ws) => ({
                ...ws,
                boards: ws.boards.map((b) => ({
                  ...b,
                  posts: b.posts.map((p) => {
                    if (p.id !== postId) return p;
                    const c: BaseComment = {
                      id: cid,
                      parentId,
                      createdAt: now,
                      author: getCurrentUserDisplayNameFromStore(get()),
                      text,
                      revisionRequested
                    };
                    return {
                      ...p,
                      comments: [...p.comments, c],
                    };
                  }),
                })),
              })),
            }));
            return cid;
          }
        },
        addBlockComment: async (postId, blockId, text, parentId, revisionRequested) => {
          const cid = uuidv4();
          const now = new Date();
          
          try {
            // Call API to add comment to database
            const { commentApi } = await import('@/lib/api/api-service');
            const comment = await commentApi.addBlockComment({
              post_id: postId,
              block_id: blockId,
              text,
              parent_id: parentId,
              revision_requested: revisionRequested,
              author: getCurrentUserDisplayNameFromStore(get()),
            });

            // If this is a revision comment, update the post status in the store
            if (revisionRequested) {
              const currentPost = get().getPost(postId);
              if (currentPost) {
                const allowedStatusesForRevision = [
                  "Pending Approval",
                  "Revised", 
                  "Approved"
                ];
                
                // If current status is in the allowed list, update to "Needs Revisions"
                if (allowedStatusesForRevision.includes(currentPost.status)) {
                  // Update the post status in the store
                  set((s) => ({
                    workspaces: s.workspaces.map((ws) => ({
                      ...ws,
                      boards: ws.boards.map((b) => ({
                        ...b,
                        posts: b.posts.map((p) => {
                          if (p.id !== postId) return p;
                          return {
                            ...p,
                            status: "Needs Revisions" as Status,
                          };
                        }),
                      })),
                    })),
                  }));
                }
              }
            }

            // Update store with the comment from database
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
                          text: comment.text,
                          revisionRequested: comment.revision_requested
                        };
                        return {
                          ...b,
                          comments: [...b.comments, c],
                        };
                      }),
                    };
                  }),
                })),
              })),
            }));
            return comment.id;
          } catch (error) {
            console.error('Failed to add block comment:', error);
            // Fallback to local-only update if API fails
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
                          id: cid,
                          parentId,
                          createdAt: now,
                          author: getCurrentUserDisplayNameFromStore(get()),
                          text,
                          revisionRequested
                        };
                        return {
                          ...b,
                          comments: [...b.comments, c],
                        };
                      }),
                    };
                  }),
                })),
              })),
            }));
            return cid;
          }
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
          const cid = uuidv4();
          const now = new Date();
          
          try {
            // Call API to add comment to database
            const { commentApi } = await import('@/lib/api/api-service');
            const comment = await commentApi.addVersionComment({
              post_id: postId,
              block_id: blockId,
              version_id: verId,
              text,
              parent_id: parentId,
              revision_requested: revisionRequested,
              author: getCurrentUserDisplayNameFromStore(get()),
              rect,
            });

            // If this is a revision comment, check if we need to update the post status
            if (revisionRequested) {
              const currentPost = get().getPost(postId);
              if (currentPost) {
                const allowedStatusesForRevision = [
                  "Pending Approval",
                  "Revised", 
                  "Approved"
                ];
                
                // If current status is in the allowed list, update to "Needs Revisions"
                if (allowedStatusesForRevision.includes(currentPost.status)) {
                  // Update the post status in the store
                  set((s) => ({
                    workspaces: s.workspaces.map((ws) => ({
                      ...ws,
                      boards: ws.boards.map((b) => ({
                        ...b,
                        posts: b.posts.map((p) => {
                          if (p.id !== postId) return p;
                          return {
                            ...p,
                            status: "Needs Revisions" as Status,
                          };
                        }),
                      })),
                    })),
                  }));
                }
              }
            }

            // Update store with the comment from database
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
                              text: comment.text,
                              revisionRequested: comment.revision_requested
                            };
                            if (comment.rect) c.rect = comment.rect;
                            return {
                              ...v,
                              comments: [...v.comments, c],
                            };
                          }),
                        };
                      })
                    };
                  }),
                })),
              })),
            }));
            return comment.id;
          } catch (error) {
            console.error('Failed to add version comment:', error);
            // Fallback to local-only update if API fails
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
                              id: cid,
                              parentId,
                              createdAt: now,
                              author: getCurrentUserDisplayNameFromStore(get()),
                              text,
                              revisionRequested
                            };
                            if (rect) c.rect = rect;
                            return {
                              ...v,
                              comments: [...v.comments, c],
                            };
                          }),
                        };
                      })
                    };
                  }),
                })),
              })),
            }));
            return cid;
          }
        },

        // Activities
        addActivity: (act) => {
          const id = uuidv4();
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
                        id,
                        at: new Date(),
                      },
                      ...p.activities
                    ],
                  };
                }),
              })),
            })),
          }));
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
              image,
              color,
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

        // Group data methods implementation
        addGroupComment: (boardId, month, text, author) => {
          const commentId = uuidv4();
          const newComment: GroupComment = {
            id: commentId,
            author,
            text,
            createdAt: new Date(),
            resolved: false,
            messages: [],
            aiSummary: [
              "Love the overall vibe, but the first 3 seconds felt a bit slow to grab attention.",
              "Typography is nice but hard to read on mobile due to size.",
              "Maybe reduce the pink saturation slightly—it's overpowering the visuals."
            ]
          };

          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              // Only update the active workspace
              if (ws.id !== s.activeWorkspaceId) return ws;
              
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== boardId) return board;
                  
                  const existingGroupData = board.groupData || [];
                  const monthGroupData = existingGroupData.find(gd => gd.month === month);
                  
                  if (monthGroupData) {
                    // Update existing month group data
                    const updatedGroupData = existingGroupData.map(gd => 
                      gd.month === month 
                        ? { ...gd, comments: [...gd.comments, newComment] }
                        : gd
                    );
                    return { ...board, groupData: updatedGroupData };
                  } else {
                    // Create new month group data
                    const newGroupData: BoardGroupData = {
                      month,
                      comments: [newComment],
                      revisionCount: 0
                    };
                    return { ...board, groupData: [...existingGroupData, newGroupData] };
                  }
                })
              };
            })
          }));
          
          return commentId;
        },

        updateGroupComment: (boardId, month, commentId, data) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              // Only update the active workspace
              if (ws.id !== s.activeWorkspaceId) return ws;
              
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== boardId) return board;
                  
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

        deleteGroupComment: (boardId, month, commentId) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              // Only update the active workspace
              if (ws.id !== s.activeWorkspaceId) return ws;
              
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== boardId) return board;
                  
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

        resolveGroupComment: (boardId, month, commentId, resolvedBy) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              // Only update the active workspace
              if (ws.id !== s.activeWorkspaceId) return ws;
              
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== boardId) return board;
                  
                  const updatedGroupData = (board.groupData || []).map(gd => {
                    if (gd.month !== month) return gd;
                    
                    return {
                      ...gd,
                      comments: gd.comments.map(comment => 
                        comment.id === commentId 
                          ? { 
                              ...comment, 
                              resolved: true, 
                              resolvedAt: new Date(), 
                              resolvedBy,
                              updatedAt: new Date()
                            }
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

        addGroupMessage: (boardId, month, commentId, text, author, parentMessageId) => {
          const messageId = uuidv4();
          const newMessage: GroupMessage = {
            id: messageId,
            author,
            text,
            createdAt: new Date(),
            replies: []
          };

          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              // Only update the active workspace
              if (ws.id !== s.activeWorkspaceId) return ws;
              
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== boardId) return board;
                  
                  const updatedGroupData = (board.groupData || []).map(gd => {
                    if (gd.month !== month) return gd;
                    
                    return {
                      ...gd,
                      comments: gd.comments.map(comment => {
                        if (comment.id !== commentId) return comment;
                        
                        if (!parentMessageId) {
                          // Add as direct reply to comment
                          return {
                            ...comment,
                            messages: [...comment.messages, newMessage]
                          };
                        } else {
                          // Add as reply to a specific message
                          const addMessageToReplies = (messages: GroupMessage[]): GroupMessage[] => {
                            return messages.map(msg => {
                              if (msg.id === parentMessageId) {
                                return { ...msg, replies: [...msg.replies, newMessage] };
                              } else {
                                return { ...msg, replies: addMessageToReplies(msg.replies) };
                              }
                            });
                          };
                          
                          return {
                            ...comment,
                            messages: addMessageToReplies(comment.messages)
                          };
                        }
                      })
                    };
                  });
                  
                  return { ...board, groupData: updatedGroupData };
                })
              };
            })
          }));
          
          return messageId;
        },

        updateGroupMessage: (boardId, month, commentId, messageId, data) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              // Only update the active workspace
              if (ws.id !== s.activeWorkspaceId) return ws;
              
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== boardId) return board;
                  
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

        deleteGroupMessage: (boardId, month, commentId, messageId) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              // Only update the active workspace
              if (ws.id !== s.activeWorkspaceId) return ws;
              
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== boardId) return board;
                  
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

        updateGroupCommentAiSummary: (boardId, month, commentId, aiSummary) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              // Only update the active workspace
              if (ws.id !== s.activeWorkspaceId) return ws;
              
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== boardId) return board;
                  
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

        deleteGroupCommentAiSummaryItem: (boardId, month, commentId, summaryIndex) => {
          set((s) => ({
            workspaces: s.workspaces.map((ws) => {
              if (ws.id !== s.activeWorkspaceId) return ws;
        
              return {
                ...ws,
                boards: ws.boards.map((board) => {
                  if (board.id !== boardId) return board;
        
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
        setUser: (user: User | null) => set({ user }),
        clearUser: () => set({ user: null }),
        
        updatePostStatusesBasedOnTime: () => {
          set((s) => {
            let updatedCount = 0;
            let hasChanges = false;
            
            const newWs = s.workspaces.map((ws) => ({
              ...ws,
              boards: ws.boards.map((board) => {
                const updatedPosts = board.posts.map((p) => {
                  const correctStatus = determineCorrectStatus(p.status, p.publishDate);
                  if (correctStatus !== p.status) {
                    console.log(`Updating post ${p.id}: ${p.status} → ${correctStatus} (publishDate: ${p.publishDate})`);
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
              console.log(`Updated ${updatedCount} post statuses based on time`);
              return { workspaces: newWs };
            }
            
            // If no changes, return the same state to prevent unnecessary re-renders
            return s;
          });
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
          if (post.publishDate) {
            const publishDate = post.publishDate instanceof Date ? post.publishDate : new Date(post.publishDate);
            if (!isNaN(publishDate.getTime())) {
              const isPast = publishDate < now;
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
    console.log("PostStatusTimeUpdater: Initializing...");
    
    // Update immediately on mount
    updatePostStatusesBasedOnTime();
    
    // Set up interval to check every 60 seconds (increased from 10 seconds for production)
    const interval = setInterval(() => {
      console.log("PostStatusTimeUpdater: Running periodic update...");
      
      // Only run the update if there are posts that might need status changes
      if (checkIfUpdatesNeeded()) {
        updatePostStatusesBasedOnTime();
      } else {
        console.log("PostStatusTimeUpdater: No status updates needed, skipping...");
      }
    }, 60000); // 60 seconds for production
    
    return () => {
      console.log("PostStatusTimeUpdater: Cleaning up...");
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

const findPage = (brand: Brand | undefined, pageId: string) =>
  brand?.socialPages.find(p => p.id === pageId);

const findAccount = (brand: Brand | undefined, accountId: string) =>
  brand?.socialAccounts.find(a => a.id === accountId);

/**
 * Determines the correct post status based on publish date and current status
 * If publish date is in the past, status should be 'Published' or 'Failed Publishing'
 * If publish date is in the future or null, status should be one of the other statuses
 */
function determineCorrectStatus(currentStatus: Status, publishDate: Date | null): Status {
  // If no publish date, keep current status
  if (!publishDate) {
    return currentStatus;
  }

  // Convert to Date object if it's a string (due to JSON serialization)
  const publishDateObj = publishDate instanceof Date ? publishDate : new Date(publishDate);
  
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
      brand: w.brand && w.brand.id === brandId
        ? { ...w.brand, socialPages: w.brand.socialPages.map(p => p.id === pageId
          ? { ...p, ...updates }
          : p)
        } : w.brand
    }))
  };
}
