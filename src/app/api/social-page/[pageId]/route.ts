import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { decryptIfNeeded, encryptIfNeeded } from '@/lib/utils/secret-encryption';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth-middleware';
import { jsonCamel, readJsonSnake } from '@/lib/utils/http';

// GET - Get social page details including tokens
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const pageId = url.pathname.split('/').pop();

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('social_pages')
      .select(`
        id,
        account_id,
        auth_token,
        auth_token_expires_at,
        metadata,
        platform,
        name,
        page_id,
        connected,
        status
      `)
      .eq('id', pageId)
      .single();

    if (error) {
      console.error('Failed to fetch social page:', error);
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    const response = {
      ...data,
      auth_token: decryptIfNeeded(data.auth_token),
    };
    return jsonCamel(response);
  } catch (error) {
    console.error('Error fetching social page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social page' },
      { status: 500 }
    );
  }
});

// PATCH - Update social page tokens
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const pageId = url.pathname.split('/').pop();
    const body = await readJsonSnake(req);

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    
    if (body.auth_token !== undefined) updateData.auth_token = encryptIfNeeded(body.auth_token);
    if (body.auth_token_expires_at !== undefined) updateData.auth_token_expires_at = body.auth_token_expires_at;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.connected !== undefined) updateData.connected = body.connected;

    const { data, error } = await supabase
      .from('social_pages')
      .update(updateData)
      .eq('id', pageId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update social page:', error);
      return NextResponse.json({ error: 'Failed to update social page' }, { status: 500 });
    }

    return jsonCamel(data);
  } catch (error) {
    console.error('Error updating social page:', error);
    return NextResponse.json(
      { error: 'Failed to update social page' },
      { status: 500 }
    );
  }
});
