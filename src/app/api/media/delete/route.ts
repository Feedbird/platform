import { NextRequest, NextResponse } from "next/server";
import { deleteFromR2ByKeyOrUrl } from "../../../../../media-processing/r2-upload";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }
    await deleteFromR2ByKeyOrUrl(url);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API /media/delete]", error);
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}


