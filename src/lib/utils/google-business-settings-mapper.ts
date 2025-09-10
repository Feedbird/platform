import type { GoogleBusinessSettings, GoogleBusinessPostType } from '@/lib/social/platforms/platform-types';

/**
 * Gets the default Google Business settings
 */
export function getDefaultGoogleBusinessSettings(): GoogleBusinessSettings {
  return {
    postType: 'STANDARD',
  };
}

/**
 * Gets default settings for a specific post type with proper initialization
 */
export function getDefaultSettingsForPostType(postType: GoogleBusinessPostType): GoogleBusinessSettings {
  const baseSettings: GoogleBusinessSettings = {
    postType,
  };

  if (postType === 'EVENT') {
    const currentDate = new Date();
    baseSettings.event = {
      title: '',
      startDate: {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1, // JavaScript months are 0-indexed, API expects 1-indexed
        day: currentDate.getDate()
      }
    };
  } else if (postType === 'OFFER') {
    const currentDate = new Date();
    baseSettings.offer = {
      title: '',
      couponCode: '',
      redeemOnlineUrl: '',
      termsConditions: '',
      startDate: {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1, // JavaScript months are 0-indexed, API expects 1-indexed
        day: currentDate.getDate()
      }
    };
  }

  return baseSettings;
}

/**
 * Validates Google Business settings based on post type
 */
export function validateGoogleBusinessSettings(settings: GoogleBusinessSettings): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  switch (settings.postType) {
    case 'STANDARD':
      // CTA is optional for standard posts
      if (settings.callToAction) {
        if (!settings.callToAction.url) {
          errors.push('Call to Action URL is required when CTA is enabled');
        } else {
          // Basic URL validation
          try {
            new URL(settings.callToAction.url);
          } catch {
            errors.push('Call to Action URL must be a valid URL');
          }
        }
      }
      break;

    case 'EVENT':
      if (!settings.event) {
        errors.push('Event details are required for Event posts');
      } else {
        if (!settings.event.title || !settings.event.title.trim()) {
          errors.push('Event title is required');
        }
        
        // Validate start date - check if it exists and has required properties
        if (!settings.event.startDate || 
            typeof settings.event.startDate.year !== 'number' ||
            typeof settings.event.startDate.month !== 'number' ||
            typeof settings.event.startDate.day !== 'number') {
          errors.push('Event start date is required');
        } else {
          const startDate = new Date(
            settings.event.startDate.year,
            settings.event.startDate.month - 1, // JavaScript months are 0-indexed
            settings.event.startDate.day
          );
          
          // Reset time to start of day for comparison
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          startDate.setHours(0, 0, 0, 0);
          
          if (startDate < today) {
            errors.push('Event start date cannot be in the past');
          }
          
          // Validate end date if provided
          if (settings.event.endDate) {
            if (typeof settings.event.endDate.year !== 'number' ||
                typeof settings.event.endDate.month !== 'number' ||
                typeof settings.event.endDate.day !== 'number') {
              errors.push('Event end date format is invalid');
            } else {
              const endDate = new Date(
                settings.event.endDate.year,
                settings.event.endDate.month - 1,
                settings.event.endDate.day
              );
              endDate.setHours(0, 0, 0, 0);
              
              if (endDate < startDate) {
                errors.push('Event end date cannot be before start date');
              }
            }
          }
        }
        
        // Validate time format if provided
        if (settings.event.startTime) {
          const { hours, minutes } = settings.event.startTime;
          if (typeof hours !== 'number' || typeof minutes !== 'number' ||
              hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            errors.push('Event start time is invalid');
          }
        }
        
        if (settings.event.endTime) {
          const { hours, minutes } = settings.event.endTime;
          if (typeof hours !== 'number' || typeof minutes !== 'number' ||
              hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            errors.push('Event end time is invalid');
          }
        }
        
        // Validate event CTA if provided
        if (settings.event.callToAction) {
          if (!settings.event.callToAction.url) {
            errors.push('Event Call to Action URL is required when CTA is enabled');
          } else {
            try {
              new URL(settings.event.callToAction.url);
            } catch {
              errors.push('Event Call to Action URL must be a valid URL');
            }
          }
        }
      }
      break;

    case 'OFFER':
      // Offer settings are optional - if provided, validate the fields
      if (settings.offer) {
        // Validate redeem URL if provided
        if (settings.offer.redeemOnlineUrl && settings.offer.redeemOnlineUrl.trim()) {
          try {
            new URL(settings.offer.redeemOnlineUrl);
          } catch {
            errors.push('Offer redeem URL must be a valid URL');
          }
        }
        
        // Validate offer dates if provided
        if (settings.offer.startDate) {
          if (typeof settings.offer.startDate.year !== 'number' || 
              typeof settings.offer.startDate.month !== 'number' || 
              typeof settings.offer.startDate.day !== 'number') {
            errors.push('Offer start date is invalid');
          } else {
            const startDate = new Date(
              settings.offer.startDate.year, 
              settings.offer.startDate.month - 1, 
              settings.offer.startDate.day
            );
            
            // Reset time to start of day for comparison
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            
            if (startDate < today) {
              errors.push('Offer start date cannot be in the past');
            }
            
            // If both start and end dates are provided, validate order
            if (settings.offer.endDate) {
              if (typeof settings.offer.endDate.year !== 'number' || 
                  typeof settings.offer.endDate.month !== 'number' || 
                  typeof settings.offer.endDate.day !== 'number') {
                errors.push('Offer end date is invalid');
              } else {
                const endDate = new Date(
                  settings.offer.endDate.year, 
                  settings.offer.endDate.month - 1, 
                  settings.offer.endDate.day
                );
                endDate.setHours(0, 0, 0, 0);
                
                if (endDate < startDate) {
                  errors.push('Offer end date must be after start date');
                }
              }
            }
          }
        }
        
        // Validate time format if provided
        if (settings.offer.startTime) {
          const { hours, minutes } = settings.offer.startTime;
          if (typeof hours !== 'number' || typeof minutes !== 'number' ||
              hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            errors.push('Offer start time is invalid');
          }
        }
        
        if (settings.offer.endTime) {
          const { hours, minutes } = settings.offer.endTime;
          if (typeof hours !== 'number' || typeof minutes !== 'number' ||
              hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            errors.push('Offer end time is invalid');
          }
        }
        
        // All other offer fields are optional - no required validation needed
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Formats Google Business settings for the API request
 */
export function formatGoogleBusinessPostData(
  content: { text: string; media?: any },
  settings: GoogleBusinessSettings
): any {
  console.log('settings', settings);
  console.log('content', content);
  const postData: any = {
    languageCode: "en-US",
    summary: content.text,
    topicType: settings.postType,
  };

  // Add media if available
  if (content.media?.urls?.length > 0) {
    postData.media = [{
      mediaFormat: "PHOTO",
      sourceUrl: content.media.urls[0],
    }];
  }

  // Add specific settings based on post type
  switch (settings.postType) {
    case 'STANDARD':
      if (settings.callToAction) {
        postData.callToAction = {
          actionType: settings.callToAction.actionType,
          url: settings.callToAction.url,
        };
      }
      break;

      // https://developers.google.com/my-business/content/posts-data#event_posts
    case 'EVENT':
      if (settings.event) {
        
        postData.event = {
          title: settings.event.title,
          schedule: {
            startDate: settings.event.startDate,
            ...(settings.event.startTime && { startTime: settings.event.startTime }),
            ...(settings.event.endDate && { endDate: settings.event.endDate }),
            ...(settings.event.endTime && { endTime: settings.event.endTime }),
          },
        };
        
        // Add CTA to event if provided
        if (settings.event.callToAction) {
          postData.callToAction = {
            actionType: settings.event.callToAction.actionType,
            url: settings.event.callToAction.url,
          };
        }
      }
      break;

      // https://developers.google.com/my-business/content/posts-data#offer_posts
      case 'OFFER':
        if (settings.offer) {
          
          // Event information is REQUIRED for OFFER posts according to API docs
          postData.event = {
            title: settings.offer.title || '',
            schedule: {
              ...(settings.offer.startDate && { startDate: settings.offer.startDate }),
              ...(settings.offer.startTime && { startTime: settings.offer.startTime }),
              ...(settings.offer.endDate && { endDate: settings.offer.endDate }),
              ...(settings.offer.endTime && { endTime: settings.offer.endTime }),
            }
          };
          
          // Offer object contains only coupon/redeem/terms fields
          postData.offer = {
            ...(settings.offer.couponCode && { couponCode: settings.offer.couponCode }),
            ...(settings.offer.redeemOnlineUrl && { redeemOnlineUrl: settings.offer.redeemOnlineUrl }),
            ...(settings.offer.termsConditions && { termsConditions: settings.offer.termsConditions }),
          };
        }
        break;
  }

  return postData;
}
