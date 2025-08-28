import { BasePlatform } from './base-platform';
import type {
  SocialAccount,
  SocialPage,
  PostContent,
  PostHistory,
  PublishOptions,
  SocialPlatformConfig,
} from './platform-types';
import { SocialAPIError, isTokenExpiredError, handleSuccess } from '@/lib/utils/error-handler';
import { withLoading } from '@/lib/utils/loading-manager';
import { validatePostContent, validateScheduledTime } from '@/lib/utils/validation';
import { normalizePostHistory } from '@/lib/utils/api-response';
import { calculateEngagementRate } from '@/lib/utils/analytics';

const config: SocialPlatformConfig = {
  name: 'Facebook',
  channel: 'facebook',
  icon: '/images/platforms/facebook.svg',
  // https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/
  authUrl: 'https://www.facebook.com/v23.0/dialog/oauth',

  // Main permissions for posting to the page
  // https://developers.facebook.com/docs/pages-api/posts/

  // Dependency Permissions
  // https://developers.facebook.com/docs/permissions/
  scopes: [
    'email',
    'public_profile',
    'business_management',
    'pages_manage_engagement',
    'pages_manage_posts',
    'pages_read_engagement',
    'publish_video',
    'pages_show_list',
    'pages_manage_metadata',
    'pages_read_user_content',
  ],
  apiVersion: 'v23.0',
  baseUrl: 'https://graph.facebook.com',
  features: {
    multipleAccounts: true,
    multiplePages: true,
    scheduling: true,
    analytics: true,
    deletion: true,
    mediaTypes: ['image', 'video', 'carousel'],
    maxMediaCount: 10,
    characterLimits: {
      content: 63206 // Facebook's actual limit
    }
  },
  mediaConstraints: {
    image: {
      maxWidth: 1200,
      maxHeight: 1350,
      aspectRatios: ["1.91:1", "1:1", "4:5"],
      maxSizeMb: 8,
      formats: ["jpg", "png"],
    },
    video: {
      maxWidth: 1280,
      maxHeight: 720,
      aspectRatios: ["16:9", "1:1", "4:5", "9:16"],
      maxSizeMb: 250,
      maxDurationSec: 14400, // 240 minutes
      maxFps: 30,
      formats: ["mp4", "mov"],
      audio: {
        codecs: ["aac"],
        minBitrateKbps: 128,
      },
      video: {
        codecs: ["h264"],
      },
    },
  },
  connectOptions: [
    {
      title: 'Add Facebook Page',
      type: 'page',
      requiredScopes: ['pages_manage_posts', 'pages_show_list']
    }
  ]
};

export class FacebookPlatform extends BasePlatform {
  constructor(env: { clientId: string; clientSecret: string; redirectUri: string }) {
    super(config, env);
  }

  // Helper method to handle API errors
  protected handleApiError(error: unknown, operation: string): never {
    if (isTokenExpiredError(error)) {
      throw new SocialAPIError(
        'Your Facebook access token has expired. Please reconnect your account.',
        'TOKEN_EXPIRED'
      );
    }

    if (error instanceof SocialAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new SocialAPIError(
        `Failed to ${operation}: ${error.message}`,
        'API_ERROR'
      );
    }

    throw new SocialAPIError(
      `An unexpected error occurred while ${operation}`,
      'UNKNOWN_ERROR'
    );
  }

  async connectAccount(code: string): Promise<SocialAccount> {
    // Exchange code for access token
    // https://developers.facebook.com/docs/facebook-login/facebook-login-for-business/#invoke-a-login-dialog
    const tokenRes = await this.fetchWithAuth<{
      access_token: string;
      expires_in: number;
    }>(`${config.baseUrl}/oauth/access_token`, {
      token: '',
      queryParams: {
        grant_type: 'authorization_code',
        client_id: this.env.clientId,
        client_secret: this.env.clientSecret,
        redirect_uri: this.env.redirectUri,
        code
      }
    });

    // Get user info
    // https://developers.facebook.com/docs/graph-api/overview/#me
    const userInfo = await this.fetchWithAuth<{
      id: string;
      name: string;
    }>(`${config.baseUrl}/${config.apiVersion}/me`, {
      token: tokenRes.access_token,
      queryParams: {
        fields: 'id,name'
      }
    });

    let userData ={
      id: crypto.randomUUID(),
      platform: 'facebook',
      name: userInfo.name,
      accountId: userInfo.id,
      authToken: tokenRes.access_token,
      accessTokenExpiresAt: new Date(Date.now() + tokenRes.expires_in * 1000),
      connected: true,
      status: 'active'
    }

    // generate a long lived access token
    const finalData = await this.refreshToken(userData);

    return finalData;
  }

  
  async refreshToken(acc: any): Promise<SocialAccount> {

    // https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived/#get-a-long-lived-user-access-token
    const response = await this.fetchWithAuth<{
      access_token: string;
      expires_in: number;
    }>(`${config.baseUrl}/oauth/access_token`, {
      token: '',
      queryParams: {
        grant_type: 'fb_exchange_token',
        client_id: this.env.clientId,
        client_secret: this.env.clientSecret,
        fb_exchange_token: acc.authToken || ''
      }
    });

    return {
      ...acc,
      authToken: response.access_token,
      accessTokenExpiresAt: new Date(Date.now() + response.expires_in * 1000)
    };
  }

  async listPages(acc: SocialAccount): Promise<SocialPage[]> {

    let allPages: any[] = [];

    let cursor = null;

    while (true) {

      // https://developers.facebook.com/docs/pages-api/manage-pages#get-your-pages
      const response: any = await this.fetchWithAuth<{
        data: Array<{
          id: string;
          name: string;
          access_token: string;
          category?: string;
          category_list?: Array<{
            id: string;
            name: string;
          }>;
          tasks?: string[];
        }>;
        paging: {
          cursors: {
            before: string;
            after: string;
          };
          next: string;
        };
      }>(`${config.baseUrl}/${config.apiVersion}/${acc.accountId}/accounts`, {
        token: acc.authToken || '',
        queryParams: {
          fields: 'id,name,access_token,category,category_list,tasks',
          limit: '100',
          ...(cursor && { after: cursor })
        }
      });

      allPages.push(...response.data);

      if (!response.paging?.cursors?.after) {
        break;
      }

      cursor = response.paging?.cursors?.after;
    }
    
    return allPages.map(page => ({
      id: crypto.randomUUID(),
      platform: 'facebook',
      entityType: 'page',
      name: page.name,
      pageId: page.id,
      authToken: page.access_token,
      connected: true,
      status: 'active',
      accountId: acc.id,
      statusUpdatedAt: new Date()
    }));
  }

  async createPost(
    page: SocialPage,
    content: PostContent,
    options?: PublishOptions
  ): Promise<PostHistory> {
    try {
      // Use the new validation utilities
      const validation = validatePostContent(content, 'Facebook', this.config);
      if (!validation.isValid) {
        throw new SocialAPIError(
          `Invalid content: ${validation.errors?.join(', ')}`,
          'VALIDATION_ERROR'
        );
      }

      // Validate scheduling if needed
      if (options?.scheduledTime) {
        const scheduleValidation = validateScheduledTime(options.scheduledTime, 'Facebook', this.config);
        if (!scheduleValidation.isValid) {
          throw new SocialAPIError(
            `Invalid schedule time: ${scheduleValidation.errors?.join(', ')}`,
            'VALIDATION_ERROR'
          );
        }
      }

      // Check for draft posts
      if (options?.isDraft) {
        throw new SocialAPIError(
          'Facebook does not support draft posts',
          'FEATURE_NOT_SUPPORTED'
        );
      }

      const result = await withLoading(
        () => this.publishPost(page, content, options),
        'Creating Facebook post...'
      );

      handleSuccess('Post created successfully');
      return result;
    } catch (error) {
      this.handleApiError(error, 'create post');
    }
  }

  async publishPost(
    page: SocialPage,
    content: PostContent,
    options?: PublishOptions
  ): Promise<PostHistory> {
    try {
      const endpoint = options?.scheduledTime
        ? `${config.baseUrl}/${config.apiVersion}/${page.pageId}/scheduled_posts`
        : `${config.baseUrl}/${config.apiVersion}/${page.pageId}/feed`;

      if (!content.media) {
        // Text-only post
        const response = await this.fetchWithAuth<{ id: string }>(endpoint, {
          method: 'POST',
          token: page.authToken || '',
          body: JSON.stringify({
            message: content.text,
            scheduled_publish_time: options?.scheduledTime
              ? Math.floor(options.scheduledTime.getTime() / 1000)
              : undefined,
            published: !options?.scheduledTime
          })
        });

        return normalizePostHistory({
          id: response.id,
          page_id: page.id,
          message: content.text,
          created_time: new Date().toISOString(),
          scheduled_publish_time: options?.scheduledTime?.getTime() ?? undefined,
          status: options?.scheduledTime ? 'SCHEDULED' : 'PUBLISHED'
        }, 'facebook');
      }

      // Handle media posts based on type and count
      if (content.media.type === 'carousel' && content.media.urls.length > 1) {
        return await withLoading(
          () => this.publishCarouselPost(page, content, options),
          'Publishing carousel post...'
        );
      }

      // Single photo/video
      const mediaEndpoint = content.media.type === 'video'
        ? `${config.baseUrl}/${config.apiVersion}/${page.pageId}/videos`
        : `${config.baseUrl}/${config.apiVersion}/${page.pageId}/photos`;

      const response = await this.fetchWithAuth<{ id: string; post_id?: string }>(mediaEndpoint, {
        method: 'POST',
        token: page.authToken || '',
        body: JSON.stringify({
          url: content.media.urls[0],
          message: content.text,
          scheduled_publish_time: options?.scheduledTime
            ? Math.floor(options.scheduledTime.getTime() / 1000)
            : undefined,
          published: !options?.scheduledTime
        })
      });

      return normalizePostHistory({
        id: response.post_id ?? response.id,
        page_id: page.id,
        message: content.text,
        created_time: new Date().toISOString(),
        scheduled_publish_time: options?.scheduledTime?.getTime() ?? undefined,
        status: options?.scheduledTime ? 'SCHEDULED' : 'PUBLISHED',
        attachments: {
          data: [{
            media: {
              image: { src: content.media.urls[0] }
            }
          }]
        }
      }, 'facebook');
    } catch (error) {
      this.handleApiError(error, 'publish post');
    }
  }

  private async publishCarouselPost(
    page: SocialPage,
    content: PostContent,
    options?: PublishOptions
  ): Promise<PostHistory> {
    try {
      // 1. Upload each media separately
      const mediaIds = await Promise.all(
        content.media!.urls.map(async (url, index) => {
          const response = await this.fetchWithAuth<{ id: string }>(
            `${config.baseUrl}/${config.apiVersion}/${page.pageId}/photos`,
            {
              method: 'POST',
              token: page.authToken || '',
              body: JSON.stringify({
                url,
                published: false,
                temporary: true
              })
            }
          );
          return response.id;
        })
      );

      // 2. Create the carousel post
      const attachedMedia = mediaIds.map(id => ({
        media_fbid: id
      }));

      const response = await this.fetchWithAuth<{ id: string }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/feed`,
        {
          method: 'POST',
          token: page.authToken || '',
          body: JSON.stringify({
            message: content.text,
            attached_media: attachedMedia,
            scheduled_publish_time: options?.scheduledTime
              ? Math.floor(options.scheduledTime.getTime() / 1000)
              : undefined,
            published: !options?.scheduledTime
          })
        }
      );

      return normalizePostHistory({
        id: response.id,
        page_id: page.id,
        message: content.text,
        created_time: new Date().toISOString(),
        scheduled_publish_time: options?.scheduledTime?.getTime() ?? undefined,
        status: options?.scheduledTime ? 'SCHEDULED' : 'PUBLISHED',
        attachments: {
          data: content.media!.urls.map(url => ({
            media: {
              image: { src: url }
            }
          }))
        }
      }, 'facebook');
    } catch (error) {
      this.handleApiError(error, 'publish carousel post');
    }
  }

  async getPostHistory(page: SocialPage, limit = 20): Promise<PostHistory[]> {
    try {
      const response = await this.fetchWithAuth<{
        data: Array<{
          id: string;
          message?: string;
          created_time: string;
          attachments?: {
            data: Array<{
              media: {
                image: { src: string };
              };
            }>;
          };
        }>;
      }>(`${config.baseUrl}/${config.apiVersion}/${page.pageId}/posts`, {
        token: page.authToken || '',
        queryParams: {
          fields: 'id,message,created_time,attachments,status',
          limit: limit.toString()
        }
      });

      return response.data.map(post => normalizePostHistory(post, 'facebook'));
    } catch (error) {
      this.handleApiError(error, 'get post history');
    }
  }

  async getPostAnalytics(page: SocialPage, postId: string): Promise<PostHistory['analytics']> {
    try {
      const response = await this.fetchWithAuth<{
        data: Array<{
          name: string;
          values: Array<{ value: number }>;
        }>;
      }>(`${config.baseUrl}/${config.apiVersion}/${postId}/insights`, {
        token: page.authToken || '',
        queryParams: {
          metric: [
            'post_impressions',
            'post_engagements',
            'post_reactions_by_type_total',
            'post_clicks',
            'post_reach'
          ].join(',')
        }
      });

      const metrics = response.data.reduce((acc, metric) => {
        acc[metric.name] = metric.values[0].value;
        return acc;
      }, {} as Record<string, number>);

      const analyticsData = {
        views: metrics.post_impressions || 0,
        engagement: metrics.post_engagements || 0,
        likes: metrics.post_reactions_by_type_total || 0,
        clicks: metrics.post_clicks || 0,
        reach: metrics.post_reach || 0,
        comments: 0, // Need to fetch separately
        shares: 0 // Need to fetch separately
      };

      return analyticsData;
    } catch (error) {
      this.handleApiError(error, 'get post analytics');
    }
  }

  // Implement remaining required methods
  async disconnectAccount(acc: SocialAccount): Promise<void> {
    acc.connected = false;
    acc.status = 'disconnected';
  }

  async connectPage(acc: SocialAccount, pageId: string): Promise<SocialPage> {
    const pages = await this.listPages(acc);
    const page = pages.find(p => p.pageId === pageId);
    if (!page) {
      throw new Error('Page not found');
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
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}`,
        { token: page.authToken || '' }
      );
      return { ...page, status: 'active', statusUpdatedAt: new Date() };
    } catch {
      return { ...page, status: 'expired', statusUpdatedAt: new Date() };
    }
  }

  async deletePost(page: SocialPage, postId: string): Promise<void> {
    await this.fetchWithAuth(
      `${config.baseUrl}/${config.apiVersion}/${postId}`,
      {
        method: 'DELETE',
        token: page.authToken || ''
      }
    );
  }
} 