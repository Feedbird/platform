import { toast } from 'sonner';
import { BaseError, ErrorSeverity } from './base-error';

interface ErrorHandlerOptions {
  context?: string;
  silent?: boolean;
  retryCallback?: () => Promise<void>;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Array<(error: Error) => void> = [];

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public addErrorListener(listener: (error: Error) => void): void {
    this.errorListeners.push(listener);
  }

  public removeErrorListener(listener: (error: Error) => void): void {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }

  public async handleError(error: unknown, options: ErrorHandlerOptions = {}): Promise<void> {
    const { context, silent = false, retryCallback } = options;
    
    // Log the error
    console.error('Error:', context, error);

    // Notify error listeners
    this.errorListeners.forEach(listener => listener(error as Error));

    if (silent) return;

    let message: string;
    let severity: ErrorSeverity = 'error';
    let retryable = false;

    if (error instanceof BaseError) {
      message = error.message;
      severity = error.metadata.severity;
      retryable = error.metadata.retryable;

      // Log additional error details
      if (process.env.NODE_ENV === 'development') {
        console.debug('Error Details:', error.toJSON());
      }
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = 'An unexpected error occurred';
    }

    // Show toast notification
    const toastOptions = {
      description: context,
      duration: severity === 'error' ? 5000 : 3000,
      ...(retryable && retryCallback ? {
        action: {
          label: 'Retry',
          onClick: () => retryCallback()
        }
      } : {})
    };

    switch (severity) {
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'warning':
        toast.warning(message, toastOptions);
        break;
      case 'info':
        toast.info(message, toastOptions);
        break;
    }
  }

  public handleSuccess(message: string, description?: string): void {
    toast.success(message, {
      description,
      duration: 2000
    });
  }

  public handleInfo(message: string, description?: string): void {
    toast.info(message, {
      description,
      duration: 3000
    });
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance(); 