/* ───────────────────────────────────────────────────────────
   Instagram driver (Business / Creator)  —  Facebook Login
   ─────────────────────────────────────────────────────────── */
import { BasePlatform } from './base-platform';
import type {
  SocialAccount,
  SocialPage,
  PostContent,
  PostHistory,
  PublishOptions,
  SocialPlatformConfig,
} from './platform-types';
import { supabase } from '@/lib/supabase/client';
import { updatePlatformPostId } from '@/lib/utils/platform-post-ids';

const IS_BROWSER = typeof window !== 'undefined';

/* ---------- Meta constants ---------- */
const config: SocialPlatformConfig = {
  name: 'Instagram',
  channel: 'instagram',
  icon: '/images/platforms/instagram.svg',
  authUrl: 'https://www.facebook.com/v23.0/dialog/oauth',
  scopes: [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_metadata',
    'business_management',
  ],
  apiVersion: 'v23.0',
  baseUrl: 'https://graph.facebook.com',
  features: {
    multipleAccounts: true,
    multiplePages: false,
    scheduling: true,
    analytics: true,
    deletion: true,
    mediaTypes: ["image", "video", "carousel", "story"],
    maxMediaCount: 10,
    characterLimits: {
      content: 2200,
    },
  },
  mediaConstraints: {
    image: {
      maxWidth: 1080,
      maxHeight: 1350,
      aspectRatios: ["1:1", "4:5", "1.91:1"],
      maxSizeMb: 30,
      formats: ["jpg", "png"],
    },
    video: {
      maxWidth: 1080,
      maxHeight: 1920,
      aspectRatios: ["1:1", "4:5", "16:9", "9:16"],
      maxSizeMb: 4000, // 4GB
      maxDurationSec: 3600, // 60 minutes for feed
      maxFps: 30,
      formats: ["mp4", "mov"],
      audio: {
        codecs: ["aac"],
      },
      video: {
        codecs: ["h264"],
      },
    },
  },
  connectOptions: [
    {
      title: 'Add Instagram Professional Account',
      type: 'business',
      requiredScopes: ['instagram_basic', 'instagram_content_publish']
    },
    {
      title: 'Add Instagram Account via Facebook',
      type: 'facebook_linked',
      requiredScopes: ['pages_show_list', 'instagram_basic']
    }
  ]
};

export class InstagramPlatform extends BasePlatform {
  constructor(env: { clientId: string; clientSecret: string; redirectUri: string }) {
    super(config, env);
  }

  // Secure token fetching method (same pattern as Facebook)
  async getToken(pageId: string): Promise<string> {
    const { data, error } = await supabase
      .from('social_pages')
      .select('account_id, auth_token, auth_token_expires_at')
      .eq('id', pageId)
      .single();

    if (error) {
      throw new Error('Failed to get Instagram token. Please reconnect your Instagram account.');
    }

    return data?.auth_token;
  }

  async connectAccount(code: string): Promise<SocialAccount> {
    // Exchange code for long-lived token
    const shortLived = await this.fetchWithAuth<{
      access_token: string;
      expires_in: number;
    }>(`${config.baseUrl}/oauth/access_token`, {
      token: '',
      queryParams: {
        client_id: this.env.clientId,
        client_secret: this.env.clientSecret,
        redirect_uri: this.env.redirectUri,
        code
      }
    });

    const longLived = await this.fetchWithAuth<{
      access_token: string;
      expires_in: number;
    }>(`${config.baseUrl}/oauth/access_token`, {
      token: '',
      queryParams: {
        grant_type: 'fb_exchange_token',
        client_id: this.env.clientId,
        client_secret: this.env.clientSecret,
        fb_exchange_token: shortLived.access_token
      }
    });

    // Get user info
    const me = await this.fetchWithAuth<{
      id: string;
      name: string;
    }>(`${config.baseUrl}/${config.apiVersion}/me`, {
      token: longLived.access_token,
      queryParams: {
        fields: 'id,name'
      }
    });

    return {
      id: crypto.randomUUID(),
      platform: 'instagram',
      name: me.name,
      accountId: me.id,
      authToken: longLived.access_token,
      accessTokenExpiresAt: new Date(Date.now() + longLived.expires_in * 1000),
      connected: true,
      status: 'active'
    };
  }

  async refreshToken(acc: SocialAccount): Promise<SocialAccount> {
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
    try {
      // First get Facebook pages
      const fbPages = await this.fetchWithAuth<{
        data: Array<{
          id: string;
          name: string;
          access_token: string;
          instagram_business_account?: {
            id: string;
            username: string;
            profile_picture_url: string;
            followers_count: number;
            media_count: number;
          };
          connected_instagram_account?: {
            id: string;
            username: string;
            profile_picture_url: string;
          };
        }>;
      }>(`${config.baseUrl}/${config.apiVersion}/me/accounts`, {
        token: acc.authToken || '',
        queryParams: {
          fields: [
            'id',
            'name',
            'access_token',
            'instagram_business_account{id,username,profile_picture_url,followers_count,media_count}',
            'connected_instagram_account{id,username,profile_picture_url}'
          ].join(',')
        }
      });

      const pages: SocialPage[] = [];

      // Process each Facebook page for connected Instagram accounts
      for (const fbPage of fbPages.data) {
        // Get detailed Instagram info
        const igInfo = await this.fetchWithAuth<{
          instagram_business_account?: {
            id: string;
            username: string;
            profile_picture_url: string;
            followers_count: number;
            media_count: number;
          };
          connected_instagram_account?: {
            id: string;
            username: string;
            profile_picture_url: string;
          };
        }>(`${config.baseUrl}/${config.apiVersion}/${fbPage.id}`, {
          token: fbPage.access_token || '',
          queryParams: {
            fields: [
              'instagram_business_account{id,username,profile_picture_url,followers_count,media_count}',
              'connected_instagram_account{id,username,profile_picture_url}'
            ].join(',')
          }
        });

        const ig = igInfo.instagram_business_account || igInfo.connected_instagram_account;
        
        if (ig?.id) {
          pages.push({
            id: crypto.randomUUID(),
            platform: 'instagram',
            entityType: 'profile',
            name: ig.username ?? fbPage.name,
            pageId: ig.id,
            authToken: fbPage.access_token,
            connected: true,
            status: 'active',
            accountId: acc.id,
            statusUpdatedAt: new Date(),
            followerCount: (ig as any).followers_count || 0,
            postCount: (ig as any).media_count || 0,
            metadata: {
              profilePicture: ig.profile_picture_url,
              facebookPageId: fbPage.id
            }
          });
        }
      }

      return pages;
    } catch (error) {
      console.error('Error in listPages:', error);
      throw error;
    }
  }

  async createPost(
    page: SocialPage,
    content: PostContent,
    options?: PublishOptions
  ): Promise<PostHistory> {
    try {
      // Use the same validation pattern as Facebook
      const validation = this.validateContent(content);
      if (!validation.isValid) {
        throw new Error(`Invalid content: ${validation.errors?.join(', ')}`);
      }

      // Instagram requires at least one media item
      if (!content.media?.urls.length) {
        throw new Error('Instagram requires at least one media item');
      }

      // Check for draft posts (Instagram doesn't support drafts)
      if (options?.isDraft) {
        throw new Error('Instagram does not support draft posts');
      }

      return this.publishPost(page, content, options);
    } catch (error) {
      console.error('Error in createPost:', error);
      throw error;
    }
  }

  async publishPost(
    page: SocialPage,
    content: PostContent,
    options?: PublishOptions
  ): Promise<PostHistory> {
    // Prevent browser calls - route to API endpoint (same pattern as Facebook)
    if (IS_BROWSER) {
      const res = await fetch('/api/social/instagram/publish', {
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
      // Get secure token from database (same pattern as Facebook)
      const token = await this.getToken(page.id);
      if (!token) {
        throw new Error('No auth token available');
      }

      // Determine media type and route accordingly
      const mediaUrls = content.media?.urls || [];
      const mediaType = content.media?.type;

      // 1. Text-only post (not supported by Instagram)
      if (!content.media || mediaUrls.length === 0) {
        throw new Error('Instagram requires at least one media item');
      }

      // 2. Single video post  
      if (mediaType === 'video') {
        if (mediaUrls.length > 1) {
          throw new Error('Instagram only supports single video uploads');
        }
        return await this.publishVideoPost(page, content, token, options);
      }

      // 3. Single photo post
      if (mediaType === 'image' && mediaUrls.length === 1) {
        return await this.publishPhotoPost(page, content, token, options);
      }

      // 4. Carousel post (multiple images)
      if ((mediaType === 'image' || mediaType === 'carousel') && mediaUrls.length > 1) {
        return await this.publishCarouselPost(page, content, token, options);
      }

      // 5. Story posts (photo or video)
      if (content.media?.type === 'story') {
        if (mediaUrls.length !== 1) {
          throw new Error('Instagram stories support only single media uploads');
        }
        
        // Determine if it's a photo or video story based on file extension or metadata
        const mediaUrl = mediaUrls[0];
        const isVideo = mediaUrl.match(/\.(mp4|mov|avi|mkv)$/i) || content.media.duration;

        if (isVideo) {
          return await this.publishVideoStory(page, content, token, options);
        } else {
          return await this.publishPhotoStory(page, content, token, options);
        }
      }

      throw new Error('Unsupported media configuration');
      
    } catch (error) {
      console.error('Error in publishPost:', error);
      throw error;
    }
  }

  // 1. Single photo post using Instagram Media API
  // https://developers.facebook.com/docs/instagram-api/reference/ig-user/media#creating
  private async publishPhotoPost(
    page: SocialPage,
    content: PostContent,
    token: string,
    options?: PublishOptions
  ): Promise<PostHistory> {
    try {
      // Step 1: Create media container
      // https://developers.facebook.com/docs/instagram-platform/content-publishing#create-a-container
      const container = await this.fetchWithAuth<{ id: string }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/media`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify({
            image_url: content.media!.urls[0],
            caption: content.text,
            media_type: 'IMAGE',
            alt_text: content.media?.altText, // Support for alt_text field
            access_token: token
          })
        }
      );

      // Step 2: Publish the container
      const published = await this.fetchWithAuth<{ id: string }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/media_publish`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify({
            creation_id: container.id,
            access_token: token
          })
        }
      );

      // Save the published post ID to the platform_post_ids column
      try {
        console.log('Saving Instagram photo post ID:', published.id);
        await updatePlatformPostId(content.id!, 'instagram', published.id, page.id);
      } catch (error) {
        console.warn('Failed to save Instagram post ID:', error);
        // Don't fail the publish if saving the ID fails
      }

      return {
        id: published.id,
        pageId: page.id,
        postId: published.id,
        content: content.text,
        mediaUrls: content.media!.urls,
        status: 'published',
        publishedAt: new Date()
      };
    } catch (error) {
      console.error('Error in publishPhotoPost:', error);
      throw error;
    }
  }

  // 2. Single video post using Instagram Media API
  // https://developers.facebook.com/docs/instagram-platform/content-publishing#publish-the-container
  private async publishVideoPost(
    page: SocialPage,
    content: PostContent,
    token: string,
    options?: PublishOptions
  ): Promise<PostHistory> {
    try {
      // Step 1: Create media container
      // https://developers.facebook.com/docs/instagram-platform/content-publishing#create-a-container
      const container = await this.fetchWithAuth<{ id: string }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/media`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify({
            video_url: content.media!.urls[0],
            caption: content.text,
            media_type: 'REELS',
            access_token: token
          })
        }
      );

      // Step 1.5: Wait for container to be ready (video processing)
      console.log('Waiting for Instagram video container to be ready...');
      await this.waitForContainerReady(container.id, token);

      // Step 2: Publish the container
      const published = await this.fetchWithAuth<{ id: string }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/media_publish`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify({
            creation_id: container.id,
            access_token: token
          })
        }
      );

      // Save the published post ID to the platform_post_ids column
      try {
        console.log('Saving Instagram video post ID:', published.id);
        await updatePlatformPostId(content.id!, 'instagram', published.id, page.id);
      } catch (error) {
        console.warn('Failed to save Instagram post ID:', error);
        // Don't fail the publish if saving the ID fails
      }

      return {
        id: published.id,
        pageId: page.id,
        postId: published.id,
        content: content.text,
        mediaUrls: content.media!.urls,
        status: 'published',
        publishedAt: new Date()
      };
    } catch (error) {
      console.error('Error in publishVideoPost:', error);
      throw error;
    }
  }

  // 3. Carousel post (multiple images) using Instagram Media API
  // https://developers.facebook.com/docs/instagram-platform/content-publishing#create-a-carousel-container
  private async publishCarouselPost(
    page: SocialPage,
    content: PostContent,
    token: string,
    options?: PublishOptions
  ): Promise<PostHistory> {
    try {
      if (content.media!.urls.length < 2 || content.media!.urls.length > 10) {
        throw new Error('Instagram carousel must contain 2-10 items');
      }

      // Step 1: Create media containers for each item
      const containerIds: string[] = [];
      for (const url of content.media!.urls) {
        // Determine if it's a video or image based on file extension
        const isVideo = url.match(/\.(mp4|mov|avi|mkv)$/i);
        
        const container = await this.fetchWithAuth<{ id: string }>(
          `${config.baseUrl}/${config.apiVersion}/${page.pageId}/media`,
          {
            method: 'POST',
            token: token,
            body: JSON.stringify({
              [isVideo ? 'video_url' : 'image_url']: url,
              is_carousel_item: true,
              media_type: isVideo ? 'VIDEO' : 'IMAGE',
              access_token: token
            })
          }
        );
        
        // If it's a video, wait for it to be ready
        if (isVideo) {
          console.log(`Waiting for video carousel item ${container.id} to be ready...`);
          await this.waitForContainerReady(container.id, token);
        }
        
        containerIds.push(container.id);
      }

      console.log('Container IDs:', containerIds);
      // Step 2: Create carousel container
      const carouselContainer = await this.fetchWithAuth<{ id: string }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/media`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify({
            media_type: 'CAROUSEL',
            children: containerIds.join(','),
            caption: content.text,
            access_token: token
          })
        }
      );

      // Step 3: Publish the carousel
      const published = await this.fetchWithAuth<{ id: string }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/media_publish`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify({
            creation_id: carouselContainer.id,
            access_token: token
          })
        }
      );

      // Save the published post ID to the platform_post_ids column
      try {
        console.log('Saving Instagram carousel post ID:', published.id);
        await updatePlatformPostId(content.id!, 'instagram', published.id, page.id);
      } catch (error) {
        console.warn('Failed to save Instagram post ID:', error);
        // Don't fail the publish if saving the ID fails
      }

      return {
        id: published.id,
        pageId: page.id,
        postId: published.id,
        content: content.text,
        mediaUrls: content.media!.urls,
        status: 'published',
        publishedAt: new Date()
      };
    } catch (error) {
      console.error('Error in publishCarouselPost:', error);
      throw error;
    }
  }

  // 4. Photo Story using Instagram Stories API
  // https://developers.facebook.com/docs/instagram-platform/content-publishing#story-posts
  private async publishPhotoStory(
    page: SocialPage,
    content: PostContent,
    token: string,
    options?: PublishOptions
  ): Promise<PostHistory> {
    try {

      // create the story container
      const response = await this.fetchWithAuth<{ id: string }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/media`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify({
            image_url: content.media!.urls[0],
            media_type: 'STORIES',
            access_token: token
          })
        }
      );

      // publish the story
      const storyResponse = await this.fetchWithAuth<{ id: string }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/media_publish`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify({
            creation_id: response.id,
            access_token: token
          })
        }
      );

      // Save the published post ID to the platform_post_ids column
      try {
        console.log('Saving Instagram photo story ID:', storyResponse.id);
        await updatePlatformPostId(content.id!, 'instagram', storyResponse.id, page.id);
      } catch (error) {
        console.warn('Failed to save Instagram post ID:', error);
        // Don't fail the publish if saving the ID fails
      }

      return {
        id: storyResponse.id,
        pageId: page.id,
        postId: storyResponse.id,
        content: content.text,
        mediaUrls: content.media!.urls,
        status: 'published',
        publishedAt: new Date()
      };
    } catch (error) {
      console.error('Error in publishPhotoStory:', error);
      throw error;
    }
  }

  // 5. Video Story using Instagram Stories API
  // https://developers.facebook.com/docs/instagram-platform/content-publishing#story-posts
  private async publishVideoStory(
    page: SocialPage,
    content: PostContent,
    token: string,
    options?: PublishOptions
  ): Promise<PostHistory> {
    try {
      // Step 1: Create video story container
      // https://developers.facebook.com/docs/instagram-platform/content-publishing#create-a-video-story-container
      const container = await this.fetchWithAuth<{ id: string }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/media`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify({
            video_url: content.media!.urls[0],
            media_type: 'STORIES',
            access_token: token
          })
        }
      );

      console.log('Instagram video story container created:', container.id);

      // Step 1.5: Wait for container to be ready (video processing)
      console.log('Waiting for Instagram video story container to be ready...');
      await this.waitForContainerReady(container.id, token);

      // Instagram video stories are published directly when container is ready
      const response = await this.fetchWithAuth<{ id: string }>(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}/media`,
        {
          method: 'POST',
          token: token,
          body: JSON.stringify({
            video_url: content.media!.urls[0],
            media_type: 'STORIES',
            access_token: token
          })
        }
      );

      // Save the published post ID to the platform_post_ids column
      try {
        console.log('Saving Instagram video story ID:', response.id);
        await updatePlatformPostId(content.id!, 'instagram', response.id, page.id);
      } catch (error) {
        console.warn('Failed to save Instagram post ID:', error);
        // Don't fail the publish if saving the ID fails
      }

      return {
        id: response.id,
        pageId: page.id,
        postId: response.id,
        content: content.text,
        mediaUrls: content.media!.urls,
        status: 'published',
        publishedAt: new Date()
      };
    } catch (error) {
      console.error('Error in publishVideoStory:', error);
      throw error;
    }
  }

  // Helper method to wait for Instagram container to be ready
  // https://developers.facebook.com/docs/instagram-api/getting-started#troubleshooting
  private async waitForContainerReady(
    containerId: string,
    token: string,
    maxWaitTime = 300000, // 5 minutes max
    checkInterval = 30000  // Check every 30 seconds
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const containerStatus = await this.fetchWithAuth<{ 
          status_code: string;
          status: string;
        }>(
          `${config.baseUrl}/${config.apiVersion}/${containerId}`,
          {
            token: token,
            queryParams: { fields: 'status_code,status' }
          }
        );

        console.log(`Instagram container ${containerId} status:`, containerStatus);

        // Check for errors first
        if (containerStatus.status_code === 'ERROR') {
          throw new Error(`Instagram container failed: ${containerStatus.status}`);
        }

        if (containerStatus.status_code === 'EXPIRED') {
          throw new Error('Instagram container expired (not published within 24 hours)');
        }

        // Check if ready to publish
        if (containerStatus.status_code === 'FINISHED') {
          console.log(`Instagram container ${containerId} is ready for publishing`);
          return; // Container is ready
        }

        // Still processing, wait before next check
        if (containerStatus.status_code === 'IN_PROGRESS') {
          console.log(`Instagram container ${containerId} still processing, waiting...`);
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          continue;
        }

        // If already published, that's fine too
        if (containerStatus.status_code === 'PUBLISHED') {
          console.log(`Instagram container ${containerId} already published`);
          return;
        }

        // Unknown status, wait and retry
        console.log(`Instagram container ${containerId} unknown status: ${containerStatus.status_code}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        
      } catch (error) {
        console.warn(`Error checking container ${containerId} status:`, error);
        // If we can't check status, continue waiting
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }

    // Timeout reached
    throw new Error(`Instagram container ${containerId} processing timeout - container may still be processing`);
  }

  async getPostHistory(page: SocialPage, limit = 20, nextPage = ''): Promise<{ posts: PostHistory[], nextPage?: string }> {
    // Prevent browser calls - route to API endpoint (same pattern as Facebook)
    if (IS_BROWSER) {
      const res = await fetch('/api/social/instagram/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          limit,
          ...(nextPage && { nextPage }),
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

      // https://developers.facebook.com/docs/instagram-api/reference/ig-user/media#reading
      const response = await this.fetchWithAuth<{
        data: Array<{
          id: string;
          caption?: string;
          media_url: string;
          media_type: string;
          timestamp: string;
          permalink?: string;
          thumbnail_url?: string;
        }>;
        paging?: {
          cursors?: {
            before?: string;
            after?: string;
          };
          next?: string;
          previous?: string;
        };
      }>(`${config.baseUrl}/${config.apiVersion}/${page.pageId}/media`, {
        token: token,
        queryParams: {
          fields: 'id,caption,media_url,media_type,timestamp,permalink,thumbnail_url',
          limit: limit.toString(),
          ...(nextPage && { after: nextPage })
        }
      });

      const posts = response.data.map(post => ({
        id: post.id,
        pageId: page.id,
        postId: post.id,
        content: post.caption || '',
        mediaUrls: [post.media_url],
        status: 'published' as const,
        publishedAt: new Date(post.timestamp),
       
        // Initialize analytics (will be populated below)
        analytics: {
          views: 0,
          likes: 0,
          comments: 0,
          clicks: 0,
          reach: 0,
          metadata: {
            instagramPostId: post.id,
            mediaType: post.media_type,
            permalink: post.permalink,
            thumbnailUrl: post.thumbnail_url,
            platform: 'instagram'
          },
        } as PostHistory['analytics']
      }));

      // Get analytics for each post (like Facebook does)
      for (const post of posts) {
        try {
          const analytics = await this.getPostAnalytics(page, post.id);
          if (analytics) {
            post.analytics = {
              ...post.analytics,
              ...analytics
            };
          }
        } catch (error) {
          console.warn('Failed to get analytics for post:', post.id, error);
          // Don't fail the entire request if analytics fail
        }
      }

      return { 
        posts, 
        nextPage: response.paging?.cursors?.after || undefined 
      };
    } catch (error) {
      console.error('Error in getPostHistory:', error);
      throw error;
    }
  }

  async getPostAnalytics(page: SocialPage, postId: string): Promise<PostHistory['analytics']> {
    // Prevent browser calls - route to API endpoint (same pattern as Facebook)
    if (IS_BROWSER) {
      const res = await fetch('/api/social/instagram/analytics', {
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

      const response = await this.fetchWithAuth<{
        data: Array<{
          name: string;
          values: Array<{ value: number }>;
        }>;
      }>(`${config.baseUrl}/${config.apiVersion}/${postId}/insights`, {
        token: token,
        queryParams: {
          metric: 'reach,likes,comments'
        }
      });

      const metrics = response.data.reduce((acc, metric) => {
        acc[metric.name] = metric.values[0].value;
        return acc;
      }, {} as Record<string, number>);

      return {
        reach: metrics.reach,
        likes: metrics.likes,
        comments: metrics.comments
      };
    } catch (error) {
      console.error('Error in getPostAnalytics:', error);
      throw error;
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
      throw new Error('Instagram profile not found');
    }
    return page;
  }

  async disconnectPage(page: SocialPage): Promise<void> {
    page.connected = false;
    page.status = 'disconnected';
  }

  async checkPageStatus(page: SocialPage): Promise<SocialPage> {
    // Prevent browser calls - route to API endpoint (same pattern as Facebook)
    if (IS_BROWSER) {
      const res = await fetch('/api/social/instagram/status', {
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
        return { ...page, status: 'expired', statusUpdatedAt: new Date() };
      }

      // Check if the Instagram account is still accessible
      await this.fetchWithAuth(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}`,
        { token: token }
      );
      return { ...page, status: 'active', statusUpdatedAt: new Date() };
    } catch {
      return { ...page, status: 'expired', statusUpdatedAt: new Date() };
    }
  }

  async deletePost(): Promise<void> {
    throw new Error('Instagram API does not support post deletion');
  }
}
  