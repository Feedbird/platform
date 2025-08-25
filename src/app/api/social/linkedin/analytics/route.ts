import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("linkedin")!;

const Body = z.object({
  page: z.any(), // full SocialPage
  postId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { page, postId } = Body.parse(await req.json());
    
    const result = await ops.getPostAnalytics(page, postId || '');
    
    return Response.json(result);
  } catch (e: any) {
    console.error("[LinkedIn analytics]", e);
    return new Response(e.message ?? "LinkedIn error", { status: 500 });
  }
}
