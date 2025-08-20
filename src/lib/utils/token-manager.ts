import { supabase } from '@/lib/supabase/client';
import { getPlatformOperations } from '@/lib/social/platforms';
import type { SocialAccount } from '@/lib/social/platforms/platform-types';

export async function getSecureToken(pageId: string): Promise<string | null> {
  // Get page with token from database
  const { data: page, error } = await supabase
    .from('social_pages')
    .select('auth_token, auth_token_expires_at, platform, account_id')
    .eq('id', pageId)
    .single();

  if (error || !page) {
    throw new Error('Page not found');
  }

  // Check if token is expired
  const isExpired = page.auth_token_expires_at && new Date(page.auth_token_expires_at) <= new Date();
  
  if (isExpired) {
    // Refresh the token
    const ops = getPlatformOperations(page.platform as any);
    if (!ops) {
      throw new Error(`Platform operations not found for ${page.platform}`);
    }

    // Get account for refresh
    const { data: account } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('id', page.account_id)
      .single();

    if (!account) {
      throw new Error('Account not found');
    }

    // Refresh token
    const refreshedAccount = await ops.refreshToken({
      id: account.id,
      platform: account.platform,
      name: account.name,
      accountId: account.account_id,
      authToken: page.auth_token,
      refreshToken: account.refresh_token,
      connected: account.connected,
      status: account.status
    } as SocialAccount);

    // Update database with new token
    await supabase
      .from('social_pages')
      .update({
        auth_token: refreshedAccount.authToken,
        auth_token_expires_at: refreshedAccount.accessTokenExpiresAt
      })
      .eq('id', pageId);

    return refreshedAccount.authToken ?? null;
  }

  return page.auth_token;
}
