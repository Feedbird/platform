// Platform Types
export type Platform = 
  | "facebook"
  | "instagram"
  | "linkedin"
  | "pinterest"
  | "youtube"
  | "tiktok"
  | "google";

// Status Types
export type PageStatus = "active" | "expired" | "pending" | "disconnected" | "error";
export type PostStatus = "draft" | "scheduled" | "published" | "failed" | "deleted";
export type PublishStatus = "draft" | "pending";

export type PageKind =
  | "page"       // FB / LinkedIn company
  | "profile"    // LinkedIn personal, TikTok personal
  | "board"      // Pinterest
  | "channel"    // YouTube
  | "business"   // Google Business
  | "organization";  // LinkedIn organization

export type Status = 
  | "Draft"
  | "Pending Approval"
  | "Needs Revisions"
  | "Revised"
  | "Approved"
  | "Scheduled"
  | "Publishing"
  | "Published"
  | "Failed Publishing";

// Content Types
export type FileKind = "image" | "video" | "document" | "other";

export type ContentFormat = "image" | "video" | "story" | "carousel" | "email";

// Platform Configuration
export interface SocialPlatformConfig {
  name: string;
  channel: Platform;
  icon: string;
  authUrl: string;
  scopes: string[];
  apiVersion: string;
  baseUrl: string;
  baseUrlAccounts?: string;
  baseUrlInfo?: string;
  features: {
    multipleAccounts: boolean;
    multiplePages: boolean;
    scheduling: boolean;
    analytics: boolean;
    deletion: boolean;
    mediaTypes: ("image" | "video" | "carousel")[];
    maxMediaCount: number;
    characterLimits: {
      content: number;
      title?: number;
    };
  };
  mediaConstraints?: {
    image?: {
      maxWidth?: number;
      maxHeight?: number;
      aspectRatios?: string[]; // e.g., ["1:1", "16:9"]
      maxSizeMb?: number;
      formats?: ("jpg" | "png" | "gif")[];
    };
    video?: {
      maxWidth?: number;
      maxHeight?: number;
      aspectRatios?: string[];
      maxSizeMb?: number;
      minDurationSec?: number;
      maxDurationSec?: number;
      formats?: ("mp4" | "mov")[];
      maxFps?: number;
      audio?: {
        minBitrateKbps?: number;
        maxBitrateKbps?: number;
        codecs?: ("aac" | "mp3")[];
      };
      video?: {
        codecs?: ("h264" | "h265")[];
      };
    };
  };
  connectOptions: {
    title: string;
    type: string;
    requiredScopes?: string[];
  }[];
}

// Account & Page Types
export interface SocialAccount {
  id          : string;              // internal DB-id
  platform    : Platform;
  name        : string;              // "John Smith", "ACME Inc"
  accountId   : string;              // provider's native id
  authToken?  : string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  tokenIssuedAt?: Date;
  connected   : boolean;
  status      : PageStatus;
  metadata?: Record<string, any>;
  pages?      : SocialPage[];        // lazy-loaded
}

export interface SocialPage {
  id            : string;            // internal key
  platform      : Platform;
  entityType    : "page" | "board" | "channel" | "profile" | "organization";
  name          : string;            // "My FB Page", "Board: Recipes"
  pageId        : string;            // provider id
  authToken?    : string;            // optional for frontend security
  authTokenExpiresAt?: Date;
  connected     : boolean;
  status        : PageStatus;          // "active" | "expired" | "pending" | ...
  accountId     : string;            // FK -> SocialAccount.id
  statusUpdatedAt?: Date;
  postCount?    : number;
  followerCount?: number;
  lastSyncAt?   : Date;
  metadata?: Record<string, any>;
}

// Post History
export interface PostHistory {
  id: string;
  pageId: string;
  postId: string;
  content: string;
  mediaUrls: string[];
  status: PostStatus;
  publishedAt: Date;
  scheduledFor?: Date;
  analytics?: {
    reach?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    clicks?: number;
    views?: number;
    engagement?: number;
    metadata?: Record<string, any>;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Post Content Types
export interface PostContent {
  text: string;
  title?: string;
  media?: {
    type: "image" | "video" | "carousel";
    urls: string[];
    thumbnailUrl?: string;
    duration?: number;
  };
  link?: {
    url: string;
    title?: string;
    description?: string;
    thumbnailUrl?: string;
  };
  metadata?: Record<string, any>;
}

// Platform Operations Interface
export interface PlatformOperations {
  // Auth operations
  getAuthUrl(): string;
  
  // Account operations
  connectAccount(code: string): Promise<SocialAccount>;
  refreshToken(acc: SocialAccount): Promise<SocialAccount>;
  disconnectAccount(acc: SocialAccount): Promise<void>;
  
  // Page operations
  listPages(acc: SocialAccount): Promise<SocialPage[]>;
  getPage?: (acc: SocialAccount, pageId: string) => Promise<SocialPage>;
  connectPage(acc: SocialAccount, pageId: string): Promise<SocialPage>;
  disconnectPage(page: SocialPage): Promise<void>;
  checkPageStatus(page: SocialPage): Promise<SocialPage>;
  
  // Post operations
  createPost(page: SocialPage, content: PostContent, options?: PublishOptions): Promise<PostHistory>;
  publishPost(page: SocialPage, content: PostContent, options?: PublishOptions): Promise<PostHistory>;
  schedulePost(page: SocialPage, content: PostContent, scheduledTime: Date): Promise<PostHistory>;
  deletePost(page: SocialPage, postId: string): Promise<void>;
  
  // Analytics & History
  getPostHistory(page: SocialPage, limit?: number): Promise<PostHistory[]>;
  getPostAnalytics(page: SocialPage, postId: string): Promise<PostHistory['analytics']>;
  
  // Platform-specific operations
  getPlatformFeatures(): SocialPlatformConfig['features'];
  validateContent(content: PostContent): { isValid: boolean; errors?: string[] };
}

export interface PlatformPage {
  name: string;
  pageId: string;
  authToken: string;
  platform: Platform;
}

export interface PublishOptions {
  scheduledTime?: Date;
  isBackgroundPublish?: boolean;
  isDraft?: boolean;
  visibility?: "public" | "private" | "unlisted";
  targeting?: {
    locations?: string[];
    languages?: string[];
    demographics?: Record<string, any>;
  };
  crosspost?: {
    enabled: boolean;
    platforms?: Platform[];
  };
}