import { BasePlatform } from './base-platform';
import type {
  SocialAccount,
  SocialPage,
  PostContent,
  PostHistory,
  PublishOptions,
  SocialPlatformConfig,
  PostHistoryResponse,
  PageStatus,
  PostStatus,
} from './platform-types';
import {
  SocialAPIError,
  isTokenExpiredError,
  handleSuccess,
} from '@/lib/utils/error-handler';
import { withLoading } from '@/lib/utils/loading-manager';
import {
  validatePostContent,
  validateScheduledTime,
} from '@/lib/utils/validation';
import { normalizePostHistory } from '@/lib/utils/api-response';
import { calculateEngagementRate } from '@/lib/utils/analytics';
import { socialApiService } from '@/lib/api/social-api-service';
import { updatePlatformPostId } from '@/lib/utils/platform-post-ids';

const IS_BROWSER = typeof window !== 'undefined';

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
    // 'pages_manage_engagement',
    'pages_manage_posts',
    'pages_read_engagement',
    // 'publish_video', // not needed for now, use case is for live video
    'pages_show_list',
    // 'pages_manage_metadata',
    'pages_read_user_content',
    'read_insights', // for analytics
  ],
  apiVersion: 'v23.0',
  baseUrl: 'https://graph.facebook.com',
  features: {
    multipleAccounts: true,
    multiplePages: true,
    scheduling: true,
    analytics: true,
    deletion: true,
    mediaTypes: ['image', 'video', 'carousel', 'story'],
    maxMediaCount: 10,
    characterLimits: {
      content: 63206, // Facebook's actual limit
    },
  },
  mediaConstraints: {
    image: {
      maxWidth: 1200,
      maxHeight: 1350,
      aspectRatios: ['1.91:1', '1:1', '4:5'],
      maxSizeMb: 8,
      formats: ['jpg', 'png'],
    },
    video: {
      maxWidth: 1280,
      maxHeight: 720,
      aspectRatios: ['16:9', '1:1', '4:5', '9:16'],
      maxSizeMb: 250,
      maxDurationSec: 14400, // 240 minutes
      maxFps: 30,
      formats: ['mp4', 'mov'],
      audio: {
        codecs: ['aac'],
        minBitrateKbps: 128,
      },
      video: {
        codecs: ['h264'],
      },
    },
    story: {
      image: {
        maxWidth: 1080,
        maxHeight: 1920,
        aspectRatios: ['9:16'],
        maxSizeMb: 4, // Facebook story limit
        formats: ['jpg', 'png', 'gif', 'bmp', 'tiff'],
      },
      video: {
        maxWidth: 1080,
        maxHeight: 1920,
        aspectRatios: ['9:16'],
        maxSizeMb: 250,
        maxDurationSec: 60, // Facebook story limit
        minDurationSec: 3,
        maxFps: 60,
        minFps: 24,
        formats: ['mp4'],
        audio: {
          codecs: ['aac'],
          minBitrateKbps: 128,
          channels: 2, // Stereo
          sampleRate: 48000, // 48kHz
        },
        video: {
          codecs: ['h264', 'h265'],
          chromaSubsampling: '4:2:0',
          closedGop: '2-5', // seconds
          progressiveScan: true,
        },
      },
    },
  },
  connectOptions: [
    {
      title: 'Add Facebook Page',
      type: 'page',
      requiredScopes: ['pages_manage_posts', 'pages_show_list'],
    },
  ],
};

export class FacebookPlatform extends BasePlatform {
  constructor(env: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }) {
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

  // Secure token fetching method using API service
  async getToken(pageId: string): Promise<string> {
    try {
      const pageData = await socialApiService.getSocialPage(pageId);
      return pageData.authToken ?? '';
    } catch (error) {
      throw new Error(
        'Failed to get Facebook token. Please reconnect your Facebook account.'
      );
    }
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
        code,
      },
    });

    // Get user info
    // https://developers.facebook.com/docs/graph-api/overview/#me
    const userInfo = await this.fetchWithAuth<{
      id: string;
      name: string;
    }>(`${config.baseUrl}/${config.apiVersion}/me`, {
      token: tokenRes.access_token,
      queryParams: {
        fields: 'id,name',
      },
    });

    let userData = {
      id: crypto.randomUUID(),
      platform: 'facebook',
      name: userInfo.name,
      accountId: userInfo.id,
      authToken: tokenRes.access_token,
      refreshToken: undefined, // Facebook doesn't use refresh tokens
      accessTokenExpiresAt: new Date(Date.now() + tokenRes.expires_in * 1000),
      refreshTokenExpiresAt: undefined, // Facebook doesn't use refresh tokens
      tokenIssuedAt: new Date(),
      connected: true,
      status: 'active',
    };

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
        fb_exchange_token: acc.authToken || '',
      },
    });

    return {
      ...acc,
      tokenIssuedAt: new Date(Date.now()),
      authToken: response.access_token,
      refreshToken: undefined, // Facebook doesn't use refresh tokens
      accessTokenExpiresAt: new Date(Date.now() + response.expires_in * 1000),
      refreshTokenExpiresAt: undefined, // Facebook doesn't use refresh tokens
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
          ...(cursor && { after: cursor }),
        },
      });

      allPages.push(...response.data);

      if (!response.paging?.cursors?.after) {
        break;
      }

      cursor = response.paging?.cursors?.after;
    }

    return allPages.map((page) => ({
      id: crypto.randomUUID(),
      platform: 'facebook',
      entityType: 'page',
      name: page.name,
      pageId: page.id,
      authToken: page.access_token,
      connected: true,
      status: 'active',
      accountId: acc.id,
      statusUpdatedAt: new Date(),
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
        const scheduleValidation = validateScheduledTime(
          options.scheduledTime,
          'Facebook',
          this.config
        );
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
    // Prevent browser calls - route to API endpoint (like TikTok)
    if (IS_BROWSER) {
      const res = await fetch('/api/social/facebook/publish', {
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

    try {
      // Get secure token from database (like TikTok/LinkedIn)
      const token = await this.getToken(page.id);
      if (!token) {
        throw new Error('No auth token available');
      }

      // Determine media type and route accordingly (like LinkedIn/TikTok)
      const mediaUrls = content.media?.urls || [];
      const mediaType = content.media?.type;

      // 1. Text-only post
      if (!content.media || mediaUrls.length === 0) {
        return await this.publishTextPost(page, content, token, options);
      }

      // 2. Single video post
      if (mediaType === 'video') {
        if (mediaUrls.length > 1) {
          throw new SocialAPIError(
            'Facebook only supports single video uploads',
            'VALIDATION_ERROR'
          );
        }
        return await this.publishVideoPost(page, content, token, options);
      }

      // 3. Single photo post
      if (mediaType === 'image' && mediaUrls.length === 1) {
        return await this.publishPhotoPost(page, content, token, options);
      }

      // 4. Carousel post (multiple images)
      if (
        (mediaType === 'image' || mediaType === 'carousel') &&
        mediaUrls.length > 1
      ) {
        return await this.publishCarouselPost(page, content, token, options);
      }

      // 5. Story posts (photo or video)
      if (content.media?.type === 'story') {
        // https://developers.facebook.com/docs/page-stories-api/
        if (mediaUrls.length !== 1) {
          throw new SocialAPIError(
            'Facebook stories support only single media uploads',
            'VALIDATION_ERROR'
          );
        }

        // Determine if it's a photo or video story based on file extension or metadata
        const mediaUrl = mediaUrls[0];
        const isVideo =
          mediaUrl.match(/\.(mp4|mov|avi|mkv)$/i) || content.media.duration;

        if (isVideo) {
          return await this.publishVideoStory(page, content, token, options);
        } else {
          return await this.publishPhotoStory(page, content, token, options);
        }
      }

      throw new SocialAPIError(
        'Unsupported media configuration',
        'VALIDATION_ERROR'
      );
    } catch (error) {
      this.handleApiError(error, 'publish post');
    }
  }

  // 1. Text-only post using /page_id/feed endpoint
  // https://developers.facebook.com/docs/pages-api/posts/#publish-posts
  private async publishTextPost(
    page: SocialPage,
    content: PostContent,
    token: string,
    options?: PublishOptions
  ): Promise<PostHistory> {
    const endpoint = `${config.baseUrl}/${config.apiVersion}/${page.pageId}/feed`;

    const postData: any = {
      message: content.text,
    };

    // Add scheduling if needed
    if (options?.scheduledTime) {
      postData.scheduled_publish_time = Math.floor(
        options.scheduledTime.getTime() / 1000
      );
      postData.published = false;
    } else {
      postData.published = true;
    }

    // Add link if provided
    if (content.link?.url) {
      postData.link = content.link.url;
    }

    const response = await this.fetchWithAuth<{ id: string }>(endpoint, {
      method: 'POST',
      token: token,
      body: JSON.stringify(postData),
    });

    // Save the published post ID to the platform_post_ids column
    try {
      console.log('Saving Facebook text post ID:', response.id);
      await updatePlatformPostId(content.id!, 'facebook', response.id, page.id);
    } catch (error) {
      console.warn('Failed to save Facebook post ID:', error);
      // Don't fail the publish if saving the ID fails
    }

    return normalizePostHistory(
      {
        id: response.id,
        page_id: page.id,
        message: content.text,
        created_time: new Date().toISOString(),
        scheduled_publish_time: options?.scheduledTime?.getTime() ?? undefined,
        status: options?.scheduledTime ? 'SCHEDULED' : 'PUBLISHED',
      },
      'facebook'
    );
  }

  // 2. Single photo post using /page_id/photos endpoint
  // https://developers.facebook.com/docs/pages-api/posts/#publish-a-photo
  private async publishPhotoPost(
    page: SocialPage,
    content: PostContent,
    token: string,
    options?: PublishOptions
  ): Promise<PostHistory> {
    const endpoint = `${config.baseUrl}/${config.apiVersion}/${page.pageId}/photos`;

    const postData: any = {
      url: content.media!.urls[0],
      message: content.text,
    };

    // Add scheduling if needed
    if (options?.scheduledTime) {
      postData.scheduled_publish_time = Math.floor(
        options.scheduledTime.getTime() / 1000
      );
      postData.published = false;
    } else {
      postData.published = true;
    }

    const response = await this.fetchWithAuth<{ id: string; post_id?: string }>(
      endpoint,
      {
        method: 'POST',
        token: token,
        body: JSON.stringify(postData),
      }
    );

    // Save the published post ID to the platform_post_ids column
    try {
      const postId = response.post_id ?? response.id;
      console.log('Saving Facebook photo post ID:', postId);
      await updatePlatformPostId(content.id!, 'facebook', postId, page.id);
    } catch (error) {
      console.warn('Failed to save Facebook post ID:', error);
      // Don't fail the publish if saving the ID fails
    }

    return normalizePostHistory(
      {
        id: response.post_id ?? response.id,
        page_id: page.id,
        message: content.text,
        created_time: new Date().toISOString(),
        scheduled_publish_time: options?.scheduledTime?.getTime() ?? undefined,
        status: options?.scheduledTime ? 'SCHEDULED' : 'PUBLISHED',
        attachments: {
          data: [
            {
              media: {
                image: { src: content.media!.urls[0] },
              },
            },
          ],
        },
      },
      'facebook'
    );
  }

  // 3. Single video post using /page_id/videos endpoint
  // https://developers.facebook.com/docs/pages-api/posts/#publish-a-video
  private async publishVideoPost(
    page: SocialPage,
    content: PostContent,
    token: string,
    options?: PublishOptions
  ): Promise<PostHistory> {
    const endpoint = `${config.baseUrl}/${config.apiVersion}/${page.pageId}/videos`;

    const postData: any = {
      file_url: content.media!.urls[0], // Facebook uses file_url for videos
      description: content.text,
    };

    // Add scheduling if needed
    if (options?.scheduledTime) {
      postData.scheduled_publish_time = Math.floor(
        options.scheduledTime.getTime() / 1000
      );
      postData.published = false;
    } else {
      postData.published = true;
    }

    const response = await this.fetchWithAuth<{ id: string; post_id?: string }>(
      endpoint,
      {
        method: 'POST',
        token: token,
        body: JSON.stringify(postData),
      }
    );

    // Save the published post ID to the platform_post_ids column
    try {
      const postId = response.post_id ?? response.id;
      console.log('Saving Facebook video post ID:', postId);
      await updatePlatformPostId(content.id!, 'facebook', postId, page.id);
    } catch (error) {
      console.warn('Failed to save Facebook post ID:', error);
      // Don't fail the publish if saving the ID fails
    }

    return normalizePostHistory(
      {
        id: response.post_id ?? response.id,
        page_id: page.id,
        message: content.text,
        created_time: new Date().toISOString(),
        scheduled_publish_time: options?.scheduledTime?.getTime() ?? undefined,
        status: options?.scheduledTime ? 'SCHEDULED' : 'PUBLISHED',
        attachments: {
          data: [
            {
              media: {
                image: { src: content.media!.urls[0] },
              },
            },
          ],
        },
      },
      'facebook'
    );
  }

  // 4. Carousel post (multiple images) using upload then attach pattern
  private async publishCarouselPost(
    page: SocialPage,
    content: PostContent,
    token: string,
    options?: PublishOptions
  ): Promise<PostHistory> {
    try {
      // Step 1: Upload each photo separately without publishing (similar to LinkedIn pattern)
      const mediaIds = await Promise.all(
        content.media!.urls.map(async (url) => {
          const response = await this.fetchWithAuth<{ id: string }>(
            `${config.baseUrl}/${config.apiVersion}/${page.pageId}/photos`,
            {
              method: 'POST',
              token: token,
              body: JSON.stringify({
                url,
                published: false, // Don't publish yet
                temporary: true, // Mark as temporary for carousel
              }),
            }
          );
          return response.id;
        })
      );

      // Step 2: Create the carousel post using /page_id/feed with attached_media
      // https://developers.facebook.com/docs/pages-api/posts/#publish-posts
      const postData: any = {
        message: content.text,
        attached_media: mediaIds.map((id) => ({
          media_fbid: id,
        })),
      };

      // Add scheduling if needed
      if (options?.scheduledTime) {
        postData.scheduled_publish_time = Math.floor(
          options.scheduledTime.getTime() / 1000
        );
        postData.published = false;
      } else {
        postData.published = true;
      }

      const response = await this.fetchWithAuth<{ id: string }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/feed`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify(postData),
        }
      );

      // Save the published post ID to the platform_post_ids column
      try {
        console.log('Saving Facebook carousel post ID:', response.id);
        await updatePlatformPostId(
          content.id!,
          'facebook',
          response.id,
          page.id
        );
      } catch (error) {
        console.warn('Failed to save Facebook post ID:', error);
        // Don't fail the publish if saving the ID fails
      }

      return normalizePostHistory(
        {
          id: response.id,
          page_id: page.id,
          message: content.text,
          created_time: new Date().toISOString(),
          scheduled_publish_time:
            options?.scheduledTime?.getTime() ?? undefined,
          status: options?.scheduledTime ? 'SCHEDULED' : 'PUBLISHED',
          attachments: {
            data: content.media!.urls.map((url) => ({
              media: {
                image: { src: url },
              },
            })),
          },
        },
        'facebook'
      );
    } catch (error) {
      this.handleApiError(error, 'publish carousel post');
    }
  }

  // 5. Photo Story using /page_id/photo_stories endpoint
  // https://developers.facebook.com/docs/facebook-stories-api/photo-stories
  private async publishPhotoStory(
    page: SocialPage,
    content: PostContent,
    token: string,
    options?: PublishOptions
  ): Promise<PostHistory> {
    try {
      // Step 1: Upload photo without publishing (required for stories)
      // https://developers.facebook.com/docs/page-stories-api/#step-1--upload-a-photo
      const photoResponse = await this.fetchWithAuth<{ id: string }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/photos`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify({
            url: content.media!.urls[0],
            published: false, // Must be false for stories
          }),
        }
      );

      // Step 2: Publish photo as
      // https://developers.facebook.com/docs/page-stories-api/#step-2--publish-a-photo-story
      const storyResponse = await this.fetchWithAuth<{
        success: boolean;
        post_id: string;
      }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/photo_stories`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify({
            photo_id: photoResponse.id,
          }),
        }
      );

      if (!storyResponse.success) {
        throw new Error('Failed to publish photo story');
      }

      // Save the published post ID to the platform_post_ids column
      try {
        console.log('Saving Facebook photo story ID:', storyResponse.post_id);
        await updatePlatformPostId(
          content.id!,
          'facebook',
          storyResponse.post_id,
          page.id
        );
      } catch (error) {
        console.warn('Failed to save Facebook post ID:', error);
        // Don't fail the publish if saving the ID fails
      }

      return normalizePostHistory(
        {
          id: storyResponse.post_id,
          page_id: page.id,
          message: content.text,
          created_time: new Date().toISOString(),
          status: 'PUBLISHED',
          attachments: {
            data: [
              {
                media: {
                  image: { src: content.media!.urls[0] },
                },
              },
            ],
          },
        },
        'facebook'
      );
    } catch (error) {
      this.handleApiError(error, 'publish photo story');
    }
  }

  // 6. Video Story using /page_id/video_stories endpoint
  // https://developers.facebook.com/docs/page-stories-api/#video-stories
  private async publishVideoStory(
    page: SocialPage,
    content: PostContent,
    token: string,
    options?: PublishOptions
  ): Promise<PostHistory> {
    try {
      // Step 1: Initialize video upload session
      // https://developers.facebook.com/docs/page-stories-api/#initialize
      const initResponse = await this.fetchWithAuth<{
        video_id: string;
        upload_url: string;
      }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/video_stories`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify({
            upload_phase: 'start',
          }),
        }
      );

      // Step 2: Upload video to Meta servers
      // https://developers.facebook.com/docs/page-stories-api/#step-2--upload-a-video
      const uploadResponse = await fetch(
        initResponse.upload_url + '?access_token=' + token,
        {
          method: 'POST',
          headers: {
            file_url: content.media!.urls[0],
          },
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video for story');
      }

      const uploadResult = await uploadResponse.json();
      if (!uploadResult.success) {
        throw new Error('Failed to upload video for story');
      }

      // Step 3: Wait for video processing (optional but recommended)
      // await this.waitForVideoProcessing(initResponse.video_id, token);

      // Step 4: Publish video story
      // https://developers.facebook.com/docs/page-stories-api/#step-3--publish-a-video-story
      const storyResponse = await this.fetchWithAuth<{
        success: boolean;
        post_id: string;
      }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/video_stories`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify({
            video_id: initResponse.video_id,
            upload_phase: 'finish',
          }),
        }
      );

      if (!storyResponse.success) {
        throw new Error('Failed to publish video story');
      }

      // Save the published post ID to the platform_post_ids column
      try {
        console.log('Saving Facebook video story ID:', storyResponse.post_id);
        await updatePlatformPostId(
          content.id!,
          'facebook',
          storyResponse.post_id,
          page.id
        );
      } catch (error) {
        console.warn('Failed to save Facebook post ID:', error);
        // Don't fail the publish if saving the ID fails
      }

      return normalizePostHistory(
        {
          id: storyResponse.post_id,
          page_id: page.id,
          message: content.text,
          created_time: new Date().toISOString(),
          status: 'PUBLISHED',
          attachments: {
            data: [
              {
                media: {
                  image: { src: content.media!.urls[0] },
                },
              },
            ],
          },
        },
        'facebook'
      );
    } catch (error) {
      console.log('error', error);
      this.handleApiError(error, 'publish video story');
    }
  }

  // Helper method to wait for video processing
  private async waitForVideoProcessing(
    videoId: string,
    token: string,
    maxWaitTime = 300000
  ): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const statusResponse = await this.fetchWithAuth<{
          status: {
            video_status: string;
            uploading_phase: { status: string };
            processing_phase: { status: string };
          };
        }>(`${config.baseUrl}/${config.apiVersion}/${videoId}`, {
          token: token,
          queryParams: {
            fields: 'status',
          },
        });
        console.log('statusResponse', statusResponse.status);

        const { video_status, uploading_phase, processing_phase } =
          statusResponse.status;

        // Check for errors
        if (video_status === 'error') {
          throw new Error('Video processing failed');
        }

        // Check if processing is complete
        if (
          uploading_phase.status === 'complete' &&
          processing_phase.status === 'complete'
        ) {
          return; // Video is ready
        }

        // Wait before next check
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      } catch (error) {
        // If we can't check status, continue waiting
        console.warn('Could not check video status:', error);
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      }
    }

    // Timeout reached
    throw new Error('Video processing timeout - video may still be processing');
  }

  async getPostHistory(
    page: SocialPage,
    limit = 20,
    nextPage?: string | number
  ): Promise<PostHistoryResponse<PostHistory>> {
    // Prevent browser calls - route to API endpoint
    if (IS_BROWSER) {
      const res = await fetch('/api/social/facebook/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          limit,
          nextPage,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    try {
      // Get secure token from database
      const token = await this.getToken(page.id);
      if (!token) {
        throw new Error('No auth token available');
      }

      // https://developers.facebook.com/docs/pages-api/posts/#posts-2
      const response = await this.fetchWithAuth<{
        data: Array<{
          id: string;
          message?: string;
          created_time: string;
          attachments?: {
            data: Array<{
              type: string;
              title?: string;
              description?: string;
              url?: string;
              media?: {
                image?: {
                  src: string;
                  height: number;
                  width: number;
                };
                source?: string;
              };
              target?: {
                id: string;
                url: string;
              };
              subattachments?: {
                data: Array<{
                  type: string;
                  media?: {
                    image?: {
                      src: string;
                      height: number;
                      width: number;
                    };
                  };
                  target?: {
                    id: string;
                    url: string;
                  };
                }>;
              };
            }>;
          };
        }>;
        paging?: {
          cursors?: {
            before?: string;
            after?: string;
          };
          next?: string;
          previous?: string;
        };
      }>(`${config.baseUrl}/${config.apiVersion}/${page.pageId}/posts`, {
        token: token,
        queryParams: {
          fields: 'id,message,created_time,attachments',
          limit: limit.toString(),
          ...(nextPage && {
            after:
              typeof nextPage === 'string' ? nextPage : nextPage.toString(),
          }),
        },
      });

      const modifiedPosts = response.data.map((post) =>
        this.mapFacebookPostToHistory(post, page.id)
      );

      for (const post of modifiedPosts) {
        const analytics = await this.getPostAnalytics(page, post.id);
        post.analytics = analytics;
      }

      return {
        posts: modifiedPosts,
        nextPage: response.paging?.cursors?.after || undefined,
      };
    } catch (error) {
      this.handleApiError(error, 'get post history');
    }
  }

  // Get story history for a Facebook Page
  // https://developers.facebook.com/docs/facebook-stories-api/get-stories
  async getStoryHistory(
    page: SocialPage,
    limit = 20,
    nextPage?: string | number
  ): Promise<PostHistoryResponse<PostHistory>> {
    // Prevent browser calls - route to API endpoint
    if (IS_BROWSER) {
      const res = await fetch('/api/social/facebook/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          limit,
          nextPage,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    try {
      // Get secure token from database
      const token = await this.getToken(page.id);
      if (!token) {
        throw new Error('No auth token available');
      }

      // https://developers.facebook.com/docs/page-stories-api/#get-stories
      const response = await this.fetchWithAuth<{
        data: Array<{
          post_id: string;
          status: 'PUBLISHED' | 'ARCHIVED';
          creation_time: string;
          media_type: 'video' | 'photo';
          media_id: string;
          url: string;
        }>;
        paging?: {
          cursors?: {
            before?: string;
            after?: string;
          };
          next?: string;
          previous?: string;
        };
      }>(`${config.baseUrl}/${config.apiVersion}/${page.pageId}/stories`, {
        token: token,
        queryParams: {
          limit: limit.toString(),
          ...(nextPage && {
            after:
              typeof nextPage === 'string' ? nextPage : nextPage.toString(),
          }),
        },
      });

      const stories = response.data.map((story) =>
        this.mapFacebookStoryToHistory(story, page.id)
      );

      return {
        posts: stories,
        nextPage: response.paging?.cursors?.after || undefined,
      };
    } catch (error) {
      this.handleApiError(error, 'get story history');
    }
  }

  // Custom mapping function for Facebook post history
  private mapFacebookPostToHistory(post: any, pageId: string): PostHistory {
    const attachment = post.attachments?.data?.[0];

    // Determine media type and extract media URLs
    let mediaType: 'image' | 'video' | 'carousel' | undefined;
    let mediaUrls: string[] = [];

    if (attachment) {
      switch (attachment.type) {
        case 'photo':
          mediaType = 'image';
          if (attachment.media?.image?.src) {
            mediaUrls = [attachment.media.image.src];
          }
          break;

        case 'video_inline':
          mediaType = 'video';
          if (attachment.media?.source) {
            mediaUrls = [attachment.media.source];
          } else if (attachment.media?.image?.src) {
            // Use thumbnail if video source not available
            mediaUrls = [attachment.media.image.src];
          }
          break;

        case 'album':
          mediaType = 'carousel';
          // Get images from subattachments
          if (attachment.subattachments?.data) {
            mediaUrls = attachment.subattachments.data
              .map((sub: any) => sub.media?.image?.src)
              .filter(Boolean) as string[];
          }
          // Include main image if available
          if (attachment.media?.image?.src) {
            mediaUrls.unshift(attachment.media.image.src);
          }
          break;
      }
    }

    return {
      id: post.id,
      pageId: pageId,
      content: post.message || '',
      mediaUrls: mediaUrls,
      publishedAt: new Date(post.created_time),
      status: 'published' as PostStatus,

      // Default analytics (to be populated by separate call)
      analytics: {
        views: 0,
        engagement: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
        reach: 0,
        metadata: {
          facebookPostId: post.id,
          attachmentType: attachment?.type,
          postUrl: attachment?.url || attachment?.target?.url,
          title: attachment?.title,
          description: attachment?.description,
          mediaType: mediaType,
          thumbnailUrl: attachment?.media?.image?.src,
        },
      },
    };
  }

  // Custom mapping function for Facebook story history
  private mapFacebookStoryToHistory(story: any, pageId: string): PostHistory {
    return {
      id: story.post_id,
      pageId: pageId,
      content: '', // Stories typically don't have text content
      mediaUrls: [story.url],
      publishedAt: new Date(story.creation_time),
      status: 'published',

      // Default analytics (to be populated by separate call)
      analytics: {
        views: 0,
        engagement: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
        reach: 0,
        metadata: {
          facebookStoryId: story.post_id,
          mediaType: story.media_type,
          storyUrl: story.url,
          status: story.status,
        },
      },
    };
  }

  async getPostAnalytics(
    page: SocialPage,
    postId: string
  ): Promise<PostHistory['analytics']> {
    // Prevent browser calls - route to API endpoint
    if (IS_BROWSER) {
      const res = await fetch('/api/social/facebook/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          postId,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    try {
      // Get secure token from database
      const token = await this.getToken(page.id);
      if (!token) {
        throw new Error('No auth token available');
      }

      // https://developers.facebook.com/docs/graph-api/reference/post/insights/
      // https://developers.facebook.com/docs/platforminsights/page#get-metrics-of-a-page-post
      // https://developers.facebook.com/docs/graph-api/reference/v23.0/insights#page-posts
      const response = await this.fetchWithAuth<{
        data: Array<{
          name: string;
          period: string;
          values: Array<{ value: number | Record<string, number> }>;
          title?: string;
          description?: string;
        }>;
      }>(`${config.baseUrl}/${config.apiVersion}/${postId}/insights`, {
        token: token,
        queryParams: {
          metric: [
            'post_impressions',
            'post_reactions_by_type_total',
            'post_clicks',
          ].join(','),
          period: 'lifetime',
        },
      });

      // Process metrics handling both numeric and object values
      const metrics: Record<string, number> = {};
      let totalReactions = 0;
      let reactionBreakdown: Record<string, number> = {};

      response.data.forEach((metric) => {
        if (metric.values && metric.values.length > 0) {
          const value = metric.values[0].value;

          if (metric.name === 'post_reactions_by_type_total') {
            // Handle reaction breakdown object: {"like": 1, "love": 1}
            if (typeof value === 'object' && value !== null) {
              reactionBreakdown = value as Record<string, number>;
              totalReactions = Object.values(reactionBreakdown).reduce(
                (sum, count) => sum + count,
                0
              );
              metrics.total_reactions = totalReactions;
            } else {
              // Fallback if it's somehow a number
              metrics.total_reactions = value as number;
              totalReactions = value as number;
            }
          } else {
            // Handle simple numeric values
            metrics[metric.name] = value as number;
          }
        }
      });

      const analyticsData = {
        views: metrics.post_impressions || 0,
        likes: totalReactions || 0, // Total of all reactions
        clicks: metrics.post_clicks || 0,

        // Additional Facebook-specific metadata
        metadata: {
          platform: 'facebook',
          postId: postId,
          reactions: {
            like: reactionBreakdown.like || 0,
            love: reactionBreakdown.love || 0,
            wow: reactionBreakdown.wow || 0,
            haha: reactionBreakdown.haha || 0,
            sorry: reactionBreakdown.sorry || 0,
            anger: reactionBreakdown.anger || 0,
            total: totalReactions,
          },
          lastUpdated: new Date().toISOString(),
        },
      };

      return analyticsData;
    } catch (error) {
      this.handleApiError(error, 'get post analytics');
    }
  }

  async getPageAnalytics(page: SocialPage): Promise<any> {
    // Prevent browser calls - route to API endpoint
    if (IS_BROWSER) {
      const res = await fetch('/api/social/facebook/page-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    try {
      // Get secure token from database
      const token = await this.getToken(page.id);
      if (!token) {
        throw new Error('No auth token available');
      }

      // https://developers.facebook.com/docs/graph-api/reference/page/insights/
      const response = await this.fetchWithAuth<{
        data: Array<{
          name: string;
          period: string;
          values: Array<{ value: number | Record<string, number> }>;
          title?: string;
          description?: string;
        }>;
      }>(`${config.baseUrl}/${config.apiVersion}/${page.pageId}/insights`, {
        token: token,
        queryParams: {
          metric: [
            'page_impressions',
            'page_fan_adds',
            'page_views_total',
            'page_posts_impressions',
            'page_follows',
          ].join(','),
          period: 'day'
        }
      });

      return {
        pageId: page.pageId,
        pageName: page.name,
        analytics: response.data,
        lastUpdated: new Date().toISOString()
      };

    } catch (error: any) {
      console.error('Facebook page analytics error:', error);
      throw new SocialAPIError(
        `Failed to fetch page analytics: ${error.message}`,
        'FACEBOOK_PAGE_ANALYTICS_ERROR'
      );
    }
  }

  // Implement remaining required methods
  async disconnectAccount(acc: SocialAccount): Promise<void> {
    acc.connected = false;
    acc.status = 'disconnected' as PageStatus;
  }

  async connectPage(acc: SocialAccount, pageId: string): Promise<SocialPage> {
    const pages = await this.listPages(acc);
    const page = pages.find((p) => p.pageId === pageId);
    if (!page) {
      throw new Error('Page not found');
    }
    return page;
  }

  async disconnectPage(page: SocialPage): Promise<void> {
    page.connected = false;
    page.status = 'disconnected' as PageStatus;
  }

  async checkPageStatus(page: SocialPage): Promise<SocialPage> {
    // Prevent browser calls - route to API endpoint
    if (IS_BROWSER) {
      const res = await fetch('/api/social/facebook/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    try {
      // Get secure token from database
      const token = await this.getToken(page.id);
      if (!token) {
        return {
          ...page,
          status: 'expired' as PageStatus,
          statusUpdatedAt: new Date(),
        };
      }

      await this.fetchWithAuth(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}`,
        { token: token }
      );
      return {
        ...page,
        status: 'active' as PageStatus,
        statusUpdatedAt: new Date(),
      };
    } catch {
      return {
        ...page,
        status: 'expired' as PageStatus,
        statusUpdatedAt: new Date(),
      };
    }
  }

  async deletePost(page: SocialPage, postId: string): Promise<any> {
    // Prevent browser calls - route to API endpoint
    if (IS_BROWSER) {
      const res = await fetch('/api/social/facebook/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          postId,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    // Get secure token from database
    const token = await this.getToken(page.id);
    if (!token) {
      throw new Error('No auth token available');
    }

    // https://developers.facebook.com/docs/pages-api/posts/#delete-a-post
    const res = await this.fetchWithAuth(
      `${config.baseUrl}/${config.apiVersion}/${postId}`,
      {
        method: 'DELETE',
        token: token,
      }
    );

    return res;
  }
}
