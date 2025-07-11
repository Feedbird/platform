import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

export const runtime = "nodejs";

/*──────────────────  R2 client setup  ──────────────────*/
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
let R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  throw new Error("Missing required R2 environment variables");
}

if (!R2_PUBLIC_URL) {
  const endpointClean = R2_ENDPOINT.replace(/\/$/, "");
  R2_PUBLIC_URL = `${endpointClean}/${R2_BUCKET_NAME}`;
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/*──────────────────  POST /api/upload/sign  ──────────────────*/
export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType, wid, bid, pid } = (await req.json()) as {
      fileName: string;
      fileType: string;
      wid?: string | null;
      bid?: string | null;
      pid?: string | null;
    };

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "fileName and fileType are required" }, { status: 400 });
    }

    /* ----- Build a unique object key ----- */
    const extMatch = fileName.match(/\.[A-Za-z0-9]+$/);
    const ext = extMatch ? extMatch[0] : "";
    const unique = crypto.randomUUID();

    const parts = [wid && `workspace-${wid}`, bid && `brand-${bid}`, pid && `post-${pid}`].filter(Boolean);
    const prefix = parts.length ? parts.join("/") + "/" : "";
    const objectKey = `${prefix}${unique}${ext}`;

    /* ----- Generate presigned PUT URL ----- */
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: fileType,
    });

    // URL valid for 5 minutes – ample for client to start upload
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 60 * 5 });

    // Public URL (depends on R2 public bucket config)
    const publicUrl = `${R2_PUBLIC_URL}/${objectKey}`;

    return NextResponse.json({ uploadUrl, publicUrl, key: objectKey });
  } catch (err: any) {
    console.error("[api/upload/sign] ❌ Error generating presigned URL:", err);
    return NextResponse.json({ error: "Failed to generate upload URL", details: err?.message }, { status: 500 });
  }
} 