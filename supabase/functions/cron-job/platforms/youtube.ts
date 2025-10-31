// platforms/youtube.ts
// YouTube platform handler for Edge Function environment

import { 
  fetchSocialAccount, 
  snapshotExists, 
  saveSnapshot,
  type SocialAccount 
} from "../utils.ts";
import { supabase } from "../supabase-client.ts";
import { youtubeClientId, youtubeClientSecret } from "../config.ts";

export interface YouTubeChannelStats {
  viewCount: string;
  subscriberCount: string;
  hiddenSubscriberCount: boolean;
  videoCount: string;
}

export interface YouTubeChannelAnalytics {
  channelId: string;
  statistics: YouTubeChannelStats;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
  };
}

interface YouTubePage {
  id: string;
  page_id: string;
  name: string;
  auth_token: string;
  auth_token_expires_at: string | null;
  account_id: string;
}

interface YouTubeAccount {
  id: string;
  refresh_token: string;
}

/**
 * Refresh YouTube access token using refresh token
 */
export async function refreshYouTubeToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const TOKEN_URL = "https://oauth2.googleapis.com/token";
  
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube token refresh failed: ${response.status} ${response.statusText}. ${errorText}`);
  }

  return await response.json();
}

/**
 * Fetch YouTube channel analytics with automatic token refresh
 * This is the main entry point - handles everything internally
 */
export async function fetchYouTubeChannelAnalyticsWithRefresh(
  page: YouTubePage,
  account: YouTubeAccount,
  clientId: string,
  clientSecret: string,
  supabase: any // Supabase client from parent
): Promise<YouTubeChannelAnalytics> {
  // Check if token needs refresh
  const now = new Date();
  const expiresAt = page.auth_token_expires_at ? new Date(page.auth_token_expires_at) : null;
  let validToken = page.auth_token;
  
  // If token is expired or will expire in less than 5 minutes, refresh it
  if (!expiresAt || expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log(`[YouTube] Token expired for ${page.name}, refreshing...`);
    
    const newToken = await refreshYouTubeToken(
      account.refresh_token,
      clientId,
      clientSecret
    );
    
    validToken = newToken.access_token;
    
    // Update database with new token
    const expiresAtISO = new Date(Date.now() + newToken.expires_in * 1000).toISOString();
    const { error: updateError } = await supabase
      .from('social_pages')
      .update({ 
        auth_token: validToken,
        auth_token_expires_at: expiresAtISO
      })
      .eq('id', page.id);
    
    if (updateError) {
      console.error('Failed to update token in database:', updateError);
      // Continue anyway - we have a valid token
    }
  }

  // Now fetch analytics with the valid token
  return await fetchYouTubeChannelAnalytics(validToken, page.page_id);
}

/**
 * Fetch YouTube channel analytics directly from YouTube API
 */
export async function fetchYouTubeChannelAnalytics(
  token: string,
  channelId: string
): Promise<YouTubeChannelAnalytics> {
  const baseUrl = 'https://www.googleapis.com/youtube/v3';
  const url = `${baseUrl}/channels?part=statistics,snippet&id=${channelId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube API Error: ${response.status} ${response.statusText}. ${errorText}`);
  }

  const data = await response.json();
  const channel = data.items?.[0];

  if (!channel) {
    throw new Error('Channel not found');
  }

  return {
    channelId: channel.id,
    statistics: channel.statistics,
    snippet: {
      title: channel.snippet?.title || '',
      description: channel.snippet?.description || '',
      customUrl: channel.snippet?.customUrl
    }
  };
}

/**
 * Transform YouTube analytics to standardized format for database
 */
export function transformYouTubeAnalytics(
  channelData: YouTubeChannelAnalytics,
  pageId: string,
  accountId: string,
  platform: string
) {
  const stats = channelData.statistics;
  const today = new Date().toISOString().split('T')[0];

  return {
    page_id: pageId,
    account_id: accountId,
    platform: platform,
    snapshot_date: today,
    // Available metrics for YouTube channel
    follower_count: parseInt(stats.subscriberCount || '0', 10),
    post_count: parseInt(stats.videoCount || '0', 10),
    total_views: parseInt(stats.viewCount || '0', 10),
    // Not available at YouTube channel level - set to null to distinguish from zero values
    following_count: null,
    total_likes: null,
    page_impressions: null,
    page_reach: null,
    page_engagement: null,
    raw_metrics: {
      channelId: channelData.channelId,
      statistics: stats,
      snippet: channelData.snippet,
      hiddenSubscriberCount: stats.hiddenSubscriberCount
    },
    demographic_data: {},
    platform_metadata: {
      platform: 'youtube',
      analyticsType: 'channel',
      channelId: channelData.channelId,
      lastUpdated: new Date().toISOString(),
      // Indicate which metrics are not available at channel level
      availableMetrics: ['follower_count', 'post_count', 'total_views'],
      unavailableMetrics: ['following_count', 'total_likes', 'page_impressions', 'page_reach', 'page_engagement']
    }
  };
}

/**
 * Complete YouTube sync - handles everything internally
 * This is the main entry point for syncing a YouTube page
 */
export async function syncYouTubeAnalytics(page: YouTubePage): Promise<void> {
  if (!youtubeClientId || !youtubeClientSecret) {
    throw new Error('YouTube credentials not configured');
  }

  try {
    // Get account data for refresh token
    const account = await fetchSocialAccount(page.account_id);
    if (!account) {
      throw new Error('Account not found');
    }

    if (!account.refresh_token) {
      throw new Error('No refresh token available');
    }

    // Fetch analytics (token refresh handled internally)
    const analytics = await fetchYouTubeChannelAnalyticsWithRefresh(
      page,
      account,
      youtubeClientId,
      youtubeClientSecret,
      supabase
    );
    
    // Transform to standardized format
    const snapshot = transformYouTubeAnalytics(
      analytics,
      page.id,
      page.account_id,
      'youtube'
    );

    // Save to database
    await saveSnapshot(snapshot);
    
  } catch (error) {
    console.error(`[YouTube] Error syncing ${page.name}:`, error);
    throw error;
  }
}
