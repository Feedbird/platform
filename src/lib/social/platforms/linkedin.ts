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
  PostHistoryResponse,
} from "./platform-types";
import { updatePlatformPostId } from '@/lib/utils/platform-post-ids';

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
    maxMediaCount: 20, // 1 for video, 20 for images (organizations), 9 for profiles
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
  // https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?context=linkedin%2Fcontext&tabs=HTTPS1
  getAuthUrl() {
    const u = new URL(config.authUrl);
    u.searchParams.set("response_type", "code");
    u.searchParams.set("client_id"    , this.env.clientId);
    u.searchParams.set("redirect_uri" , this.env.redirectUri);
    u.searchParams.set("scope"        , config.scopes.join(" "));
    return u.toString();
  }

  /* 2 ─ code ➜ token */
  async connectAccount(code: string): Promise<SocialAccount> {
    // 1. Exchange authorization code for an access token.
    // https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?context=linkedin%2Fcontext&tabs=HTTPS1#step-3-exchange-authorization-code-for-an-access-token
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
      refresh_token_expires_in: number;
    };

    // 2. Get user info from the OIDC userinfo endpoint.
    // https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?context=linkedin%2Fcontext&tabs=HTTPS1#step-4-make-authenticated-requests
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
      refreshTokenExpiresAt: new Date(Date.now() + tokenData.refresh_token_expires_in * 1000),
      tokenIssuedAt: new Date(),
      metadata,
      connected: true,
      status: "active",
    };
  }

  async refreshToken(a: SocialAccount) { return a; }
  async disconnectAccount(a: SocialAccount) { a.connected = false; }

  /* ──────────────────────────────────────────────────────────
     helper – fetch total follower count for member
     @url https://learn.microsoft.com/en-us/linkedin/marketing/community-management/members/follower-statistics?view=li-lms-2025-08&source=recommendations&tabs=http
     ────────────────────────────────────────────────────────── */
  async getMemberFollowerCount(token: string): Promise<number> {
    try {

      // Additionslly we can pass daterange then The API returns the daily followers count within the specified dateRange.
      const url = `${config.baseUrl}/rest/memberFollowersCount?q=me`;
      
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
        throw new Error(`LinkedIn Member Follower Count API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as {
        elements: Array<{
          memberFollowersCount: number;
        }>;
        paging: {
          count: number;
          start: number;
          total: number;
          links: any[];
        };
      };

      if (data.elements && data.elements.length > 0) {
        return data.elements[0].memberFollowersCount;
      }

      return 0;
    } catch (error) {
      console.error('[LinkedIn] Failed to fetch member follower count:', error);
      return 0;
    }
  }

  /* one synthetic "Page" == the member profile */
  async listPages(acc: SocialAccount): Promise<SocialPage[]> {
    const pages: SocialPage[] = [];

    const authToken = acc.authToken;
    const authTokenExpiresAt = acc.accessTokenExpiresAt;

    if(!authToken || !authTokenExpiresAt) {
      throw new Error('No auth token found or auth token expires at found. Please reconnect your LinkedIn account.');
    }

    // Get total follower count for the member
    let memberFollowerCount = 0;
    try {
      memberFollowerCount = await this.getMemberFollowerCount(authToken);
    } catch (error) {
      console.warn('[LinkedIn] Could not fetch follower count for member:', error);
    }

    // Add personal profile directly from the SocialAccount object.
    pages.push({
      id         : crypto.randomUUID(),
      platform   : "linkedin",
      entityType : "profile",
      name       : acc.name,
      pageId     : `urn:li:person:${acc.accountId}`, // Construct the URN from the ID
      authToken,
      authTokenExpiresAt,
      connected  : true,
      status     : "active",
      accountId  : acc.id,
      statusUpdatedAt: new Date(),
      metadata: {
        ...acc.metadata,
        followerCount: memberFollowerCount
      },
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
            token: authToken
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
              token: authToken
            });

                        // Fetch follower count for the organization
            let organizationFollowerCount = 0;
            try {
              organizationFollowerCount = await this.getOrganizationFollowerCount(org.organizationalTarget, authToken);
            } catch (error) {
              console.warn('[LinkedIn] Could not fetch follower count for organization:', orgDetails.localizedName, error);
            }

            pages.push({
              id         : crypto.randomUUID(),
              platform   : "linkedin",
              entityType : "organization",
              name       : orgDetails.localizedName,
              pageId     : org.organizationalTarget,
              authToken,
              authTokenExpiresAt,
              connected  : true,
              status     : "active",
              accountId  : org.roleAssignee,
              statusUpdatedAt: new Date(),
              metadata: {
                ...orgDetails,
                followerCount: organizationFollowerCount
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

  /* ──────────────────────────────────────────────────────────
     helper – upload image for organization
     @url https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api?view=li-lms-2025-07&tabs=http
     ────────────────────────────────────────────────────────── */
  private async uploadImageForOrganization(
    imageUrl: string,
    organizationUrn: string,
    token: string
  ): Promise<string> {
    try {
      // Step 1: Initialize upload
      const initResponse = await fetch(`${config.baseUrl}/rest/images?action=initializeUpload`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202507',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          initializeUploadRequest: {
            owner: organizationUrn
          }
        })
      });

      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        throw new Error(`LinkedIn Images API Init Error: ${initResponse.status} ${initResponse.statusText} - ${errorText}`);
      }

      const initData = await initResponse.json() as {
        value: {
          uploadUrlExpiresAt: number;
          uploadUrl: string;
          image: string; // urn:li:image:...
        }
      };

      const { uploadUrl, image: imageUrn } = initData.value;

      // Step 2: Download the image from URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image from ${imageUrl}: ${imageResponse.status} ${imageResponse.statusText}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Validate image size (LinkedIn limit: 36,152,320 pixels)
      const contentType = imageResponse.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}. Expected image/*`);
      }

      // Step 3: Upload the image binary
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          'Content-Type': contentType,
        },
        body: imageBuffer
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`LinkedIn Images API Upload Error: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
      }

      return imageUrn;
    } catch (error) {
      console.error('[LinkedIn] Failed to upload image for organization:', error);
      throw error;
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – upload video for organization (new Videos API)
     @url https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/videos-api?view=li-lms-2025-07&tabs=http
     ────────────────────────────────────────────────────────── */
  private async uploadVideoForOrganization(
    videoUrl: string,
    organizationUrn: string,
    token: string
  ): Promise<string> {
    try {
      // Step 1: Download video to get file size
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video from ${videoUrl}: ${videoResponse.status} ${videoResponse.statusText}`);
      }

      const videoBuffer = await videoResponse.arrayBuffer();
      const fileSizeBytes = videoBuffer.byteLength;

      // Validate video size (LinkedIn limit: 500MB)
      if (fileSizeBytes > 500 * 1024 * 1024) {
        throw new Error(`Video file size ${fileSizeBytes} bytes exceeds LinkedIn limit of 500MB`);
      }

      // Validate video format (LinkedIn supports MP4)
      const contentType = videoResponse.headers.get('content-type');
      if (contentType && !contentType.includes('video/mp4') && !contentType.includes('video/')) {
        log('Warning: Video content type is not MP4:', contentType);
      }

      // Step 2: Initialize video upload
      const initResponse = await fetch(`${config.baseUrl}/rest/videos?action=initializeUpload`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202507',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          initializeUploadRequest: {
            owner: organizationUrn,
            fileSizeBytes: fileSizeBytes,
            uploadCaptions: false,
            uploadThumbnail: false
          }
        })
      });

      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        throw new Error(`LinkedIn Videos API Init Error: ${initResponse.status} ${initResponse.statusText} - ${errorText}`);
      }

      const initData = await initResponse.json() as {
        value: {
          uploadUrlsExpireAt: number;
          video: string; // urn:li:video:...
          uploadInstructions: Array<{
            uploadUrl: string;
            lastByte: number;
            firstByte: number;
          }>;
          uploadToken: string;
        }
      };

      const { video: videoUrn, uploadInstructions, uploadToken } = initData.value;

      // Step 3: Upload video parts
      const uploadedPartIds: string[] = [];
      
      for (let i = 0; i < uploadInstructions.length; i++) {
        const instruction = uploadInstructions[i];
        const startByte = instruction.firstByte;
        const endByte = instruction.lastByte;
        
        // Extract the part of the video buffer for this upload
        const partBuffer = videoBuffer.slice(startByte, endByte + 1);
        
        const uploadResponse = await fetch(instruction.uploadUrl, {
          method: "PUT",
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: partBuffer
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`LinkedIn Videos API Upload Error (part ${i + 1}): ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
        }

        // Get ETag from response headers
        const etag = uploadResponse.headers.get('etag');
        if (!etag) {
          throw new Error(`No ETag received for video part ${i + 1}`);
        }

        // Extract the ETag value (remove quotes if present)
        const etagValue = etag.replace(/^"|"$/g, '');
        uploadedPartIds.push(etagValue);
      }

      // Step 4: Finalize video upload
      const finalizeResponse = await fetch(`${config.baseUrl}/rest/videos?action=finalizeUpload`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202507',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          finalizeUploadRequest: {
            video: videoUrn,
            uploadToken: uploadToken,
            uploadedPartIds: uploadedPartIds
          }
        })
      });

      if (!finalizeResponse.ok) {
        const errorText = await finalizeResponse.text();
        throw new Error(`LinkedIn Videos API Finalize Error: ${finalizeResponse.status} ${finalizeResponse.statusText} - ${errorText}`);
      }

      // Verify the video was uploaded successfully by checking its status
      const verifyResponse = await fetch(`${config.baseUrl}/rest/videos/${encodeURIComponent(videoUrn)}`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202507'
        }
      });

      if (verifyResponse.ok) {
        const videoData = await verifyResponse.json() as { status: string };
        log('Video upload verification - status:', videoData.status);
        
        if (videoData.status === 'PROCESSING_FAILED') {
          throw new Error(`Video upload failed: ${videoUrn}`);
        }
      }

      log('Successfully uploaded video for organization:', {
        organizationUrn,
        videoUrn,
        videoSize: fileSizeBytes,
        parts: uploadedPartIds.length
      });

      // Note: Video may still be processing. For production, you might want to poll the video status
      // until it becomes "AVAILABLE" before using it in a post.
      // For now, we'll proceed and let LinkedIn handle the processing.

      return videoUrn;
    } catch (error) {
      console.error('[LinkedIn] Failed to upload video for organization:', error);
      throw error;
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – check video status and wait for availability
     @url https://learn.microsoft.com/en-us/linkedin/marketing/community-management/organizations/videos-api
     ────────────────────────────────────────────────────────── */
  private async waitForVideoAvailability(
    videoUrn: string,
    token: string,
    maxWaitTimeMs: number = 60000 // 60 seconds
  ): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < maxWaitTimeMs) {
      try {
        const response = await fetch(`${config.baseUrl}/rest/videos/${encodeURIComponent(videoUrn)}`, {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'LinkedIn-Version': '202507'
          }
        });

        if (response.ok) {
          const videoData = await response.json() as { status: string };
          
          if (videoData.status === 'AVAILABLE') {
            log('Video is now available:', videoUrn);
            return;
          } else if (videoData.status === 'PROCESSING_FAILED') {
            throw new Error(`Video processing failed: ${videoUrn}`);
          }
          
          log(`Video status: ${videoData.status}, waiting...`);
        } else {
          log(`Failed to check video status: ${response.status}`);
        }
      } catch (error) {
        log('Error checking video status:', error);
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    throw new Error(`Video did not become available within ${maxWaitTimeMs}ms: ${videoUrn}`);
  }

  // function in which pass the page id and get the token from the supabase
  async getToken(pageId: string) {
    const { data, error } = await supabase.from('social_pages').select('account_id, auth_token, auth_token_expires_at').eq('id', pageId).single();

    if (error) {
      throw new Error('Failed to get LinkedIn token. Please reconnect your LinkedIn account.');
    }

    const accessToken = data?.auth_token;
    // LinkedIn tokens may have an expiration, but our DB row may not have this field.
    // If it exists, check if expired.
    const authTokenExpiresAt = (data as any)?.auth_token_expires_at;


    //  we need to convert the authTokenExpiresAt to milliseconds
    const authTokenExpiresAtMs = new Date(authTokenExpiresAt).getTime();
    if (authTokenExpiresAt && authTokenExpiresAtMs < new Date().getTime()) {
      const accessToken = await this.refreshTokenFromLinkedIn(data?.account_id);
      return accessToken;
    }

    return accessToken; 
  }

  /* ──────────────────────────────────────────────────────────
     helper – refresh token from LinkedIn
     @url https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens
     ────────────────────────────────────────────────────────── */
  async refreshTokenFromLinkedIn(accountId: string) {
    
    const { data, error } = await supabase.from('social_accounts').select('auth_token, access_token_expires_at, refresh_token, refresh_token_expires_at').eq('id', accountId).single();

    //  if the account is not found, throw an error
    if (error || !data) {
      throw new Error('Failed to refresh LinkedIn token. Please reconnect your LinkedIn account.');
    }

    // check if the refresh token is expired (in milliseconds)
    const refreshTokenExpiresAt = data?.refresh_token_expires_at;
    const refreshTokenExpiresAtMs = new Date(refreshTokenExpiresAt).getTime();
    if (refreshTokenExpiresAt && refreshTokenExpiresAtMs < new Date().getTime()) {
      throw new Error('Refresh token expired. Please reconnect your LinkedIn account.');
    }

    //  call the LinkedIn API to refresh the token
    //  https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=refresh_token&refresh_token=${data?.refresh_token}&client_id=${this.env.clientId}&client_secret=${this.env.clientSecret}`
    });

    //  if the response is not ok, throw an error
    if (!response.ok) {
      throw new Error('Failed to refresh LinkedIn token. Please reconnect your LinkedIn account.');
    }

    //  get the token data
    const tokenData: any = await response.json();

    //  get the current date
    const now = new Date();

    // update the supabase table with the new token
    await supabase.from('social_accounts').update({
      auth_token: tokenData?.access_token,
      access_token_expires_at: new Date(now.getTime() + tokenData?.expires_in * 1000),
      refresh_token: tokenData?.refresh_token,
      refresh_token_expires_at: new Date(now.getTime() + tokenData?.refresh_token_expires_in * 1000)
    }).eq('id', accountId);

    // also update the social_pages table with the new token, social pages are linked to social accounts
    await supabase.from('social_pages').update({
      auth_token: tokenData?.access_token,
      auth_token_expires_at: new Date(now.getTime() + tokenData?.expires_in * 1000)
    }).eq('account_id', accountId);

    return tokenData?.access_token;
  }

  /* 4 — publish post (text, single image, multiple images, or video) */
  // https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin#api-request
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
    
    const token = await this.getToken(page.id);
    if (!token) {
      throw new Error("Token not found");
    }

    // Determine if this is a personal profile or organization
    const isOrganization = page.entityType === "organization";
    
    if (isOrganization) {
      return this.publishToOrganization(page, content, token, options);
    } else {
      return this.publishToProfile(page, content, token, options);
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – publish to organization
     @url https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2025-07&tabs=http
     ────────────────────────────────────────────────────────── */
  private async publishToOrganization(
    page: SocialPage,
    content: PostContent,
    token: string,
    options?: PublishOptions
  ): Promise<PostHistory> {
    
    const postData: any = {
      author: page.pageId, // organization URN
      commentary: content.text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false
    };

          // Handle media if present
      if (content.media && content.media.urls && content.media.urls.length > 0) {
        if (content.media.type === 'image' || content.media.type === 'carousel') {
          if (content.media.urls.length === 1) {
            // Single image post
            const imageUrn = await this.uploadImageForOrganization(
              content.media.urls[0],
              page.pageId,
              token
            );
            
            postData.content = {
              media: {
                id: imageUrn,
                altText: content.media.altText || "LinkedIn post image"
              }
            };
          } else if (content.media.urls.length >= 2 && content.media.urls.length <= 20) {
            // Multi-image post (2-20 images)
            const imageUrns = await Promise.all(
              content.media.urls.map(async (url, index) => {
                const imageUrn = await this.uploadImageForOrganization(url, page.pageId, token);
                return {
                  id: imageUrn,
                  altText: content.media?.altText || `LinkedIn post image ${index + 1}`
                };
              })
            );
            
            postData.content = {
              multiImage: {
                images: imageUrns
              }
            };
          } else {
            throw new Error("LinkedIn organizations support 1-20 images per post");
          }
        } else if (content.media.type === 'video') {
          // Single video post
          if (content.media.urls.length > 1) {
            throw new Error("LinkedIn organizations only support single video posts");
          }
          
          const videoUrn = await this.uploadVideoForOrganization(
            content.media.urls[0],
            page.pageId,
            token
          );
          
          // Wait for video to be available before posting
          await this.waitForVideoAvailability(videoUrn, token);
          
          // For videos, use the media field directly without altText
          postData.content = {
            media: {
              id: videoUrn
            }
          };
        } else {
          throw new Error(`Media type '${content.media.type}' is not supported for LinkedIn organizations`);
        }
      }

      const response = await fetch(`${config.baseUrl}/rest/posts`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202507',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

          if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LinkedIn Organization API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

    // Get post ID from response header
    const postId = response.headers.get('x-restli-id');
    if (!postId) {
      throw new Error("No post ID returned from LinkedIn API");
    }

    // Save the published post ID to the platform_post_ids column
    try {
      console.log('Saving LinkedIn post ID:', postId);
      await updatePlatformPostId(content.id!, 'linkedin', postId, page.id);
    } catch (error) {
      console.warn('Failed to save LinkedIn post ID:', error);
      // Don't fail the publish if saving the ID fails
    }

    return {
      id: postId,
      pageId: page.id,
      postId: postId,
      publishId: postId,
      content: content.text,
      mediaUrls: content.media?.urls || [],
      status: "published",
      publishedAt: new Date(),
      analytics: {}
    };
  }

  /* ──────────────────────────────────────────────────────────
     helper – publish to personal profile (legacy UGC API)
     @url https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
     ────────────────────────────────────────────────────────── */
  private async publishToProfile(
    page: SocialPage,
    content: PostContent,
    token: string,
    options?: PublishOptions
  ): Promise<PostHistory> {
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

    // Prepare the share post data
    // https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin?context=linkedin%2Fconsumer%2Fcontext#creating-a-share-on-linkedin
    const postData: any = {
      author: page.pageId,
      lifecycleState: "PUBLISHED",
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

    // Save the published post ID to the platform_post_ids column
    try {
      console.log('Saving LinkedIn post ID:', response.id);
      await updatePlatformPostId(content.id!, 'linkedin', response.id, page.id);
    } catch (error) {
      console.warn('Failed to save LinkedIn post ID:', error);
      // Don't fail the publish if saving the ID fails
    }

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
  async getPostHistory(pg: SocialPage, limit = 20, nextPage?: number): Promise<PostHistoryResponse<PostHistory>> {
    if (IS_BROWSER) {
      const res = await fetch("/api/social/linkedin/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: pg,
          limit,
          nextPage,
        })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    try {
      // Only support organization pages for now since we need r_organization_social permission
      if (pg.entityType !== 'organization') {
        console.warn('[LinkedIn] Post history only supported for organization pages');
        return { posts: [], nextPage: undefined };
      }

      const token = await this.getToken(pg.id);
      if (!token) {
        throw new Error("Token not found");
      }

      const fetchedPosts = await this.getOrganizationPosts(pg.pageId, token, limit, nextPage);
      return { posts: fetchedPosts.posts, nextPage: fetchedPosts.nextPage };
    } catch (error) {
      console.error('[LinkedIn] Failed to get post history:', error);
      return { posts: [], nextPage: undefined };
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – fetch organization posts
     @url https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2025-07&tabs=http#find-posts-by-account
     ────────────────────────────────────────────────────────── */
  private async getOrganizationPosts(
    organizationUrn: string,
    token: string,
    limit: number = 20,
    nextPage?: number
  ): Promise<PostHistoryResponse<PostHistory>> {
    try {
      let url = `${config.baseUrl}/rest/posts?author=${encodeURIComponent(organizationUrn)}&q=author&count=${Math.min(limit, 100)}&sortBy=LAST_MODIFIED`;
      
      // Add pagination cursor if provided
      if (nextPage !== undefined) {
        url += `&start=${nextPage}`;
      }
      
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
        throw new Error(`LinkedIn Posts API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as {
        paging: {
          start: number;
          count: number;
          links: any[];
        };
        elements: Array<{
          id: string;
          commentary: string;
          lifecycleState: string;
          publishedAt: number;
          createdAt: number;
          lastModifiedAt: number;
          author: string;
          visibility: string;
          content?: {
            media?: {
              id: string;
              title?: string;
            };
            multiImage?: {
              images: Array<{
                id: string;
                altText?: string;
              }>;
            };
            article?: {
              source: string;
              title: string;
              description: string;
            };
          };
          reshareContext?: {
            parent: string;
            root: string;
          };
        }>;
      };

      const resolvedPosts: PostHistory[] = [];

      for (const post of data.elements || []) {
        // Extract media URNs if present
        let mediaUrns: string[] = [];
        if (post.content?.media?.id) {
          mediaUrns.push(post.content.media.id);
        } else if (post.content?.multiImage?.images) {
          mediaUrns = post.content.multiImage.images.map(img => img.id);
        }

        // Resolve media URNs to actual URLs
        const resolvedMedia = await this.resolveMediaUrls(mediaUrns, token);
        const resolvedMediaUrls = resolvedMedia.map(m => m.url);
        
        // Store media type information in metadata
        const mediaTypes = resolvedMedia.map(m => m.type);

        resolvedPosts.push({
          id: post.id,
          pageId: organizationUrn,
          postId: post.id,
          content: post.commentary || '',
          mediaUrls: resolvedMediaUrls, // Now these are actual URLs
          status: post.lifecycleState.toLowerCase() as any,
          publishedAt: new Date(post.publishedAt || post.createdAt),
          analytics: {
            // We could fetch analytics for each post here if needed
            metadata: {
              platform: 'linkedin',
              postType: post.content?.media ? 'media' : 
                       post.content?.multiImage ? 'multiImage' : 
                       post.content?.article ? 'article' : 'text',
              isReshare: !!post.reshareContext,
              visibility: post.visibility,
              mediaTypes: mediaTypes, // Store media types for frontend use
              // Add pagination metadata
              pagination: {
                start: data.paging.start,
                count: data.paging.count,
                hasMore: data.paging.links.some(link => link.rel === 'next'),
                nextCursor: data.paging.start + data.paging.count
              }
            }
          }
        });
      }

      return { posts: resolvedPosts, nextPage: data.paging.start + data.paging.count };
    } catch (error) {
      console.error('[LinkedIn] Failed to fetch organization posts:', error);
      return { posts: [], nextPage: undefined };
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – fetch post analytics
     Note: The API from the linkedin giving 500 error so it's not used.
     would be used if it's fixed by linkedin API.
     ────────────────────────────────────────────────────────── */
  async getPostAnalytics(page: SocialPage, postId: string): Promise<PostHistory['analytics']> { 
    if (IS_BROWSER) {
      const res = await fetch("/api/social/linkedin/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page,
          postId,
        })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    try {
      const token = await this.getToken(page.id);
      if (!token) {
        throw new Error("Token not found");
      }

      // For organization pages, we can fetch organization-specific analytics
      if (page.entityType === 'organization') {
        const analytics = await this.getOrganizationPostAnalytics(token, postId);
        return {
          reach: analytics.membersReached || 0,
          likes: analytics.reactions || 0,
          comments: analytics.comments || 0,
          shares: analytics.reshares || 0,
          clicks: 0, // LinkedIn doesn't provide click metrics in this API
          views: analytics.impressions || 0,
          engagement: this.calculateEngagement(analytics),
          metadata: {
            platform: 'linkedin',
            analyticsType: 'organization_single_post',
            postId: postId,
            lastUpdated: new Date().toISOString()
          }
        };
      } else {
        // For personal profiles, use member analytics
        const analytics = await this.getMemberPostAnalytics(token, postId);
        return {
          reach: analytics.membersReached || 0,
          likes: analytics.reactions || 0,
          comments: analytics.comments || 0,
          shares: analytics.reshares || 0,
          clicks: 0, // LinkedIn doesn't provide click metrics in this API
          views: analytics.impressions || 0,
          engagement: this.calculateEngagement(analytics),
          metadata: {
            platform: 'linkedin',
            analyticsType: 'member_single_post',
            postId: postId,
            lastUpdated: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      console.error('[LinkedIn] Failed to get post analytics:', error);
      return {
        reach: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
        views: 0,
        engagement: 0,
        metadata: {
          platform: 'linkedin',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /* ──────────────────────────────────────────────────────────
     getPageAnalytics – fetch organization or profile analytics
     @url https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/organizations/organization-access-control
     ────────────────────────────────────────────────────────── */
  async getPageAnalytics(page: SocialPage): Promise<any> {
    // Prevent browser calls - route to API endpoint
    if (IS_BROWSER) {
      const res = await fetch('/api/social/linkedin/page-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    try {
      const token = await this.getToken(page.id);
      if (!token) {
        throw new Error('No auth token available');
      }

      // For organization pages, fetch organization analytics
      if (page.entityType === 'organization') {
        const analytics = await this.getOrganizationAnalytics(token, page.pageId);
        
        return {
          pageId: page.pageId,
          pageName: page.name,
          entityType: 'organization',
          analytics: analytics,
          lastUpdated: new Date().toISOString()
        };
      } else {
        // For personal profiles, fetch member profile analytics
        const analytics = await this.getMemberProfileAnalytics(page.pageId,token);
        
        return {
          pageId: page.pageId,
          pageName: page.name,
          entityType: 'profile',
          analytics: analytics,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (error: any) {
      console.error('[LinkedIn] Failed to fetch page analytics:', error);
      throw new Error(`Failed to fetch page analytics: ${error.message}`);
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – fetch organization analytics
     @url https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/organizations/page-statistics
     ────────────────────────────────────────────────────────── */
  private async getOrganizationAnalytics(token: string, organizationId: string): Promise<any> {
    try {
      // Ensure organizationId is in the correct URN format
      const orgUrn = organizationId.startsWith('urn:li:organization:') 
        ? organizationId 
        : `urn:li:organization:${organizationId}`;

      // Try to get follower count using the working API
      let followerCount = 0;
      try {
        followerCount = await this.getOrganizationFollowerCount(orgUrn, token);
      } catch (error) {
        console.warn('[LinkedIn] Could not fetch follower count:', error);
      }

      let pageStatistics: any = null;
      try {
        const pageStatsResponse = await fetch(`${config.baseUrl}/rest/organizationPageStatistics?q=organization&organization=${encodeURIComponent(orgUrn)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'LinkedIn-Version': '202507',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        });

        if (pageStatsResponse.ok) {
          const pageData = await pageStatsResponse.json();
          if (pageData.elements && pageData.elements.length > 0) {
            pageStatistics = pageData.elements[0];
          }
        }
      } catch (error) {
        console.warn('[LinkedIn] Could not fetch page statistics:', error);
      }

      return {
        followerCount,
        pageViews: pageStatistics,
        description: 'LinkedIn organization analytics',
        organizationUrn: orgUrn
      };
    } catch (error) {
      console.error('[LinkedIn] Failed to fetch organization analytics:', error);
      return {
        followerCount: 0,
        pageViews: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          platform: 'linkedin',
          analyticsType: 'organization_page',
          organizationId: organizationId,
          lastUpdated: new Date().toISOString()
        }
      };
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – fetch member profile analytics
     ────────────────────────────────────────────────────────── */
  private async getMemberProfileAnalytics(pageId: string,token: string): Promise<any> {
    try {

      const personId = pageId.split(':')[3];
      // fetc the connection size
      const connectionSize = await this.getConnectionSize(personId,token);

      return {
        connectionSize: connectionSize,
        description: 'LinkedIn member profile analytics',
        note: 'Limited analytics available through LinkedIn API'
      };
    } catch (error) {
      console.error('[LinkedIn] Failed to fetch member profile analytics:', error);
      throw new Error(`Failed to fetch member profile analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – fetch organization post analytics (single post)
     @url https://learn.microsoft.com/en-us/linkedin/marketing/community-management/members/post-statistics?view=li-lms-2025-07&tabs=http
     ────────────────────────────────────────────────────────── */
  private async getOrganizationPostAnalytics(token: string, postId: string): Promise<{
    impressions?: number;
    membersReached?: number;
    reactions?: number;
    comments?: number;
    reshares?: number;
  }> {
    try {
      // For now, we'll use the same member analytics endpoint
      // In the future, we can implement organization-specific analytics if available
      return await this.getMemberPostAnalytics(token, postId);
    } catch (error) {
      console.error('[LinkedIn] Failed to fetch organization post analytics:', error);
      return {};
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – fetch member post analytics (single post)
     @url https://learn.microsoft.com/en-us/linkedin/marketing/community-management/members/post-statistics?view=li-lms-2025-07&tabs=http
     ────────────────────────────────────────────────────────── */
  private async getMemberPostAnalytics(token: string, postId: string): Promise<{
    impressions?: number;
    membersReached?: number;
    reactions?: number;
    comments?: number;
    reshares?: number;
  }> {
    try {
      const metrics = ['IMPRESSION', 'MEMBERS_REACHED', 'REACTION', 'COMMENT', 'RESHARE'];
      const results: any = {};

      // Fetch each metric type for the specific post
      for (const metric of metrics) {
        try {
          // Use entity query for single post analytics
          const encodedEntity = encodeURIComponent(`${postId}`);
          const url = `${config.baseUrl}/rest/memberCreatorPostAnalytics?q=entity&entity=(${postId.includes('share') ? 'share' : 'post'}:${encodedEntity})&queryType=${metric}&aggregation=TOTAL`;
          
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
            console.warn(`[LinkedIn] Failed to fetch ${metric} analytics for post ${postId}:`, response.status, errorText);
            continue;
          }

          const data = await response.json() as {
            elements: Array<{
              count: number;
              metricType: {
                'com.linkedin.adsexternalapi.memberanalytics.v1.CreatorPostAnalyticsMetricTypeV1': string;
              };
            }>;
          };

          if (data.elements && data.elements.length > 0) {
            const count = data.elements[0].count;
            
            // Map LinkedIn metrics to our analytics structure
            switch (metric) {
              case 'IMPRESSION':
                results.impressions = count;
                break;
              case 'MEMBERS_REACHED':
                results.membersReached = count;
                break;
              case 'REACTION':
                results.reactions = count;
                break;
              case 'COMMENT':
                results.comments = count;
                break;
              case 'RESHARE':
                results.reshares = count;
                break;
            }
          }
        } catch (metricError) {
          console.warn(`[LinkedIn] Error fetching ${metric} analytics for post ${postId}:`, metricError);
        }
      }

      return results;
    } catch (error) {
      console.error('[LinkedIn] Failed to fetch member post analytics:', error);
      return {};
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – calculate engagement rate
     ────────────────────────────────────────────────────────── */
  private calculateEngagement(analytics: {
    impressions?: number;
    membersReached?: number;
    reactions?: number;
    comments?: number;
    reshares?: number;
  }): number {
    const reach = analytics.membersReached || analytics.impressions || 0;
    if (reach === 0) return 0;

    const totalEngagement = (analytics.reactions || 0) + (analytics.comments || 0) + (analytics.reshares || 0);
    return Math.round((totalEngagement / reach) * 10000) / 100; // Return as percentage with 2 decimal places
  }

  /* ──────────────────────────────────────────────────────────
     helper – delete a post
     ────────────────────────────────────────────────────────── */
  async deletePost(page: SocialPage, postId: string): Promise<void> {
    if (IS_BROWSER) {
      const res = await fetch('/api/social/linkedin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, postId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return;
    }

    // Check if this is an organization page (required for deletion)
    if (page.entityType !== 'organization') {
      throw new Error('LinkedIn post deletion is only supported for organization pages, not personal profiles');
    }

  
    const token = await this.getToken(page.id);
    if(!token) {
      throw new Error('No token found for page');
    }

    // LinkedIn API requires the post URN to be URL-encoded
    const encodedPostUrn = encodeURIComponent(postId);
    
    // https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2025-08&tabs=curl#delete-posts
    const response = await fetch(`${config.baseUrl}/rest/posts/${encodedPostUrn}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'LinkedIn-Version': '202507',
        'X-Restli-Protocol-Version': '2.0.0',
        'X-RestLi-Method': 'DELETE'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LinkedIn] Delete post failed: ${response.status} - ${errorText}`);
      throw new Error(`Failed to delete LinkedIn post: ${response.status} - ${errorText}`);
    }

    log(`Successfully deleted post ${postId}`);
  }

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

  /* ──────────────────────────────────────────────────────────
     helper – extract asset ID from LinkedIn URN
     ────────────────────────────────────────────────────────── */
  private extractAssetIdFromUrn(urn: string): string | null {
    // Handle different URN formats:
    // urn:li:video:D4D10AQEW1V2BEKc4hA
    // urn:li:image:C5622AQHdBDflPp0pEg
    // urn:li:digitalmediaAsset:C5622AQHdBDflPp0pEg
    
    const match = urn.match(/urn:li:(?:video|image|digitalmediaAsset):([A-Za-z0-9]+)/);
    return match ? match[1] : null;
  }

  /* ──────────────────────────────────────────────────────────
     helper – fetch media artifacts to get actual URLs
     @url https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/vector-asset-api?view=li-lms-2025-07&tabs=curl
     ────────────────────────────────────────────────────────── */
  private async getMediaArtifacts(assetId: string, token: string): Promise<{
    imageUrl?: string;
    videoUrl?: string;
    documentUrl?: string;
  }> {
    try {
      const url = `${config.baseUrl}/rest/assets/${assetId}?fields=mediaArtifacts,recipes,id`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'LinkedIn-Version': '202507',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      if (!response.ok) {
        console.warn(`[LinkedIn] Failed to get media artifacts for ${assetId}:`, response.status);
        return {};
      }

      const data = await response.json();
      const mediaArtifacts = data.mediaArtifacts;
      
      if (!mediaArtifacts?.length) {
        console.warn(`[LinkedIn] No media artifacts found for asset ${assetId}`);
        return {};
      }

      let bestImageUrl: string | undefined;
      let bestVideoUrl: string | undefined;
      let bestDocumentUrl: string | undefined;

      // Iterate through all media artifacts to find the best URLs
      for (const artifact of mediaArtifacts) {
        if (!artifact.identifiers?.length) continue;

        for (const identifier of artifact.identifiers) {
          const url = identifier.identifier;
          const mediaType = identifier.mediaType;

          // For images, prioritize higher resolution versions
          if (mediaType?.startsWith('image/')) {
            if (!bestImageUrl || url.includes('image-shrink_1280')) {
              bestImageUrl = url;
            }
          }
          
          // For videos, prioritize MP4 files over HLS playlists
          if (mediaType === 'video/mp4') {
            if (!bestVideoUrl || url.includes('720p')) {
              bestVideoUrl = url;
            }
          } else if (mediaType === 'application/vnd.apple.mpegURL' && !bestVideoUrl) {
            // Fallback to HLS if no MP4 found
            bestVideoUrl = url;
          }
          
          // For documents
          if (mediaType?.startsWith('text/') || mediaType?.startsWith('application/')) {
            if (!bestDocumentUrl) {
              bestDocumentUrl = url;
            }
          }
        }
      }

      return {
        imageUrl: bestImageUrl,
        videoUrl: bestVideoUrl,
        documentUrl: bestDocumentUrl,
      };
    } catch (error) {
      console.error(`[LinkedIn] Error fetching media artifacts for ${assetId}:`, error);
      return {};
    }
  }

  /* ──────────────────────────────────────────────────────────
     helper – resolve media URNs to actual URLs with type information
     ────────────────────────────────────────────────────────── */
  private async resolveMediaUrls(mediaUrns: string[], token: string): Promise<Array<{url: string; type: 'image' | 'video' | 'document'}>> {
    const resolvedMedia: Array<{url: string; type: 'image' | 'video' | 'document'}> = [];
    
    if (!mediaUrns.length) {
      return resolvedMedia;
    }

    
    for (const urn of mediaUrns) {
      const assetId = this.extractAssetIdFromUrn(urn);
      if (!assetId) {
        console.warn(`[LinkedIn] Could not extract asset ID from URN: ${urn}`);
        continue;
      }

      
      // Determine media type from URN first
      let mediaType: 'image' | 'video' | 'document' = 'document';
      
      if (urn.includes('urn:li:image:')) {
        mediaType = 'image';
      } else if (urn.includes('urn:li:video:')) {
        mediaType = 'video';
      }
      
      // Only get the relevant URL based on the URN type
      const artifacts = await this.getMediaArtifacts(assetId, token);
      let resolvedUrl: string | undefined;
      
      if (mediaType === 'image' && artifacts.imageUrl) {
        resolvedUrl = artifacts.imageUrl;
      } else if (mediaType === 'video' && artifacts.videoUrl) {
        resolvedUrl = artifacts.videoUrl;
      } else if (mediaType === 'document' && artifacts.documentUrl) {
        resolvedUrl = artifacts.documentUrl;
      } else {
        console.warn(`[LinkedIn] No ${mediaType} URL found for asset: ${assetId}`);
      }
      
      if (resolvedUrl) {
        resolvedMedia.push({ url: resolvedUrl, type: mediaType });
      }
    }
    
    return resolvedMedia;
  }
}
  