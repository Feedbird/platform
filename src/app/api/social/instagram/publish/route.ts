import { NextRequest, NextResponse } from 'next/server';
import { InstagramPlatform } from '@/lib/social/platforms/instagram';

export async function POST(request: NextRequest) {
  try {
    const { page, content, options } = await request.json();

    // Validate required fields
    if (!page || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: page and content' },
        { status: 400 }
      );
    }

    // Initialize Instagram platform
    const instagram = new InstagramPlatform({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      redirectUri: process.env.FACEBOOK_REDIRECT_URI!,
    });

    // Publish the post
    const result = await instagram.publishPost(page, content, options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Instagram publish error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to publish Instagram post' },
      { status: 500 }
    );
  }
}
