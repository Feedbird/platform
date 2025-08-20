import type { TikTokSettings, PublishOptions } from '@/lib/social/platforms/platform-types';

/**
 * Maps TikTok settings from the UI to PublishOptions for the platform
 */
export function mapTikTokSettingsToPublishOptions(tiktokSettings: TikTokSettings): Partial<PublishOptions> {
  return {
    visibility: tiktokSettings.privacyLevel === 'SELF_ONLY' ? 'private' : 'public',
    privacyLevel: tiktokSettings.privacyLevel,
    disableDuet: tiktokSettings.disableDuet,
    disableStitch: tiktokSettings.disableStitch,
    disableComment: tiktokSettings.disableComment,
    
    // Commercial Content Disclosure
    commercialContentToggle: tiktokSettings.commercialContentToggle,
    brandContentToggle: tiktokSettings.brandContentToggle,
    brandOrganicToggle: tiktokSettings.brandOrganicToggle,
    
    // Content Settings
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
  const defaultPrivacy = 'SELF_ONLY';
  
  return {
    privacyLevel: defaultPrivacy as any,
    disableDuet: creatorInfo?.duetDisabled || false,
    disableStitch: creatorInfo?.stitchDisabled || false,
    disableComment: creatorInfo?.commentDisabled || false,
    
    // Commercial Content Disclosure (OFF by default as required by TikTok)
    commercialContentToggle: false,
    brandContentToggle: false,
    brandOrganicToggle: false,
    
    // Content Settings
    autoAddMusic: false,
    isAigc: false,
  };
}
