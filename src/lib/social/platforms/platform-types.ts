// Platform Types
export type Platform = 
  | "facebook"
  | "instagram"
  | "linkedin"
  | "pinterest"
  | "youtube"
  | "tiktok"
  | "google";

// TikTok Privacy Levels (from TikTok API)
export type TikTokPrivacyLevel = 
  | "PUBLIC_TO_EVERYONE"
  | "MUTUAL_FOLLOW_FRIENDS" 
  | "FOLLOWER_OF_CREATOR"
  | "SELF_ONLY";

// Google Business Post Types
export type GoogleBusinessPostType = "STANDARD" | "EVENT" | "OFFER";

// Google Business CTA Action Types (from Google My Business API)
export type GoogleBusinessCTAAction = 
  | "BOOK"       // Book an appointment, table, etc.
  | "ORDER"      // Order something
  | "SHOP"       // Browse product catalog
  | "LEARN_MORE" // See additional details on website
  | "SIGN_UP"    // Register, sign up, or join
  | "CALL";      // Call business

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
    mediaTypes: ("image" | "video" | "carousel" | "story")[];
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
    story?: {
      image?: {
        maxWidth?: number;
        maxHeight?: number;
        aspectRatios?: string[];
        maxSizeMb?: number;
        formats?: ("jpg" | "png" | "gif" | "bmp" | "tiff")[];
      };
      video?: {
        maxWidth?: number;
        maxHeight?: number;
        aspectRatios?: string[];
        maxSizeMb?: number;
        minDurationSec?: number;
        maxDurationSec?: number;
        formats?: ("mp4")[];
        minFps?: number;
        maxFps?: number;
        audio?: {
          minBitrateKbps?: number;
          codecs?: ("aac")[];
          channels?: number;
          sampleRate?: number;
        };
        video?: {
          codecs?: ("h264" | "h265")[];
          chromaSubsampling?: string;
          closedGop?: string;
          progressiveScan?: boolean;
        };
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
  postId?: string;
  pageId: string;
  publishId?: string;
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
  id?: string;
  text: string;
  title?: string;
  media?: {
    type: "image" | "video" | "carousel" | "story";
    urls: string[];
    thumbnailUrl?: string;
    duration?: number;
    altText?: string;
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
  getBoards?(page: SocialPage): unknown;
  checkPostStatusAndUpdate?: (publishId: string, pageId: string, postId: string) => Promise<void>;
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
  // TODO: Use this when we have implemented across all platforms
  // getPostHistory(page: SocialPage, limit?: number, nextPage?: number | string | null | undefined): Promise<{ posts: PostHistory[], nextPage: number | string | null | undefined }>;
  getPostHistory(page: SocialPage, limit?: number, nextPage?: number | string | null | undefined): Promise<any>;
  getPostAnalytics(page: SocialPage, postId: string): Promise<PostHistory['analytics']>;

  // optional method for getStoryHistory in the facebook platform
  getStoryHistory?(
    page: SocialPage,
    limit?: number,
    nextPage?: number | string | null | undefined
  ): Promise<any>;

  // Platform-specific operations
  getPlatformFeatures(): SocialPlatformConfig['features'];
  validateContent(content: PostContent): { isValid: boolean; errors?: string[] };
  
  // TikTok-specific operations
  getCreatorInfo?(page: SocialPage): Promise<TikTokCreatorInfo>;
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
  // TikTok-specific options (expanded)
  disableDuet?: boolean;
  disableStitch?: boolean;
  disableComment?: boolean;
  
  // Commercial Content Disclosure (Required by TikTok)
  commercialContentToggle?: boolean;
  brandContentToggle?: boolean;      // For third-party brands (Paid Partnership)
  brandOrganicToggle?: boolean;      // For your own business (Brand Organic)
  
  // Content Settings
  autoAddMusic?: boolean;
  allowDownload?: boolean;
  allowStitch?: boolean;
  allowDuet?: boolean;
  videoCoverTimestampMs?: number;
  
  // Pinterest-specific options
  pinterest?: {
    boardId: string;
    boardName: string;
  };
  isAigc?: boolean;
  videoCovers?: {
    coverImageId?: string;
    coverTapTime?: number;
  };
  contentDisclosure?: {
    contentDisclosure: boolean;
    contentDisclosureIcon?: string;
  };
  privacyLevel?: TikTokPrivacyLevel;
  
  // YouTube-specific options
  madeForKids?: boolean;
  description?: string;
  
  // General settings object that can contain platform-specific settings
  settings?: any;
}

// TikTok-specific interfaces
export interface TikTokCreatorInfo {
  creatorAvatarUrl: string;
  creatorUsername: string;
  creatorNickname: string;
  privacyLevelOptions: TikTokPrivacyLevel[];
  
  // Interaction settings from creator's app
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  
  // Content constraints
  maxVideoPostDurationSec: number;

}

export interface TikTokSettings {
  privacyLevel: TikTokPrivacyLevel;
  disableDuet: boolean;
  disableStitch: boolean;
  disableComment: boolean;
  videoCoverTimestampMs?: number;
  
  // Commercial Content Disclosure (Required by TikTok)
  commercialContentToggle: boolean; // Must be OFF by default
  brandContentToggle: boolean;      // For third-party brands (Paid Partnership)
  brandOrganicToggle: boolean;      // For your own business (Brand Organic)
  
  // Content Settings
  autoAddMusic: boolean;
  isAigc: boolean;
  
  // Validation fields from creator info
  maxVideoDurationSec?: number;
  canPostMore?: boolean;
}

// Google Business Settings for different post types
export interface GoogleBusinessSettings {
  postType: GoogleBusinessPostType;
  
  // Call to Action settings (when postType is "STANDARD" with CTA)
  callToAction?: {
    actionType: GoogleBusinessCTAAction;
    url: string;
  };
  
  // Event settings (when postType is "EVENT")
  event?: {
    title: string;
    description?: string;
    startDate: {
      year: number;
      month: number;
      day: number;
    };
    startTime?: {
      hours: number;
      minutes: number;
      seconds?: number;
      nanos?: number;
    };
    endDate?: {
      year: number;
      month: number;
      day: number;
    };
    endTime?: {
      hours: number;
      minutes: number;
      seconds?: number;
      nanos?: number;
    };
    // Events can also have CTA buttons
    callToAction?: {
      actionType: GoogleBusinessCTAAction;
      url: string;
    };
  };
  
  // Offer settings (when postType is "OFFER") - all fields are optional
  offer?: {
    title?: string;
    description?: string;
    couponCode?: string;
    redeemOnlineUrl?: string;
    termsConditions?: string;
    // Date/time fields for offers
    startDate?: {
      year: number;
      month: number;
      day: number;
    };
    endDate?: {
      year: number;
      month: number;
      day: number;
    };
    startTime?: {
      hours: number;
      minutes: number;
      seconds?: number;
      nanos?: number;
    };
    endTime?: {
      hours: number;
      minutes: number;
      seconds?: number;
      nanos?: number;
    };
  };
}

// YouTube-specific settings
export interface YouTubeSettings {
  privacyStatus: 'public' | 'private' | 'unlisted';
  madeForKids: boolean;
  description?: string;
}

export interface PinterestSettings {
  boardId: string;
  boardName: string;
  title?: string;
}

// Post Settings Structure (includes platform-specific settings)
export interface PostSettings {
  locationTags: string[];
  taggedAccounts: string[];
  thumbnail: boolean;
  tiktok?: TikTokSettings;
  google?: GoogleBusinessSettings;
  pinterest?: PinterestSettings;
  youtube?: YouTubeSettings;
}


export interface PostHistoryResponse<T = PostHistory> {
  posts: T[];
  nextPage: number | string | null | undefined;
}