export type ErrorSeverity = 'error' | 'warning' | 'info';
export type ErrorCategory = 
  | 'API_ERROR' 
  | 'VALIDATION_ERROR' 
  | 'AUTH_ERROR' 
  | 'NETWORK_ERROR' 
  | 'PLATFORM_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'PERMISSION_ERROR'
  | 'FEATURE_ERROR'
  | 'UNKNOWN_ERROR';

export interface ErrorMetadata {
  timestamp: Date;
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  source?: string;
  details?: unknown;
}

export class BaseError extends Error {
  public readonly metadata: ErrorMetadata;

  constructor(
    message: string,
    category: ErrorCategory,
    options?: Partial<ErrorMetadata>
  ) {
    super(message);
    this.name = this.constructor.name;

    this.metadata = {
      timestamp: new Date(),
      code: options?.code || category,
      category,
      severity: options?.severity || 'error',
      retryable: options?.retryable ?? false,
      source: options?.source,
      details: options?.details
    };

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      metadata: this.metadata,
      stack: this.stack
    };
  }
} 