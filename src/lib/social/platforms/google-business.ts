/*──────────────────────────────────────────────────────────────
  Google Business Profile driver  ◇ "server-only"
  Uses *Account-Management* + *Business-Information* APIs.
──────────────────────────────────────────────────────────────*/
import type {
  PlatformOperations, SocialAccount, SocialPage,
  PostHistory, SocialPlatformConfig
} from "./platform-types";
import { BasePlatform } from './base-platform';
import type {
  PostContent,
  PublishOptions,
} from './platform-types';

/*── static meta ───────────────────────────────────────────────*/
const cfg: SocialPlatformConfig = {
  name   : "Google Business",
  channel: "google",
  icon   : "/images/platforms/google-business.svg",
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  scopes : [
    "https://www.googleapis.com/auth/business.manage"
  ],
  /* we need two base URLs – keep them separate */
  apiVersion      : "v1",
  baseUrl         : "https://mybusinessbusinessinformation.googleapis.com",
  baseUrlAccounts : "https://mybusinessaccountmanagement.googleapis.com",
  baseUrlInfo     : "https://mybusinessbusinessinformation.googleapis.com",
  features: {
    multipleAccounts: true,
    multiplePages: true, // locations
    scheduling: false,
    analytics: true,
    deletion: true,
    mediaTypes: ['image', 'video'],
    maxMediaCount: 10,
    characterLimits: {
      content: 1500,
      title: 100
    }
  },
  connectOptions: [
    {
      title: 'Add Google Business Location',
      type: 'location',
      requiredScopes: ['https://www.googleapis.com/auth/business.manage']
    }
  ]
} as const;

const TOKEN_URL  = "https://oauth2.googleapis.com/token";
const POST_URL   = "https://mybusiness.googleapis.com/v4";      // LocalPosts v4
const IS_BROWSER = typeof window !== "undefined";

/* helper that prints body on error */
async function gbFetch<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} – ${await r.text()}`);
  return r.json() as Promise<T>;
}

/*──────────────────────────────────────────────────────────────*/
export class GoogleBusinessPlatform extends BasePlatform {
  constructor(env: { clientId: string; clientSecret: string; redirectUri: string }) {
    super(cfg, env);
  }

  /* 1 ─ popup URL */
  getAuthUrl() {
    const u = new URL(cfg.authUrl);
    u.searchParams.set("response_type", "code");
    u.searchParams.set("client_id",     this.env.clientId);
    u.searchParams.set("redirect_uri",  this.env.redirectUri);
    u.searchParams.set("scope",         cfg.scopes.join(" "));
    u.searchParams.set("access_type",   "offline");  // refresh_token
    u.searchParams.set("prompt",        "consent");  // force refresh_token
    return u.toString();
  }

  /* 2 ─ code ➜ tokens ➜ first business-profile account */
  async connectAccount(code: string): Promise<SocialAccount> {
    // Exchange code for access token
    const tokenResponse = await this.fetchWithAuth<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>(TOKEN_URL, {
      method: 'POST',
      token: '',
      body: JSON.stringify({
        code,
        client_id: this.env.clientId,
        client_secret: this.env.clientSecret,
        redirect_uri: this.env.redirectUri,
        grant_type: 'authorization_code'
      })
    });
    // Get account info - extract only essential fields
    // https://developers.google.com/my-business/reference/accountmanagement/rest/v1/accounts/list
    const accountsResponse = await this.fetchWithAuth<{
      accounts: Array<{
        name: string;
        accountName: string;
        type: string;
        verificationState: string;
        role: string;
        permissionLevel: string;
      }>;
    }>(`${cfg.baseUrlAccounts}/v1/accounts`, {
      token: tokenResponse.access_token
    });

    const accountInfo = accountsResponse.accounts[0];
    
    return {
      id: crypto.randomUUID(),
      platform: 'google',
      name: accountInfo.accountName || '',
      accountId: accountInfo.name.split('/').pop()!,
      authToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      connected: true,
      status: accountInfo.verificationState === 'VERIFIED' ? 'active' : 'pending',
      metadata: {
        type: accountInfo.type,
        role: accountInfo.role,
        permissionLevel: accountInfo.permissionLevel,
        verificationState: accountInfo.verificationState
      }
    };
  }

  /* 3 ─ every verified LOCATION becomes one "page" with proper pagination */
  async listPages(acc: SocialAccount): Promise<SocialPage[]> {
    // Fetch all pages by implementing proper pagination
    let allPages: SocialPage[] = [];
    let nextPageToken: string | undefined;
    
    do {
      const result = await this.listPagesWithPagination(acc, 1, nextPageToken);
      allPages.push(...result.pages);
      nextPageToken = result.nextPage;
    } while (nextPageToken);
    
    return allPages;
  }

  /* Helper method for paginated location listing - can be used for progressive loading */
  async listPagesWithPagination(acc: SocialAccount, limit = 50, nextPage?: string): Promise<{pages: SocialPage[], nextPage?: string}> {
    // Build query parameters
    const queryParams = new URLSearchParams({
      pageSize: Math.min(limit, 100).toString(), // Max 100 per Google API
      // https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations#Location
      readMask: 'name,title,storeCode,phoneNumbers.primaryPhone,storefrontAddress,profile.description,metadata.mapsUri,metadata.newReviewUri,metadata.canOperateLocalPost,metadata.canDelete,metadata.placeId'
    });

    // Add pagination token if provided
    if (nextPage) {
      queryParams.set('pageToken', nextPage);
    }

    // https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations/list
    const response = await this.fetchWithAuth<{
      locations: Array<{
        name: string;
        title: string;
        storeCode?: string;
        phoneNumbers?: {
          primaryPhone?: string;
        };
        storefrontAddress?: {
          regionCode: string;
          languageCode: string;
          postalCode?: string;
          locality?: string;
          administrativeArea?: string;
          addressLines?: string[];
        };
        profile?: {
          description?: string;
        };
        metadata?: {
          mapsUri?: string;
          newReviewUri?: string;
          canOperateLocalPost?: boolean;
          canDelete?: boolean;
          placeId?: string;
        };
      }>;
      nextPageToken?: string;
      totalSize?: number;
    }>(`${cfg.baseUrl}/v1/accounts/${acc.accountId}/locations?${queryParams.toString()}`, {
      token: acc.authToken || ''
    });

    const pages: SocialPage[] = response.locations
      .filter(location => location.metadata?.placeId) // Only include locations with placeId
      .map(location => ({
        id: crypto.randomUUID(),
        platform: 'google' as const,
        entityType: 'page' as const,
        name: location.title,
        pageId: location.name.split('/').pop()!,
        authToken: acc.authToken || '',
        connected: true,
        status: 'active' as const, // Assume active if returned by API
        accountId: acc.id,
        statusUpdatedAt: new Date(),
        metadata: {
          storeCode: location.storeCode,
          phone: location.phoneNumbers?.primaryPhone,
          address: location.storefrontAddress,
          description: location.profile?.description,
          mapsUrl: location.metadata?.mapsUri,
          reviewUrl: location.metadata?.newReviewUri,
          canOperateLocalPost: location.metadata?.canOperateLocalPost,
          canDelete: location.metadata?.canDelete,
          placeId: location.metadata?.placeId
        }
      }));

    return {
      pages,
      nextPage: response.nextPageToken
    };
  }

  async connectPage(acc: SocialAccount, pageId: string): Promise<SocialPage> {
    const pages = await this.listPages(acc);
    const page = pages.find(p => p.pageId === pageId);
    if (!page) {
      throw new Error('Google Business location not found');
    }
    return page;
  }

  async disconnectPage(page: SocialPage): Promise<void> {
    page.connected = false;
    page.status = 'disconnected';
  }

  async disconnectAccount(acc: SocialAccount): Promise<void> {
    // Google Business API doesn't have a specific endpoint for revoking access
    // We just mark the account as disconnected locally
    acc.connected = false;
    acc.status = 'disconnected';
  }

  async createPost(
    page: SocialPage,
    content: PostContent
  ): Promise<PostHistory> {
    // For Google Business, createPost is the same as publishPost
    return this.publishPost(page, content);
  }

  async checkPageStatus(page: SocialPage): Promise<SocialPage> {
    try {
      const response = await this.fetchWithAuth<{
        state: {
          isVerified: boolean;
          isPublished: boolean;
        };
      }>(`${cfg.baseUrl}/v1/${page.pageId}`, {
        token: page.authToken || ''
      });

      return {
        ...page,
        status: response.state.isVerified ? 'active' : 'pending',
        statusUpdatedAt: new Date()
      };
    } catch {
      return { ...page, status: 'expired', statusUpdatedAt: new Date() };
    }
  }

  async refreshToken(acc: SocialAccount): Promise<SocialAccount> {
    if (!acc.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.fetchWithAuth<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>(TOKEN_URL, {
      method: 'POST',
      token: '',
      body: JSON.stringify({
        refresh_token: acc.refreshToken,
        client_id: this.env.clientId,
        client_secret: this.env.clientSecret,
        grant_type: 'refresh_token'
      })
    });

    return {
      ...acc,
      authToken: response.access_token,
      refreshToken: response.refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + response.expires_in * 1000)
    };
  }

  /* 4 ─ create "Local Post" */
  async publishPost(
    page: SocialPage,
    content: PostContent,
    options?: PublishOptions
  ): Promise<PostHistory> {
    const postData = {
      languageCode: "en-US",
      summary: content.text,
      callToAction: {
        actionType: "LEARN_MORE",
        url: content.link?.url
      },
      media: content.media ? content.media.urls.map(url => ({
        mediaFormat: content.media?.type === "video" ? "VIDEO" : "PHOTO",
        sourceUrl: url
      })) : undefined
    };

    const response = await this.fetchWithAuth<{ name: string }>(`${POST_URL}/${page.pageId}/localPosts`, {
      method: "POST",
      token: page.authToken || '',
      body: JSON.stringify(postData)
    });

    return {
      id: crypto.randomUUID(),
      pageId: page.id,
      postId: response.name,
      content: content.text,
      mediaUrls: content.media?.urls ?? [],
      status: "published",
      publishedAt: new Date(),
      analytics: {}
    };
  }

  /* 5 ─ fetch latest LocalPosts */
  async getPostHistory(pg: SocialPage, limit = 20): Promise<PostHistory[]> {
    const list = await gbFetch<{ localPosts?: any[] }>(
      `${POST_URL}/${pg.pageId}/localPosts?pageSize=${limit}`,
      { headers: { Authorization: `Bearer ${pg.authToken || ''}` } }
    );

    return (list.localPosts ?? []).map(lp => ({
      id         : lp.name.split("/").pop(),
      postId     : lp.name.split("/").pop(),
      pageId     : pg.id,
      content    : lp.summary ?? "",
      mediaUrls  : lp.media?.length ? [lp.media[0].sourceUrl] : [],
      status     : "published",
      publishedAt: new Date(lp.updateTime)
    }));
  }

  async getPostAnalytics() { return {}; }      // not exposed
  async deletePost()       { /* deletion not in API yet */ }
}

/* util */
function toYMD(d: Date) {
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}
