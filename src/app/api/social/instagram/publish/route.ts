import { NextRequest, NextResponse } from 'next/server';
import { getPlatformOperations } from '@/lib/social/platforms';

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

    // check the connection type
    const connectionType = page.metadata?.connectionType || 'facebook';
    const ops = getPlatformOperations('instagram' as any, connectionType || undefined);
    if (!ops) {
      return NextResponse.json(
        { error: 'Unsupported platform' },
        { status: 400 }
      );
    }
    // Publish the post
    const result = await ops.publishPost(page, content, options);

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
