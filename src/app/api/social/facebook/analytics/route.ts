import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("facebook")!;

const Body = z.object({
  page: z.any(),
  postId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body: any = Body.parse(await req.json());
    
    const result = await ops.getPostAnalytics(body.page, body.postId);
    
    return Response.json(result);

  } catch (e: any) {
    console.error("[API] Facebook analytics error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
