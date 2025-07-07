import { NextRequest, NextResponse } from 'next/server';
import { convertMediaForPlatform } from '../../../../../media-processing/conversion';
import { uploadToR2 } from '../../../../../media-processing/r2-upload';
import { Platform } from '@/lib/social/platforms/platform-types';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  console.log('[API /media/upload] Received a request.');
  try {
    const platformParam = req.nextUrl.searchParams.get('platform');
    // Treat empty string or missing param as null
    const platform = platformParam ? (platformParam as Platform) : null;
    const wid = req.nextUrl.searchParams.get('wid');
    const bid = req.nextUrl.searchParams.get('bid');
    const pid = req.nextUrl.searchParams.get('pid');
    console.log(`[API /media/upload] Platform identified: ${platform ?? 'none (raw upload)'}`);

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

    // Build structured key prefix: workspace/<wid>/brand/<bid>/post/<pid>
    const parts = [wid && `workspace-${wid}`, bid && `brand-${bid}`, pid && `post-${pid}`].filter(Boolean);
    const prefix = parts.length ? parts.join('/') + '/' : undefined;

    let r2Url: string;
    try {
      if (platform) {
        console.log('[API /media/upload] Handing off to conversion module...');
        r2Url = await convertMediaForPlatform(tempFilePath, platform as Platform, prefix);
      } else {
        // Raw upload
        const unique = crypto.randomUUID();
        const base = path.basename(tempFilePath);
        const fileName = prefix ? `${prefix}${unique}-${base}` : `${unique}-${base}`;
        r2Url = await uploadToR2(tempFilePath, fileName);
      }
    } catch (convErr: any) {
      console.error('[API /media/upload] ❌ Conversion/Upload failed:', convErr);
      return NextResponse.json({ error: 'Processing failed', details: convErr.message }, { status: 500 });
    }

    console.log(`[API /media/upload] ✅ Successfully received R2 URL: ${r2Url}`);
    return NextResponse.json({ url: r2Url });

  } catch (error: any) {
    console.error('❌ [API /media/upload] A critical error occurred:', error);
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 });
  }
} 