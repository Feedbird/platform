import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("linkedin")!;

const Body = z.object({
  pg  : z.any(),                                    // full SocialPage
  post: z.object({
    content   : z.string().min(1),
    mediaUrls : z.array(z.string().url()).optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const { pg, post } = Body.parse(await req.json());
    const result = await ops.publishPost(pg, {
      text: post.content,
      media: post.mediaUrls ? {
        type: "image",
        urls: post.mediaUrls
      } : undefined
    });
    return Response.json(result);                   // 200
  } catch (e: any) {
    console.error("[LinkedIn publish]", e);
    return new Response(e.message ?? "LinkedIn error", { status: 500 });
  }
}
