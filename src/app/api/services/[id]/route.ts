import { NextRequest, NextResponse } from 'next/server';
import { ServicesHandler } from '../handler';
import { ApiHandlerError } from '../../shared';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const extractedParams = await params;
    const serviceId = extractedParams.id;

    if (!serviceId) {
      throw new ApiHandlerError('Service ID is required', 400);
    }

    const data = await ServicesHandler.getServiceById(serviceId);

    return NextResponse.json({ data });
  } catch (e) {
    const uiMessage = 'Unable to retrieve service. Please try again later.';
    if (e instanceof ApiHandlerError) {
      return NextResponse.json({ error: uiMessage }, { status: e.status });
    }
    return NextResponse.json({ error: uiMessage }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const extractedParams = await params;
    const serviceId = extractedParams.id;

    if (!serviceId) {
      throw new ApiHandlerError('Service ID is required', 400);
    }

    const payload = await req.json();

    const serviceUpdated = await ServicesHandler.updateServiceById(
      serviceId,
      payload
    );

    return NextResponse.json({ data: serviceUpdated });
  } catch (e) {
    const uiMessage = 'Unable to update service. Please try again later.';
    if (e instanceof ApiHandlerError) {
      console.log(e.message);
      return NextResponse.json({ error: uiMessage }, { status: e.status });
    }
    return NextResponse.json({ error: uiMessage }, { status: 500 });
  }
}
