import { NextRequest, NextResponse } from "next/server";
import { getPlatformOperations } from "@/lib/social/platforms";

export async function POST(req: NextRequest) {
  try {
    const { page, postId } = await req.json();

    if (!page || !postId) {
      return NextResponse.json(
        { error: "Missing required fields: page, postId" },
        { status: 400 }
      );
    }

    const ops = getPlatformOperations("pinterest");
    if (!ops) {
      return NextResponse.json(
        { error: "Pinterest platform operations not available" },
        { status: 400 }
      );
    }

    await ops.deletePost(page, postId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pinterest delete error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete Pinterest post" },
      { status: 500 }
    );
  }
}