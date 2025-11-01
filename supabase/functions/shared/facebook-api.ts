// shared/facebook-api.ts
// Reusable Facebook Graph API functions for Edge Functions
// These can be imported by any Edge Function that needs to interact with Facebook API

export interface FacebookPageInsights {
  data: Array<{
    name: string;
    period: string;
    values: Array<{ 
      value: number | Record<string, number>;
      end_time?: string;
    }>;
    title?: string;
    description?: string;
  }>;
}

/**
 * Refresh Facebook access token using fb_exchange_token
 * Facebook uses long-lived tokens that can be extended
 * 
 * Documentation:
 * - https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived
 * - https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow#extend-token
 */
export async function refreshFacebookToken(
  accessToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const TOKEN_URL = "https://graph.facebook.com/v23.0/oauth/access_token";
  
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: accessToken,
  });
  
  const response = await fetch(`${TOKEN_URL}?${params.toString()}`, {
    method: "GET",
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Facebook token refresh failed: ${response.status} ${response.statusText}. ${errorText}`);
  }

  return await response.json();
}

/**
 * Fetch Facebook page basic info (followers, likes)
 * 
 * Documentation:
 * - https://developers.facebook.com/docs/graph-api/reference/page
 * - Fields: https://developers.facebook.com/docs/graph-api/reference/page#fields
 */
export async function fetchFacebookPageInfo(
  token: string,
  pageId: string
): Promise<{ followers?: number; likes?: number }> {
  const url = `https://graph.facebook.com/v23.0/${pageId}?fields=followers_count,fan_count&access_token=${token}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Facebook API Error (page info): ${response.status} ${response.statusText}. ${errorText}`);
  }

  const data = await response.json();
  return {
    followers: data.followers_count || data.fan_count || 0,
    likes: data.fan_count || 0
  };
}

/**
 * Fetch Facebook page insights directly from Facebook API
 * 
 * Documentation:
 * - https://developers.facebook.com/docs/graph-api/reference/insights
 * - Page Insights Metrics: https://developers.facebook.com/docs/graph-api/reference/insights#page-metrics
 * - Available metrics: https://developers.facebook.com/docs/graph-api/reference/insights#page-metrics-reference
 */
export async function fetchFacebookPageInsights(
  token: string,
  pageId: string,
  options?: {
    metrics?: string[];
    period?: 'day' | 'week' | 'days_28' | 'lifetime';
  }
): Promise<FacebookPageInsights> {
  const defaultMetrics = [
    'page_impressions',      // Total number of impressions for your Page
    'page_fan_adds',         // Number of new people who have liked your Page
    'page_views_total',      // Total number of views of your Page
    'page_posts_impressions', // Number of impressions of posts published by the Page
    'page_follows',          // Number of new follows for your Page
  ];

  const metrics = options?.metrics || defaultMetrics;
  const period = options?.period || 'day';

  const url = `https://graph.facebook.com/v23.0/${pageId}/insights`;
  
  const params = new URLSearchParams({
    metric: metrics.join(','),
    period: period,
    access_token: token
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Facebook API Error (insights): ${response.status} ${response.statusText}. ${errorText}`);
  }

  const data = await response.json();
  return { data: data.data || [] };
}

