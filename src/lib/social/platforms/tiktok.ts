import { BasePlatform } from './base-platform';
import type {
  SocialAccount,
  SocialPage,
  PostContent,
  PostHistory,
  PublishOptions,
  SocialPlatformConfig,
  TikTokCreatorInfo,
} from './platform-types';
import { getSecureToken } from '@/lib/utils/token-manager';
import { postApi } from '@/lib/api/api-service';

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
    url.searchParams.set('state', crypto.randomUUID());
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
    const response = await this.fetchWithAuth<{
      data: {
        creator_avatar_url: string;
        creator_username: string;
        creator_nickname: string;
        privacy_level_options: string[];
        comment_disabled: boolean;
        duet_disabled: boolean;
        stitch_disabled: boolean;
        max_video_post_duration_sec: number;
      };
    }>(`${config.baseUrl}/v2/post/publish/creator_info/query/`, {
      method: 'POST',
      token: token,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      }
    });
    return response.data;
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


    // 1. Query creator info first (required by TikTok)
    const creatorInfo = await this.fetchCreatorInfo(token);

    // Validate privacy level
    const privacyLevel = options?.visibility === 'private' ? 'SELF_ONLY' : 'PUBLIC_TO_EVERYONE';
    if (!creatorInfo.privacy_level_options.includes(privacyLevel)) {
      throw new Error(`Invalid privacy level. Available options: ${creatorInfo.privacy_level_options.join(', ')}`);
    }

    const tiktokBody = {
      post_info: {
        title: content.text,
        privacy_level: privacyLevel,
        disable_duet: options?.disableDuet || false,
        disable_stitch: options?.disableStitch || false,
        disable_comment: options?.disableComment || false,
        brand_content_toggle: options?.brandContentToggle || false,
        brand_organic_toggle: options?.brandOrganicToggle || false,
        auto_add_music: options?.autoAddMusic !== undefined ? options.autoAddMusic : true,
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
        video_url: content.media?.urls[0],
        image_url: content.media?.urls[0]
      }
    } 


    // 2. Initialize video post with PULL_FROM_URL
    const initResponse = await fetch(`${config.baseUrl}/v2/post/publish/video/init/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(tiktokBody)
    });

    const initResponseData = await initResponse.json();

    if (initResponseData.error?.code !== 'ok') {
      throw new Error(`TikTok API Error: ${initResponseData.error?.message} (${initResponseData.error?.code})`);
    }

    const publishId = initResponseData.data.publish_id;

    // 3. Check post status until complete
    let status = 'PROCESSING';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10-second intervals

    while (status === 'PROCESSING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;

      const statusResponse = await this.fetchWithAuth<{
        data: {
          status: string;
          share_id?: string;
          create_time?: number;
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

      if (statusResponse.error?.code !== 'ok') {
        throw new Error(`Status check failed: ${statusResponse.error?.message}`);
      }

      status = statusResponse.data.status;

      if (status === 'SUCCESS') {
      //  just update the post status to published
      await postApi.updatePost(page.id, { status: 'Published' });
      
      } else if (status === 'FAILED') {
       await postApi.updatePost(page.id, { status: 'Failed Publishing' });
      }
    }

    return {
      id: publishId,
    }
  }

  async getPostHistory(page: SocialPage, limit = 20): Promise<PostHistory[]> {
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
          stats: {
            comment_count: number;
            like_count: number;
            play_count: number;
            share_count: number;
          };
        }>;
      };
    }>(`${config.baseUrl}/video/list/`, {
      token: token,
      queryParams: {
        fields: [
          'id',
          'create_time',
          'cover_image_url',
          'share_url',
          'video_description',
          'duration',
          'height',
          'width',
          'title',
          'stats'
        ].join(','),
        max_count: limit.toString()
      }
    });

    return response.data.videos.map(video => ({
      id: video.id,
      pageId: page.id,
      postId: video.id,
      content: video.video_description || video.title,
      mediaUrls: [video.share_url],
      status: 'published',
      publishedAt: new Date(video.create_time * 1000),
      analytics: {
        likes: video.stats.like_count,
        comments: video.stats.comment_count,
        shares: video.stats.share_count,
        views: video.stats.play_count
      }
    }));
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
        stats: {
          comment_count: number;
          like_count: number;
          play_count: number;
          share_count: number;
        };
      };
    }>(`${config.baseUrl}/video/query/`, {
      token: token,
      queryParams: {
        fields: ['stats'].join(','),
        video_id: postId
      }
    });

    return {
      likes: response.data.stats.like_count,
      comments: response.data.stats.comment_count,
      shares: response.data.stats.share_count,
      views: response.data.stats.play_count
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
      acc.status = 'disconnected';
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
    page.status = 'disconnected';
  }

  async checkPageStatus(page: SocialPage): Promise<SocialPage> {
    try {
      const token = await getSecureToken(page.id);
      if (!token) {
        throw new Error('No auth token available');
      }
      await this.getUserInfo(token, ['open_id']);
      return { ...page, status: 'active', statusUpdatedAt: new Date() };
    } catch {
      return { ...page, status: 'expired', statusUpdatedAt: new Date() };
    }
  }

  async deletePost(page: SocialPage, postId: string): Promise<void> {
    if (IS_BROWSER) {
      const res = await fetch('/api/social/tiktok/delete', {
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

    await this.fetchWithAuth(
      `${config.baseUrl}/video/delete/`,
      {
        method: 'POST',
        token: token,
        body: JSON.stringify({
          video_id: postId
        })
      }
    );
  }
} 