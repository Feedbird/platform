import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";
import { getSecureToken } from "@/lib/utils/token-manager";

const ops = getPlatformOperations("tiktok")!;

const Body = z.object({
  pageId: z.string(),
  limit: z.number().int().positive().max(100).optional(),
  cursor: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    console.log("[API] TikTok history → body", body);

    // Get secure token (handles refresh if needed)
    const token = await getSecureToken(body.pageId);
    
    // Create page object with secure token
    const page = {
      id: body.pageId,
      authToken: token
    } as any;

    const videos = await ops.getPostHistory(page, body.limit ?? 20, body.cursor);
    console.log(`[API] TikTok history → ${videos.length} videos`);
    return Response.json(videos);

  } catch (e: any) {
    console.error("[API] TikTok history error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
