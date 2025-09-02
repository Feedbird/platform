import { NextRequest, NextResponse } from 'next/server';
import { getSignedUploadUrl } from '../../../../../media-processing/r2-upload';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'Missing fileName or fileType' }, { status: 400 });
    }

    // Extract query params for namespacing the R2 key
    const wid = req.nextUrl.searchParams.get('wid');
    const board_id = req.nextUrl.searchParams.get('bid');
    const pid = req.nextUrl.searchParams.get('pid');
    const cid = req.nextUrl.searchParams.get('cid'); // columnId for attachments

    const { uploadUrl, publicUrl } = await getSignedUploadUrl({
        fileName,
        fileType,
        wid,
        board_id,
        pid,
        cid,
    });

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error: any) {
    console.error('❌ [API /media/request-upload-url] A critical error occurred:', error);
    return NextResponse.json({ error: 'Failed to get upload URL', details: error.message }, { status: 500 });
  }
} 