// analytics-sync.ts
// Main analytics synchronization service for Edge Function

import { supabase } from "./supabase-client.ts";
import { syncYouTubeAnalytics } from "./platforms/youtube.ts";
import type { SocialAccount } from "./utils.ts";
import { snapshotExists, fetchSocialPages } from "./utils.ts";

/**
 * Main sync function - processes all social pages
 */
export async function syncAllAnalytics(): Promise<void> {
  console.log('Starting analytics sync...');
  
  // Fetch all social pages
  const pages = await fetchSocialPages();
  console.log(`Found ${pages.length} connected social pages`);

  if (pages.length === 0) {
    console.log('No connected pages to sync');
    return;
  }
  
  // Group pages by platform
  const pagesByPlatform = pages.reduce((acc, page) => {
    if (!acc[page.platform]) {
      acc[page.platform] = [];
    }
    acc[page.platform].push(page);
    return acc;
  }, {} as Record<string, typeof pages>);

  // Process each platform
  for (const [platform, platformPages] of Object.entries(pagesByPlatform)) {
    console.log(`Processing ${platformPages.length} ${platform} pages...`);
    
    for (const page of platformPages) {
      try {
        // Check if snapshot already exists for today
        const today = new Date().toISOString().split('T')[0];
        const exists = await snapshotExists(page.id, today);
        if (exists) {
          console.log(`[${page.platform}] Snapshot already exists for ${page.name} on ${today}`);
          continue;
        }

        switch (platform) {
          case 'youtube':
            // Sync YouTube (all logic handled internally)
            await syncYouTubeAnalytics(page);
            break;
          default:
            console.log(`[${platform}] Not yet implemented, skipping ${page.name}`);
        }
      } catch (error) {
        console.error(`Failed to sync ${page.name}:`, error);
        // Continue with other pages even if one fails
      }
    }
  }

  console.log('Analytics sync completed');
}
