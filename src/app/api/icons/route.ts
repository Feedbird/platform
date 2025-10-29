import { IconSection } from '@/lib/supabase/primary';
import { NextRequest, NextResponse } from 'next/server';
import { IconHandler } from './handler';
import { ApiHandlerError } from '../shared';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  const userId = searchParams.get('userId');
  const section = searchParams.get('section') || 'default';

  try {
    const icons = await IconHandler.getAllIcons({
      workspaceId: workspaceId,
      userId: userId,
      section: section as IconSection,
    });

    return NextResponse.json({ data: icons }, { status: 200 });
  } catch (error) {
    const uiMessage = 'An error occurred while fetching icons.';
    console.error('Icon GET error:', error);
    if (error instanceof ApiHandlerError) {
      console.error('ApiHandlerError details:', error.message, error.cause);
      return NextResponse.json({ error: uiMessage }, { status: error.status });
    }
    return NextResponse.json({ error: uiMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, userId, section, svg, common_name } = await req.json();

    if (!svg || !common_name) {
      return NextResponse.json(
        { error: 'SVG content & icon name (common_name) are required.' },
        { status: 400 }
      );
    }
    const newIcon = await IconHandler.createIcon({
      workspaceId: workspaceId || null,
      common_name,
      userId: userId || null,
      section: section ?? 'default',
      svg,
    });

    return NextResponse.json({ data: newIcon }, { status: 201 });
  } catch (e) {
    const uiMessage = 'An error occurred while creating the icon.';
    console.error('Icon POST error:', e);
    if (e instanceof ApiHandlerError) {
      console.error('ApiHandlerError details:', e.message, e.cause);
      return NextResponse.json({ error: uiMessage }, { status: e.status });
    }
    return NextResponse.json({ error: uiMessage }, { status: 500 });
  }
}
