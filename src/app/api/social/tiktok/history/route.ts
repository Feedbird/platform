import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("tiktok")!;

const Body = z.object({
  page: z.any(),
  limit: z.number().int().positive().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    console.log("[API] TikTok history → body", body);

    const videos = await ops.getPostHistory(body.page, body.limit ?? 20);
    console.log(`[API] TikTok history → ${videos.length} videos`);
    return Response.json(videos);

  } catch (e: any) {
    console.error("[API] TikTok history error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
