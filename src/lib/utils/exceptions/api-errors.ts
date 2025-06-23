import { BaseError, ErrorCategory, ErrorMetadata } from './base-error';

/**
 * A general error for all API interactions.
 */
export class ApiError extends BaseError {
  constructor(message: string, options?: Partial<ErrorMetadata>) {
    super(message, 'API_ERROR', options);
  }
}

/**
 * For authentication or authorization errors (e.g. invalid API key, expired token).
 */
export class AuthError extends BaseError {
  constructor(message: string, options?: Partial<ErrorMetadata>) {
    super(message, 'AUTH_ERROR', {
      severity: 'warning',
      retryable: true, // Often requires user to re-authenticate
      ...options
    });
  }
}

/**
 * A specific error for when a social media platform's API returns an error.
 */
export class PlatformApiError extends BaseError {
  constructor(platform: string, message: string, options?: Partial<ErrorMetadata>) {
    super(`[${platform}] ${message}`, 'PLATFORM_ERROR', {
      source: platform,
      ...options,
    });
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, options?: Partial<ErrorMetadata>) {
    super(message, 'VALIDATION_ERROR', {
      severity: 'warning',
      retryable: false,
      ...options
    });
  }
}

export class NetworkError extends BaseError {
  constructor(message: string, options?: Partial<ErrorMetadata>) {
    super(message, 'NETWORK_ERROR', {
      severity: 'error',
      retryable: true,
      ...options
    });
  }
}

export class RateLimitError extends BaseError {
  constructor(message: string, options?: Partial<ErrorMetadata>) {
    super(message, 'RATE_LIMIT_ERROR', {
      severity: 'warning',
      retryable: true,
      ...options
    });
  }
}

export class PermissionError extends BaseError {
  constructor(message: string, options?: Partial<ErrorMetadata>) {
    super(message, 'PERMISSION_ERROR', {
      severity: 'error',
      retryable: false,
      ...options
    });
  }
}

export class FeatureError extends BaseError {
  constructor(message: string, options?: Partial<ErrorMetadata>) {
    super(message, 'FEATURE_ERROR', {
      severity: 'warning',
      retryable: false,
      ...options
    });
  }
} 