import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("linkedin")!;

const Body = z.object({
  page: z.any(),                                    // full SocialPage
  content: z.any(),
  options: z.any().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { page, content, options } = Body.parse(await req.json());
    
    const result = await ops.publishPost(page, content, options);
    
    return Response.json(result);                   // 200
  } catch (e: any) {
    console.error("[LinkedIn publish]", e);
    return new Response(e.message ?? "LinkedIn error", { status: 500 });
  }
}
