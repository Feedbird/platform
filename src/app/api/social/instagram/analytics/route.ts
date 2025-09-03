import { NextRequest, NextResponse } from 'next/server';
import { InstagramPlatform } from '@/lib/social/platforms/instagram';

export async function POST(request: NextRequest) {
  try {
    const { page, postId } = await request.json();

    // Validate required fields
    if (!page || !postId) {
      return NextResponse.json(
        { error: 'Missing required fields: page and postId' },
        { status: 400 }
      );
    }

    // Initialize Instagram platform
    const instagram = new InstagramPlatform({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      redirectUri: process.env.FACEBOOK_REDIRECT_URI!,
    });

    // Get post analytics
    const result = await instagram.getPostAnalytics(page, postId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Instagram analytics error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get Instagram post analytics' },
      { status: 500 }
    );
  }
}
