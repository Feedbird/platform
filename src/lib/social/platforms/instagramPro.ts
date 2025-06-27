import type {
    PlatformOperations, SocialAccount, SocialPage,
    PostHistory, SocialPlatformConfig, PostContent, PublishOptions
  } from "./platform-types";
  
  const cfg: SocialPlatformConfig = {
    name: "Instagram (Direct)",
    channel: "instagram",
    icon: "/images/platforms/instagram.svg",
    authUrl: "https://www.instagram.com/oauth/authorize",
    scopes: ["instagram_basic", "instagram_content_publish", "instagram_manage_comments"],
    apiVersion: "v19.0",
    baseUrl: "https://graph.facebook.com",
    features: {
      multipleAccounts: true,
      multiplePages: true,
      scheduling: true,
      analytics: true,
      deletion: true,
      mediaTypes: ['image', 'video', 'carousel'],
      maxMediaCount: 10,
      characterLimits: {
        content: 2200, // Instagram caption limit
        title: 0 // Instagram doesn't use titles
      }
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
        title: 'Add Instagram Account',
        type: 'profile',
        requiredScopes: ['instagram_basic', 'instagram_content_publish']
      }
    ]
  };
  
  type Env = { clientId: string; clientSecret: string; redirectUri: string };
  
  export class InstagramProPlatform implements PlatformOperations {
    constructor(private env: Env) {}
  
    /* 1 ── build the instagram.com OAuth URL */
    getAuthUrl(): string {
      const p = new URLSearchParams({
        client_id: this.env.clientId,
        redirect_uri: this.env.redirectUri,
        response_type: "code",
        scope: cfg.scopes.join(" "),        // SPACE-separated!
        state: crypto.randomUUID(),
      });
      return `${cfg.authUrl}?${p.toString()}`;
    }
  
    /* 2 ── code → profile access-token (short-lived, upgradable to 60 d) */
    async connectAccount(code: string): Promise<SocialAccount> {
      const token = await jsonPOST(
        `${cfg.baseUrl}/${cfg.apiVersion}/ig_oauth/access_token`,
        {
          client_id: this.env.clientId,
          client_secret: this.env.clientSecret,
          grant_type: "authorization_code",
          redirect_uri: this.env.redirectUri,
          code,
        },
      );
  
      /* Upgrade to 60-day long-lived token */
      const long = await jsonGET(
        `${cfg.baseUrl}/${cfg.apiVersion}/refresh_access_token`,
        {
          grant_type: "ig_refresh_token",
          access_token: token.access_token,
        },
      );
  
      const me = await jsonGET(
        `${cfg.baseUrl}/${cfg.apiVersion}/${token.user_id}`,
        { fields: "username", access_token: long.access_token },
      );
  
      return {
        id: crypto.randomUUID(),
        platform: cfg.channel,
        name: me.username,
        accountId: token.user_id,
        authToken: long.access_token,
        expiresAt: new Date(Date.now() + long.expires_in * 1000),
        connected: true,
        status: "active",
      };
    }
  
    async refreshToken(a: SocialAccount): Promise<SocialAccount> {
      const r = await jsonGET(`${cfg.baseUrl}/${cfg.apiVersion}/refresh_access_token`, {
        grant_type: "ig_refresh_token",
        access_token: a.authToken,
      });
      return { ...a, authToken: r.access_token,
               expiresAt: new Date(Date.now() + r.expires_in * 1000) };
    }
    async disconnectAccount(a: SocialAccount) { a.connected = false; a.status = "disconnected"; }
  
    /* 3 ── one synthetic "page" = IG profile */
    async listPages(a: SocialAccount): Promise<SocialPage[]> {
      return [{
        id: crypto.randomUUID(),
        platform: cfg.channel,
        entityType: "profile",
        name: a.name,
        pageId: a.accountId,
        authToken: a.authToken,
        connected: true,
        status: "active",
        accountId: a.id,
      }];
    }
    async connectPage(a: SocialAccount, _id: string) { return (await this.listPages(a))[0]; }
    async disconnectPage(p: SocialPage) { p.connected = false; p.status = "expired"; }
    async checkPageStatus(p: SocialPage) { return { ...p }; }
  
    /* 4 ── publishing helpers identical to previous answer ---------------- */
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
      return this.publishPost(page, content, { scheduledTime });
    }
  
    getPlatformFeatures() {
      return cfg.features;
    }
  
    validateContent(content: PostContent): { isValid: boolean; errors?: string[] } {
      const errors: string[] = [];
      const features = cfg.features;
  
      // Check text length
      if (content.text.length > features.characterLimits.content) {
        errors.push(`Caption exceeds maximum length of ${features.characterLimits.content} characters`);
      }
  
      // Validate media
      if (!content.media || !content.media.urls.length) {
        errors.push('Instagram requires at least one media item');
      } else if (!features.mediaTypes.includes(content.media.type)) {
        errors.push(`Media type '${content.media.type}' is not supported`);
      } else if (content.media.urls.length > features.maxMediaCount) {
        errors.push(`Maximum of ${features.maxMediaCount} media items allowed`);
      }
  
      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    }
  
    async publishPost(
      page: SocialPage,
      content: PostContent,
      options?: PublishOptions
    ): Promise<PostHistory> {
      return !content.media?.urls.length || content.media.urls.length === 1
        ? this.single(page, {
            content: content.text,
            mediaUrls: content.media?.urls,
            scheduledTime: options?.scheduledTime
          })
        : this.carousel(page, {
            content: content.text,
            mediaUrls: content.media.urls,
            scheduledTime: options?.scheduledTime
          });
    }
  
    private async single(pg: SocialPage, p: any): Promise<PostHistory> {
      const url = p.mediaUrls?.[0] ?? "";
      const isVid = /\.(mp4|mov|m4v)$/i.test(url);
      const cont = await jsonPOST(`${cfg.baseUrl}/${cfg.apiVersion}/${pg.pageId}/media`, {
        [isVid ? "video_url" : "image_url"]: url,
        caption: p.content,
        media_type: isVid ? "VIDEO" : undefined,
        access_token: pg.authToken,
      });
      const pub = await jsonPOST(`${cfg.baseUrl}/${cfg.apiVersion}/${pg.pageId}/media_publish`, {
        creation_id: cont.id,
        publish_at: p.scheduledTime
          ? Math.floor(p.scheduledTime.getTime() / 1000) : undefined,
        access_token: pg.authToken,
      });
      return {
        id: pub.id, pageId: pg.id, postId: pub.id,
        content: p.content, mediaUrls: p.mediaUrls ?? [],
        status: p.scheduledTime ? "scheduled" : "published",
        publishedAt: p.scheduledTime ?? new Date(),
      };
    }
  
    private async carousel(pg: SocialPage, p: any): Promise<PostHistory> {
      if (p.mediaUrls.length < 2 || p.mediaUrls.length > 10) {
        throw new Error("Carousel must contain 2–10 images.");
      }
      const kids: string[] = [];
      for (const img of p.mediaUrls) {
        const c = await jsonPOST(`${cfg.baseUrl}/${cfg.apiVersion}/${pg.pageId}/media`, {
          image_url: img, is_carousel_item: true, access_token: pg.authToken,
        });
        kids.push(c.id);
      }
      const parent = await jsonPOST(`${cfg.baseUrl}/${cfg.apiVersion}/${pg.pageId}/media`, {
        caption: p.content, children: kids.join(","), media_type: "CAROUSEL",
        access_token: pg.authToken,
      });
      const pub = await jsonPOST(`${cfg.baseUrl}/${cfg.apiVersion}/${pg.pageId}/media_publish`, {
        creation_id: parent.id,
        publish_at: p.scheduledTime
          ? Math.floor(p.scheduledTime.getTime() / 1000) : undefined,
        access_token: pg.authToken,
      });
      return {
        id: pub.id, pageId: pg.id, postId: pub.id,
        content: p.content, mediaUrls: p.mediaUrls,
        status: p.scheduledTime ? "scheduled" : "published",
        publishedAt: p.scheduledTime ?? new Date(),
      };
    }
  
    /* 5 ── history / insights identical to previous answer ---------------- */
    async getPostHistory(pg: SocialPage, limit = 20) {
      const r = await jsonGET(`${cfg.baseUrl}/${cfg.apiVersion}/${pg.pageId}/media`, {
        fields: "id,caption,media_url,timestamp",
        limit,
        access_token: pg.authToken,
      });
      return r.data.map((m: any): PostHistory => ({
        id: m.id, pageId: pg.id, postId: m.id,
        content: m.caption ?? "", mediaUrls: [m.media_url],
        status: "published", publishedAt: new Date(m.timestamp),
      }));
    }
    async getPostAnalytics(pg: SocialPage, postId: string) {
      const r = await jsonGET(`${cfg.baseUrl}/${cfg.apiVersion}/${postId}/insights`, {
        metric: "impressions,reach,engagement,likes,comments",
        access_token: pg.authToken,
      });
      const o: any = {}; for (const m of r.data) o[m.name] = m.values[0].value;
      return { reach: o.reach, likes: o.likes, comments: o.comments };
    }
    async deletePost(pg: SocialPage, postId: string) {
      const { success } = await jsonDEL(`${cfg.baseUrl}/${cfg.apiVersion}/${postId}`, {
        access_token: pg.authToken,
      });
      if (!success) throw new Error("Delete failed");
    }
  }
  
  /* tiny helpers */
  async function jsonGET(url: string, qs: Record<string, any>, soft = false) {
    const u = new URL(url); Object.entries(qs).forEach(([k, v]) => v != null && u.searchParams.set(k, String(v)));
    const j = await fetch(u).then(r => r.json());
    if (!soft && j.error) throw new Error(j.error.message);
    return j;
  }
  async function jsonPOST(url: string, body: Record<string, any>) {
    const fd = new URLSearchParams(); Object.entries(body).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    const j = await fetch(url, { method: "POST", body: fd }).then(r => r.json());
    if (j.error) throw new Error(j.error.message);
    return j;
  }
  async function jsonDEL(url: string, qs: Record<string, any>) {
    const u = new URL(url); Object.entries(qs).forEach(([k, v]) => v != null && u.searchParams.set(k, String(v)));
    return fetch(u, { method: "DELETE" }).then(r => r.json());
  }
  