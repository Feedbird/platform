import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("tiktok")!;

const Body = z.object({
  page: z.any(),
  postId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    console.log("[API] TikTok delete → body", body);

    await ops.deletePost(body.page, body.postId);
    console.log(`[API] TikTok delete → success`);
    return Response.json({ success: true });

  } catch (e: any) {
    console.error("[API] TikTok delete error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
