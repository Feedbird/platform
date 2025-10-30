import { socialApiService } from '@/lib/api/social-api-service';
import { getPlatformOperations } from '@/lib/social/platforms';
import type { SocialAccount } from '@/lib/social/platforms/platform-types';

export async function getSecureToken(pageId: string): Promise<string | null> {
  try {
    // Get page with token from API service
    const page = await socialApiService.getSocialPage(pageId);

    // Check if token is expired
    const isExpired =
      page.authTokenExpiresAt &&
      new Date(page.authTokenExpiresAt) <= new Date();

    if (isExpired) {
      // Refresh the token
      const ops = getPlatformOperations(page.platform as any);
      if (!ops) {
        throw new Error(`Platform operations not found for ${page.platform}`);
      }

      // Get account for refresh
      const account = await socialApiService.getSocialAccount(page.accountId);

      if (!account) {
        throw new Error('Account not found');
      }

      // Refresh token
      const refreshedAccount = await ops.refreshToken({
        id: account.id,
        platform: account.platform,
        name: account.name,
        accountId: account.accountId,
        authToken: page.authToken,
        refreshToken: account.refreshToken,
        connected: account.connected,
        status: account.status,
      } as SocialAccount);

      // Update database with new token using API service
      await socialApiService.updateSocialPage(pageId, {
        authToken: refreshedAccount.authToken,
        authTokenExpiresAt: refreshedAccount.accessTokenExpiresAt,
      });

      return refreshedAccount.authToken ?? null;
    }

    return page.authToken ?? '';
  } catch (error) {
    console.error('Error getting secure token:', error);
    throw new Error('Failed to get secure token');
  }
}
