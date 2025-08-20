import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("tiktok")!;

const Body = z.object({
  page: z.any(),
  content: z.any(),
  options: z.any(),
});

export async function POST(req: NextRequest) {
  try {
    const body: any = Body.parse(await req.json());
    
    const result = await ops.publishPost(body.page, body.content, body.options);
    
    console.log(`[API] TikTok publish → success`, result);

    if(result.publishId) {
      //Check post status until complete
      if(ops.checkPostStatusAndUpdate) {
        ops.checkPostStatusAndUpdate(result.publishId, body.page.id, result.id);
      }
    }
    return  Response.json(result);

  } catch (e: any) {
    console.error("[API] TikTok publish error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
