import { BasePlatform } from './base-platform';
import type {
  SocialAccount,
  SocialPage,
  PostContent,
  PostHistory,
  PublishOptions,
  SocialPlatformConfig,
  TikTokCreatorInfo,
  PostStatus,
  PostHistoryResponse,
  PageStatus,
} from './platform-types';
import { getSecureToken } from '@/lib/utils/token-manager';
import { postApi } from '@/lib/api/api-service';
import { supabase } from '@/lib/supabase/client';

const IS_BROWSER = typeof window !== 'undefined';

const config: SocialPlatformConfig = {
  name: 'TikTok',
  channel: 'tiktok',
  icon: '/images/platforms/tiktok.svg',
  authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
  // https://developers.tiktok.com/doc/tiktok-api-scopes
  scopes: [
    'user.info.basic',
    'user.info.profile',
    'user.info.stats',
    'video.list',
    'video.upload',
    'video.publish'
  ],
  apiVersion: 'v2',
  baseUrl: 'https://open.tiktokapis.com',
  features: {
    multipleAccounts: true,
    multiplePages: false,
    scheduling: false,
    analytics: true,
    deletion: true,
    mediaTypes: ['video'],
    maxMediaCount: 1,
    characterLimits: {
      content: 2200, // caption limit
      title: 100
    }
  },
  connectOptions: [
    {
      title: 'Add TikTok Business Account',
      type: 'business',
      requiredScopes: ['video.upload', 'video.publish']
    },
    {
      title: 'Add TikTok Account',
      type: 'profile',
      requiredScopes: ['video.upload']
    }
  ]
};

interface TikTokTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  open_id: string;
  scope: string;
  token_type: string;
}

interface TikTokUserInfo {
  user: {
    open_id: string;
    union_id: string;
    display_name: string;
    bio_description: string;
    profile_deep_link: string;
    is_verified: boolean;
    follower_count: number;
    following_count: number;
    likes_count: number;
    video_count: number;
  };
}

export class TikTokPlatform extends BasePlatform {
  // Constants to avoid repetition
  private readonly USER_INFO_FIELDS = [
    'open_id',
    'union_id',
    'display_name',
    'bio_description',
    'profile_deep_link',
    'is_verified',
    'follower_count',
    'following_count',
    'likes_count',
    'video_count'
  ];

  constructor(env: { clientId: string; clientSecret: string; redirectUri: string }) {
    super(config, env);
  }

  // TikTok-specific auth URL generator
  getAuthUrl(): string {
    const url = new URL(this.config.authUrl);
    url.searchParams.set('client_key', this.env.clientId);
    url.searchParams.set('redirect_uri', this.env.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', this.config.scopes.join(','));
    return url.toString();
  }

  // Helper method to reduce duplicate token request code
  private async makeTokenRequest(params: Record<string, string>): Promise<TikTokTokenResponse> {
    const formData = new URLSearchParams(params);
    
    const response = await fetch(`${config.baseUrl}/v2/oauth/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(error.error?.message || 'Token request failed');
    }

    return response.json();
  }

  // Helper method to reduce duplicate user info requests
  private async getUserInfo(token: string, fields: string[] = this.USER_INFO_FIELDS) {
    // https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info
    const response = await this.fetchWithAuth<{ data: TikTokUserInfo }>(
      `${config.baseUrl}/v2/user/info/`,
      {
        token,
        queryParams: { fields: fields.join(',') }
      }
    );
    return response.data.user;
  }

  // Helper method to fetch creator info (reusable across methods)
  private async fetchCreatorInfo(token: string) {
    // https://developers.tiktok.com/doc/content-posting-api-reference-query-creator-info
    const response = await this.fetchWithAuth<{
      data: any;
      error: {
        code: string;
        message: string;
      };
    }>(`${config.baseUrl}/v2/post/publish/creator_info/query/`, {
      method: 'POST',
      token: token
    });

    if(response.error?.code !== 'ok') {
      throw new Error(`TikTok API Error: ${response.error?.message} (${response.error?.code})`);
    }

    return response.data;
  }

  /**
   * Check post status and update the post accordingly
   * This function can be called separately to monitor post status
   */
  public async checkPostStatusAndUpdate(publishId: string, pageId: string, postId: string): Promise<void> {
    const token = await getSecureToken(pageId);
    if (!token) {
      throw new Error('No auth token available');
    }

    let status = 'PROCESSING';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10-second intervals

    while (status !== 'PUBLISH_COMPLETE' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;

      const statusResponse = await this.fetchWithAuth<{
        data: {
          status: string;
          share_id?: string;
          create_time?: number;
          fail_reason?: string;
        };
        error: {
          code: string;
          message: string;
        };
      }>(`${config.baseUrl}/v2/post/publish/status/fetch/`, {
        method: 'POST',
        token: token,
        body: JSON.stringify({
          publish_id: publishId
        })
      });
      console.log("[API] TikTok checkPostStatusAndUpdate → statusResponse", statusResponse);

      if (statusResponse.error?.code !== 'ok') {
        throw new Error(`Status check failed: ${statusResponse.error?.message}`);
      }

      status = statusResponse.data.status;

      if (status === 'PUBLISH_COMPLETE') {
        // Update the post status to published in the supabase
        await supabase.from('posts').update({ status: 'published' }).eq('id', postId);

        return; // Exit early on success
      } else if (status === 'FAILED') {
        await supabase.from('posts').update({ status: 'failed' }).eq('id', postId);
        return; // Exit early on failure
      }
    }

    if(status != 'PUBLISH_COMPLETE') {
    // If we reach here, the post is still processing after max attempts
    // You might want to handle this case (e.g., mark as "Processing" or "Pending")
    console.warn(`Post ${publishId} is still processing after ${maxAttempts} attempts`);
    }
  }

  async connectAccount(code: string): Promise<SocialAccount> {
    const tokenData = await this.makeTokenRequest({
      client_key: this.env.clientId,
      client_secret: this.env.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: this.env.redirectUri
    });

    const userInfo = await this.getUserInfo(tokenData.access_token);

    const now = new Date();
    const accessTokenExpiresAt = new Date(now.getTime() + tokenData.expires_in * 1000);
    const refreshTokenExpiresAt = new Date(now.getTime() + tokenData.refresh_expires_in * 1000);

    return {
      id: crypto.randomUUID(),
      platform: 'tiktok',
      name: userInfo.display_name,
      accountId: userInfo.open_id,
      authToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      tokenIssuedAt: now,
      connected: true,
      status: 'active',
      metadata: {
        unionId: userInfo.union_id,
        bio: userInfo.bio_description,
        profileUrl: userInfo.profile_deep_link,
        isVerified: userInfo.is_verified,
        followerCount: userInfo.follower_count,
        followingCount: userInfo.following_count,
        likesCount: userInfo.likes_count,
        videoCount: userInfo.video_count
      }
    };
  }

  async refreshToken(acc: SocialAccount): Promise<SocialAccount> {
    if (!acc.refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokenData = await this.makeTokenRequest({
      client_key: this.env.clientId,
      client_secret: this.env.clientSecret,
      refresh_token: acc.refreshToken,
      grant_type: 'refresh_token'
    });

    const now = new Date();
    const accessTokenExpiresAt = new Date(now.getTime() + tokenData.expires_in * 1000);
    const refreshTokenExpiresAt = new Date(now.getTime() + tokenData.refresh_expires_in * 1000);

    return {
      ...acc,
      authToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      tokenIssuedAt: now
    };
  }

  async listPages(acc: SocialAccount): Promise<SocialPage[]> {
    // TikTok doesn't have separate pages, the account itself is the page
    if (!acc.authToken) {
      throw new Error('No auth token available');
    }

    const userInfo = await this.getUserInfo(acc.authToken);

    return [{
      id: crypto.randomUUID(),
      platform: 'tiktok',
      entityType: 'profile',
      name: userInfo.display_name,
      pageId: userInfo.open_id,
      authToken: acc.authToken,
      authTokenExpiresAt: acc.accessTokenExpiresAt,
      connected: true,
      status: 'active',
      accountId: acc.id,
      statusUpdatedAt: new Date(),
      followerCount: userInfo.follower_count,
      postCount: userInfo.video_count,
      metadata: {
        bio: userInfo.bio_description,
        profileUrl: userInfo.profile_deep_link,
        isVerified: userInfo.is_verified,
        followingCount: userInfo.following_count,
        likesCount: userInfo.likes_count
      }
    }];
  }

  async createPost(
    page: SocialPage,
    content: PostContent,
    options?: PublishOptions
  ): Promise<PostHistory> {
    const validation = this.validateContent(content);
    if (!validation.isValid) {
      throw new Error(`Invalid content: ${validation.errors?.join(', ')}`);
    }

    if (!content.media?.urls.length) {
      throw new Error('TikTok requires a video file');
    }

    if (content.media.urls.length > 1) {
      throw new Error('TikTok only supports one video per post');
    }

    if (content.media.type !== 'video') {
      throw new Error('TikTok only supports video uploads');
    }

    return this.publishPost(page, content, options);
  }

  async publishPost(
    page: SocialPage,
    content: PostContent,
    options?: PublishOptions
  ): Promise<any> {
    if (IS_BROWSER) {
      const res = await fetch('/api/social/tiktok/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          content,
          options,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    // Get secure token from the database
    const token = await getSecureToken(page.id);
    if (!token) {
      throw new Error('No auth token available');
    }

    const mediaType = content.media?.type;

    if (!content.media || !content.media.urls) {
      throw new Error('No media found');
    }

    let media ={}
   if(mediaType === 'video') {
    // https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide
    media = {
      video_url: content.media?.urls[0],
    }

    // check the media type should be MP4 (recommended), WebM, MOV
    const mediaFormat = content.media?.urls[0].split('.').pop();
    if(mediaFormat !== 'mp4' && mediaFormat !== 'webm' && mediaFormat !== 'mov') {
      throw new Error('TikTok only supports MP4, WebM, and MOV media types');
    }

   } else if(mediaType === 'image' || mediaType === 'carousel') {
    // https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide
    if(content.media?.urls?.length && content.media?.urls?.length > 35) {
      throw new Error('TikTok only supports up to 35 images in a carousel');
    }

    // check the media type for each should be WebP, JPEG, if not throw error, we can use for loop
    for(const url of content.media?.urls) {
      const mediaFormat = url.split('.').pop();
      if(mediaFormat !== 'webp' && mediaFormat !== 'jpeg') {

        throw new Error(`TikTok only supports WebP, JPEG media types ${mediaType == 'carousel' ? 'for carousel' : 'for image'}`);
      }
    }

    // https://developers.tiktok.com/doc/content-posting-api-reference-photo-post#
    media = {
      photo_images: content.media?.urls,
      photo_cover_index: 0
    }
   }else{
    throw new Error('Unsupported media type');
   }

// https://developers.tiktok.com/doc/content-posting-api-reference-direct-post?enter_method=left_navigation

    const tiktokBody = {
      post_info: {
        description: content.text,
        privacy_level: options?.privacyLevel || 'SELF_ONLY',
        disable_duet: options?.disableDuet || false,
        disable_stitch: options?.disableStitch || false,
        disable_comment: options?.disableComment || false,
        brand_content_toggle: options?.brandContentToggle || false,
        brand_organic_toggle: options?.brandOrganicToggle || false,
        auto_add_music: options?.autoAddMusic !== undefined ? options.autoAddMusic : false,
        is_aigc: options?.isAigc || false,
        ...(options?.videoCoverTimestampMs && {
          video_cover_timestamp_ms: options.videoCoverTimestampMs
        }),
        ...(options?.videoCovers && {
          video_cover_timestamp_ms: (options.videoCovers.coverTapTime || 0) * 1000
        }),
        ...(options?.contentDisclosure?.contentDisclosure && {
          content_disclosure: options.contentDisclosure.contentDisclosure
        })
      },
      source_info: {
        source: 'PULL_FROM_URL',
        ...media,
      },
      ...(mediaType != 'video' && {
        post_mode: "DIRECT_POST",
        media_type: "PHOTO",
      })
    } 


    const initResponse = await this.fetchWithAuth<{
      data: {
        publish_id: string;
      };
      error: {
        code: string;
        message: string;
      };
    }>(`${config.baseUrl}/v2/post/publish/${mediaType == 'video' ? 'video' : 'content'}/init/`, {
      method: 'POST',
      token: token,
      body: JSON.stringify(tiktokBody)
    });

    if (initResponse.error?.code !== 'ok') {
      throw new Error(`TikTok API Error: ${initResponse.error?.message} (${initResponse.error?.code})`);
    }

    const publishId = initResponse.data.publish_id;

    return { publishId, id: content.id }
  }

  async getPostHistory(page: SocialPage, limit = 20, nextPage?: number): Promise<PostHistoryResponse<PostHistory>> {
    if (IS_BROWSER) {
      const res = await fetch('/api/social/tiktok/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: page.id, limit }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    const token = await getSecureToken(page.id);
    if (!token) {
      throw new Error('No auth token available');
    }

    // Validate limit according to TikTok API specs (max 20)
    const validatedLimit = Math.min(Math.max(limit, 1), 20);

    // Define required fields for the response (based on actual TikTok API)
    const fields = [
      'id',
      'create_time',
      'cover_image_url',
      'share_url',
      'video_description',
      'duration',
      'height',
      'width',
      'title'
    ];

    // https://developers.tiktok.com/doc/tiktok-api-v2-video-list
    const response = await this.fetchWithAuth<{
      data: {
        videos: Array<{
          id: string;
          create_time: number;
          title: string;
          cover_image_url: string;
          share_url: string;
          video_description: string;
          duration: number;
          height: number;
          width: number;
        }>;
        cursor?: number;
        has_more: boolean;
      };
      error: {
        code: string;
        message: string;
        log_id: string;
      };
    }>(`${config.baseUrl}/v2/video/list/`, {
      method: 'POST',
      token: token,
      queryParams: {
        fields: fields.join(',')
      },
      body: JSON.stringify({
        max_count: validatedLimit,
        ...(nextPage && { cursor: nextPage })
      })
    });
    
    // Check for TikTok API errors
    if (response.error?.code !== 'ok') {
      throw new Error(`TikTok API Error: ${response.error?.message} (${response.error?.code})`);
    }


    // If we have videos, fetch detailed analytics for each video
    if (response.data.videos.length > 0) {
      try {
        // Extract video IDs for analytics query
        const videoIds = response.data.videos.map(video => video.id);
        
        // Fetch detailed analytics for all videos in batches (max 20 per request)
        // https://developers.tiktok.com/doc/tiktok-api-v2-video-query
        const analyticsResponse = await this.fetchWithAuth<{
          data: {
            videos: Array<{
              id: string;
              like_count: number;
              comment_count: number;
              share_count: number;
              view_count: number;
            }>;
          };
          error: {
            code: string;
            message: string;
            log_id: string;
          };
        }>(`${config.baseUrl}/v2/video/query/`, {
          method: 'POST',
          token: token,
          queryParams: {
            fields: 'id,like_count,comment_count,share_count,view_count'
          },
          body: JSON.stringify({
            filters: {
              video_ids: videoIds
            }
          })
        });


        // Check for TikTok API errors in analytics request
        if (analyticsResponse.error?.code !== 'ok') {
          console.warn(`TikTok Analytics API Error: ${analyticsResponse.error?.message}`);
        }

        // Create a map of video analytics for quick lookup
        const analyticsMap = new Map();
        if (analyticsResponse.data?.videos) {
          analyticsResponse.data.videos.forEach(video => {
            analyticsMap.set(video.id, {
              likes: video.like_count || 0,
              comments: video.comment_count || 0,
              shares: video.share_count || 0,
              views: video.view_count || 0
            });
          });
        }

        // Map videos with analytics data
        const posts = response.data.videos.map(video => ({
          id: video.id,
          pageId: page.id,
          postId: video.id,
          content: video.video_description || video.title,
          mediaUrls: [video.share_url],
          status: 'published' as PostStatus,
          publishedAt: new Date(video.create_time * 1000),
          analytics: analyticsMap.get(video.id) || {
            likes: 0,
            comments: 0,
            shares: 0,
            views: 0
          }
        }));

        return { posts, nextPage: response.data.has_more ? (nextPage || 0) + limit : undefined };
      } catch (error) {
        console.warn('Failed to fetch video analytics:', error);
        // Fallback to videos without analytics
      }
    }

    // Return videos without analytics if no videos or analytics fetch failed
    const posts = response.data.videos.map(video => ({
      id: video.id,
      pageId: page.id,
      postId: video.id,
      content: video.video_description || video.title,
      mediaUrls: [video.share_url],
      status: 'published' as PostStatus,
      publishedAt: new Date(video.create_time * 1000),
      analytics: {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0
      }
    }));

    return { posts, nextPage: response.data.has_more ? (nextPage || 0) + limit : undefined };
  }

  async getCreatorInfo(page: SocialPage): Promise<TikTokCreatorInfo> {
    if (IS_BROWSER) {
      const res = await fetch('/api/social/tiktok/creator-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: page.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    const token = await getSecureToken(page.id);
    if (!token) {
      throw new Error('No auth token available');
    }

    const creatorInfo = await this.fetchCreatorInfo(token);

    return {
      privacyLevelOptions: creatorInfo.privacy_level_options as any[],
      maxVideoPostDurationSec: creatorInfo.max_video_post_duration_sec,
      creatorNickname: creatorInfo.creator_nickname,
      creatorAvatarUrl: creatorInfo.creator_avatar_url,
      creatorUsername: creatorInfo.creator_username,
      commentDisabled: creatorInfo.comment_disabled,
      duetDisabled: creatorInfo.duet_disabled,
      stitchDisabled: creatorInfo.stitch_disabled
    };
  }

  async getPostAnalytics(page: SocialPage, postId: string): Promise<PostHistory['analytics']> {
    if (IS_BROWSER) {
      const res = await fetch('/api/social/tiktok/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, postId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    const token = await getSecureToken(page.id);
    if (!token) {
      throw new Error('No auth token available');
    }

    const response = await this.fetchWithAuth<{
      data: {
        videos: Array<{
          id: string;
          like_count: number;
          comment_count: number;
          share_count: number;
          view_count: number;
        }>;
      };
    }>(`${config.baseUrl}/v2/video/query/`, {
      method: 'POST',
      token: token,
      queryParams: {
        fields: 'stats'
      },
      body: JSON.stringify({
        filters: {
          video_ids: [postId]
        }
      })
    });

    // The response structure is different for single video query
    const video = response.data.videos?.[0];
    if (!video) {
      throw new Error('Video not found');
    }

    return {
      likes: video.like_count || 0,
      comments: video.comment_count || 0,
      shares: video.share_count || 0,
      views: video.view_count || 0
    };
  }

  async disconnectAccount(acc: SocialAccount): Promise<void> {
    try {
      if (!acc.authToken) {
        throw new Error('No auth token available');
      }

      // Revoke the access token with TikTok
      const formData = new URLSearchParams({
        client_key: this.env.clientId,
        client_secret: this.env.clientSecret,
        token: acc.authToken
      });

      await fetch(`${config.baseUrl}/v2/oauth/revoke/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        },
        body: formData
      });
    } catch (error) {
      console.warn('Failed to revoke TikTok token:', error);
    } finally {
      acc.connected = false;
      acc.status = 'disconnected' as PageStatus;
    }
  }

  async connectPage(acc: SocialAccount, pageId: string): Promise<SocialPage> {
    const pages = await this.listPages(acc);
    const page = pages.find(p => p.pageId === pageId);
    if (!page) {
      throw new Error('TikTok profile not found');
    }
    return page;
  }

  async disconnectPage(page: SocialPage): Promise<void> {
    page.connected = false;
    page.status = 'disconnected' as PageStatus;
  }

  async checkPageStatus(page: SocialPage): Promise<SocialPage> {
    try {
      const token = await getSecureToken(page.id);
      if (!token) {
        throw new Error('No auth token available');
      }
      await this.getUserInfo(token, ['open_id']);
      return { ...page, status: 'active' as PageStatus, statusUpdatedAt: new Date() };
    } catch {
      return { ...page, status: 'expired' as PageStatus, statusUpdatedAt: new Date() };
    }
  }

  async deletePost(page: SocialPage, postId: string): Promise<void> { 
    // Do not support delete post
  }
} 