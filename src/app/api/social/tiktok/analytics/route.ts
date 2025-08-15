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
    console.log("[API] TikTok analytics → body", body);

    const analytics = await ops.getPostAnalytics(body.page, body.postId);
    console.log(`[API] TikTok analytics → success`, analytics);
    return Response.json(analytics);

  } catch (e: any) {
    console.error("[API] TikTok analytics error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
