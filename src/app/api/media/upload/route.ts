import { NextRequest, NextResponse } from 'next/server';
import { convertMediaForPlatform } from '../../../../../media-processing/conversion';
import { Platform } from '@/lib/social/platforms/platform-types';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  console.log('[API /media/upload] Received a request.');
  try {
    const platform = req.nextUrl.searchParams.get('platform') as Platform;
    console.log(`[API /media/upload] Platform identified: ${platform}`);

    if (!platform) {
      console.error('[API /media/upload] ❌ Error: Platform query parameter is missing.');
      return NextResponse.json({ error: 'Platform query parameter is required' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as unknown as File | null;

    if (!file) {
      console.error('[API /media/upload] ❌ Error: No file uploaded.');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log(`[API /media/upload] File received: ${file.name} (${file.size} bytes)`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tempDir = path.join(os.tmpdir(), 'feedbird-uploads');
    await fs.mkdir(tempDir, { recursive: true });
    const tempFilePath = path.join(tempDir, file.name);
    await fs.writeFile(tempFilePath, buffer);

    console.log(`[API /media/upload] Saved upload to temporary path: ${tempFilePath}`);
    console.log('[API /media/upload] Handing off to conversion module...');
    const r2Url = await convertMediaForPlatform(tempFilePath, platform);

    console.log(`[API /media/upload] ✅ Successfully received R2 URL: ${r2Url}`);
    return NextResponse.json({ url: r2Url });

  } catch (error: any) {
    console.error('❌ [API /media/upload] A critical error occurred:', error);
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 });
  }
} 