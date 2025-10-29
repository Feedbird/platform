import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { decryptIfNeeded, encryptIfNeeded } from '@/lib/utils/secret-encryption';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth-middleware';

// GET - Get social account details including tokens
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const accountId = url.pathname.split('/').pop();

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('social_accounts')
      .select(`
        id,
        auth_token,
        refresh_token,
        access_token_expires_at,
        refresh_token_expires_at,
        token_issued_at,
        metadata,
        platform,
        name,
        account_id,
        connected,
        status
      `)
      .eq('id', accountId)
      .single();

    if (error) {
      console.error('Failed to fetch social account:', error);
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    // Decrypt sensitive fields before returning
    const response = {
      ...data,
      auth_token: decryptIfNeeded(data.auth_token),
      refresh_token: decryptIfNeeded(data.refresh_token),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching social account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social account' },
      { status: 500 }
    );
  }
});

// PATCH - Update social account tokens
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const accountId = url.pathname.split('/').pop();
    const body = await req.json();

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    
    if (body.auth_token !== undefined) updateData.auth_token = encryptIfNeeded(body.auth_token);
    if (body.refresh_token !== undefined) updateData.refresh_token = encryptIfNeeded(body.refresh_token);
    if (body.access_token_expires_at !== undefined) updateData.access_token_expires_at = body.access_token_expires_at;
    if (body.refresh_token_expires_at !== undefined) updateData.refresh_token_expires_at = body.refresh_token_expires_at;
    if (body.token_issued_at !== undefined) updateData.token_issued_at = body.token_issued_at;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.connected !== undefined) updateData.connected = body.connected;

    const { data, error } = await supabase
      .from('social_accounts')
      .update(updateData)
      .eq('id', accountId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update social account:', error);
      return NextResponse.json({ error: 'Failed to update social account' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating social account:', error);
    return NextResponse.json(
      { error: 'Failed to update social account' },
      { status: 500 }
    );
  }
});
