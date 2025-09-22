/* ────────────────────────────────────────────────────────────
   lib/social/platforms/pinterest.ts      ◇ SERVER-ONLY DRIVER
   ──────────────────────────────────────────────────────────── */
   import { supabase } from '@/lib/supabase/client'
import type {
    PlatformOperations,
    SocialAccount,
    SocialPage,
    PostHistory,
    SocialPlatformConfig,
    PostContent,
    PublishOptions
  } from './platform-types'
  
  /* ––– basic toggle ––– */
  const DEBUG = true
  const log   = (...a: unknown[]) => DEBUG && console.log('[Pinterest]', ...a)
  
  /* static metadata */
  const cfg: SocialPlatformConfig = {
    name   : 'Pinterest',
    channel: 'pinterest',
    icon   : '/images/platforms/pinterest.svg',
    authUrl: 'https://www.pinterest.com/oauth/',
    scopes : [
      'boards:read', 'boards:write',
      'pins:read',   'pins:write',
      'user_accounts:read',
    ],
    apiVersion: 'v5',
    baseUrl   : process.env.PINTEREST_API_BASE || 'https://api.pinterest.com',
    features: {
      multipleAccounts: false,
      multiplePages: true, // boards
      scheduling: false,
      analytics: true,
      deletion: true,
      mediaTypes: ['image', 'video'],
      maxMediaCount: 1, // Pinterest only supports single media per pin
      characterLimits: {
        content: 500, // Pinterest description limit
        title: 100,  // Board title limit
      }
    },
    connectOptions: [
      {
        title: 'Add Pinterest Account',
        type: 'account',
        requiredScopes: ['boards:read', 'pins:write']
      }
    ]
  }
  
  const IS_BROWSER = typeof window !== 'undefined'
  
  /* helper – throws on non-2xx and prints details */
  async function pinFetch<T = any>(url: string, init?: RequestInit): Promise<T> {
    try {
      const r = await fetch(url, init)
      if (!r.ok) {
        const txt = await r.text()
        throw new Error(`${r.status} ${r.statusText} – ${txt}`)
      }
      return r.json() as Promise<T>
    } catch (e) {
      log('pinFetch error:', e)
      throw e
    }
  }
  
  /* ─────────────────────────────────────────────────────────── */
  export class PinterestPlatform implements PlatformOperations {
    private readonly baseUrl = 'https://api.pinterest.com/v5'
  
    constructor(
      private readonly clientId    : string,
      private readonly clientSecret: string,
      private readonly redirectUri : string,
    ){}
  
    /* 1 – consent URL (popup) */
    getAuthUrl() {
      // https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/#step-1-redirect-the-user-to-the-pinterest-oauth-page
      const u = new URL(cfg.authUrl);
      u.searchParams.set('client_id', this.clientId);
      u.searchParams.set('redirect_uri', this.redirectUri);
      u.searchParams.set('scope', cfg.scopes.join(','));
      u.searchParams.set('response_type', 'code');
      return u.toString();
    }
  
    /* 2 – code → tokens + profile */
    async connectAccount(code: string): Promise<SocialAccount> {

      // https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/#step-2-receive-the-authorization-code-with-your-redirect-uri
      const tok = await pinFetch<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        refresh_token_expires_in: number;
      }>(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });
  
      const me = await pinFetch<{ id: string; username: string }>(
        `${this.baseUrl}/user_account`,
        { headers: { Authorization: `Bearer ${tok.access_token}` } },
      );
        
      return {
        id: crypto.randomUUID(),
        platform: 'pinterest',
        name: me.username,
        accountId: me.id,
        authToken: tok.access_token,
        refreshToken: tok.refresh_token,
        refreshTokenExpiresAt: new Date(Date.now() + tok.refresh_token_expires_in * 1_000),
        accessTokenExpiresAt: new Date(Date.now() + tok.expires_in * 1_000),
        tokenIssuedAt: new Date(),
        connected: true,
        status: 'active',
        metadata: {},
      };
    }

  
    /* 3 – silent refresh */
    async refreshToken(acc: SocialAccount): Promise<SocialAccount> {

      // https://developers.pinterest.com/docs/api/v5/oauth-token
      const tok = await pinFetch<{ access_token: string; refresh_token: string; expires_in: number; refresh_token_expires_in: number }>(
        `${cfg.baseUrl}/v5/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: acc.refreshToken!,
        }),
      });
  
      return {
        ...acc, // Spread the existing account properties
        authToken: tok.access_token,
        refreshToken: tok.refresh_token,
        refreshTokenExpiresAt: new Date(Date.now() + tok.refresh_token_expires_in * 1_000),
        accessTokenExpiresAt: new Date(Date.now() + tok.expires_in * 1_000),
        tokenIssuedAt: new Date(),
        status: 'active', // Reset status on successful refresh
      };
    }
    async disconnectAccount(a: SocialAccount){ a.connected=false; a.status='disconnected' }
  
    /* 4 – Profile as Social Page */
    async listPages(acc: SocialAccount): Promise<SocialPage[]> {
      // Get user profile information
      // https://developers.pinterest.com/docs/api/v5/user_account-get
      const profile = await this.fetchJSON<{ 
        id: string; 
        username: string; 
        account_type: string;
        profile_image?: string;
        follower_count?: number;
        following_count?: number;
      }>(
        `${this.baseUrl}/user_account`,
        { headers: { Authorization: `Bearer ${acc.authToken || ''}` } }
      )
  
      // Return the profile as the social page (not boards)
      return [{
        id        : crypto.randomUUID(),
        platform  : 'pinterest',
        entityType: 'profile',
        name      : profile.username,
        pageId    : profile.id,
        authToken : acc.authToken || '',
        connected : true,
        status    : 'active',
        accountId : acc.id,
        statusUpdatedAt: new Date(),
        postCount: 0,
        followerCount: profile.follower_count || 0,
        metadata  : {
          account_type: profile.account_type,
          profile_image: profile.profile_image,
          following_count: profile.following_count
        }
      }]
    }

    async getToken(pageId: string): Promise<string> {

      // get token from database
      const { data, error } = await supabase
        .from('social_pages')
        .select('auth_token, auth_token_expires_at, account_id')
        .eq('id', pageId)
        .single();
    
      if (error) {
        throw new Error('Failed to get Pinterest token. Please reconnect your Pinterest account.');
      }

      // check if the token is expired
      const now = new Date();
      const expiresAt = data?.auth_token_expires_at ? new Date(data.auth_token_expires_at) : null;
      if (expiresAt && expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
        return data?.auth_token;
      }

      // refresh the token
      const refreshedToken = await this.refreshToken(data?.account_id);
      if (!refreshedToken?.authToken) {
        throw new Error('Failed to refresh Pinterest token. Please reconnect your Pinterest account.');
      }

      // update the token in the database
      await supabase
        .from('social_pages')
        .update({ auth_token: refreshedToken.authToken, auth_token_expires_at: refreshedToken.accessTokenExpiresAt })
        .eq('id', pageId);

      return refreshedToken.authToken;
    }
    


  
    /* connectPage = connect profile page */
    async connectPage(acc: SocialAccount, profile_id: string): Promise<SocialPage> {
      if (IS_BROWSER) {
        const res = await fetch('/api/social/pinterest/profile', {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({ token: acc.authToken || '', profile_id }),
        })
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      }
      
      if (!acc.authToken) {
        throw new Error('No auth token available');
      }
  
      // Get profile information
      const profile = await pinFetch<{ 
        id: string; 
        username: string; 
        account_type: string;
        profile_image?: string;
        follower_count?: number;
        following_count?: number;
      }>(
        `${this.baseUrl}/user_account`,
        { headers:{ Authorization:`Bearer ${acc.authToken || ''}` } },
      )
  
      return {
        id        : crypto.randomUUID(),
        platform  : 'pinterest',
        entityType: 'profile',
        name      : profile.username,
        pageId    : profile.id,
        authToken : acc.authToken || '',
        connected : true,
        status    : 'active',
        accountId : acc.id,
        statusUpdatedAt: new Date(),
        followerCount: profile.follower_count || 0,
        metadata  : {
          account_type: profile.account_type,
          profile_image: profile.profile_image,
          following_count: profile.following_count
        }
      }
    }
    
    async disconnectPage(p: SocialPage){ p.connected=false; p.status='disconnected' }
    async checkPageStatus(p: SocialPage){ return { ...p } }
  
    /* 5 – publish pin */
    async publishPost(
      page: SocialPage,
      content: PostContent,
      options?: PublishOptions
    ): Promise<PostHistory> {
      /* client-side ⇒ proxy route (bypass CORS) */
      if (IS_BROWSER) {
        const res = await fetch('/api/social/pinterest/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: page,
            post: {
              content: content.text,
              mediaUrls: content.media?.urls ?? []
            }
          })
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      }
  
      if (!content.media?.urls.length) {
        throw new Error('Pinterest requires at least one media URL');
      }

      // Get user's boards to find a board to pin to
      const boards = await pinFetch<{ items: { id: string; name: string }[] }>(
        `${this.baseUrl}/boards?page_size=1`,
        { headers: { Authorization: `Bearer ${page.authToken || ''}` } }
      );

      if (!boards.items.length) {
        throw new Error('No boards found. Please create a board on Pinterest first.');
      }

      // Use the first available board
      const boardId = boards.items[0].id;
  
      const pin = await pinFetch<{ id: string }>(`${this.baseUrl}/pins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${page.authToken || ''}`
        },
        body: JSON.stringify({
          board_id: boardId,
          media_source: {
            source_type: 'image_url',
            url: content.media.urls[0]
          },
          title: content.title,
          description: content.text
        })
      });
  
      return {
        id: pin.id,
        pageId: page.id,
        postId: pin.id,
        content: content.text,
        mediaUrls: content.media.urls,
        status: 'published',
        publishedAt: new Date(),
        analytics: {}
      };
    }
  
    /* 6 – latest pins from profile */
    async getPostHistory(profile: SocialPage, limit = 20): Promise<PostHistory[]> {
      if (IS_BROWSER) {
        const res = await fetch('/api/social/pinterest/history', {
          method :'POST',
          headers:{ 'Content-Type':'application/json' },
          body   : JSON.stringify({ profile, limit }),
        })
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      }
  
      // Get user's pins (not board-specific)
      const pins = await pinFetch<{
        items:{
          id:string; title:string; created_at:string;
          media?:{images?:Record<string,{url:string}>};
        }[]
      }>(
        `${this.baseUrl}/pins?page_size=${limit}`,
        { headers:{ Authorization:`Bearer ${profile.authToken || ''}` } },
      )
  
      return pins.items.map(p => {
        /* ------- pick the best available image URL ------------- */
        let url: string | undefined
        if (p.media?.images) {
          const imgs = p.media.images
          url = imgs.originals?.url       // preferred key
             ?? (imgs as any).original?.url // legacy spelling
             ?? Object.values(imgs)[0]?.url // fallback first size
        }
  
        return {
          id         : p.id,
          postId     : p.id,
          pageId     : profile.id,
          content    : p.title,
          mediaUrls  : url ? [url] : [],
          status     : 'published',
          publishedAt: new Date(p.created_at),
        }
      })
    }
  
    /* 7 – delete pin */
    async deletePost(profile: SocialPage, pinId: string) {
      if (IS_BROWSER) {
        const res = await fetch('/api/social/pinterest/delete', {
          method :'POST',
          headers:{ 'Content-Type':'application/json' },
          body   : JSON.stringify({ profile, pinId }),
        })
        if (!res.ok) throw new Error(await res.text())
        return
      }
  
      await pinFetch(
        `${this.baseUrl}/pins/${encodeURIComponent(pinId)}`, {
          method:'DELETE',
          headers:{ Authorization:`Bearer ${profile.authToken || ''}` },
        })
    }
  
    async getPostAnalytics(){ return {} } // not exposed in v5
  
    async createPost(
      page: SocialPage,
      content: PostContent,
    ): Promise<PostHistory> {
      return this.publishPost(page, content);
    }
  
    async schedulePost(
      page: SocialPage,
      content: PostContent,
      scheduledTime: Date
    ): Promise<PostHistory> {
      throw new Error('Pinterest does not support scheduling posts');
    }
  
    getPlatformFeatures() {
      return cfg.features;
    }
  
    validateContent(content: PostContent): { isValid: boolean; errors?: string[] } {
      const errors: string[] = [];
      const features = cfg.features;
  
      // Check text length
      if (content.text.length > features.characterLimits.content) {
        errors.push(`Text exceeds maximum length of ${features.characterLimits.content} characters`);
      }
  
      // Validate media
      if (!content.media || !content.media.urls.length) {
        errors.push('Pinterest requires at least one media item');
      } else if (content.media.urls.length > features.maxMediaCount) {
        errors.push(`Pinterest only supports ${features.maxMediaCount} media item per pin`);
      }
  
      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    }
  
    private async fetchJSON<T = any>(url: string, init: RequestInit = {}): Promise<T> {
      const response = await fetch(url, init);
      const data = await response.json();
      if (!response.ok) {
        // Use a more specific error here later
        throw new Error(data.message || 'Pinterest API error');
      }
      return data;
    }
  }
  