import { toast } from 'sonner';

export class SocialAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SocialAPIError';
  }
}

export function isTokenExpiredError(error: unknown): boolean {
  if (error instanceof SocialAPIError) {
    return error.code === 'TOKEN_EXPIRED';
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('token expired') ||
      message.includes('invalid token') ||
      message.includes('token invalid') ||
      message.includes('unauthorized') ||
      message.includes('unauthenticated')
    );
  }

  return false;
}

export function handleError(
  error: unknown,
  context?: string,
  options: { log?: boolean } = { log: true }
): void {
  if (options.log) {
    console.error('Error:', context, error);
  }

  let message = 'An unexpected error occurred';
  let type: 'error' | 'warning' = 'error';
  
  if (error instanceof SocialAPIError) {
    message = error.message;
    
    // Special handling for specific error types
    switch (error.code) {
      case 'TOKEN_EXPIRED':
        message = `${message} Please try reconnecting your account.`;
        break;
      case 'FEATURE_NOT_SUPPORTED':
        type = 'warning';
        break;
      case 'VALIDATION_ERROR':
        type = 'warning';
        break;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  toast[type](message, {
    description: context,
    duration: 4000
  });
}

export function handleSuccess(message: string, title?: string): void {
  toast.success(message, {
    description: title,
    duration: 2000
  });
}

export function handleWarning(message: string, title?: string): void {
  toast.warning(message, {
    description: title,
    duration: 3000
  });
}

// Helper function to format validation errors
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return `Multiple issues found:\n${errors.map(err => `• ${err}`).join('\n')}`;
}

// Helper function to handle API response errors
export function handleApiResponse(response: Response): void {
  if (!response.ok) {
    throw new SocialAPIError(
      `API request failed with status ${response.status}`,
      'API_ERROR',
      { status: response.status }
    );
  }
} 