import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("youtube")!;

const Body = z.object({
  page: z.any(),
  postId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    console.log("[API] YouTube delete → body", body);

    await ops.deletePost(body.page, body.postId);
    console.log(`[API] YouTube delete → success`);
    return Response.json({ success: true });

  } catch (e: any) {
    console.error("[API] YouTube delete error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
