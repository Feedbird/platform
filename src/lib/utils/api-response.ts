import { SocialAPIError } from './error-handler';
import type { PostHistory } from '../social/platforms/platform-types';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface MediaItem {
  url?: string;
  source?: string;
  media?: {
    image?: {
      src?: string;
    };
  };
  type?: string;
}

interface LinkedInMediaItem {
  originalUrl?: string;
  thumbnails?: Array<{ url: string }>;
}

interface InstagramMediaItem {
  media_url?: string;
  media_type?: string;
  thumbnail_url?: string;
}

export function handleAPIResponse<T>(
  response: Response,
  platform: string,
  operation: string
): Promise<T> {
  if (!response.ok) {
    return response.json().then(error => {
      throw new SocialAPIError(
        error.message || `${platform} API request failed`,
        error.code || 'API_ERROR',
        error
      );
    }).catch(error => {
      if (error instanceof SocialAPIError) {
        throw error;
      }
      throw new SocialAPIError(
        `${platform} ${operation} failed: ${response.statusText}`,
        'API_ERROR',
        { status: response.status }
      );
    });
  }

  return response.json();
}

export function normalizePostHistory(
  rawData: any,
  platform: string
): PostHistory {
  // Common fields that should be present in all platforms
  const base = {
    id: rawData.id,
    pageId: rawData.pageId || rawData.page_id,
    postId: rawData.postId || rawData.post_id || rawData.id,
    content: rawData.content || rawData.message || rawData.text,
    mediaUrls: [],
    status: rawData.status || 'published',
    publishedAt: new Date(rawData.publishedAt || rawData.published_at || rawData.created_time),
    scheduledFor: rawData.scheduledFor || rawData.scheduled_for || null,
  };

  // Platform-specific normalizations
  switch (platform.toLowerCase()) {
    case 'facebook':
      return {
        ...base,
        mediaUrls: extractFacebookMediaUrls(rawData),
        analytics: normalizeFacebookAnalytics(rawData),
      };

    case 'instagram':
      return {
        ...base,
        mediaUrls: extractInstagramMediaUrls(rawData),
        analytics: normalizeInstagramAnalytics(rawData),
      };

    case 'linkedin':
      return {
        ...base,
        mediaUrls: extractLinkedInMediaUrls(rawData),
        analytics: normalizeLinkedInAnalytics(rawData),
      };

    default:
      return {
        ...base,
        analytics: {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
        },
      };
  }
}

function extractFacebookMediaUrls(data: any): string[] {
  if (!data) return [];

  // Handle attachments
  if (data.attachments?.data) {
    return data.attachments.data.map((attachment: MediaItem) => {
      if (attachment.type === 'video') {
        return attachment.url || attachment.source;
      }
      return attachment.media?.image?.src || attachment.url;
    }).filter(Boolean);
  }

  // Handle media array
  if (Array.isArray(data.media)) {
    return data.media.map((item: MediaItem) => item.url || item.source).filter(Boolean);
  }

  return [];
}

function extractInstagramMediaUrls(data: any): string[] {
  if (!data) return [];

  // Handle carousel children
  if (data.children?.data) {
    return data.children.data.map((child: InstagramMediaItem) => 
      child.media_url || child.media_type === 'VIDEO' ? child.thumbnail_url : null
    ).filter(Boolean);
  }

  // Handle single media
  if (data.media_url) {
    return [data.media_url];
  }

  return [];
}

function extractLinkedInMediaUrls(data: any): string[] {
  if (!data) return [];

  // Handle share media
  if (data.specificContent?.['com.linkedin.ugc.ShareContent']?.media) {
    const media = data.specificContent['com.linkedin.ugc.ShareContent'].media;
    return media.map((item: LinkedInMediaItem) => 
      item.originalUrl || item.thumbnails?.[0]?.url
    ).filter(Boolean);
  }

  return [];
}

function normalizeFacebookAnalytics(data: any) {
  return {
    views: parseInt(data.views || data.video_views || 0),
    likes: parseInt(data.likes?.summary?.total_count || data.like_count || 0),
    comments: parseInt(data.comments?.summary?.total_count || data.comment_count || 0),
    shares: parseInt(data.shares?.count || data.share_count || 0),
    clicks: parseInt(data.clicks || 0),
    reach: parseInt(data.reach || 0),
    engagement: parseInt(data.engagement || 0),
  };
}

function normalizeInstagramAnalytics(data: any) {
  return {
    views: parseInt(data.video_views || data.impressions || 0),
    likes: parseInt(data.like_count || 0),
    comments: parseInt(data.comments_count || 0),
    shares: parseInt(data.shares || 0),
    saves: parseInt(data.saved || 0),
    reach: parseInt(data.reach || 0),
    engagement: parseInt(data.engagement || 0),
  };
}

function normalizeLinkedInAnalytics(data: any) {
  // Handle both old and new data structures
  const analytics = data.analytics || {};
  const totalShareStatistics = data.analytics?.metadata?.totalShareStatistics || {};
  
  return {
    views: analytics.views || parseInt(totalShareStatistics.impressionCount || 0),
    likes: analytics.likes || parseInt(totalShareStatistics.likeCount || 0),
    comments: analytics.comments || parseInt(totalShareStatistics.commentCount || 0),
    shares: analytics.shares || parseInt(totalShareStatistics.shareCount || 0),
    clicks: analytics.clicks || parseInt(totalShareStatistics.clickCount || 0),
    engagement: analytics.engagement || parseFloat(totalShareStatistics.engagement || 0),
    reach: analytics.reach || parseInt(totalShareStatistics.uniqueImpressionsCount || 0),
  };
} 