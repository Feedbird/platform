import type { PostHistory } from '../social/platforms/platform-types';

interface AnalyticsMetrics {
  [key: string]: number | undefined;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  reach?: number;
  engagement?: number;
}

export function calculateEngagementRate(metrics: AnalyticsMetrics): number {
  const { likes = 0, comments = 0, shares = 0, views = 0, reach = 0 } = metrics;
  const interactions = likes + comments + shares;
  const audience = reach || views;

  if (!audience) return 0;
  return (interactions / audience) * 100;
}

export function aggregateAnalytics(posts: PostHistory[]): AnalyticsMetrics {
  return posts.reduce(
    (acc, post) => {
      const analytics = post.analytics || {};
      return {
        views: (acc.views || 0) + (analytics.views || 0),
        likes: (acc.likes || 0) + (analytics.likes || 0),
        comments: (acc.comments || 0) + (analytics.comments || 0),
        shares: (acc.shares || 0) + (analytics.shares || 0),
        clicks: (acc.clicks || 0) + (analytics.clicks || 0),
        reach: (acc.reach || 0) + (analytics.reach || 0),
        engagement: (acc.engagement || 0) + (analytics.engagement || 0),
      };
    },
    {} as AnalyticsMetrics
  );
}

export function formatAnalyticsMetric(value: number, metric: keyof AnalyticsMetrics): string {
  if (value === undefined || value === null) return 'N/A';

  // Format large numbers
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  // Format percentages
  if (metric === 'engagement') {
    return `${value.toFixed(2)}%`;
  }

  return value.toString();
}

export function getAnalyticsDateRange(
  range: 'day' | 'week' | 'month' | 'year' = 'week'
): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case 'day':
      start.setDate(start.getDate() - 1);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }

  return { start, end };
}

export function filterPostsByDateRange(
  posts: PostHistory[],
  range: { start: Date; end: Date }
): PostHistory[] {
  return posts.filter(post => {
    const postDate = new Date(post.publishedAt);
    return postDate >= range.start && postDate <= range.end;
  });
}

export function calculateGrowthRate(
  current: number,
  previous: number
): { rate: number; trend: 'up' | 'down' | 'stable' } {
  if (!previous) return { rate: 0, trend: 'stable' };

  const rate = ((current - previous) / previous) * 100;
  const trend = rate > 0 ? 'up' : rate < 0 ? 'down' : 'stable';

  return { rate: Math.abs(rate), trend };
}

export function getPlatformSpecificMetrics(
  platform: string,
  metrics: AnalyticsMetrics
): Record<string, string | number> {
  const baseMetrics: Record<string, string | number> = {};
  
  // Convert undefined values to 0 for all metrics
  Object.entries(metrics).forEach(([key, value]) => {
    baseMetrics[key] = value ?? 0;
  });

  switch (platform.toLowerCase()) {
    case 'instagram':
      return {
        ...baseMetrics,
        'Engagement Rate': `${calculateEngagementRate(metrics).toFixed(2)}%`,
      };

    case 'facebook':
      return {
        ...baseMetrics,
        'Page Views': metrics.views ?? 0,
      };

    case 'linkedin':
      return {
        ...baseMetrics,
        'Click-through Rate': metrics.clicks && metrics.views
          ? `${((metrics.clicks / metrics.views) * 100).toFixed(2)}%`
          : 'N/A',
      };

    default:
      return baseMetrics;
  }
} 