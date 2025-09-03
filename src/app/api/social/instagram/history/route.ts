import { NextRequest, NextResponse } from 'next/server';
import { getPlatformOperations } from '@/lib/social/platforms';

export async function POST(request: NextRequest) {
  try {
    const { page, limit = 20, nextPage } = await request.json();

    // Validate required fields
    if (!page) {
      return NextResponse.json(
        { error: 'Missing required field: page' },
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

    // Get post history
    const result = await ops.getPostHistory(page, limit, nextPage);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Instagram history error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get Instagram post history' },
      { status: 500 }
    );
  }
}
