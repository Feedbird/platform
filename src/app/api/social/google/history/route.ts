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

    // Get Google Business platform operations
    const ops = getPlatformOperations('google');
    if (!ops) {
      return NextResponse.json(
        { error: 'Unsupported platform' },
        { status: 400 }
      );
    }

    // Get post history with pagination
    const result = await ops.getPostHistory(page, limit, nextPage);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Google Business history error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get Google Business post history' },
      { status: 500 }
    );
  }
}
