import { supabase } from '@/lib/supabase/client';
import { SECURE_SOCIAL_ACCOUNT_WITH_PAGES } from '@/lib/utils/secure-queries';

export const socialAccountApi = {
  async saveSocialAccount(data: {
    brandId: string;
    platform: string;
    account: any;
    pages: any[];
  }) {
    const { brandId, platform, account, pages } = data;

    // check if account already exists
    const { data: existingAccount, error: existingAccountError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('brand_id', brandId)
      .eq('account_id', account.accountId)
      .eq('platform', platform)
      .maybeSingle()
      

    if (existingAccountError) {
      console.error('Failed to check if account already exists:', existingAccountError);
      throw new Error('Failed to check if account already exists');
    }

    if (existingAccount) {
      console.log('Account already exists');
      // update the account
      const { data: updatedAccount, error: updateAccountError } = await supabase
        .from('social_accounts')
        .update({
          auth_token: account.authToken,
          refresh_token: account.refreshToken,
          access_token_expires_at: account.accessTokenExpiresAt,
          refresh_token_expires_at: account.refreshTokenExpiresAt,
          token_issued_at: account.tokenIssuedAt,
        })
        .eq('id', existingAccount.id)
        .select();

      if (updateAccountError) {
        console.error('Failed to update account:', updateAccountError);
        throw new Error('Failed to update account');
      }

      // update the pages
      const { data: updatedPages, error: updatePagesError } = await supabase
        .from('social_pages')
        .update({
          auth_token: account.authToken,
          auth_token_expires_at: account.accessTokenExpiresAt,
        })
        .eq('account_id', existingAccount.id)
        .select();

      if (updatePagesError) {
        console.error('Failed to update pages:', updatePagesError);
        throw new Error('Failed to update pages');
      }

      return {
        account: updatedAccount,
        pages: updatedPages
      };
    }

    // 1. Save social account
    const { data: savedAccount, error: accountError } = await supabase
      .from('social_accounts')
      .insert({
        brand_id: brandId,
        name: account.name,
        account_id: account.accountId,
        platform: platform,
        auth_token: account.authToken,
        refresh_token: account.refreshToken,
        access_token_expires_at: account.accessTokenExpiresAt,
        refresh_token_expires_at: account.refreshTokenExpiresAt,
        token_issued_at: account.tokenIssuedAt,
        connected: true,
        status: 'active',
        metadata: account.metadata || {}
      })
      .select()
      .single();

    if (accountError) {
      console.error('Failed to save social account:', accountError);
      throw new Error('Failed to save account');
    }

    // 2. Save social pages
    const pagesToInsert = pages.map(page => ({
      brand_id: brandId,
      account_id: savedAccount.id,
      page_id: page.pageId,
      name: page.name,
      platform: platform,
      connected: page.connected,
      status: page.status,
      auth_token: page.authToken,
      auth_token_expires_at: page.authTokenExpiresAt,
      metadata: page.metadata || {}
    }));

    const { data: savedPages, error: pagesError } = await supabase
      .from('social_pages')
      .insert(pagesToInsert)
      .select();

    if (pagesError) {
      // Rollback: delete the account if pages fail
      await supabase
        .from('social_accounts')
        .delete()
        .eq('id', savedAccount.id);
      
      console.error('Failed to save social pages:', pagesError);
      throw new Error('Failed to save pages');
    }

    return {
      account: savedAccount,
      pages: savedPages
    };
  },

  async getSocialAccounts(brandId: string) {
    const { data, error } = await supabase
      .from('social_accounts')
      .select(SECURE_SOCIAL_ACCOUNT_WITH_PAGES)
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch social accounts:', error);
      throw new Error('Failed to load accounts');
    }

    return data;
  },

  async deleteSocialAccount(accountId: string) {
    // Delete pages first (due to foreign key constraint)
    const { error: pagesError } = await supabase
      .from('social_pages')
      .delete()
      .eq('account_id', accountId);

    if (pagesError) {
      console.error('Failed to delete social pages:', pagesError);
      throw new Error('Failed to delete pages');
    }

    // Then delete account
    const { error: accountError } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', accountId);

    if (accountError) {
      console.error('Failed to delete social account:', accountError);
      throw new Error('Failed to delete account');
    }
  },

  async deleteSocialPage(pageId: string) {
    const { error } = await supabase
      .from('social_pages')
      .delete()
      .eq('id', pageId);

    if (error) {
      console.error('Failed to delete social page:', error);
      throw new Error('Failed to delete page');
    }
  }
};
