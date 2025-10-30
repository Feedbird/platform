import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ApiHandlerError } from '../shared';
import { ServicesHandler } from './handler';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const workspaceId = searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json(
        {
          error: 'Workspace is necessary to fetch services',
        },
        { status: 400 }
      );
    }
    const available = searchParams.get('available') || {};
    const services = await ServicesHandler.getServices(
      workspaceId,
      available && available === '1'
    );

    return NextResponse.json({ data: services });
  } catch (error) {
    const uiMessage =
      'We are unable to retrieve services now. Please try again later.';
    console.error('Error in GET /api/services:', error);
    if (error instanceof ApiHandlerError) {
      return NextResponse.json({ error: uiMessage }, { status: error.status });
    }
    return NextResponse.json({ error: uiMessage }, { status: 500 });
  }
}

// Create service
export async function POST(req: NextRequest) {
  try {
    // Extract userId from Clerk auth
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!body.workspaceId) {
      return NextResponse.json(
        { error: 'Workspace is necessary to create service' },
        { status: 400 }
      );
    }
    const draftService = await ServicesHandler.createDraftService({
      workspaceId: body.workspaceId,
    });

    return NextResponse.json({ data: draftService });
  } catch (error) {
    const uiMessage =
      'We are unable to create service now. Please try again later.';
    console.error('Error in POST /api/services:', error);
    if (error instanceof ApiHandlerError) {
      return NextResponse.json({ error: uiMessage }, { status: error.status });
    }
    return NextResponse.json({ error: uiMessage }, { status: 500 });
  }
}
