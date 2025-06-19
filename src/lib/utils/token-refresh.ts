import type { SocialAccount } from '../social/platforms/platform-types';
import { SocialAPIError } from './error-handler';

interface TokenRefreshResult {
  success: boolean;
  account?: SocialAccount;
  error?: string;
}

export async function refreshToken(
  account: SocialAccount,
  platform: any // Platform instance
): Promise<TokenRefreshResult> {
  try {
    if (!account.refreshToken) {
      return {
        success: false,
        error: 'No refresh token available'
      };
    }

    // Check if token needs refresh (5 minutes buffer)
    const now = new Date();
    const expiresAt = account.expiresAt;
    if (expiresAt && expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
      return {
        success: true,
        account
      };
    }

    // Attempt to refresh the token
    const refreshedAccount = await platform.refreshToken(account);
    return {
      success: true,
      account: refreshedAccount
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      };
    }
    return {
      success: false,
      error: 'Failed to refresh token'
    };
  }
}

export async function withTokenRefresh<T>(
  account: SocialAccount,
  platform: any,
  operation: (acc: SocialAccount) => Promise<T>
): Promise<T> {
  try {
    const refreshResult = await refreshToken(account, platform);
    if (!refreshResult.success) {
      throw new SocialAPIError(
        refreshResult.error || 'Failed to refresh token',
        'TOKEN_REFRESH_ERROR'
      );
    }

    return await operation(refreshResult.account || account);
  } catch (error) {
    if (error instanceof SocialAPIError) {
      throw error;
    }
    throw new SocialAPIError(
      'Operation failed after token refresh',
      'OPERATION_ERROR',
      error
    );
  }
} 