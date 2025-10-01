/* ─────────────────────────────────────────────────────────────
   YouTube driver – upload video + basic snippet (no DB needed)
   ─────────────────────────────────────────────────────────── */

import type {
  PlatformOperations,
  SocialAccount,
  SocialPage,
  PostHistory,
  PostHistoryResponse,
  SocialPlatformConfig,
  PostContent,
  PublishOptions,
} from './platform-types';
import { BasePlatform } from './base-platform';
import { socialApiService } from '@/lib/api/social-api-service';
import { updatePlatformPostId } from '@/lib/utils/platform-post-ids';

/* —— static meta —— */
const cfg: SocialPlatformConfig = {
  name: 'YouTube',
  channel: 'youtube',
  icon: '/images/platforms/youtube.svg',
  // https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps#httprest_1
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  // https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps#identify-access-scopes
  scopes: [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
  ],
  apiVersion: 'v3',
  baseUrl: 'https://www.googleapis.com/youtube/v3',
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
      title: 100,
    },
  },
  connectOptions: [
    {
      title: 'Add YouTube Channel',
      type: 'channel',
      requiredScopes: ['https://www.googleapis.com/auth/youtube'],
    },
  ],
};

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const IS_BROWSER = typeof window !== 'undefined';

/* —— helper —— */
async function ytFetch<T = any>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} – ${await r.text()}`);
  return r.json() as Promise<T>;
}

/* ─────────────────────────────────────────────────────────── */
export class YouTubePlatform extends BasePlatform {
  constructor(
    private clientId: string,
    private clientSecret: string,
    private redirectUri: string
  ) {
    super(cfg, { clientId, clientSecret, redirectUri });
  }

  /* 1 ─ popup */
  getAuthUrl() {
    const u = new URL(cfg.authUrl);
    u.searchParams.set('response_type', 'code');
    u.searchParams.set('client_id', this.clientId);
    u.searchParams.set('redirect_uri', this.redirectUri);
    u.searchParams.set('scope', cfg.scopes.join(' '));
    u.searchParams.set('access_type', 'offline');
    u.searchParams.set('include_granted_scopes', 'true');
    u.searchParams.set('prompt', 'consent'); // force refresh_token
    return u.toString();
  }

  /* 2 ─ code → tokens → my channel */
  async connectAccount(code: string): Promise<SocialAccount> {
    const tok = await ytFetch<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    const ch = await ytFetch<{
      items: { id: string; snippet: { title: string } }[];
    }>(`${cfg.baseUrl}/channels?part=snippet&mine=true`, {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    });
    if (!ch.items?.[0]) throw new Error('No YouTube channel on this account');

    return {
      id: crypto.randomUUID(),
      platform: 'youtube',
      name: ch.items[0].snippet.title,
      accountId: ch.items[0].id,
      authToken: tok.access_token,
      refreshToken: tok.refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + tok.expires_in * 1_000),
      connected: true,
      status: 'active',
    };
  }

  /* 3 ─ silent refresh */
  async refreshToken(acc: any) {
    if (!acc.refresh_token) {
      throw new Error('No refresh token available');
    }

    const tok = await ytFetch<{ access_token: string; expires_in: number }>(
      TOKEN_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: acc.refresh_token,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      }
    );

    // update the account with the new token using API service
    await socialApiService.updateSocialAccount(acc.id, {
      authToken: tok.access_token,
      accessTokenExpiresAt: new Date(Date.now() + tok.expires_in * 1_000),
    });

    return {
      ...acc,
      authToken: tok.access_token,
      accessTokenExpiresAt: new Date(Date.now() + tok.expires_in * 1_000),
    };
  }
  async disconnectAccount(a: SocialAccount) {
    a.connected = false;
  }

  /* 4 ─ one synthetic "page" == the channel  */
  async listPages(acc: SocialAccount): Promise<SocialPage[]> {
    if (!acc.authToken) {
      throw new Error(
        'YouTube authentication token is missing. Please reconnect your YouTube account.'
      );
    }

    return [
      {
        id: crypto.randomUUID(),
        platform: 'youtube',
        entityType: 'channel',
        name: acc.name,
        pageId: acc.accountId,
        authToken: acc.authToken,
        authTokenExpiresAt: acc.accessTokenExpiresAt,
        connected: true,
        status: 'active',
        accountId: acc.id,
        statusUpdatedAt: new Date(),
      },
    ];
  }
  async connectPage(a: SocialAccount) {
    return (await this.listPages(a))[0];
  }
  async disconnectPage(p: SocialPage) {
    p.connected = false;
    p.status = 'expired';
  }
  async checkPageStatus(p: SocialPage) {
    return { ...p };
  }

  async getToken(pageId: string): Promise<string> {
    try {
      const pageData = await socialApiService.getSocialPage(pageId);

      // check if the token is expired
      const now = new Date();
      const expiresAt = pageData.authTokenExpiresAt
        ? new Date(pageData.authTokenExpiresAt)
        : null;
      if (expiresAt && expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
        return pageData.authToken ?? '';
      }

      // fetch the account from the database
      const account = await socialApiService.getSocialAccount(
        pageData.accountId
      );

      if (!account) {
        throw new Error('Failed to get account');
      }

      // refresh the token
      const refreshedToken = await this.refreshToken(account);
      if (!refreshedToken.authToken) {
        throw new Error(
          'Failed to refresh YouTube token. Please reconnect your YouTube account.'
        );
      }

      // update the token in the database
      await socialApiService.updateSocialPage(pageId, {
        authToken: refreshedToken.authToken,
        authTokenExpiresAt:
          refreshedToken.accessTokenExpiresAt?.toISOString() || null,
      });

      return refreshedToken.authToken;
    } catch (error) {
      throw new Error(
        'Failed to get YouTube token. Please reconnect your YouTube account.'
      );
    }
  }
  /* 5 ─ upload video */
  async publishPost(
    page: SocialPage,
    content: PostContent,
    options?: PublishOptions
  ): Promise<PostHistory> {
    /* —— browser side: call the server route —— */
    if (IS_BROWSER) {
      const res = await fetch('/api/social/youtube/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          post: {
            id: content.id,
            content: content.text,
            mediaUrls: content.media?.urls,
          },
          options,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    if (!content.media?.urls[0]) {
      throw new Error('YouTube API needs a video file URL.');
    }

    // fetch the token from the database
    const token = await this.getToken(page.id);
    if (!token) {
      throw new Error('No auth token available');
    }

    // Build snippet with settings from options
    const snippet: any = {
      title:
        content.title?.slice(0, 100) ||
        content.text.slice(0, 100) ||
        'Untitled',
      description: options?.description || content.text,
    };

    const status: any = {
      privacyStatus: options?.visibility || 'public',
      selfDeclaredMadeForKids: options?.madeForKids || false,
    };

    let vid: { id: string };
    vid = await this.resumableUpload(
      token,
      content.media.urls[0],
      snippet,
      status
    );

    // Save the published post ID to the platform_post_ids column
    try {
      await updatePlatformPostId(content.id!, 'youtube', vid.id, page.id);
    } catch (error) {
      console.warn('Failed to save YouTube post ID:', error);
      // Don't fail the publish if saving the ID fails
    }

    return {
      id: vid.id,
      pageId: page.id,
      postId: vid.id,
      content: content.text,
      mediaUrls: content.media.urls,
      status: 'published',
      publishedAt: new Date(),
      analytics: {},
    };
  }

  /* 5 — delete a YouTube video */
  async deletePost(page: SocialPage, postId: string): Promise<void> {
    if (IS_BROWSER) {
      const res = await fetch('/api/social/youtube/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, postId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return;
    }

    const token = await this.getToken(page.id);
    if (!token) {
      throw new Error('No token found for page');
    }

    // YouTube Data API v3 - Videos: delete
    // https://developers.google.com/youtube/v3/docs/videos/delete
    const response = await fetch(
      `${cfg.baseUrl}/videos?id=${encodeURIComponent(postId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[YouTube] Delete video failed: ${response.status} - ${errorText}`
      );

      if (response.status === 403) {
        throw new Error(
          'Video cannot be deleted. You may not have permission to delete this video.'
        );
      } else if (response.status === 404) {
        throw new Error('Video not found. It may have already been deleted.');
      } else {
        throw new Error(
          `Failed to delete YouTube video: ${response.status} - ${errorText}`
        );
      }
    }

    console.log(`[YouTube] Successfully deleted video ${postId}`);
  }

  /* 6 — get post history using videos.list API */
  async getPostHistory(
    pg: SocialPage,
    limit = 20,
    nextPage?: string | number
  ): Promise<PostHistoryResponse<PostHistory>> {
    if (IS_BROWSER) {
      const res = await fetch('/api/social/youtube/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pg,
          limit,
          nextPage,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    try {
      const token = await this.getToken(pg.id);
      if (!token) {
        throw new Error('Token not found');
      }

      // First, get the uploads playlist ID for the channel
      const channelResponse = await ytFetch<{
        items: Array<{
          contentDetails: {
            relatedPlaylists: {
              uploads: string;
            };
          };
        }>;
      }>(`${cfg.baseUrl}/channels?part=contentDetails&id=${pg.pageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!channelResponse.items || channelResponse.items.length === 0) {
        throw new Error('Channel not found');
      }

      const uploadsPlaylistId =
        channelResponse.items[0].contentDetails.relatedPlaylists.uploads;

      // Now get videos from the uploads playlist
      const response = await ytFetch<{
        kind: string;
        etag: string;
        nextPageToken?: string;
        prevPageToken?: string;
        pageInfo: {
          totalResults: number;
          resultsPerPage: number;
        };
        items: Array<{
          id: string;
          snippet: {
            publishedAt: string;
            channelId: string;
            title: string;
            description: string;
            thumbnails: {
              default: { url: string; width: number; height: number };
              medium: { url: string; width: number; height: number };
              high: { url: string; width: number; height: number };
            };
            channelTitle: string;
            resourceId: {
              videoId: string;
            };
          };
        }>;
      }>(
        `${cfg.baseUrl}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${Math.min(limit, 50)}${nextPage ? `&pageToken=${nextPage}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Get video IDs to fetch detailed statistics
      const videoIds = response.items
        .map((item) => item.snippet.resourceId.videoId)
        .join(',');

      // Fetch detailed video information including statistics, status, and contentDetails
      // https://developers.google.com/youtube/v3/docs/videos/list
      const videosResponse = await ytFetch<{
        items: Array<{
          id: string;
          snippet: {
            publishedAt: string;
            channelId: string;
            title: string;
            description: string;
            thumbnails: {
              default: { url: string; width: number; height: number };
              medium: { url: string; width: number; height: number };
              high: { url: string; width: number; height: number };
            };
            channelTitle: string;
            tags?: string[];
            categoryId: string;
            liveBroadcastContent: string;
          };
          statistics: {
            viewCount: string;
            likeCount: string;
            dislikeCount: string;
            favoriteCount: string;
            commentCount: string;
          };
          status: {
            uploadStatus: string;
            privacyStatus: string;
            license: string;
            embeddable: boolean;
            publicStatsViewable: boolean;
            madeForKids: boolean;
          };
          contentDetails: {
            duration: string;
            dimension: string;
            definition: string;
            caption: string;
            licensedContent: boolean;
            projection: string;
          };
        }>;
      }>(
        `${cfg.baseUrl}/videos?part=snippet,statistics,status,contentDetails&id=${videoIds}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const channelVideos = videosResponse.items || [];

      const posts = channelVideos.map((video) => ({
        id: video.id,
        postId: video.id,
        pageId: pg.id,
        content: video.snippet.title,
        mediaUrls: [`https://www.youtube.com/watch?v=${video.id}`],
        status: 'published' as const,
        publishedAt: new Date(video.snippet.publishedAt),
        analytics: {
          views: parseInt(video.statistics.viewCount || '0'),
          likes: parseInt(video.statistics.likeCount || '0'),
          comments: parseInt(video.statistics.commentCount || '0'),
          metadata: {
            youtubeVideoId: video.id,
            description: video.snippet.description,
            channelTitle: video.snippet.channelTitle,
            channelId: video.snippet.channelId,
            thumbnailUrl:
              video.snippet.thumbnails.high?.url ||
              video.snippet.thumbnails.medium?.url ||
              video.snippet.thumbnails.default?.url,
            tags: video.snippet.tags || [],
            categoryId: video.snippet.categoryId,
            liveBroadcastContent: video.snippet.liveBroadcastContent,
            platform: 'youtube',
            duration: video.contentDetails.duration,
            privacyStatus: video.status.privacyStatus,
            madeForKids: video.status.madeForKids,
            uploadStatus: video.status.uploadStatus,
            embeddable: video.status.embeddable,
            publicStatsViewable: video.status.publicStatsViewable,
            dimension: video.contentDetails.dimension,
            definition: video.contentDetails.definition,
            caption: video.contentDetails.caption,
            licensedContent: video.contentDetails.licensedContent,
            favoriteCount: parseInt(video.statistics.favoriteCount || '0'),
            dislikeCount: parseInt(video.statistics.dislikeCount || '0'),
          },
        },
      }));

        return { 
          posts, 
          nextPage: response.nextPageToken || undefined 
        };
      } catch (error) {
        console.error('[YouTube] Failed to get post history:', error);
        return { posts: [], nextPage: undefined };
      }
    }
    async getPostAnalytics(page: SocialPage, postId: string, startDate?: string, endDate?: string): Promise<any> {
      // Prevent browser calls - route to API endpoint
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/social/youtube/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page, postId, startDate, endDate }),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      }

      try {
        const token = await this.getToken(page.id);
        if (!token) {
          throw new Error('No auth token available');
        }

        // Use YouTube Data API v3 to get video statistics
        const response = await fetch(`${cfg.baseUrl}/videos?part=snippet,statistics,status,contentDetails&id=${postId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const video = data.items?.[0];
        
        return video;
      } catch (error) {
        console.error('[YouTube] Failed to get post analytics:', error);
        throw error;
      }
    }

    async getPageAnalytics(page: SocialPage): Promise<any> {
      // Prevent browser calls - route to API endpoint
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/social/youtube/page-analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page }),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      }

      try {
        const token = await this.getToken(page.id);
        if (!token) {
          throw new Error('No auth token available');
        }

        // Get channel analytics
        const analytics = await this.getChannelAnalytics(token, page.pageId);

        return {
          pageId: page.pageId,
          pageName: page.name,
          entityType: 'channel',
          analytics: analytics,
          lastUpdated: new Date().toISOString()
        };
      } catch (error: any) {
        console.error('[YouTube] Failed to fetch page analytics:', error);
        throw new Error(`Failed to fetch page analytics: ${error.message}`);
      }
    }

    private async getChannelAnalytics(token: string, channelId: string): Promise<any> {
      try {
        // Get channel statistics
        const channelResponse = await fetch(`${cfg.baseUrl}/channels?part=statistics,snippet&id=${channelId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!channelResponse.ok) {
          throw new Error(`YouTube API Error: ${channelResponse.status} ${channelResponse.statusText}`);
        }

        const channelData = await channelResponse.json();
        const channel = channelData.items?.[0];

        if (!channel) {
          throw new Error('Channel not found');
        }

        const stats = channel.statistics;
        const snippet = channel.snippet;

        return {
          channelId: channelId,
          title: snippet.title,
          description: snippet.description,
          subscriberCount: parseInt(stats.subscriberCount) || 0,
          videoCount: parseInt(stats.videoCount) || 0,
          viewCount: parseInt(stats.viewCount) || 0,
          customUrl: snippet.customUrl,
          publishedAt: snippet.publishedAt,
          thumbnails: snippet.thumbnails,
          analyticsDescription: 'YouTube channel analytics',
          metadata: {
            platform: 'youtube',
            analyticsType: 'channel',
            lastUpdated: new Date().toISOString()
          }
        };
      } catch (error) {
        console.error('[YouTube] Failed to fetch channel analytics:', error);
        throw error;
      }
    }

  // Get file info (size and MIME type) from URL
  async getFileInfo(
    url: string
  ): Promise<{ fileSize: number; mimeType: string }> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const fileSize = parseInt(
        response.headers.get('content-length') || '0',
        10
      );
      const mimeType = response.headers.get('content-type') || 'video/*';

      if (fileSize === 0) {
        console.warn('Could not determine file size, defaulting to 10MB');
        return { fileSize: 10 * 1024 * 1024, mimeType };
      }

      return { fileSize, mimeType };
    } catch (error) {
      console.warn('Error getting file info, using defaults:', error);
      return { fileSize: 10 * 1024 * 1024, mimeType: 'video/*' };
    }
  }

  // Initialize resumable upload session
  async initializeResumableUpload(
    token: string,
    snippet: any,
    status: any,
    fileSize: number,
    mimeType: string
  ): Promise<string> {
    const url =
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Length': fileSize.toString(),
      'X-Upload-Content-Type': mimeType,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ snippet, status }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error starting resumable session:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(
        `Failed to initialize resumable upload: ${response.status} ${errorText}`
      );
    }

    const uploadUrl = response.headers.get('location');
    if (!uploadUrl) {
      throw new Error(
        'Failed to get upload URL from resumable upload initialization'
      );
    }

    return uploadUrl;
  }

  // Download a specific chunk of the video using HTTP Range requests
  async downloadChunk(
    videoUrl: string,
    startByte: number,
    endByte: number
  ): Promise<Uint8Array> {
    try {
      console.log(`Downloading chunk from ${startByte} to ${endByte}`);
      const response = await fetch(videoUrl, {
        headers: {
          Range: `bytes=${startByte}-${endByte}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to download chunk: ${response.status} ${response.statusText}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error(
        `Error downloading chunk from ${startByte} to ${endByte}:`,
        error
      );
      throw error;
    }
  }

  // Upload video in chunks using HTTP Range requests (based on working reference code)
  async uploadVideoInChunks(
    token: string,
    uploadUrl: string,
    videoUrl: string,
    fileSize: number,
    mimeType: string
  ): Promise<{ id: string }> {
    try {
      console.log('Uploading video in chunks...');

      const chunkSize = 10 * 1024 * 1024; // 10MB per chunk (multiple of 256KB)
      let startByte = 0;
      let endByte = Math.min(chunkSize - 1, fileSize - 1);
      let videoId: string | undefined;

      // Loop through the video in chunks
      while (startByte < fileSize) {
        const chunk = await this.downloadChunk(videoUrl, startByte, endByte);
        console.log('Chunk Downloaded:', chunk.length, 'bytes');

        // Set the upload headers (matching your working code exactly)
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Length': chunk.length.toString(),
          'Content-Type': mimeType,
          'Content-Range': `bytes ${startByte}-${endByte}/${fileSize}`,
        };

        console.log('Uploading chunk from', startByte, 'to', endByte);
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers,
          body: new Uint8Array(chunk),
        });

        console.log(
          `Uploaded chunk ${startByte} to ${endByte}, status: ${uploadResponse.status}`
        );

        // Handle different response codes
        if (uploadResponse.status === 200) {
          // Upload completed successfully
          const result = await uploadResponse.json();
          videoId = result.id;
          console.log('Upload completed successfully:', result);
          break;
        } else if (uploadResponse.status === 308) {
          // 308 Resume Incomplete - this is normal, upload is progressing
          console.log(
            `Chunk uploaded successfully (308): bytes ${startByte}-${endByte}`
          );
          // Continue to next chunk
        } else if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Upload chunk failed:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            error: errorText,
            startByte,
            endByte,
            chunkSize: chunk.length,
          });
          throw new Error(
            `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`
          );
        }

        // Move to next chunk
        startByte = endByte + 1;
        endByte = Math.min(startByte + chunkSize - 1, fileSize - 1);
      }

      if (!videoId) {
        throw new Error('Upload completed but no video ID returned');
      }

      return { id: videoId };
    } catch (error) {
      console.error('Error uploading video in chunks:', error);
      throw error;
    }
  }

  // Resumable upload
  async resumableUpload(
    token: string,
    videoUrl: string,
    snippet: any,
    status: any
  ): Promise<{ id: string }> {
    console.log('Starting resumable upload...');

    // Get file size and MIME type
    const { fileSize, mimeType } = await this.getFileInfo(videoUrl);
    console.log(`File size: ${fileSize} bytes, MIME type: ${mimeType}`);

    // Initialize resumable upload
    const uploadUrl = await this.initializeResumableUpload(
      token,
      snippet,
      status,
      fileSize,
      mimeType
    );
    console.log('Resumable upload initialized:', { uploadUrl });

    // Upload in chunks using HTTP Range requests
    return await this.uploadVideoInChunks(
      token,
      uploadUrl,
      videoUrl,
      fileSize,
      mimeType
    );
  }

  async createPost(
    page: SocialPage,
    content: PostContent,
    options?: PublishOptions
  ): Promise<PostHistory> {
    return this.publishPost(page, content, options);
  }

  async schedulePost(
    page: SocialPage,
    content: PostContent,
    scheduledTime: Date,
    options?: PublishOptions
  ): Promise<PostHistory> {
    // For now, just publish immediately since scheduling is not implemented
    return this.publishPost(page, content, options);
  }

  getPlatformFeatures() {
    return cfg.features;
  }

  validateContent(content: PostContent): {
    isValid: boolean;
    errors?: string[];
  } {
    const errors: string[] = [];
    const features = cfg.features;

    // Check text length (used as description)
    if (content.text.length > features.characterLimits.content) {
      errors.push(
        `Description exceeds maximum length of ${features.characterLimits.content} characters`
      );
    }

    // Check title length if provided
    if (
      content.title &&
      features.characterLimits.title &&
      content.title.length > features.characterLimits.title
    ) {
      errors.push(
        `Title exceeds maximum length of ${features.characterLimits.title} characters`
      );
    }

    // Validate media
    if (!content.media || !content.media.urls.length) {
      errors.push('YouTube requires a video file');
    } else if (content.media.type !== 'video') {
      errors.push('Only video media type is supported');
    } else if (content.media.urls.length > features.maxMediaCount) {
      errors.push(
        `YouTube only supports ${features.maxMediaCount} video per post`
      );
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
