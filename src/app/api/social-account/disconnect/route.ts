import { NextRequest, NextResponse } from 'next/server';
import { getPlatformOperations } from '@/lib/social/platforms';
import { socialAccountApi } from '@/lib/api/social-accounts';
import { supabase } from '@/lib/supabase/client';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth-middleware';
import { SOCIAL_ACCOUNT_WITH_TOKENS } from '@/lib/utils/secure-queries';

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { pageId, workspaceId } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    // Get the workspace's social accounts and pages (secure query)
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select(`
        *,
        social_accounts (
          ${SOCIAL_ACCOUNT_WITH_TOKENS}
        )
      `)
      .eq('id', workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Handle disconnection
    const page = workspace.social_accounts
      ?.flatMap((acc: any) => acc.social_pages || [])
      .find((p: any) => p.id === pageId);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const account = workspace.social_accounts?.find((a: any) => a.id === page.account_id);
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // TikTok: Revoke token first (server-side)
    if (account.platform === 'tiktok') {
      const tiktokOps = getPlatformOperations('tiktok');
      if (tiktokOps) {
        await tiktokOps.disconnectAccount({
          id: account.id,
          platform: account.platform,
          name: account.name,
          accountId: account.account_id,
          authToken: account.auth_token,
          connected: account.connected,
          status: account.status
        });
      }
    }

    // Check if this is the only page for this account
    const pagesForSameAccount = workspace.social_accounts
      ?.flatMap((acc: any) => acc.social_pages || [])
      .filter((p: any) => p.account_id === page.account_id) || [];

    if (pagesForSameAccount.length === 1) {
      // Only page - delete entire account
      await socialAccountApi.deleteSocialAccount(account.id);
    } else {
      // Multiple pages - delete only this page
      await socialAccountApi.deleteSocialPage(pageId);
    }

    return NextResponse.json({ success: true, message: 'Page disconnected' });

  } catch (error) {
    console.error('Error disconnecting social account:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect social account' },
      { status: 500 }
    );
  }
});
