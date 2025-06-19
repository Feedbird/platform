/* ─────────────────────────────────────────────────────────────
   lib/social/platforms/linkedin.ts           ◇ SERVER-SIDE DRIVER
   Text-only  +  single-image posts (OIDC + UGC API)
   ──────────────────────────────────────────────────────────── */

   import { BasePlatform } from './base-platform';
   import type {
    SocialAccount,
    SocialPage,
    PostContent,
    PostHistory,
    PublishOptions,
    SocialPlatformConfig,
  } from "./platform-types";
  
  /* ─── toggle console noise ─── */
  const DEBUG = true;
  const log   = (...m: unknown[]) => DEBUG && console.log("[LinkedIn]", ...m);
  
  /* ─── static meta ─── */
  const config: SocialPlatformConfig = {
    name      : "LinkedIn",
    channel   : "linkedin",
    icon      : "/images/platforms/linkedin.svg",
    authUrl   : "https://www.linkedin.com/oauth/v2/authorization",
    scopes    : [
      "r_liteprofile",
      "r_organization_social",
      "rw_organization_admin",
      "w_member_social",
      "w_organization_social"
    ],
    apiVersion: "v2",
    baseUrl   : "https://api.linkedin.com",
    features: {
      multipleAccounts: false,
      multiplePages: true,
      scheduling: true,
      analytics: true,
      deletion: false,
      mediaTypes: ['image', 'video', 'carousel'],
      maxMediaCount: 9,
      characterLimits: {
        content: 3000,
        title: 200
      }
    },
    connectOptions: [
      {
        title: 'Add LinkedIn Personal Profile',
        type: 'profile',
        requiredScopes: ['r_liteprofile', 'w_member_social']
      },
      {
        title: 'Add LinkedIn Company Pages',
        type: 'organization',
        requiredScopes: ['r_organization_social', 'w_organization_social']
      }
    ]
  };
  
  /* endpoints */
  const TOKEN_URL    = "https://www.linkedin.com/oauth/v2/accessToken";
  const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
  
  const IS_BROWSER = typeof window !== "undefined";
  
  /* helper – prints body on 4xx/5xx */
  async function liFetch<T = any>(url: string, init: RequestInit = {}): Promise<T> {
    const r = await fetch(url, init);
    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`${r.status} ${r.statusText} – ${txt}`);
    }
    return r.json() as Promise<T>;
  }
  
  /*─────────────────────────────────────────────────────────────*/
  export class LinkedInPlatform extends BasePlatform {
    constructor(env: { clientId: string; clientSecret: string; redirectUri: string }) {
      super(config, env);
    }
  
    /* 1 ─ consent URL */
    getAuthUrl() {
      const u = new URL(config.authUrl);
      u.searchParams.set("response_type", "code");
      u.searchParams.set("client_id"    , this.env.clientId);
      u.searchParams.set("redirect_uri" , this.env.redirectUri);
      u.searchParams.set("scope"        , config.scopes.join(" "));
      u.searchParams.set("state"        , crypto.randomUUID());
      return u.toString();
    }
  
    /* 2 ─ code ➜ token ➜ OIDC profile */
    async connectAccount(code: string): Promise<SocialAccount> {
      // Exchange code for access token
      const tokenResponse = await this.fetchWithAuth<{
        access_token: string;
        expires_in: number;
      }>(`${config.baseUrl}/oauth/v2/accessToken`, {
        method: 'POST',
        token: '',
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          client_id: this.env.clientId,
          client_secret: this.env.clientSecret,
          redirect_uri: this.env.redirectUri
        })
      });
  
      // Get user info
      const userInfo = await this.fetchWithAuth<{
        id: string;
        localizedFirstName: string;
        localizedLastName: string;
      }>(`${config.baseUrl}/v2/me`, {
        token: tokenResponse.access_token
      });
  
      return {
        id        : crypto.randomUUID(),
        platform  : "linkedin",
        name      : `${userInfo.localizedFirstName} ${userInfo.localizedLastName}`,
        accountId : userInfo.id,
        authToken : tokenResponse.access_token,
        expiresAt : new Date(Date.now() + tokenResponse.expires_in * 1000),
        connected : true,
        status    : "active",
      };
    }
  
    async refreshToken(a: SocialAccount) { return a; }
    async disconnectAccount(a: SocialAccount) { a.connected = false; }
  
    /* one synthetic "Page" == the member profile */
    async listPages(acc: SocialAccount): Promise<SocialPage[]> {
      const pages: SocialPage[] = [];
  
      // Add personal profile
      const profile = await this.fetchWithAuth<{
        id: string;
        localizedFirstName: string;
        localizedLastName: string;
      }>(`${config.baseUrl}/v2/me`, {
        token: acc.authToken
      });
  
      pages.push({
        id         : crypto.randomUUID(),
        platform   : "linkedin",
        entityType : "profile",
        name       : `${profile.localizedFirstName} ${profile.localizedLastName}`,
        pageId     : `urn:li:person:${profile.id}`,
        authToken  : acc.authToken,
        connected  : true,
        status     : "active",
        accountId  : acc.id,
        statusUpdatedAt: new Date(),
      });
  
      // Get organization pages
      try {
        const orgs = await this.fetchWithAuth<{
          elements: Array<{
            organization: string; // URN
            organizationName: string;
            role: string;
            state: string;
          }>;
        }>(`${config.baseUrl}/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR`, {
          token: acc.authToken
        });
  
        // Get details for each organization
        for (const org of orgs.elements) {
          if (org.state === 'APPROVED' && org.role === 'ADMINISTRATOR') {
            const orgId = org.organization.split(':').pop();
            const orgDetails = await this.fetchWithAuth<{
              id: string;
              vanityName: string;
              localizedName: string;
              description?: string;
              followersCount?: number;
            }>(`${config.baseUrl}/v2/organizations/${orgId}`, {
              token: acc.authToken
            });
  
            pages.push({
              id         : crypto.randomUUID(),
              platform   : "linkedin",
              entityType : "organization",
              name       : orgDetails.localizedName,
              pageId     : org.organization,
              authToken  : acc.authToken,
              connected  : true,
              status     : "active",
              accountId  : acc.id,
              statusUpdatedAt: new Date(),
              followerCount: orgDetails.followersCount,
              metadata: {
                vanityName: orgDetails.vanityName,
                description: orgDetails.description
              }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching organization pages:', error);
      }
  
      return pages;
    }
    async connectPage(a: SocialAccount) { return (await this.listPages(a))[0]; }
    async disconnectPage(p: SocialPage) { p.connected = false; p.status = "expired"; }
    async checkPageStatus(p: SocialPage){ return { ...p }; }
  
    /* ──────────────────────────────────────────────────────────
       helper – upload ONE image, return asset URN
       ────────────────────────────────────────────────────────── */
    private async uploadImage(
      publicUrl: string,
      ownerUrn : string,
      token    : string,
    ): Promise<string> {
  
      /* 1 — register upload */
      const reg = await liFetch<{
        value: {
          asset           : string;
          uploadMechanism : any;
        };
      }>(
        `${config.baseUrl}/v2/assets?action=registerUpload`,
        {
          method : "POST",
          headers: {
            "Content-Type"              : "application/json",
            "X-Restli-Protocol-Version" : "2.0.0",
            Authorization               : `Bearer ${token}`,
          },
          body: JSON.stringify({
            registerUploadRequest: {
              owner                 : ownerUrn,
              recipes               : ["urn:li:digitalmediaRecipe:feedshare-image"],
              serviceRelationships  : [{
                relationshipType: "OWNER",
                identifier      : "urn:li:userGeneratedContent",
              }],
              supportedUploadMechanism: ["SYNCHRONOUS_UPLOAD"],
            },
          }),
        },
      );
  
      DEBUG && log("registerUpload →", JSON.stringify(reg, null, 2));
  
      /* LinkedIn sometimes returns an object, sometimes an array */
      const mech = Array.isArray(reg.value.uploadMechanism)
        ? reg.value.uploadMechanism[0]
        : reg.value.uploadMechanism;
  
      const uploadHttp = mech?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"];
      if (!uploadHttp?.uploadUrl) {
        throw new Error("LinkedIn: uploadUrl not found in registerUpload response");
      }
  
      /* 2 — fetch bytes from original URL & PUT to LinkedIn */
      const bytes = await fetch(publicUrl).then(r => r.arrayBuffer());
  
      await fetch(uploadHttp.uploadUrl, {
        method : "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body   : bytes,
      });
  
      /* 3 — done */
      return reg.value.asset;        // e.g. "urn:li:digitalmediaAsset:C4D00AAA..."
    }
  
    /* 4 — publish post (text or single image) */
    async publishPost(
      page: SocialPage,
      content: PostContent,
      options?: PublishOptions
    ): Promise<PostHistory> {
      if (IS_BROWSER) {
        const res = await fetch("/api/social/linkedin/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pg: page,
            post: {
              content: content.text,
              mediaUrls: content.media?.urls
            }
          })
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      }
  
      // Prepare the post data
      const postData: any = {
        author: page.pageId,
        lifecycleState: options?.scheduledTime ? "SCHEDULED" : "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: content.text
            },
            shareMediaCategory: content.media ? "IMAGE" : "NONE"
          }
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
      };
  
      // Handle scheduling
      if (options?.scheduledTime) {
        postData.scheduledTime = options.scheduledTime.getTime();
      }
  
      // Handle media
      if (content.media?.urls?.length) {
        const mediaAssets = await Promise.all(
          content.media.urls.map(url =>
            this.uploadImage(url, page.pageId, page.authToken)
          )
        );
  
        postData.specificContent["com.linkedin.ugc.ShareContent"].media = mediaAssets.map(id => ({
          status: "READY",
          media: id,
          title: { text: content.title || "" }
        }));
      }
  
      const response = await this.fetchWithAuth<{ id: string }>(
        `${config.baseUrl}/v2/ugcPosts`,
        {
          method: "POST",
          token: page.authToken,
          body: JSON.stringify(postData)
        }
      );
  
      return {
        id: response.id,
        pageId: page.id,
        postId: response.id,
        content: content.text,
        mediaUrls: content.media?.urls ?? [],
        status: options?.scheduledTime ? "scheduled" : "published",
        publishedAt: options?.scheduledTime ?? new Date(),
        analytics: {}
      };
    }
  
    /* 5 — optional history */
    async getPostHistory(pg: SocialPage, limit = 20): Promise<PostHistory[]> {
      const raw = await liFetch<{
        elements: { id: string; lastModified: { time: number }; specificContent: any; }[];
      }>(
        `${config.baseUrl}/v2/ugcPosts?q=authors` +
        `&authors=List(urn:li:person:${pg.pageId})` +
        `&sortBy=LAST_MODIFIED&count=${limit}`,
        { headers: { Authorization: `Bearer ${pg.authToken}` } },
      );
  
      return raw.elements.map(e => ({
        id         : e.id,
        postId     : e.id,
        pageId     : pg.id,
        content    : e.specificContent?.["com.linkedin.ugc.ShareContent"]
                       ?.shareCommentary?.text ?? "",
        mediaUrls  : [],
        status     : "published",
        publishedAt: new Date(e.lastModified.time),
      }));
    }
  
    async getPostAnalytics() { return {}; }
    async deletePost()       { /* not supported for member UGC */ }
  
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
      return config.features;
    }
  
    validateContent(content: PostContent): { isValid: boolean; errors?: string[] } {
      const errors: string[] = [];
      const features = config.features;
  
      // Check text length
      if (content.text.length > features.characterLimits.content) {
        errors.push(`Text exceeds maximum length of ${features.characterLimits.content} characters`);
      }
  
      // Validate media if present
      if (content.media) {
        if (!features.mediaTypes.includes(content.media.type)) {
          errors.push(`Media type '${content.media.type}' is not supported`);
        }
        if (content.media.urls.length > features.maxMediaCount) {
          errors.push(`Maximum of ${features.maxMediaCount} media items allowed`);
        }
      }
  
      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    }
  }
  