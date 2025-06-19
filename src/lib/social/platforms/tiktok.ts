import { BasePlatform } from './base-platform';
import type {
  SocialAccount,
  SocialPage,
  PostContent,
  PostHistory,
  PublishOptions,
  SocialPlatformConfig,
} from './platform-types';

const config: SocialPlatformConfig = {
  name: 'TikTok',
  channel: 'tiktok',
  icon: '/images/platforms/tiktok.svg',
  authUrl: 'https://www.tiktok.com/auth/authorize/',
  scopes: [
    'user.info.basic',
    'user.info.profile',
    'user.info.stats',
    'video.list',
    'video.upload',
    'video.publish',
    'video.delete'
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
  refresh_token: string;
  expires_in: number;
  open_id: string;
  scope: string;
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
  constructor(env: { clientId: string; clientSecret: string; redirectUri: string }) {
    super(config, env);
  }

  async connectAccount(code: string): Promise<SocialAccount> {
    // Exchange code for access token
    const tokenResponse = await this.fetchWithAuth<TikTokTokenResponse>(`${config.baseUrl}/oauth/access_token/`, {
      method: 'POST',
      token: '',
      body: JSON.stringify({
        client_key: this.env.clientId,
        client_secret: this.env.clientSecret,
        code,
        grant_type: 'authorization_code'
      })
    });

    // Get user info
    const userInfo = await this.fetchWithAuth<TikTokUserInfo>(`${config.baseUrl}/user/info/`, {
      token: tokenResponse.access_token,
      queryParams: {
        fields: [
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
        ].join(',')
      }
    });

    return {
      id: crypto.randomUUID(),
      platform: 'tiktok',
      name: userInfo.user.display_name,
      accountId: userInfo.user.open_id,
      authToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      connected: true,
      status: 'active',
      metadata: {
        unionId: userInfo.user.union_id,
        bio: userInfo.user.bio_description,
        profileUrl: userInfo.user.profile_deep_link,
        isVerified: userInfo.user.is_verified,
        followerCount: userInfo.user.follower_count,
        followingCount: userInfo.user.following_count,
        likesCount: userInfo.user.likes_count,
        videoCount: userInfo.user.video_count
      }
    };
  }

  async refreshToken(acc: SocialAccount): Promise<SocialAccount> {
    if (!acc.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.fetchWithAuth<TikTokTokenResponse>(`${config.baseUrl}/oauth/refresh_token/`, {
      method: 'POST',
      token: '',
      body: JSON.stringify({
        client_key: this.env.clientId,
        client_secret: this.env.clientSecret,
        refresh_token: acc.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    return {
      ...acc,
      authToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: new Date(Date.now() + response.expires_in * 1000)
    };
  }

  async listPages(acc: SocialAccount): Promise<SocialPage[]> {
    // TikTok doesn't have separate pages, the account itself is the page
    const userInfo = await this.fetchWithAuth<TikTokUserInfo>(`${config.baseUrl}/user/info/`, {
      token: acc.authToken,
      queryParams: {
        fields: [
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
        ].join(',')
      }
    });

    return [{
      id: crypto.randomUUID(),
      platform: 'tiktok',
      entityType: 'profile',
      name: userInfo.user.display_name,
      pageId: userInfo.user.open_id,
      authToken: acc.authToken,
      connected: true,
      status: 'active',
      accountId: acc.id,
      statusUpdatedAt: new Date(),
      followerCount: userInfo.user.follower_count,
      postCount: userInfo.user.video_count,
      metadata: {
        bio: userInfo.user.bio_description,
        profileUrl: userInfo.user.profile_deep_link,
        isVerified: userInfo.user.is_verified,
        followingCount: userInfo.user.following_count,
        likesCount: userInfo.user.likes_count
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
  ): Promise<PostHistory> {
    const videoUrl = content.media!.urls[0];

    // 1. Get upload URL
    const uploadResponse = await this.fetchWithAuth<{
      data: {
        upload_url: string;
        access_key: string;
      };
    }>(`${config.baseUrl}/share/video/upload/`, {
      method: 'POST',
      token: page.authToken,
      body: JSON.stringify({
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: 0, // Will be set after fetching video
          chunk_size: 0
        }
      })
    });

    // 2. Upload the video
    const videoResponse = await fetch(videoUrl);
    const videoBlob = await videoResponse.blob();

    const uploadResult = await fetch(uploadResponse.data.upload_url, {
      method: 'POST',
      body: videoBlob,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Authorization': `Bearer ${page.authToken}`
      }
    });

    if (!uploadResult.ok) {
      throw new Error('Failed to upload video');
    }

    // 3. Create the post
    const publishResponse = await this.fetchWithAuth<{
      data: {
        share_id: string;
        create_time: number;
      };
    }>(`${config.baseUrl}/share/video/upload/`, {
      method: 'POST',
      token: page.authToken,
      body: JSON.stringify({
        video_id: uploadResponse.data.access_key,
        title: content.text,
        privacy_level: options?.visibility === 'private' ? 'SELF_ONLY' : 'PUBLIC',
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false,
        visibility_type: 'PUBLIC'
      })
    });

    return {
      id: publishResponse.data.share_id,
      pageId: page.id,
      postId: publishResponse.data.share_id,
      content: content.text,
      mediaUrls: [videoUrl],
      status: 'published',
      publishedAt: new Date(publishResponse.data.create_time * 1000)
    };
  }

  async getPostHistory(page: SocialPage, limit = 20): Promise<PostHistory[]> {
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
      token: page.authToken,
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

  async getPostAnalytics(page: SocialPage, postId: string): Promise<PostHistory['analytics']> {
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
      token: page.authToken,
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
    acc.connected = false;
    acc.status = 'disconnected';
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
      await this.fetchWithAuth(
        `${config.baseUrl}/user/info/`,
        {
          token: page.authToken,
          queryParams: {
            fields: ['open_id'].join(',')
          }
        }
      );
      return { ...page, status: 'active', statusUpdatedAt: new Date() };
    } catch {
      return { ...page, status: 'expired', statusUpdatedAt: new Date() };
    }
  }

  async deletePost(page: SocialPage, postId: string): Promise<void> {
    await this.fetchWithAuth(
      `${config.baseUrl}/video/delete/`,
      {
        method: 'POST',
        token: page.authToken,
        body: JSON.stringify({
          video_id: postId
        })
      }
    );
  }
} 