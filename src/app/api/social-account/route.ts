import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { SECURE_SOCIAL_ACCOUNT_WITH_PAGES } from '@/lib/utils/secure-queries';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth-middleware';

// GET - Load social accounts for a workspace
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('social_accounts')
      .select(SECURE_SOCIAL_ACCOUNT_WITH_PAGES)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Failed to fetch social accounts:', error);
      throw new Error('Failed to load accounts');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading social accounts:', error);
    return NextResponse.json(
      { error: 'Failed to load social accounts' },
      { status: 500 }
    );
  }
});


