import type { YouTubeSettings, PublishOptions } from '@/lib/social/platforms/platform-types';

/**
 * Maps YouTube settings from the UI to PublishOptions for the platform
 */
export function mapYouTubeSettingsToPublishOptions(youtubeSettings: YouTubeSettings): Partial<PublishOptions> {
  return {
    visibility: youtubeSettings.privacyStatus,
    madeForKids: youtubeSettings.madeForKids,
    categoryId: youtubeSettings.categoryId,
    tags: youtubeSettings.tags,
    defaultLanguage: youtubeSettings.defaultLanguage,
    defaultAudioLanguage: youtubeSettings.defaultAudioLanguage,
    thumbnailUrl: youtubeSettings.thumbnailUrl,
  };
}

/**
 * Gets the default YouTube settings
 */
export function getDefaultYouTubeSettings(): YouTubeSettings {
  return {
    privacyStatus: 'public',
    madeForKids: false,
    categoryId: '22', // People & Blogs (default category)
    tags: [],
    defaultLanguage: 'en',
    defaultAudioLanguage: 'en',
  };
}
