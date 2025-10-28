import { NextRequest, NextResponse } from "next/server";
import {
  getSignedUploadUrl,
  getSignedUploadUrlLegacy,
} from "../../../../../media-processing/r2-upload";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType, path } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Missing fileName or fileType" },
        { status: 400 }
      );
    }

    const wid = req.nextUrl.searchParams.get("wid");
    if (!wid) {
      return NextResponse.json(
        { error: "Missing workspace ID (wid)" },
        { status: 400 }
      );
    }

    let uploadResult;

    if (path) {
      // New flexible approach: use path array
      // Example: path = [{ type: "forms", id: "form123" }, { type: "fields" }]
      uploadResult = await getSignedUploadUrl({
        fileName,
        fileType,
        wid,
        resources: path,
      });
    } else {
      // Legacy approach: use individual query params
      const boardId = req.nextUrl.searchParams.get("bid");
      const pid = req.nextUrl.searchParams.get("pid");
      const cid = req.nextUrl.searchParams.get("cid");

      uploadResult = await getSignedUploadUrlLegacy({
        fileName,
        fileType,
        wid,
        boardId,
        pid,
        cid,
      });
    }

    return NextResponse.json(uploadResult);
  } catch (error: any) {
    console.error(
      "❌ [API /media/request-upload-url] A critical error occurred:",
      error
    );
    return NextResponse.json(
      { error: "Failed to get upload URL", details: error.message },
      { status: 500 }
    );
  }
}
