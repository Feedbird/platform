import type { SocialPlatformConfig } from '../social/platforms/platform-types';

// Base configuration that all platforms extend
export const basePlatformConfig: Partial<SocialPlatformConfig> = {
  features: {
    multipleAccounts: false,
    multiplePages: true,
    scheduling: true,
    analytics: true,
    deletion: false,
    characterLimits: {
      content: 2000,
      title: 100,
    },
    mediaTypes: ['image', 'video', 'carousel'],
    maxMediaCount: 1,
  },
};

// Helper function to merge platform-specific config with base config
export function createPlatformConfig(
  platformConfig: Partial<SocialPlatformConfig>
): SocialPlatformConfig {
  return {
    ...basePlatformConfig,
    ...platformConfig,
    features: {
      ...basePlatformConfig.features,
      ...platformConfig.features,
      characterLimits: {
        ...basePlatformConfig.features?.characterLimits,
        ...platformConfig.features?.characterLimits,
      },
    },
  } as SocialPlatformConfig;
}

// Helper function to validate platform configuration
export function validatePlatformConfig(config: SocialPlatformConfig): void {
  const requiredFields = ['name', 'baseUrl', 'apiVersion', 'features'];
  const missingFields = requiredFields.filter(field => !(field in config));
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields in platform config: ${missingFields.join(', ')}`);
  }

  // Validate features
  const features = config.features;
  if (!features) {
    throw new Error('Platform config must include features');
  }

  // Validate character limits
  if (!features.characterLimits?.content) {
    throw new Error('Platform config must specify content character limit');
  }

  // Validate media types
  if (!Array.isArray(features.mediaTypes) || features.mediaTypes.length === 0) {
    throw new Error('Platform config must specify supported media types');
  }

  // Validate max media count
  if (typeof features.maxMediaCount !== 'number' || features.maxMediaCount < 1) {
    throw new Error('Platform config must specify valid max media count');
  }
}

// Helper function to get platform-specific error messages
export function getPlatformErrorMessage(
  platform: string,
  errorCode: string,
  context?: string
): string {
  const errorMessages: Record<string, Record<string, string>> = {
    facebook: {
      TOKEN_EXPIRED: 'Your Facebook access token has expired. Please reconnect your account.',
      INVALID_PAGE: 'The selected Facebook page is not accessible or has been disconnected.',
      MEDIA_ERROR: 'Failed to upload media to Facebook. Please try again.',
    },
    instagram: {
      TOKEN_EXPIRED: 'Your Instagram access token has expired. Please reconnect your account.',
      INVALID_ACCOUNT: 'The selected Instagram account is not accessible or has been disconnected.',
      MEDIA_ERROR: 'Failed to upload media to Instagram. Please ensure your media meets the requirements.',
    },
    linkedin: {
      TOKEN_EXPIRED: 'Your LinkedIn access token has expired. Please reconnect your account.',
      INVALID_PAGE: 'The selected LinkedIn page is not accessible or has been disconnected.',
      MEDIA_ERROR: 'Failed to upload media to LinkedIn. Please try again.',
    },
    // Add more platforms as needed
  };

  const platformMessages = errorMessages[platform.toLowerCase()];
  if (!platformMessages) {
    return context ? `Error: ${context}` : 'An error occurred';
  }

  const message = platformMessages[errorCode];
  if (!message) {
    return context ? `Error: ${context}` : 'An error occurred';
  }

  return message;
} 