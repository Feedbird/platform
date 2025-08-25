import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("linkedin")!;

const Body = z.object({
  page: z.any(), // full SocialPage
  postId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());

    await ops.deletePost(body.page, body.postId);

    return Response.json({ success: true });

  } catch (e: any) {
    console.error("[API] LinkedIn delete error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
