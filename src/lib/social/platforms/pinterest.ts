/* ────────────────────────────────────────────────────────────
   lib/social/platforms/pinterest.ts      ◇ SERVER-ONLY DRIVER
   ──────────────────────────────────────────────────────────── */
   import { supabase } from '@/lib/supabase/client'
import { updatePlatformPostId } from '@/lib/utils/platform-post-ids'
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
  // https://developers.pinterest.com/docs/work-with-organic-content-and-users/create-boards-and-pins/
  const cfg: SocialPlatformConfig = {
    name   : 'Pinterest',
    channel: 'pinterest',
    icon   : '/images/platforms/pinterest.svg',
    authUrl: 'https://www.pinterest.com/oauth/',
    // https://developers.pinterest.com/apps/1520535/
    scopes : [
      'boards:read', 'boards:write',
      'pins:read',   'pins:write',
      'user_accounts:read',
      'boards:read_secret',
      'pins:read_secret',
      'boards:write_secret',
      'pins:write_secret'
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
    async refreshToken(acc: any): Promise<SocialAccount> {

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
          refresh_token: acc.refresh_token!,
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

      // fetch the account from the database
      const {data: account, error: accountError} = await supabase
        .from('social_accounts')
        .select('*')
        .eq('id', data?.account_id)
        .single();
        
      if (accountError) {
        throw new Error('Failed to get account');
      }
      // refresh the token
      const refreshedToken = await this.refreshToken(account as any);
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

    /* 4 – get user's boards with pagination */
    async getBoards(page: SocialPage): Promise<{ id: string; name: string; description?: string; privacy: string }[]> {
      if (IS_BROWSER) {
        const res = await fetch('/api/social/pinterest/boards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.boards;
      }

      try {
        const token = await this.getToken(page.id);
        if (!token) {
          throw new Error('No auth token available');
        }

        // Fetch all boards using pagination
        const allBoards: any[] = [];
        let bookmark: string | null = null;
        const pageSize = 250; // Maximum page size allowed by Pinterest
        let pageCount = 0;
        const maxPages = 50; // Safety limit to prevent infinite loops

        do {
          // Safety check to prevent infinite loops
          if (pageCount >= maxPages) {
            console.warn(`Reached maximum page limit (${maxPages}). Stopping pagination.`);
            break;  
          }

          // Build URL with pagination parameters
          let url = `${this.baseUrl}/boards?page_size=${pageSize}`;
          if (bookmark) {
            url += `&bookmark=${encodeURIComponent(bookmark)}`;
          }

          console.log(`Fetching Pinterest boards page ${pageCount + 1} with bookmark: ${bookmark || 'none'}`);

          const response = await pinFetch<{ 
            items: { 
              id: string; 
              name: string; 
              description?: string;
              privacy: 'PUBLIC' | 'PRIVATE' | 'SECRET';
              pin_count?: number;
              follower_count?: number;
            }[];
            bookmark: string | null;
          }>(
            url,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Validate response structure
          if (!response.items || !Array.isArray(response.items)) {
            console.error('Invalid response structure from Pinterest API:', response);
            throw new Error('Invalid response structure from Pinterest API');
          }

          // Add items from this page to our collection
          allBoards.push(...response.items);
          
          // Update bookmark for next iteration
          bookmark = response.bookmark;
          pageCount++;
          
          console.log(`Fetched ${response.items.length} boards on page ${pageCount}, total so far: ${allBoards.length}, bookmark: ${bookmark}`);

          // Small delay between requests to be respectful to Pinterest's API
          if (bookmark !== null) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } while (bookmark !== null);

        console.log(`Finished fetching Pinterest boards. Total boards: ${allBoards.length}`);

        return allBoards.map(board => ({
          id: board.id,
          name: board.name,
          description: board.description,
          privacy: board.privacy,
          pin_count: board.pin_count,
          follower_count: board.follower_count
        }));
        
      } catch (error) {
        console.error('Pinterest getBoards error:', error);
        throw error;
      }
    }
  
    /* 5 – publish pin */
    async publishPost(
      page: SocialPage,
      content: PostContent,
      options?: PublishOptions
    ): Promise<PostHistory> {
      // Prevent browser calls - route to API endpoint (like Facebook)
      if (IS_BROWSER) {
        const res = await fetch('/api/social/pinterest/publish', {
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
        // Get secure token from database (like Facebook)
        const token = await this.getToken(page.id);
        if (!token) {
          throw new Error('No auth token available');
        }

        // Validate that a board is selected (required for Pinterest)
        if (!options?.settings?.pinterest?.boardId) {
          throw new Error('Pinterest requires a board to be selected. Please select a board in the settings.');
        }

        // Validate content
        if (!content.media?.urls.length) {
          throw new Error('Pinterest requires at least one media URL');
        }


        // Determine media type and route accordingly (like Facebook)
        const mediaUrls = content.media?.urls || [];
        const mediaType = content.media?.type;

        let postedResponse : any = null;

        // 1. Single image post
        if (mediaType === 'image' && mediaUrls.length === 1) {
          postedResponse = await this.publishImagePin(page, content, token, options);
        }

        // 2. Single video post
        if (mediaType === 'video' && mediaUrls.length === 1) {
          postedResponse = await this.publishVideoPin(page, content, token, options);
        }

        // 3. Multiple images (Pinterest supports multiple images in a single pin)
        if ((mediaType === 'image' || mediaType === 'carousel') && mediaUrls.length > 1) {
          postedResponse = await this.publishMultiImagePin(page, content, token, options);
        }

        if(!postedResponse) {
          throw new Error('Unsupported media configuration for Pinterest');
        }

        // save the post id to the database
        try {
          console.log('Saving Pinterest post ID:', postedResponse.id);
          await updatePlatformPostId(content.id!, 'pinterest', postedResponse.id, page.id);
        } catch (error) {
          console.warn('Failed to save Pinterest post ID:', error);
          // Don't fail the publish if saving the ID fails
        }

        return postedResponse;
        
      } catch (error) {
        throw error;
      }
    }

    // 1. Single image pin
    private async publishImagePin(
      page: SocialPage,
      content: PostContent,
      token: string,
      options?: PublishOptions
    ): Promise<PostHistory> {
      // Board ID is now compulsory and validated at the top level
      const boardId = options?.settings?.pinterest?.boardId!;
  
      // https://developers.pinterest.com/docs/api/v5/pins-create
      const pin = await pinFetch<{ id: string }>(`${this.baseUrl}/pins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          board_id: boardId,
          media_source: {
            source_type: 'image_url',
            url: content.media!.urls[0]
          },
          title: 'Pin' + new Date().getTime(),
          description: content.text
        })
      });
      
  
      return {
        id: pin.id,
        pageId: page.id,
        postId: pin.id,
        publishId: pin.id,
        content: content.text,
        mediaUrls: content.media!.urls,
        status: 'published' as any,
        publishedAt: new Date()
      };
    }

    // 2. Single video pin
    private async publishVideoPin(
      page: SocialPage,
      content: PostContent,
      token: string,
      options?: PublishOptions
    ): Promise<PostHistory> {
      // Board ID is now compulsory and validated at the top level
      const boardId = options?.settings?.pinterest?.boardId!;
      
      // Step 1: Register media upload for video
      // https://developers.pinterest.com/docs/api/v5/media-create
      const mediaUpload = await pinFetch<{
        media_id: string;
        media_type: string;
        upload_parameters: Record<string, string>;
        upload_url: string;
      }>(`${this.baseUrl}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          media_type: 'video'
        })
      });

      // Step 2: Upload video to Pinterest's S3 bucket
      // https://developers.pinterest.com/docs/work-with-organic-content-and-users/create-boards-and-pins/#creating-video-pins
      const videoUrl = content.media!.urls[0];
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error('Failed to fetch video from URL');
      }
      const videoBuffer = await videoResponse.arrayBuffer();

      // Upload to Pinterest's S3 bucket
      const formData = new FormData();
      
      // Add all upload parameters as form fields (not headers)
      Object.entries(mediaUpload.upload_parameters).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Add the video file
      formData.append('file', new Blob([videoBuffer]), 'video.mp4');
      
      const uploadResponse = await fetch(mediaUpload.upload_url, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video to Pinterest');
      }

      // Step 3: Confirm upload status
      let uploadStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 30; // Maximum 10 attempts (10 seconds)
      
      while (uploadStatus !== 'succeeded' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await pinFetch<{
          status: string;
          media_id: string;
          media_type: string;
        }>(`${this.baseUrl}/media/${mediaUpload.media_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        uploadStatus = statusResponse.status;
        attempts++;
        
        console.log(`Upload status check ${attempts}: ${uploadStatus}`);
      }
      
      if (uploadStatus !== 'succeeded') {
        throw new Error(`Video upload failed. Status: ${uploadStatus} after ${attempts} attempts`);
      }

      // Step 4: Create pin with media_id
      // https://developers.pinterest.com/docs/api/v5/pins-create
      const pin = await pinFetch<{ id: string }>(`${this.baseUrl}/pins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          board_id: boardId,
          media_source: {
            source_type: 'video_id',
            media_id: mediaUpload.media_id,
            cover_image_key_frame_time: 1.0 // Extract frame at 1 second as cover image
          },
          title: 'Pin' + new Date().getTime(),
          description: content.text
        })
      });
  
      return {
        id: pin.id,
        pageId: page.id,
        postId: pin.id,
        publishId: pin.id,
        content: content.text,
        mediaUrls: content.media!.urls,
        status: 'published' as any,
        publishedAt: new Date()
      };
    }

    // 3. Multiple images pin (Pinterest supports multiple images in a single pin)
    private async publishMultiImagePin(
      page: SocialPage,
      content: PostContent,
      token: string,
      options?: PublishOptions
    ): Promise<PostHistory> {
      // Board ID is now compulsory and validated at the top level
      const boardId = options?.settings?.pinterest?.boardId!;
     
  
      // Pinterest supports multiple images using multiple_image_urls
      // https://developers.pinterest.com/docs/api/v5/pins-create
      const pin = await pinFetch<{ id: string }>(`${this.baseUrl}/pins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          board_id: boardId,
          media_source: {
            source_type: 'multiple_image_urls',
            items: content.media!.urls.map((url, index) => ({
              url: url
            }))
          },
          title: 'Pin' + new Date().getTime(),
          description: content.text
        })
      });
  
      return {
        id: pin.id,
        pageId: page.id,
        postId: pin.id,
        publishId: pin.id,
        content: content.text,
        mediaUrls: content.media!.urls,
        status: 'published' as any,
        publishedAt: new Date()
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
  