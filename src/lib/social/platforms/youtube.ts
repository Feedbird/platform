/* ─────────────────────────────────────────────────────────────
   YouTube driver – upload video + basic snippet (no DB needed)
   ─────────────────────────────────────────────────────────── */

   import type {
    PlatformOperations, SocialAccount, SocialPage,
    PostHistory, SocialPlatformConfig, PostContent, PublishOptions
  } from "./platform-types";
  
  /* —— static meta —— */
  const cfg: SocialPlatformConfig = {
    name   : "YouTube",
    channel: "youtube",
    icon   : "/images/platforms/youtube.svg",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes : [
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
    apiVersion: "v3",
    baseUrl   : "https://www.googleapis.com/youtube/v3",
    features: {
      multipleAccounts: false,
      multiplePages: true, // channels
      scheduling: true,
      analytics: true,
      deletion: true,
      mediaTypes: ['video'],
      maxMediaCount: 1,
      characterLimits: {
        content: 5000, // description limit
        title: 100
      }
    },
    connectOptions: [
      {
        title: 'Add YouTube Channel',
        type: 'channel',
        requiredScopes: ['https://www.googleapis.com/auth/youtube']
      }
    ]
  };
  
  const TOKEN_URL = "https://oauth2.googleapis.com/token";
  const IS_BROWSER = typeof window !== "undefined";
  
  /* —— helper —— */
  async function ytFetch<T = any>(url: string, init: RequestInit = {}): Promise<T> {
    const r = await fetch(url, init);
    if (!r.ok) throw new Error(`${r.status} ${r.statusText} – ${await r.text()}`);
    return r.json() as Promise<T>;
  }
  
  /* ─────────────────────────────────────────────────────────── */
  export class YouTubePlatform implements PlatformOperations {
    constructor(
      private clientId    : string,
      private clientSecret: string,
      private redirectUri : string,
    ) {}
  
    /* 1 ─ popup */
    getAuthUrl() {
      const u = new URL(cfg.authUrl);
      u.searchParams.set("response_type", "code");
      u.searchParams.set("client_id",      this.clientId);
      u.searchParams.set("redirect_uri",   this.redirectUri);
      u.searchParams.set("scope",          cfg.scopes.join(" "));
      u.searchParams.set("access_type",    "offline");
      u.searchParams.set("include_granted_scopes", "true");
      u.searchParams.set("state", crypto.randomUUID());
      return u.toString();
    }
  
    /* 2 ─ code → tokens → my channel */
    async connectAccount(code: string): Promise<SocialAccount> {
      const tok = await ytFetch<{
        access_token : string;
        refresh_token: string;
        expires_in   : number;
      }>(TOKEN_URL, {
        method : "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body   : new URLSearchParams({
          grant_type   : "authorization_code",
          code,
          redirect_uri : this.redirectUri,
          client_id    : this.clientId,
          client_secret: this.clientSecret,
        }),
      });
  
      const ch = await ytFetch<{
        items: { id: string; snippet: { title: string } }[];
      }>(
        `${cfg.baseUrl}/channels?part=snippet&mine=true`,
        { headers: { Authorization: `Bearer ${tok.access_token}` } },
      );
      if (!ch.items?.[0]) throw new Error("No YouTube channel on this account");
  
      return {
        id         : crypto.randomUUID(),
        platform   : "youtube",
        name       : ch.items[0].snippet.title,
        accountId  : ch.items[0].id,
        authToken  : tok.access_token,
        refreshToken: tok.refresh_token,
        accessTokenExpiresAt  : new Date(Date.now() + tok.expires_in * 1_000),
        connected  : true,
        status     : "active",
      };
    }
  
    /* 3 ─ silent refresh */
    async refreshToken(acc: SocialAccount) {
      if (!acc.refreshToken) return acc;
      const tok = await ytFetch<{ access_token: string; expires_in: number }>(
        TOKEN_URL, {
          method : "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body   : new URLSearchParams({
            grant_type   : "refresh_token",
            refresh_token: acc.refreshToken,
            client_id    : this.clientId,
            client_secret: this.clientSecret,
          }),
        });
      return { ...acc,
        authToken: tok.access_token,
        accessTokenExpiresAt: new Date(Date.now() + tok.expires_in * 1_000),
      };
    }
    async disconnectAccount(a: SocialAccount){ a.connected = false; }
  
    /* 4 ─ one synthetic "page" == the channel  */
    async listPages(acc: SocialAccount): Promise<SocialPage[]> {
      return [{
        id        : crypto.randomUUID(),
        platform  : "youtube",
        entityType: "channel",
        name      : acc.name,
        pageId    : acc.accountId,
        authToken : acc.authToken || '',
        connected : true,
        status    : "active",
        accountId : acc.id,
        statusUpdatedAt: new Date(),
      }];
    }
    async connectPage(a: SocialAccount)           { return (await this.listPages(a))[0]; }
    async disconnectPage(p: SocialPage)           { p.connected = false; p.status = "expired"; }
    async checkPageStatus(p: SocialPage)          { return { ...p }; }
  
    /* 5 ─ upload video */
    async publishPost(
      page: SocialPage,
      content: PostContent
    ): Promise<PostHistory> {
      console.log("publishPost", page, content);
      /* —— browser side: call the server route —— */
      if (IS_BROWSER) {
        const res = await fetch("/api/social/youtube/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page,
            post: {
              content: content.text,
              mediaUrls: content.media?.urls
            }
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      }
  
      if (!content.media?.urls[0]) {
        throw new Error("YouTube API needs a video file URL.");
      }
  
      /* a) pull raw bytes */
      const bytes = await fetch(content.media.urls[0]).then(r => r.arrayBuffer());
  
      /* b) multipart via FormData (boundary handled automatically) */
      const form = new FormData();
      form.append("snippet", new Blob([JSON.stringify({
        snippet: {
          title: content.title?.slice(0, 100) || content.text.slice(0, 100) || "Untitled",
          description: content.text,
        },
        status: { privacyStatus: "private" },
      })], { type: "application/json" }));
      form.append("video", new Blob([bytes], { type: "video/*" }));
  
      /* c) upload */
      const vid = await ytFetch<{ id: string }>(
        "https://www.googleapis.com/upload/youtube/v3/videos" +
        "?part=snippet,status&uploadType=multipart",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${page.authToken || ''}` },
          body: form,
        });
  
      return {
        id: vid.id,
        pageId: page.id,
        postId: vid.id,
        content: content.text,
        mediaUrls: content.media.urls,
        status: "published",
        publishedAt: new Date(),
        analytics: {}
      };
    }
  
    /* optional stubs */
    async getPostHistory(pg: SocialPage, limit = 20): Promise<PostHistory[]> {
        /* ① discover "uploads" playlist once per hot-reload */
        if (!(globalThis as any)._yt_uploads) {
          const ch = await ytFetch<{
            items: { contentDetails: { relatedPlaylists: { uploads: string } } }[];
          }>(
            `${cfg.baseUrl}/channels?part=contentDetails&id=${pg.pageId}`,
            { headers: { Authorization: `Bearer ${pg.authToken || ''}` } },
          );
          (globalThis as any)._yt_uploads =
            ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        }
        const uploads = (globalThis as any)._yt_uploads;
        if (!uploads) return [];
      
        /* ② fetch latest videos from that playlist */
        const vids = await ytFetch<{
          items: {
            id: string;
            snippet: {
              title: string;
              publishedAt: string;
              /** present when part=snippet — TS just didn't know about it */
              resourceId?: { videoId: string };
            };
          }[];
        }>(
          `${cfg.baseUrl}/playlistItems` +
          `?part=snippet&playlistId=${uploads}&maxResults=${limit}`,
          { headers: { Authorization: `Bearer ${pg.authToken || ''}` } },
        );
      
        return vids.items.map(v => ({
          id         : v.id,
          postId     : v.id,
          pageId     : pg.id,
          content    : v.snippet.title,
          mediaUrls  : [
            `https://www.youtube.com/watch?v=${
              v.snippet.resourceId?.videoId ?? v.id
            }`,
          ],
          status     : "published",
          publishedAt: new Date(v.snippet.publishedAt),
        }));
    }
    async getPostAnalytics(){ return {}; }
    async deletePost() {}

    async createPost(
      page: SocialPage,
      content: PostContent
    ): Promise<PostHistory> {
      return this.publishPost(page, content);
    }

    async schedulePost(
      page: SocialPage,
      content: PostContent,
      scheduledTime: Date
    ): Promise<PostHistory> {
      throw new Error('YouTube scheduling is not implemented yet');
    }

    getPlatformFeatures() {
      return cfg.features;
    }

    validateContent(content: PostContent): { isValid: boolean; errors?: string[] } {
      const errors: string[] = [];
      const features = cfg.features;

      // Check text length (used as description)
      if (content.text.length > features.characterLimits.content) {
        errors.push(`Description exceeds maximum length of ${features.characterLimits.content} characters`);
      }

      // Check title length if provided
      if (content.title && features.characterLimits.title && content.title.length > features.characterLimits.title) {
        errors.push(`Title exceeds maximum length of ${features.characterLimits.title} characters`);
      }

      // Validate media
      if (!content.media || !content.media.urls.length) {
        errors.push('YouTube requires a video file');
      } else if (content.media.type !== 'video') {
        errors.push('Only video media type is supported');
      } else if (content.media.urls.length > features.maxMediaCount) {
        errors.push(`YouTube only supports ${features.maxMediaCount} video per post`);
      }

      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    }
  }
  