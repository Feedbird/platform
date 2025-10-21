// app/api/oauth/[platform]/callback/route.ts
import { getPlatformOperations } from '@/lib/social/platforms/index'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: Request): Promise<Response> {
  /* --------------------- derive platform segment -------------------- */
  const { pathname, searchParams } = new URL(request.url)
  //  …/api/oauth/google/callback   →  ['','api','oauth','google','callback']
  let sp: string = pathname.split('/').at(-2) as string
  if (sp === 'googlebusiness') sp = 'google'

  /* --------------------- query-params ------------------------------ */
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const workspaceId = state?.split('workspaceId:')[1]?.split(':')[0] || state?.split('brandId:')[1]?.split(':')[0] // Support both for backward compatibility
  const method = state?.includes('method:') ? state?.split('method:')[1] : undefined
  const err  = searchParams.get('error_description') || searchParams.get('error')

  if (err || !code || !workspaceId) {
    return html(`<script>
      window.opener.postMessage({ 
        error: ${JSON.stringify(err || 'Missing parameters')}
      }, "*"); 
      window.close();
    </script>`)
  }

  try {
    // 1. Exchange code for tokens
    const ops     = getPlatformOperations(sp as any, method)!
    const account = await ops.connectAccount(code)
    const pages   = await ops.listPages(account)

    // 2. Save to database FIRST
    const savedData = await saveSocialAccount({
      workspaceId: workspaceId!,
      platform: sp,
      account,
      pages
    });

    // 3. Return success with database IDs
    return html(`<script>
      window.opener.postMessage({
        success: true,
        workspaceId: ${JSON.stringify(workspaceId)},
        accountId: ${JSON.stringify(savedData.account.id)},
        pages: ${JSON.stringify(savedData.pages)}
      }, "*");
      window.close();
    </script>`)
  } catch (e: any) {
    return html(`<script>
      window.opener.postMessage({ 
        error: ${JSON.stringify(e.message)}
      }, "*");
      window.close();
    </script>`)
  }
}

async function saveSocialAccount(data: {
  workspaceId: string;
  platform: string;
  account: any;
  pages: any[];
}) {
  const { workspaceId, platform, account, pages } = data;

  // check if account already exists
  const { data: existingAccount, error: existingAccountError } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('workspace_id', workspaceId)
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
      workspace_id: workspaceId,
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
    workspace_id: workspaceId,
    account_id: savedAccount.id,
    page_id: page.pageId,
    name: page.name,
    platform: platform,
    connected: page.connected,
    status: page.status,
    auth_token: page.authToken,
    auth_token_expires_at: page.authTokenExpiresAt,
    metadata: page.metadata || {},
    entity_type: page.entityType
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
}

function html(body: string) {
  return new Response(body, { headers: { 'Content-Type': 'text/html' } })
}
