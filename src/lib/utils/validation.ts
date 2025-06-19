import type { PostContent, SocialPlatformConfig } from '../social/platforms/platform-types';
import { SocialAPIError } from './error-handler';

interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export function validatePostContent(
  content: PostContent,
  platform: string,
  config: SocialPlatformConfig
): ValidationResult {
  const errors: string[] = [];
  const features = config.features;

  // Validate text content
  if (!content.text && !content.media) {
    errors.push('Post must contain either text or media');
  }

  if (content.text) {
    if (content.text.length > features.characterLimits.content) {
      errors.push(
        `Text exceeds maximum length of ${features.characterLimits.content} characters for ${platform}`
      );
    }
  }

  // Validate title if present
  if (content.title) {
    if (features.characterLimits.title && content.title.length > features.characterLimits.title) {
      errors.push(
        `Title exceeds maximum length of ${features.characterLimits.title} characters for ${platform}`
      );
    }
  }

  // Validate media
  if (content.media) {
    // Check media type support
    if (!features.mediaTypes.includes(content.media.type)) {
      errors.push(
        `Media type '${content.media.type}' is not supported by ${platform}. Supported types: ${features.mediaTypes.join(', ')}`
      );
    }

    // Check media count
    if (content.media.urls.length > features.maxMediaCount) {
      errors.push(
        `${platform} allows a maximum of ${features.maxMediaCount} media items per post`
      );
    }

    // Validate each media URL
    content.media.urls.forEach((url, index) => {
      if (!isValidMediaUrl(url)) {
        errors.push(`Invalid media URL at position ${index + 1}`);
      }
    });

    // Platform-specific media validations
    const mediaErrors = validatePlatformSpecificMedia(content.media, platform);
    errors.push(...mediaErrors);
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

function isValidMediaUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validatePlatformSpecificMedia(
  media: PostContent['media'],
  platform: string
): string[] {
  const errors: string[] = [];

  if (!media) return errors;

  switch (platform.toLowerCase()) {
    case 'instagram':
      // Instagram-specific validations
      if (media.type === 'carousel' && media.urls.length < 2) {
        errors.push('Instagram carousel posts must have at least 2 media items');
      }
      if (media.type === 'image') {
        media.urls.forEach((url, index) => {
          if (!url.match(/\.(jpg|jpeg|png)$/i)) {
            errors.push(`Instagram image at position ${index + 1} must be JPG or PNG`);
          }
        });
      }
      break;

    case 'facebook':
      // Facebook-specific validations
      if (media.type === 'video') {
        media.urls.forEach((url, index) => {
          if (!url.match(/\.(mp4|mov)$/i)) {
            errors.push(`Facebook video at position ${index + 1} must be MP4 or MOV`);
          }
        });
      }
      break;

    case 'linkedin':
      // LinkedIn-specific validations
      if (media.type === 'carousel' && media.urls.length > 9) {
        errors.push('LinkedIn carousel posts cannot exceed 9 media items');
      }
      break;

    case 'pinterest':
      // Pinterest-specific validations
      if (media.urls.length > 1) {
        errors.push('Pinterest only supports single media posts');
      }
      break;
  }

  return errors;
}

export function validateScheduledTime(
  scheduledTime: Date,
  platform: string,
  config: SocialPlatformConfig
): ValidationResult {
  const errors: string[] = [];

  if (!config.features.scheduling) {
    errors.push(`${platform} does not support post scheduling`);
    return { isValid: false, errors };
  }

  const now = new Date();
  const minScheduleTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
  const maxScheduleTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

  if (scheduledTime < minScheduleTime) {
    errors.push('Scheduled time must be at least 10 minutes in the future');
  }

  if (scheduledTime > maxScheduleTime) {
    errors.push('Scheduled time cannot be more than 1 year in the future');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export function validatePagePermissions(
  permissions: string[],
  platform: string,
  requiredPermissions: string[]
): ValidationResult {
  const errors: string[] = [];
  const missing = requiredPermissions.filter(perm => !permissions.includes(perm));

  if (missing.length > 0) {
    errors.push(
      `Missing required ${platform} permissions: ${missing.join(', ')}. Please reconnect your account with the necessary permissions.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
} 