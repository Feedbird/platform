/*──────────────────────────────────────────────────────────────
  Google Business Profile driver  ◇ "server-only"
  Uses *Account-Management* + *Business-Information* APIs.
──────────────────────────────────────────────────────────────*/
import type {
  PlatformOperations, SocialAccount, SocialPage,
  PostHistory, PostHistoryResponse, PostStatus, SocialPlatformConfig
} from "./platform-types";
import { BasePlatform } from './base-platform';
import type {
  PostContent,
  PublishOptions,
} from './platform-types';
import { formatGoogleBusinessPostData } from '@/lib/utils/google-business-settings-mapper';
import { supabase } from '@/lib/supabase/client';
import { SocialAPIError } from '@/lib/utils/error-handler';
import { updatePlatformPostId } from '@/lib/utils/platform-post-ids';

/*── static meta ───────────────────────────────────────────────*/
const cfg: SocialPlatformConfig = {
  name   : "Google Business",
  channel: "google",
  icon   : "/images/platforms/google.svg",
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
    // https://developers.google.com/identity/protocols/oauth2/web-server#obtainingaccesstokens
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
    // https://developers.google.com/identity/protocols/oauth2/web-server#handlingresponse
    // https://developers.google.com/identity/protocols/oauth2/web-server#exchange-authorization-code
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

    if(!response.locations || response.locations.length === 0) {
      throw new SocialAPIError('No Google Business locations found for account', 'API_ERROR');
    }

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
    content: PostContent,
    options?: PublishOptions
  ): Promise<PostHistory> {
    try {
      // Validate content
      if (!content.text || content.text.trim().length === 0) {
        throw new SocialAPIError('Post content cannot be empty', 'VALIDATION_ERROR');
      }

      if (content.text.length > cfg.features.characterLimits.content) {
        throw new SocialAPIError(`Content exceeds maximum length of ${cfg.features.characterLimits.content} characters`, 'VALIDATION_ERROR');
      }

      // For Google Business, createPost is the same as publishPost
      return await this.publishPost(page, content, options);
    } catch (error) {
      if (error instanceof SocialAPIError) {
        throw error;
      }
      throw new SocialAPIError(`Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`, 'API_ERROR');
    }
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

  async refreshToken(acc: any): Promise<SocialAccount> {

    if (!acc.refresh_token) {
      throw new Error('No refresh token available');
    }

    // Use simple fetch with www-form-urlencoded data for refresh token access
    // https://developers.google.com/identity/protocols/oauth2/web-server#offline
    const params = new URLSearchParams({
      refresh_token: acc.refresh_token,
      client_id: this.env.clientId,
      client_secret: this.env.clientSecret,
      grant_type: 'refresh_token'
    });

    const fetchResp = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    }).catch(error => {
      console.log('error', error);
      throw new Error('Failed to refresh token');
    });

    if (!fetchResp.ok) {
      throw new SocialAPIError(`Failed to refresh token: ${fetchResp.statusText}`, 'TOKEN_ERROR');
    }

    const response = await fetchResp.json();

    // update the acc with the new token in the supabase table
    await supabase.from('social_accounts').update({
      auth_token: response.access_token,
      refresh_token: response.refresh_token,
      access_token_expires_at: new Date(Date.now() + response.expires_in * 1000)
    }).eq('id', acc.id);


    return {
      ...acc,
      authToken: response.access_token,
      refreshToken: response.refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + response.expires_in * 1000)
    };
  }

  // Secure token fetching method with automatic refresh
  async getToken(pageId: string): Promise<string> {
    const { data, error } = await supabase
      .from('social_pages')
      .select('account_id, auth_token, auth_token_expires_at, account:social_accounts(refresh_token, access_token_expires_at)')
      .eq('id', pageId)
      .single();

    if (error) {
      throw new SocialAPIError('Failed to get Google Business token. Please reconnect your account.', 'TOKEN_ERROR');
    }

    if (!data?.auth_token) {
      throw new SocialAPIError('No auth token available', 'TOKEN_ERROR');
    }

    // Check if token needs refresh (5 minutes buffer)
    const now = new Date();
    const expiresAt = data.auth_token_expires_at ? new Date(data.auth_token_expires_at) : null;
    
    if (expiresAt && expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
      return data.auth_token;
    }

    // Token needs refresh - get account data and refresh
    const accountData = Array.isArray(data.account) ? data.account[0] : data.account;
    if (!accountData?.refresh_token) {
      throw new SocialAPIError('No refresh token available. Please reconnect your account.', 'TOKEN_ERROR');
    }

    try {
      const refreshedAccount = await this.refreshToken(accountData);
      return refreshedAccount.authToken || '';
      
    } catch (error) {
      throw new SocialAPIError('Failed to refresh token. Please reconnect your account.', 'TOKEN_REFRESH_ERROR');
    }
  }

  /* 4 ─ create "Local Post" */
  async publishPost(
    page: SocialPage,
    content: PostContent,
    options?: PublishOptions
  ): Promise<PostHistory> {
    // Prevent browser calls - route to API endpoint (like Facebook)
    if (IS_BROWSER) {
      const res = await fetch('/api/social/google/publish', {
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

    // Validate media constraints if present
    if (content.media && content.media.urls.length > 0) {
      // Validate single photo constraint
      if (content.media.urls.length > 1) {
        throw new SocialAPIError('Google Business Profile only supports single photo posts', 'MEDIA_LIMIT_EXCEEDED');
      }
      
      if (content.media.type !== 'image') {
        throw new SocialAPIError('Google Business Profile only supports image posts, not videos', 'UNSUPPORTED_MEDIA_TYPE');
      }
    }

    // Get secure token from database with automatic refresh
    const token = await this.getToken(page.id);

    if (!token) {
      throw new SocialAPIError('Failed to get Google Business token. Please reconnect your account.', 'TOKEN_ERROR');
    }

    // Get the location ID from page metadata
    const locationId = page.pageId;
    if (!locationId) {
      throw new SocialAPIError('Location ID not found. Please reconnect your Google Business account.', 'LOCATION_ERROR');
    }

    // Get account ID from page
    const { data: pageData } = await supabase
      .from('social_accounts')
      .select('account_id')
      .eq('id', page.accountId)
      .single();

    if (!pageData?.account_id) {
      throw new SocialAPIError('Account ID not found', 'ACCOUNT_ERROR');
    }

    // Build post data using Google Business settings if available
    let postData: any;
    
    // Check if we have Google Business settings in the options
    const googleSettings = options?.settings?.google;
    
    if (googleSettings) {
      // Use settings-based approach
      postData = formatGoogleBusinessPostData(content, googleSettings);
    } else {
      // Fallback to legacy approach for backward compatibility
      postData = {
        languageCode: "en-US",
        summary: content.text,
        topicType: "STANDARD"
      };

      // Add media if present
      if (content.media && content.media.urls.length > 0) {
        postData.media = [
          {
            mediaFormat: "PHOTO",
            sourceUrl: content.media.urls[0]
          }
        ];
      }

      // Add call to action if link is provided
      if (content.link?.url) {
        postData.callToAction = {
          actionType: "LEARN_MORE",
          url: content.link.url
        };
      }
    }

    // https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts#LocalPost
    const responseRaw = await fetch(
      `${POST_URL}/accounts/${pageData.account_id}/locations/${locationId}/localPosts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      }
    );

    if (!responseRaw.ok) {
      const responseError = await responseRaw.json();
      const errorText = (responseError?.error?.details[0]?.errorDetails && responseError?.error?.details[0]?.errorDetails[0]?.message) || responseError?.error?.message || 'Unknown error';
      throw new SocialAPIError(`Failed to publish post: ${errorText}`, 'POST_ERROR');
    }
    const response = await responseRaw.json();

    // Save the published post ID to the platform_post_ids column
    try {
      console.log('Saving Google Business post ID:', response.name);
      await updatePlatformPostId(content.id!, 'google', response.name, page.id);
    } catch (error) {
      console.warn('Failed to save Google Business post ID:', error);
      // Don't fail the publish if saving the ID fails
    }

    return {
      id: crypto.randomUUID(),
      pageId: page.id,
      postId: response.name,
      content: content.text,
      mediaUrls: content.media?.urls || [],
      status: "published",
      publishedAt: new Date(),
      analytics: {
        views: 0,
        engagement: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
        reach: 0,
        metadata: {
          platform: 'google',
          postId: response.name,
          locationId: locationId,
          lastUpdated: new Date().toISOString()
        }
      }
    };
  }

  /* 5 ─ fetch latest LocalPosts with pagination */
  async getPostHistory(pg: SocialPage, limit = 20, nextPage?: string | number | null | undefined): Promise<PostHistoryResponse<PostHistory>> {
    // Prevent browser calls - route to API endpoint (same pattern as other platforms)
    if (IS_BROWSER) {
      const res = await fetch('/api/social/google/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pg,
          limit,
          ...(nextPage && { nextPage }),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    try {
      // Get secure token from database
      const token = await this.getToken(pg.id);
      if (!token) {
        throw new Error('No auth token available');
      }

      // Build query parameters for pagination
      const queryParams = new URLSearchParams({
        pageSize: limit.toString(),
        ...(nextPage && { pageToken: nextPage.toString() })
      });

      // find account id from page
      const { data: pageData } = await supabase
        .from('social_accounts')
        .select('account_id')
        .eq('id', pg.accountId)
        .single();

      if (!pageData?.account_id) {
        throw new SocialAPIError('Account ID not found', 'ACCOUNT_ERROR');
      }


      // https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts/list
      const response = await gbFetch<{
        localPosts?: Array<{
          name: string;
          languageCode: string;
          summary: string;
          callToAction?: {
            actionType: string;
            url: string;
          };
          createTime: string;
          updateTime: string;
          event?: {
            title: string;
            schedule?: {
              startDate?: { year: number; month: number; day: number };
              startTime?: { hours: number; minutes: number; seconds?: number; nanos?: number };
              endDate?: { year: number; month: number; day: number };
              endTime?: { hours: number; minutes: number; seconds?: number; nanos?: number };
            };
          };
          state: string;
          media?: Array<{
            sourceUrl: string;
          }>;
          searchUrl?: string;
          topicType: string;
          offer?: {
            couponCode?: string;
            redeemOnlineUrl?: string;
            termsConditions?: string;
          };
        }>;
        nextPageToken?: string;
      }>(`${POST_URL}/accounts/${pageData.account_id}/locations/${pg.pageId}/localPosts?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const posts = (response.localPosts ?? []).map(lp => this.mapGoogleBusinessPostToHistory(lp, pg.id));

      return { 
        posts, 
        nextPage: response.nextPageToken || undefined 
      };
    } catch (error) {
      this.handleApiError(error, 'get post history');
    }
  }

  /**
   * Maps Google Business LocalPost to PostHistory format
   */
  private mapGoogleBusinessPostToHistory(localPost: any, pageId: string): PostHistory {
    const postId = localPost.name.split("/").pop();
    return {
      id: postId,
      postId: postId,
      pageId: pageId,
      content: localPost.summary || "",
      mediaUrls: localPost.media?.length ? localPost.media.map((m: any) => m.googleUrl) : [],
      status: this.mapGoogleBusinessStateToStatus(localPost.state),
      publishedAt: new Date(localPost.updateTime || localPost.createTime),
      analytics: {
        // Google Business doesn't provide detailed analytics in the basic API
        metadata: {
          platform: 'google',
          mediaTypes: localPost.media?.length ? localPost.media.map((m: any) => m.mediaFormat) : [],
          topicType: localPost.topicType,
          languageCode: localPost.languageCode,
          searchUrl: localPost.searchUrl,
          event: localPost.event,
          offer: localPost.offer,
          callToAction: localPost.callToAction
        }
      }
    };
  }

  /**
   * Maps Google Business post state to our status format
   */
  private mapGoogleBusinessStateToStatus(state: string): PostStatus {
    switch (state) {
      case 'LIVE':
        return 'published';
      case 'PROCESSING':
        return 'scheduled';
      case 'REJECTED':
        return 'failed';
      default:
        return 'draft';
    }
  }

  async getPostAnalytics() { return {}; }      // not exposed

  /* 6 ─ delete a Local Post */
  async deletePost(page: SocialPage, postId: string): Promise<any> {
    // Prevent browser calls - route to API endpoint
    if (IS_BROWSER) {
      const res = await fetch('/api/social/google/delete', {
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

    // Get account ID from page
    const { data: pageData } = await supabase
      .from('social_accounts')
      .select('account_id')
      .eq('id', page.accountId)
      .single();

    if (!pageData?.account_id) {
      throw new SocialAPIError('Account ID not found', 'ACCOUNT_ERROR');
    }

    // Get the location ID from page metadata
    const locationId = page.pageId;
    if (!locationId) {
      throw new SocialAPIError('Location ID not found. Please reconnect your Google Business account.', 'LOCATION_ERROR');
    }

    // https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts/delete
    const response = await fetch(
      `${POST_URL}/accounts/${pageData.account_id}/locations/${locationId}/localPosts/${postId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const responseError = await response.json();
      const errorText = (responseError?.error?.details[0]?.errorDetails && responseError?.error?.details[0]?.errorDetails[0]?.message) || responseError?.error?.message || 'Unknown error';
      throw new SocialAPIError(`Failed to delete post: ${errorText}`, 'DELETE_ERROR');
    }

    return { success: true };
  }
}
