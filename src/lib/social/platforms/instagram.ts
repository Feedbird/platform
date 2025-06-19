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

/* ---------- Meta constants ---------- */
const config: SocialPlatformConfig = {
  name: 'Instagram',
  channel: 'instagram',
  icon: '/images/platforms/instagram.svg',
  authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
  scopes: [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_metadata',
    'business_management',
  ],
  apiVersion: 'v19.0',
  baseUrl: 'https://graph.facebook.com',
  features: {
    multipleAccounts: true,
    multiplePages: true,
    scheduling: true,
    analytics: true,
    deletion: false, // Instagram API doesn't support post deletion
    mediaTypes: ['image', 'video', 'carousel'],
    maxMediaCount: 10,
    characterLimits: {
      content: 2200, // Instagram's caption limit
    }
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
      expiresAt: new Date(Date.now() + longLived.expires_in * 1000),
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
        fb_exchange_token: acc.authToken
      }
    });

    return {
      ...acc,
      authToken: response.access_token,
      expiresAt: new Date(Date.now() + response.expires_in * 1000)
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
        token: acc.authToken,
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
          token: fbPage.access_token,
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
    const validation = this.validateContent(content);
    if (!validation.isValid) {
      throw new Error(`Invalid content: ${validation.errors?.join(', ')}`);
    }

    if (!content.media?.urls.length) {
      throw new Error('Instagram requires at least one media item');
    }

    return this.publishPost(page, content, options);
  }

  async publishPost(
    page: SocialPage,
    content: PostContent,
    options?: PublishOptions
  ): Promise<PostHistory> {
    if (content.media!.urls.length > 1) {
      return this.publishCarousel(page, content, options);
    }

    const url = content.media!.urls[0];
    const isVideo = /\.(mp4|mov|m4v)$/i.test(url);

    // 1. Create media container
    const container = await this.fetchWithAuth<{ id: string }>(`${config.baseUrl}/${config.apiVersion}/${page.pageId}/media`, {
      method: 'POST',
      token: page.authToken,
      body: JSON.stringify({
        [isVideo ? 'video_url' : 'image_url']: url,
        caption: content.text,
        media_type: isVideo ? 'VIDEO' : 'IMAGE',
        access_token: page.authToken
      })
    });

    // 2. Publish the container
    const published = await this.fetchWithAuth<{ id: string }>(`${config.baseUrl}/${config.apiVersion}/${page.pageId}/media_publish`, {
      method: 'POST',
      token: page.authToken,
      body: JSON.stringify({
        creation_id: container.id,
        access_token: page.authToken
      })
    });

    return {
      id: published.id,
      pageId: page.id,
      postId: published.id,
      content: content.text,
      mediaUrls: content.media!.urls,
      status: 'published',
      publishedAt: new Date()
    };
  }

  private async publishCarousel(
    page: SocialPage,
    content: PostContent,
    options?: PublishOptions
  ): Promise<PostHistory> {
    if (content.media!.urls.length < 2 || content.media!.urls.length > 10) {
      throw new Error('Instagram carousel must contain 2-10 items');
    }

    // 1. Create media containers for each item
    const containerIds: string[] = [];
    for (const url of content.media!.urls) {
      const container = await this.fetchWithAuth<{ id: string }>(`${config.baseUrl}/${config.apiVersion}/${page.pageId}/media`, {
        method: 'POST',
        token: page.authToken,
        body: JSON.stringify({
          image_url: url,
          is_carousel_item: true,
          access_token: page.authToken
        })
      });
      containerIds.push(container.id);
    }

    // 2. Create carousel container
    const carouselContainer = await this.fetchWithAuth<{ id: string }>(`${config.baseUrl}/${config.apiVersion}/${page.pageId}/media`, {
      method: 'POST',
      token: page.authToken,
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: containerIds.join(','),
        caption: content.text,
        access_token: page.authToken
      })
    });

    // 3. Publish the carousel
    const published = await this.fetchWithAuth<{ id: string }>(`${config.baseUrl}/${config.apiVersion}/${page.pageId}/media_publish`, {
      method: 'POST',
      token: page.authToken,
      body: JSON.stringify({
        creation_id: carouselContainer.id,
        access_token: page.authToken
      })
    });

    return {
      id: published.id,
      pageId: page.id,
      postId: published.id,
      content: content.text,
      mediaUrls: content.media!.urls,
      status: 'published',
      publishedAt: new Date()
    };
  }

  async getPostHistory(page: SocialPage, limit = 20): Promise<PostHistory[]> {
    const response = await this.fetchWithAuth<{
      data: Array<{
        id: string;
        caption?: string;
        media_url: string;
        timestamp: string;
      }>;
    }>(`${config.baseUrl}/${config.apiVersion}/${page.pageId}/media`, {
      token: page.authToken,
      queryParams: {
        fields: 'id,caption,media_url,timestamp',
        limit: limit.toString()
      }
    });

    return response.data.map(post => ({
      id: post.id,
      pageId: page.id,
      postId: post.id,
      content: post.caption ?? '',
      mediaUrls: [post.media_url],
      status: 'published',
      publishedAt: new Date(post.timestamp)
    }));
  }

  async getPostAnalytics(page: SocialPage, postId: string): Promise<PostHistory['analytics']> {
    const response = await this.fetchWithAuth<{
      data: Array<{
        name: string;
        values: Array<{ value: number }>;
      }>;
    }>(`${config.baseUrl}/${config.apiVersion}/${postId}/insights`, {
      token: page.authToken,
      queryParams: {
        metric: 'impressions,reach,engagement,saved,likes,comments'
      }
    });

    const metrics = response.data.reduce((acc, metric) => {
      acc[metric.name] = metric.values[0].value;
      return acc;
    }, {} as Record<string, number>);

    return {
      reach: metrics.reach,
      engagement: metrics.engagement,
      likes: metrics.likes,
      comments: metrics.comments,
      metadata: {
        saved: metrics.saved,
        impressions: metrics.impressions
      }
    };
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
    try {
      await this.fetchWithAuth(
        `${config.baseUrl}/${config.apiVersion}/${page.pageId}`,
        { token: page.authToken }
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

/* helper fetch wrappers */
async function jsonGET(url: string, qs: Record<string, any>, soft = false) {
  const u = new URL(url); Object.entries(qs).forEach(([k, v]) => v != null && u.searchParams.set(k, String(v)));
  const j = await fetch(u).then(r => r.json()); if (!soft && j.error) throw new Error(j.error.message); return j;
}
async function jsonPOST(url: string, body: Record<string, any>) {
  const fd = new URLSearchParams(); Object.entries(body).forEach(([k, v]) => v != null && fd.append(k, String(v)));
  const j = await fetch(url, { method: "POST", body: fd }).then(r => r.json()); if (j.error) throw new Error(j.error.message); return j;
}
async function jsonDEL(url: string, qs: Record<string, any>) {
  const u = new URL(url); Object.entries(qs).forEach(([k, v]) => v != null && u.searchParams.set(k, String(v)));
  return fetch(u, { method: "DELETE" }).then(r => r.json());
}
  