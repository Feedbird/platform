/* ────────────────────────────────────────────────────────────
   lib/social/platforms/pinterest.ts      ◇ SERVER-ONLY DRIVER
   ──────────────────────────────────────────────────────────── */
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
    constructor(
      private clientId    : string,
      private clientSecret: string,
      private redirectUri : string,
    ){}
  
    /* 1 – consent URL (popup) */
    getAuthUrl() {
      const u = new URL(cfg.authUrl)
      u.searchParams.set('client_id',     this.clientId)
      u.searchParams.set('redirect_uri',  this.redirectUri)
      u.searchParams.set('scope',         cfg.scopes.join(','))
      u.searchParams.set('response_type', 'code')
      u.searchParams.set('state',         crypto.randomUUID())
      return u.toString()
    }
  
    /* 2 – code → tokens + profile */
    async connectAccount(code: string): Promise<SocialAccount> {
      try {
        const tok = await pinFetch<{
          access_token : string; refresh_token: string; expires_in: number;
        }>(`${cfg.baseUrl}/v5/oauth/token`, {
          method : 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization :
              'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
          },
          body: new URLSearchParams({
            grant_type   : 'authorization_code',
            code,
            redirect_uri : this.redirectUri,
            client_id    : this.clientId,
            client_secret: this.clientSecret,
          }),
        })
  
        const me = await pinFetch<{ id: string; username: string }>(
          `${cfg.baseUrl}/v5/user_account`,
          { headers:{ Authorization:`Bearer ${tok.access_token}` } },
        )
  
        return {
          id         : crypto.randomUUID(),
          platform   : 'pinterest',
          name       : me.username,
          accountId  : me.id,
          authToken  : tok.access_token,
          refreshToken: tok.refresh_token,
          expiresAt  : new Date(Date.now() + tok.expires_in*1_000),
          connected  : true,
          status     : 'active',
          metadata   : {}
        }
      } catch (e) { log('connectAccount error', e); throw e }
    }
  
    /* 3 – silent refresh */
    async refreshToken(acc: SocialAccount): Promise<SocialAccount> {
      if (!acc.refreshToken) {
        throw new Error('No refresh token available')
      }
  
      const tok = await pinFetch<{ access_token:string; refresh_token:string; expires_in:number }>(
        `${cfg.baseUrl}/v5/oauth/token`, {
          method : 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization :
              'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
          },
          body: new URLSearchParams({
            grant_type   : 'refresh_token',
            refresh_token: acc.refreshToken,
            client_id    : this.clientId,
            client_secret: this.clientSecret,
          }),
        })
      return { ...acc,
        authToken: tok.access_token,
        refreshToken: tok.refresh_token,
        expiresAt: new Date(Date.now()+tok.expires_in*1_000),
      }
    }
    async disconnectAccount(a: SocialAccount){ a.connected=false; a.status='disconnected' }
  
    /* 4 – Boards ⇄ Pages */
    async listPages(acc: SocialAccount): Promise<SocialPage[]> {
      const boards = await pinFetch<{ items:{id:string;name:string;description?:string;privacy:string;pin_count?:number;follower_count?:number;created_at:string}[] }>(
        `${cfg.baseUrl}/v5/boards`,
        { headers:{ Authorization:`Bearer ${acc.authToken}` } },
      )
  
      return boards.items.map(b => ({
        id        : crypto.randomUUID(),
        platform  : 'pinterest',
        entityType: 'board',
        name      : b.name,
        pageId    : b.id,
        authToken : acc.authToken,
        connected : true,
        status    : 'active',
        accountId : acc.id,
        statusUpdatedAt:new Date(),
        postCount: b.pin_count,
        followerCount: b.follower_count,
        metadata  : {
          description: b.description,
          privacy: b.privacy,
          createdAt: b.created_at
        }
      }))
    }
  
    /* connectPage = instant client-side move */
    async connectPage(acc: SocialAccount, boardId: string): Promise<SocialPage> {
      if (IS_BROWSER) {
        const res = await fetch('/api/social/pinterest/board', {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({ token: acc.authToken, boardId }),
        })
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      }
  
      const b = await pinFetch<{ id:string; name:string }>(
        `${cfg.baseUrl}/v5/boards/${encodeURIComponent(boardId)}`,
        { headers:{ Authorization:`Bearer ${acc.authToken}` } },
      )
  
      return {
        id        : crypto.randomUUID(),
        platform  : 'pinterest',
        entityType: 'board',
        name      : b.name,
        pageId    : b.id,
        authToken : acc.authToken,
        connected : true,
        status    : 'active',
        accountId : acc.id,
        statusUpdatedAt: new Date(),
      }
    }
    async disconnectPage(p: SocialPage){ p.connected=false; p.status='disconnected' }
    async checkPageStatus(p: SocialPage){ return { ...p } }
  
    /* 5 – publish pin */
    async publishPost(
      board: SocialPage,
      content: PostContent,
      options?: PublishOptions
    ): Promise<PostHistory> {
      /* client-side ⇒ proxy route (bypass CORS) */
      if (IS_BROWSER) {
        const res = await fetch('/api/social/pinterest/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            board,
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
  
      const pin = await pinFetch<{ id: string }>(`${cfg.baseUrl}/v5/pins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${board.authToken}`
        },
        body: JSON.stringify({
          board_id: board.pageId,
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
        pageId: board.id,
        postId: pin.id,
        content: content.text,
        mediaUrls: content.media.urls,
        status: 'published',
        publishedAt: new Date(),
        analytics: {}
      };
    }
  
    /* 6 – latest pins on a board */
    async getPostHistory(board: SocialPage, limit = 20): Promise<PostHistory[]> {
      if (IS_BROWSER) {
        const res = await fetch('/api/social/pinterest/history', {
          method :'POST',
          headers:{ 'Content-Type':'application/json' },
          body   : JSON.stringify({ board, limit }),
        })
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      }
  
      const pins = await pinFetch<{
        items:{
          id:string; title:string; created_at:string;
          media?:{images?:Record<string,{url:string}>};
        }[]
      }>(
        `${cfg.baseUrl}/v5/boards/${encodeURIComponent(board.pageId)}/pins?page_size=${limit}`,
        { headers:{ Authorization:`Bearer ${board.authToken}` } },
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
          pageId     : board.id,
          content    : p.title,
          mediaUrls  : url ? [url] : [],
          status     : 'published',
          publishedAt: new Date(p.created_at),
        }
      })
    }
  
    /* 7 – delete pin */
    async deletePost(board: SocialPage, pinId: string) {
      if (IS_BROWSER) {
        const res = await fetch('/api/social/pinterest/delete', {
          method :'POST',
          headers:{ 'Content-Type':'application/json' },
          body   : JSON.stringify({ board, pinId }),
        })
        if (!res.ok) throw new Error(await res.text())
        return
      }
  
      await pinFetch(
        `${cfg.baseUrl}/v5/pins/${encodeURIComponent(pinId)}`, {
          method:'DELETE',
          headers:{ Authorization:`Bearer ${board.authToken}` },
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
  }
  