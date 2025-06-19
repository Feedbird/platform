import { BaseError, ErrorMetadata } from './base-error';

export class APIError extends BaseError {
  constructor(message: string, options?: Partial<ErrorMetadata>) {
    super(message, 'API_ERROR', {
      retryable: true,
      ...options
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

export class AuthenticationError extends BaseError {
  constructor(message: string, options?: Partial<ErrorMetadata>) {
    super(message, 'AUTH_ERROR', {
      severity: 'error',
      retryable: true,
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