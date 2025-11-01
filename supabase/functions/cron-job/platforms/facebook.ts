// platforms/facebook.ts
// Facebook platform handler for Edge Function environment (Cron Job specific)

import { 
  saveSnapshot
} from "../utils.ts";
import { supabase } from "../supabase-client.ts";
import { facebookClientId, facebookClientSecret } from "../config.ts";
// Import reusable Facebook API functions from shared folder
import {
  refreshFacebookToken,
  fetchFacebookPageInfo,
  fetchFacebookPageInsights,
  type FacebookPageInsights
} from "../../shared/facebook-api.ts";

export interface FacebookPageAnalytics {
  pageId: string;
  insights: FacebookPageInsights['data'];
  // Also fetch page info for follower count
  followers?: number;
  likes?: number;
}

interface FacebookPage {
  id: string;
  page_id: string;
  name: string;
  auth_token: string;
  auth_token_expires_at: string | null;
  account_id: string;
}


/**
 * Fetch Facebook page analytics with automatic token refresh
 * This is the main entry point - handles everything internally
 * Uses the page token directly from the database, only refreshes if expired
 */
export async function fetchFacebookPageAnalyticsWithRefresh(
  page: FacebookPage,
  clientId: string,
  clientSecret: string,
  supabase: any // Supabase client from parent
): Promise<FacebookPageAnalytics> {
  // Use the page token directly from database
  const now = new Date();
  const expiresAt = page.auth_token_expires_at ? new Date(page.auth_token_expires_at) : null;
  let validToken = page.auth_token;
  
  // Only refresh if token is expired or will expire in less than 5 minutes
  if (!expiresAt || expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log(`[Facebook] Token expired for ${page.name}, refreshing...`);
    
    // Try refreshing the page token directly (works for long-lived tokens)
    try {
      const pageTokenRefresh = await refreshFacebookToken(
        page.auth_token,
        clientId,
        clientSecret
      );
      validToken = pageTokenRefresh.access_token;
      
      // Update database with refreshed token
      const expiresAtISO = new Date(Date.now() + pageTokenRefresh.expires_in * 1000).toISOString();
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
    } catch (error) {
      console.error(`[Facebook] Failed to refresh page token: ${error}`);
      throw new Error(`Failed to refresh Facebook page token: ${error}`);
    }
  }

  // Fetch both page insights and page info in parallel using the page token
  const [insights, pageInfo] = await Promise.all([
    fetchFacebookPageInsights(validToken, page.page_id),
    fetchFacebookPageInfo(validToken, page.page_id)
  ]);

  return {
    pageId: page.page_id,
    insights: insights.data,
    followers: pageInfo.followers,
    likes: pageInfo.likes
  };
}

/**
 * Transform Facebook analytics to standardized format for database
 */
export function transformFacebookAnalytics(
  analyticsData: FacebookPageAnalytics,
  pageId: string,
  accountId: string,
  platform: string
) {
  const today = new Date().toISOString().split('T')[0];
  
  // Extract metrics from insights data
  const insightsMap: Record<string, number> = {};
  
  analyticsData.insights.forEach((insight) => {
    // Get the latest value (usually the last item in the values array)
    const latestValue = insight.values[insight.values.length - 1];
    if (latestValue && typeof latestValue.value === 'number') {
      insightsMap[insight.name] = latestValue.value;
    } else if (latestValue && typeof latestValue.value === 'object') {
      // Sometimes value is an object with breakdown, get sum or first value
      const values = Object.values(latestValue.value);
      insightsMap[insight.name] = values.reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0);
    }
  });

  // Map Facebook metrics to standardized format
  const pageImpressions = insightsMap['page_impressions'] || 0;
  const pageFanAdds = insightsMap['page_fan_adds'] || 0;
  const pageViewsTotal = insightsMap['page_views_total'] || 0;
  const pagePostsImpressions = insightsMap['page_posts_impressions'] || 0;
  const pageFollows = insightsMap['page_follows'] || 0;

  return {
    page_id: pageId,
    account_id: accountId,
    platform: platform,
    snapshot_date: today,
    // Available metrics for Facebook page
    follower_count: analyticsData.followers || 0,
    following_count: null, // Not available for Facebook pages
    post_count: null, // Not available directly in insights, would need separate API call
    total_views: pageViewsTotal,
    total_likes: analyticsData.likes || 0,
    page_impressions: pageImpressions,
    page_reach: null, // Available but requires different metric request
    page_engagement: pageFanAdds + pageFollows, // Combined engagement metric
    raw_metrics: {
      pageId: analyticsData.pageId,
      insights: analyticsData.insights,
      pageInfo: {
        followers: analyticsData.followers,
        likes: analyticsData.likes
      },
      extractedMetrics: insightsMap
    },
    demographic_data: {},
    platform_metadata: {
      platform: 'facebook',
      analyticsType: 'page_insights',
      pageId: analyticsData.pageId,
      lastUpdated: new Date().toISOString(),
      availableMetrics: [
        'follower_count', 
        'total_views', 
        'total_likes', 
        'page_impressions', 
        'page_engagement'
      ],
      unavailableMetrics: ['following_count', 'post_count', 'page_reach'],
      metricsBreakdown: {
        page_impressions: pageImpressions,
        page_fan_adds: pageFanAdds,
        page_views_total: pageViewsTotal,
        page_posts_impressions: pagePostsImpressions,
        page_follows: pageFollows
      }
    }
  };
}

/**
 * Complete Facebook sync - handles everything internally
 * This is the main entry point for syncing a Facebook page
 * Uses the page token directly from the database - no need to fetch from Facebook
 */
export async function syncFacebookAnalytics(page: FacebookPage): Promise<void> {

  try {
    // Fetch analytics (token refresh handled internally if needed)
    const analytics = await fetchFacebookPageAnalyticsWithRefresh(
      page,
      facebookClientId,
      facebookClientSecret,
      supabase
    );
    
    // Transform to standardized format
    const snapshot = transformFacebookAnalytics(
      analytics,
      page.id,
      page.account_id,
      'facebook'
    );

    // Save to database
    await saveSnapshot(snapshot);
    
  } catch (error) {
    console.error(`[Facebook] Error syncing ${page.name}:`, error);
    throw error;
  }
}

