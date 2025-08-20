import { NextRequest, NextResponse } from 'next/server';
import { socialAccountApi } from '@/lib/api/social-accounts';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth-middleware';

// GET - Load social accounts for a brand
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
    }

    const accounts = await socialAccountApi.getSocialAccounts(brandId);
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error loading social accounts:', error);
    return NextResponse.json(
      { error: 'Failed to load social accounts' },
      { status: 500 }
    );
  }
});


