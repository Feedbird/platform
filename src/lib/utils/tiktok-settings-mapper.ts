import type { TikTokSettings, PublishOptions } from '@/lib/social/platforms/platform-types';

/**
 * Maps TikTok settings from the UI to PublishOptions for the platform
 */
export function mapTikTokSettingsToPublishOptions(tiktokSettings: TikTokSettings): Partial<PublishOptions> {
  return {
    visibility: tiktokSettings.privacyLevel === 'SELF_ONLY' ? 'private' : 'public',
    disableDuet: tiktokSettings.disableDuet,
    disableStitch: tiktokSettings.disableStitch,
    disableComment: tiktokSettings.disableComment,
    brandContentToggle: tiktokSettings.brandContentToggle,
    brandOrganicToggle: tiktokSettings.brandOrganicToggle,
    autoAddMusic: tiktokSettings.autoAddMusic,
    isAigc: tiktokSettings.isAigc,
    videoCoverTimestampMs: tiktokSettings.videoCoverTimestampMs,
  };
}

/**
 * Gets the default TikTok settings based on creator info constraints
 */
export function getDefaultTikTokSettings(creatorInfo?: {
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  privacyLevelOptions: string[];
}): TikTokSettings {
  const defaultPrivacy = creatorInfo?.privacyLevelOptions?.[0] || 'PUBLIC_TO_EVERYONE';
  
  return {
    privacyLevel: defaultPrivacy as any,
    disableDuet: creatorInfo?.duetDisabled || false,
    disableStitch: creatorInfo?.stitchDisabled || false,
    disableComment: creatorInfo?.commentDisabled || false,
    brandContentToggle: false,
    brandOrganicToggle: false,
    autoAddMusic: false,
    isAigc: false,
  };
}
