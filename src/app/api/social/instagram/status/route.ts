import { NextRequest, NextResponse } from 'next/server';
import { InstagramPlatform } from '@/lib/social/platforms/instagram';

export async function POST(request: NextRequest) {
  try {
    const { page } = await request.json();

    // Validate required fields
    if (!page) {
      return NextResponse.json(
        { error: 'Missing required field: page' },
        { status: 400 }
      );
    }

    // Initialize Instagram platform
    const instagram = new InstagramPlatform({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      redirectUri: process.env.FACEBOOK_REDIRECT_URI!,
    });

    // Check page status
    const result = await instagram.checkPageStatus(page);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Instagram status error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to check Instagram page status' },
      { status: 500 }
    );
  }
}
