import type { YouTubeSettings, PublishOptions } from '@/lib/social/platforms/platform-types';

/**
 * Maps YouTube settings from the UI to PublishOptions for the platform
 */
export function mapYouTubeSettingsToPublishOptions(youtubeSettings: YouTubeSettings): Partial<PublishOptions> {
  return {
    visibility: youtubeSettings.privacyStatus,
    madeForKids: youtubeSettings.madeForKids,
    description: youtubeSettings.description,
  };
}

/**
 * Gets the default YouTube settings
 */
export function getDefaultYouTubeSettings(): YouTubeSettings {
  return {
    privacyStatus: 'public',
    madeForKids: false,
  };
}
