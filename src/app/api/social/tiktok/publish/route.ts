import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("tiktok")!;

const Body = z.object({
  page: z.any(),
  post: z.object({
    content: z.string(),
    mediaUrls: z.array(z.string()),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    console.log("[API] TikTok publish → body", body);

    const result = await ops.publishPost(body.page, {
      text: body.post.content,
      media: {
        type: "video" as const,
        urls: body.post.mediaUrls
      }
    });
    
    console.log(`[API] TikTok publish → success`, result);
    return Response.json(result);

  } catch (e: any) {
    console.error("[API] TikTok publish error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
