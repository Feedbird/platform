import type {
  PlatformOperations,
  SocialPlatformConfig,
  SocialAccount,
  SocialPage,
  PostContent,
  PostHistory,
  PublishOptions,
} from './platform-types';
import { SocialAPIError, isTokenExpiredError } from '@/lib/utils/error-handler';
import { withTokenRefresh } from '@/lib/utils/token-refresh';

export abstract class BasePlatform implements PlatformOperations {
  protected constructor(
    protected config: SocialPlatformConfig,
    protected env: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    }
  ) {}

  protected async fetchWithAuth<T>(
    url: string,
    options: {
      method?: string;
      token: string;
      body?: string;
      queryParams?: Record<string, string>;
    }
  ): Promise<T> {
    try {
      const urlWithParams = options.queryParams
        ? `${url}?${new URLSearchParams(options.queryParams)}`
        : url;

      const response = await fetch(urlWithParams, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${options.token}`,
        },
        body: options.body,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new SocialAPIError(
          error.error?.message || error?.message || 'API request failed',
          'API_ERROR',
          error
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof SocialAPIError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new SocialAPIError(error.message, 'NETWORK_ERROR');
      }
      throw new SocialAPIError('Unknown error occurred', 'UNKNOWN_ERROR');
    }
  }

  // Default auth URL generator
  getAuthUrl(): string {
    const url = new URL(this.config.authUrl);
    url.searchParams.set('client_id', this.env.clientId);
    url.searchParams.set('redirect_uri', this.env.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', this.config.scopes.join(' '));
    url.searchParams.set('state', crypto.randomUUID());
    return url.toString();
  }

  // Default content validation
  validateContent(content: PostContent): { isValid: boolean; errors?: string[] } {
    const errors: string[] = [];
    const features = this.config.features;

    // Check text length
    if (content.text.length > features.characterLimits.content) {
      errors.push(`Text exceeds maximum length of ${features.characterLimits.content} characters`);
    }

    // Check title if required
    if (features.characterLimits.title && content.title) {
      if (content.title.length > features.characterLimits.title) {
        errors.push(`Title exceeds maximum length of ${features.characterLimits.title} characters`);
      }
    }

    // Validate media
    if (content.media) {
      // Check media type support
      if (!features.mediaTypes.includes(content.media.type)) {
        errors.push(`Media type '${content.media.type}' is not supported`);
      }

      // Check media count
      if (content.media.urls.length > features.maxMediaCount) {
        errors.push(`Maximum of ${features.maxMediaCount} media items allowed`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // Default implementation for scheduling
  async schedulePost(
    page: SocialPage,
    content: PostContent,
    scheduledTime: Date
  ): Promise<PostHistory> {
    if (!this.config.features.scheduling) {
      throw new SocialAPIError(
        'Scheduling is not supported by this platform',
        'FEATURE_NOT_SUPPORTED'
      );
    }

    return this.publishPost(page, content, { scheduledTime });
  }

  // Helper method to handle API errors
  protected handleApiError(error: unknown, operation: string): never {
    if (isTokenExpiredError(error)) {
      throw new SocialAPIError(
        `Your ${this.config.name} access token has expired. Please reconnect your account.`,
        'TOKEN_EXPIRED'
      );
    }

    if (error instanceof SocialAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new SocialAPIError(
        `Failed to ${operation}: ${error.message}`,
        'API_ERROR'
      );
    }

    throw new SocialAPIError(
      `An unexpected error occurred while ${operation}`,
      'UNKNOWN_ERROR'
    );
  }

  // Helper method to execute operations with token refresh
  protected async executeWithRefresh<T>(
    account: SocialAccount,
    operation: (acc: SocialAccount) => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await withTokenRefresh(account, this, operation);
    } catch (error) {
      this.handleApiError(error, operationName);
    }
  }

  // Abstract methods that must be implemented by platform-specific classes
  abstract connectAccount(code: string): Promise<SocialAccount>;
  abstract refreshToken(acc: SocialAccount): Promise<SocialAccount>;
  abstract disconnectAccount(acc: SocialAccount): Promise<void>;
  abstract listPages(acc: SocialAccount): Promise<SocialPage[]>;
  abstract connectPage(acc: SocialAccount, pageId: string): Promise<SocialPage>;
  abstract disconnectPage(page: SocialPage): Promise<void>;
  abstract checkPageStatus(page: SocialPage): Promise<SocialPage>;
  abstract createPost(page: SocialPage, content: PostContent, options?: PublishOptions): Promise<PostHistory>;
  abstract publishPost(page: SocialPage, content: PostContent, options?: PublishOptions): Promise<PostHistory>;
  abstract deletePost(page: SocialPage, postId: string): Promise<void>;
  abstract getPostHistory(page: SocialPage, limit?: number, nextPage?: number | string | null | undefined): Promise<{ posts: PostHistory[], nextPage: number | string | null | undefined }>;
  abstract getPostAnalytics(page: SocialPage, postId: string): Promise<PostHistory['analytics']>;

  // Platform features
  getPlatformFeatures(): SocialPlatformConfig['features'] {
    return this.config.features;
  }
} 