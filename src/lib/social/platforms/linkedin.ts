/* ─────────────────────────────────────────────────────────────
   lib/social/platforms/linkedin.ts           ◇ SERVER-SIDE DRIVER
   Text, single image, multiple images, and video posts (OIDC + UGC API)
   ──────────────────────────────────────────────────────────── */

import { supabase } from '@/lib/supabase/client';
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
// https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
const config: SocialPlatformConfig = {
  name      : "LinkedIn",
  channel   : "linkedin",
  icon      : "/images/platforms/linkedin.svg",
  authUrl   : "https://www.linkedin.com/oauth/v2/authorization",
  scopes    : [
    "r_member_postAnalytics", "r_organization_followers",
    "r_organization_social", "rw_organization_admin", "r_organization_social_feed", "w_member_social", "r_member_profileAnalytics", "w_organization_social", "r_basicprofile","w_organization_social_feed","w_member_social_feed", "r_1st_connections_size"
  ],
  apiVersion: "v2",
  baseUrl   : "https://api.linkedin.com",
  features: {
    multipleAccounts: true,
    multiplePages: true,
    scheduling: true,
    analytics: true,
    deletion: true,
    mediaTypes: ["image", "video"],
    maxMediaCount: 9, // 1 for video, 9 for images
    characterLimits: {
      content: 3000,
    },
  },
  mediaConstraints: {
    image: {
      maxWidth: 1200,
      maxHeight: 1200,
      aspectRatios: ["1:1", "1.91:1"],
      maxSizeMb: 8,
      formats: ["jpg", "png"],
    },
    video: {
      maxWidth: 4096,
      maxHeight: 2304,
      aspectRatios: ["16:9", "1:1", "9:16", "4:5"],
      maxSizeMb: 200,
      minDurationSec: 3,
      maxDurationSec: 600, // 10 minutes
      maxFps: 60,
      formats: ["mp4", "mov"],
      audio: {
        codecs: ["aac", "mp3"], // mpeg4 audio is mp3
      },
      video: {
        codecs: ["h264"],
      },
    },
  },
  connectOptions: [
    {
      title: 'Add LinkedIn Personal Profile',
      type: 'profile',
      requiredScopes: ['w_member_social', 'r_basicprofile']
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
const USERINFO_URL = "https://api.linkedin.com/v2/me";

const IS_BROWSER = typeof window !== "undefined";

/*─────────────────────────────────────────────────────────────*/
export class LinkedInPlatform extends BasePlatform {
  constructor(env: { clientId: string; clientSecret: string; redirectUri: string }) {
    super(config, env);
  }

  /* 1 ─ consent URL */
  // https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin#api-request
  getAuthUrl() {
    const u = new URL(config.authUrl);
    u.searchParams.set("response_type", "code");
    u.searchParams.set("client_id"    , this.env.clientId);
    u.searchParams.set("redirect_uri" , this.env.redirectUri);
    u.searchParams.set("scope"        , config.scopes.join(" "));
    return u.toString();
  }

  /* 2 ─ code ➜ token ➜ OIDC profile */
  async connectAccount(code: string): Promise<SocialAccount> {
    // 1. Exchange authorization code for an access token.
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.env.redirectUri,
        client_id: this.env.clientId,
        client_secret: this.env.clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText} – ${errorText}`);
    }

    const tokenData = await tokenResponse.json() as {
      access_token: string;
      expires_in: number;
      refresh_token: string;
      scope: string;
      refresh_expires_in: number;
    };

    // 2. Get user info from the OIDC userinfo endpoint.
    const userInfoResponse = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      throw new Error(`User info fetch failed: ${userInfoResponse.status} ${userInfoResponse.statusText} – ${errorText}`);
    }

    const userInfo = await userInfoResponse.json() as {
      id: string;
      localizedFirstName: string;
      localizedLastName: string;
      profilePicture: {
        displayImage: string;
      },
      vanityName: string;
      firstName: {
        localized: { [key: string]: string };
        preferredLocale: { country: string; language: string };
      };
      lastName: {
        localized: { [key: string]: string };
        preferredLocale: { country: string; language: string };
      };
      headline: {
        localized: { [key: string]: string };
        preferredLocale: { country: string; language: string };
      };
      localizedHeadline: string;
    };


    let metadata = userInfo as any
    // Fetch connection size if we have a valid token
      try {
        const connectionSize = await this.getConnectionSize(userInfo.id, tokenData.access_token);
        metadata.connectionSize = connectionSize;
      } catch (error) {
        console.warn('[LinkedIn] Could not fetch connection size:', error);
        // Continue without connection size
      }
    
    return {
      id: crypto.randomUUID(),
      platform: "linkedin",
      name: userInfo.localizedFirstName + " " + userInfo.localizedLastName,
      accountId: userInfo.id,
      authToken: tokenData.access_token,
      accessTokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      refreshToken: tokenData.refresh_token,
      refreshTokenExpiresAt: new Date(Date.now() + tokenData.refresh_expires_in * 1000),
      metadata,
      connected: true,
      status: "active",
    };
  }

  async refreshToken(a: SocialAccount) { return a; }
  async disconnectAccount(a: SocialAccount) { a.connected = false; }

  /* one synthetic "Page" == the member profile */
  async listPages(acc: SocialAccount): Promise<SocialPage[]> {
    const pages: SocialPage[] = [];

    // Add personal profile directly from the SocialAccount object.
    pages.push({
      id         : crypto.randomUUID(),
      platform   : "linkedin",
      entityType : "profile",
      name       : acc.name,
      pageId     : `urn:li:person:${acc.accountId}`, // Construct the URN from the ID
      authToken  : acc.authToken || '',
      connected  : true,
      status     : "active",
      accountId  : acc.id,
      statusUpdatedAt: new Date(),
      metadata: acc.metadata || {},
    });
      try {

        // https://learn.microsoft.com/en-us/linkedin/marketing/community-management/organizations/organization-access-control-by-role?view=li-lms-2025-08&tabs=http#sample-request
        let allOrgs: Array<{
          roleAssignee: string;
          state: string;
          organizationalTarget: string;
          role: string;
        }> = [];
        
        let start = 0;
        const count = 20;
        let hasMore = true;

        // Fetch all organizations with pagination
        while (hasMore) {
          const orgsResponse = await this.fetchWithAuth<{
            elements: Array<{
              roleAssignee: string;
              state: string;
              organizationalTarget: string;
              role: string;
            }>;
            paging: {
              count: number;
              start: number;
              links?: Array<{
                type: string;
                rel: string;
                href: string;
              }>;
            };
          }>(`${config.baseUrl}/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=${count}&start=${start}`, {
            token: acc.authToken || ''
          });

          allOrgs = allOrgs.concat(orgsResponse.elements);

          // Check if there are more pages
          hasMore = orgsResponse.paging.links?.some(link => link.rel === 'next') || false;
          start += count;
        }

        // Get details for each organization
        for (const org of allOrgs) {
          if (org.state === 'APPROVED' && org.role === 'ADMINISTRATOR') {
            const orgId = org.organizationalTarget.split(':').pop();
            const orgDetails = await this.fetchWithAuth<{
              vanityName: string;
              localizedName: string;
              groups: any[];
              versionTag: string;
              organizationType: string;
              defaultLocale: { country: string; language: string };
              alternativeNames: any[];
              specialties: any[];
              staffCountRange: string;
              localizedSpecialties: any[];
              industries: string[];
              name: {
                localized: { [key: string]: string };
                preferredLocale: { country: string; language: string };
              };
              primaryOrganizationType: string;
              locations: any[];
              id: number;
              '$URN': string;
              logoV2: {
                cropped: string;
                original: string;
                cropInfo: { x: number; width: number; y: number; height: number };
              };
            }>(`${config.baseUrl}/v2/organizations/${orgId}`, {
              token: acc.authToken || ''
            });

                        // Fetch follower count for the organization
            let followerCount = 0;
            try {
              followerCount = await this.getOrganizationFollowerCount(org.organizationalTarget, acc.authToken || '');
            } catch (error) {
              console.warn('[LinkedIn] Could not fetch follower count for organization:', orgDetails.localizedName, error);
            }

            pages.push({
              id         : crypto.randomUUID(),
              platform   : "linkedin",
              entityType : "organization",
              name       : orgDetails.localizedName,
              pageId     : org.organizationalTarget,
              authToken  : acc.authToken || '',
              connected  : true,
              status     : "active",
              accountId  : org.roleAssignee,
              statusUpdatedAt: new Date(),
              metadata: {
                ...orgDetails,
                followerCount
              }
            });
          }
        }
      } catch (error) {
        console.error(error);
      }

    return pages;
  }

  async connectPage(a: SocialAccount) { return (await this.listPages(a))[0]; }
  async disconnectPage(p: SocialPage) { p.connected = false; p.status = "expired"; }
  async checkPageStatus(p: SocialPage){ return { ...p }; }

  /* ──────────────────────────────────────────────────────────
     helper – fetch person's connection size
     @url https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/connections-size
     ────────────────────────────────────────────────────────── */
  async getConnectionSize(personId: string, token: string): Promise<number> {
    try {
      const response = await this.fetchWithAuth<{
        firstDegreeSize: number;
      }>(
        `${config.baseUrl}/v2/connections/urn:li:person:${personId}`,
        {
          method: "GET",
          token: token
        }
      );

      return response.firstDegreeSize;
    } catch (error) {
      console.error('[LinkedIn] Failed to fetch connection size:', error);
      // Return 0 if we can't fetch the connection size
      return 0;
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – fetch detailed organization follower statistics (for analytics)
     @url https://learn.microsoft.com/en-us/linkedin/marketing/community-management/organizations/follower-statistics?view=li-lms-2025-07&tabs=curl
     ────────────────────────────────────────────────────────── */
  async getOrganizationFollowerStats(
    organizationUrn: string, 
    token: string, 
    options?: {
      timeRange?: {
        start: number; // milliseconds since epoch
        end?: number;  // milliseconds since epoch (optional)
      };
      timeGranularityType?: 'DAY' | 'WEEK' | 'MONTH';
    }
  ): Promise<{
    followerGains?: Array<{
      timeRange: { start: number; end: number };
      organicFollowerGain: number;
      paidFollowerGain: number;
    }>;
    demographics?: {
      byCountry?: Array<{ geo: string; count: number }>;
      byIndustry?: Array<{ industry: string; count: number }>;
      byFunction?: Array<{ function: string; count: number }>;
      bySeniority?: Array<{ seniority: string; count: number }>;
      byStaffCount?: Array<{ staffCountRange: string; count: number }>;
    };
  }> {
    try {
      let url = `${config.baseUrl}/rest/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(organizationUrn)}`;
      
      // Add time intervals if provided
      if (options?.timeRange) {
        const timeIntervals = {
          timeRange: {
            start: options.timeRange.start,
            ...(options.timeRange.end && { end: options.timeRange.end })
          },
          ...(options.timeGranularityType && { timeGranularityType: options.timeGranularityType })
        };
        
        // Use Restli 2.0 format for time intervals
        const timeIntervalsParam = encodeURIComponent(JSON.stringify(timeIntervals).replace(/"/g, ''));
        url += `&timeIntervals=${timeIntervalsParam}`;
      }

      // LinkedIn API requires LinkedIn-Version header, so we use direct fetch
      const response = await fetch(url, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'LinkedIn-Version': '202507',
          'X-Restli-Protocol-Version': '2.0.0'
        }
              });

        if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LinkedIn API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json() as {
        elements: Array<{
          timeRange?: { start: number; end: number };
          followerGains?: {
            organicFollowerGain: number;
            paidFollowerGain: number;
          };
          followerCountsByGeoCountry?: Array<{
            geo: string;
            followerCounts: { organicFollowerCount: number; paidFollowerCount: number };
          }>;
          followerCountsByIndustry?: Array<{
            industry: string;
            followerCounts: { organicFollowerCount: number; paidFollowerCount: number };
          }>;
          followerCountsByFunction?: Array<{
            function: string;
            followerCounts: { organicFollowerCount: number; paidFollowerCount: number };
          }>;
          followerCountsBySeniority?: Array<{
            seniority: string;
            followerCounts: { organicFollowerCount: number; paidFollowerCount: number };
          }>;
          followerCountsByStaffCountRange?: Array<{
            staffCountRange: string;
            followerCounts: { organicFollowerCount: number; paidFollowerCount: number };
          }>;
        }>;
      };

      const result: any = {};
      
      if (responseData.elements && responseData.elements.length > 0) {
        const element = responseData.elements[0];
        
        // Handle time-bound statistics (with timeRange)
        if (element.timeRange && element.followerGains) {
          result.followerGains = responseData.elements.map((el: any) => ({
            timeRange: el.timeRange!,
            organicFollowerGain: el.followerGains!.organicFollowerGain,
            paidFollowerGain: el.followerGains!.paidFollowerGain
          }));
        }
        
        // Handle lifetime statistics (demographics)
        if (element.followerCountsByGeoCountry || element.followerCountsByIndustry) {
          result.demographics = {};
          
          if (element.followerCountsByGeoCountry) {
            result.demographics.byCountry = element.followerCountsByGeoCountry.map((item: any) => ({
              geo: item.geo,
              count: item.followerCounts.organicFollowerCount + item.followerCounts.paidFollowerCount
            }));
          }
          
          if (element.followerCountsByIndustry) {
            result.demographics.byIndustry = element.followerCountsByIndustry.map((item: any) => ({
              industry: item.industry,
              count: item.followerCounts.organicFollowerCount + item.followerCounts.paidFollowerCount
            }));
          }
          
          if (element.followerCountsByFunction) {
            result.demographics.byFunction = element.followerCountsByFunction.map((item: any) => ({
              function: item.function,
              count: item.followerCounts.organicFollowerCount + item.followerCounts.paidFollowerCount
            }));
          }
          
          if (element.followerCountsBySeniority) {
            result.demographics.bySeniority = element.followerCountsBySeniority.map((item: any) => ({
              seniority: item.seniority,
              count: item.followerCounts.organicFollowerCount + item.followerCounts.paidFollowerCount
            }));
          }
          
          if (element.followerCountsByStaffCountRange) {
            result.demographics.byStaffCount = element.followerCountsByStaffCountRange.map((item: any) => ({
              staffCountRange: item.staffCountRange,
              count: item.followerCounts.organicFollowerCount + item.followerCounts.paidFollowerCount
            }));
          }
        }
      }
      return result;
    } catch (error) {
      console.error('[LinkedIn] Failed to fetch organization follower stats:', error);
      return {};
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – fetch organization follower count (simple)
     @url https://learn.microsoft.com/en-us/linkedin/marketing/community-management/organizations/organization-lookup-api?view=li-lms-2025-07&tabs=curl#retrieve-organization-follower-count
     ────────────────────────────────────────────────────────── */
  async getOrganizationFollowerCount(
    organizationUrn: string,
    token: string
  ): Promise<number> {
    try {
      const url = `${config.baseUrl}/rest/networkSizes/${encodeURIComponent(organizationUrn)}?edgeType=COMPANY_FOLLOWED_BY_MEMBER`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'LinkedIn-Version': '202507',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LinkedIn API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as { firstDegreeSize: number };
      return data.firstDegreeSize;
    } catch (error) {
      console.error('[LinkedIn] Failed to fetch organization follower count:', error);
      return 0;
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – register upload for image or video using fetchWithAuth
     @url https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin#register-the-image-or-video
     ────────────────────────────────────────────────────────── */
  private async registerUpload(
    ownerUrn: string,
    token: string,
    mediaType: 'image' | 'video'
  ): Promise<{ uploadUrl: string; asset: string }> {
    const recipe = mediaType === 'image' 
      ? 'urn:li:digitalmediaRecipe:feedshare-image' 
      : 'urn:li:digitalmediaRecipe:feedshare-video';

    const reg = await this.fetchWithAuth<{
      value: {
        asset: string;
        uploadMechanism: any;
      };
    }>(
      `${config.baseUrl}/v2/assets?action=registerUpload`,
      {
        method: "POST",
        token: token,
        body: JSON.stringify({
          registerUploadRequest: {
            owner: ownerUrn,
            recipes: [recipe],
            serviceRelationships: [{
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            }],
          },
        }),
      }
    );

    /* LinkedIn sometimes returns an object, sometimes an array */
    const mech = Array.isArray(reg.value.uploadMechanism)
      ? reg.value.uploadMechanism[0]
      : reg.value.uploadMechanism;

    const uploadHttp = mech?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"];
    if (!uploadHttp?.uploadUrl) {
      throw new Error("LinkedIn: uploadUrl not found in registerUpload response");
    }

    return {
      uploadUrl: uploadHttp.uploadUrl,
      asset: reg.value.asset
    };
  }

  /* ──────────────────────────────────────────────────────────
     helper – upload image from URL
     @url https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin#upload-image-or-video-binary-file
     ────────────────────────────────────────────────────────── */
  private async uploadImage(
    imageUrl: string,
    uploadUrl: string,
    token: string
  ): Promise<void> {
    // Fetch the image from the given URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from ${imageUrl}: ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();

    // Upload the image to LinkedIn
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "image/jpeg",
        Authorization: `Bearer ${token}`,
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – upload video from URL
     @url https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin#register-the-image-or-video
     ────────────────────────────────────────────────────────── */
  private async uploadVideo(
    videoUrl: string,
    uploadUrl: string,
    token: string
  ): Promise<void> {
    // Fetch the video from the given URL
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video from ${videoUrl}: ${videoResponse.statusText}`);
    }
    
    const videoBuffer = await videoResponse.arrayBuffer();

    // Upload the video to LinkedIn
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        Authorization: `Bearer ${token}`,
      },
      body: videoBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload video: ${uploadResponse.statusText}`);
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – upload single image and return asset URN
     ────────────────────────────────────────────────────────── */
  private async uploadSingleImage(
    imageUrl: string,
    ownerUrn: string,
    token: string
  ): Promise<string> {
    const { uploadUrl, asset } = await this.registerUpload(ownerUrn, token, 'image');
    await this.uploadImage(imageUrl, uploadUrl, token);
    return asset;
  }

  /* ──────────────────────────────────────────────────────────
     helper – upload single video and return asset URN
     ────────────────────────────────────────────────────────── */
  private async uploadSingleVideo(
    videoUrl: string,
    ownerUrn: string,
    token: string
  ): Promise<string> {
    const { uploadUrl, asset } = await this.registerUpload(ownerUrn, token, 'video');
    await this.uploadVideo(videoUrl, uploadUrl, token);
    return asset;
  }

  /* ──────────────────────────────────────────────────────────
     helper – upload multiple images and return asset URNs
     ────────────────────────────────────────────────────────── */
  private async uploadMultipleImages(
    imageUrls: string[],
    ownerUrn: string,
    token: string
  ): Promise<string[]> {
    const assets: string[] = [];

    for (const imageUrl of imageUrls) {
      const asset = await this.uploadSingleImage(imageUrl, ownerUrn, token);
      assets.push(asset);
    }

    return assets;
  }

  // function in which pass the page id and get the token from the supabase
  async getTokenFromSupabase(pageId: string) {
    const { data } = await supabase.from('social_pages').select('auth_token').eq('id', pageId).single();
    return data?.auth_token;
  }

  /* 4 — publish post (text, single image, multiple images, or video) */
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
          page,
          content,
          options,
        })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
    
    const token = await this.getTokenFromSupabase(page.id);
    if (!token) {
      throw new Error("Token not found");
    }

    // Determine media type and category
    const mediaUrls = content.media?.urls || [];
    const mediaType = content.media?.type || 'image';
    
    let shareMediaCategory: 'NONE' | 'IMAGE' | 'VIDEO' = 'NONE';
    let mediaAssets: string[] = [];

    // Handle different media types
    if (mediaUrls.length > 0) {
      if (mediaType === 'video') {
        if (mediaUrls.length > 1) {
          throw new Error("LinkedIn only supports single video uploads");
        }
        shareMediaCategory = 'VIDEO';
        mediaAssets = [await this.uploadSingleVideo(mediaUrls[0], page.pageId, token)];
      } else {
        // Image or carousel
        if (mediaUrls.length === 1) {
          shareMediaCategory = 'IMAGE';
          mediaAssets = [await this.uploadSingleImage(mediaUrls[0], page.pageId, token)];
        } else {
          // Multiple images
          shareMediaCategory = 'IMAGE';
          mediaAssets = await this.uploadMultipleImages(mediaUrls, page.pageId, token);
        }
      }
    }

    // Prepare the post data
    // https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin?context=linkedin%2Fconsumer%2Fcontext#creating-a-share-on-linkedin
    const postData: any = {
      author: page.pageId,
      lifecycleState: options?.scheduledTime ? "SCHEDULED" : "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content.text
          },
          shareMediaCategory: shareMediaCategory
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    };

    // Add media if present
    if (mediaAssets.length > 0) {
      postData.specificContent["com.linkedin.ugc.ShareContent"].media = mediaAssets.map(asset => ({
        status: "READY",
        media: asset,
        title: { text: content.title || "" }
      }));
    }

    const response = await this.fetchWithAuth<{ id: string }>(
      `${config.baseUrl}/v2/ugcPosts`,
      {
        method: "POST",
        token: token,
        body: JSON.stringify(postData)
      }
    );

    return {
      id: response.id,
      pageId: page.id,
      postId: response.id,
      publishId: response.id,
      content: content.text,
      mediaUrls: mediaUrls,
      status: "published",
      publishedAt: new Date(),
      analytics: {}
    };
  }

  /* 5 — optional history using fetchWithAuth */
  async getPostHistory(pg: SocialPage, limit = 20): Promise<PostHistory[]> {
    // Not supported eed the 'r_member_social' permission (https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2024-04&tabs=http#permissions) to read posts and this permission is closed permission (https://learn.microsoft.com/en-us/linkedin/marketing/lms-faq?view=li-lms-2024-04#how-do-i-get-access-to-r_member_social) as of March 15, 2024.
    return [];
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
      
      const mediaUrls = content.media.urls || [];
      if (content.media.type === 'video' && mediaUrls.length > 1) {
        errors.push("LinkedIn only supports single video uploads");
      } else if (mediaUrls.length > features.maxMediaCount) {
        errors.push(`Maximum of ${features.maxMediaCount} media items allowed`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
  