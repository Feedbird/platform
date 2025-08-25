import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("linkedin")!;

const Body = z.object({
  page: z.any(), // full SocialPage
  limit: z.number().optional().default(20),
  cursor: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Response
    // return Response.json([])
    const { page, limit, cursor } = Body.parse(await req.json());
    
    const result = await ops.getPostHistory(page, limit, cursor);
    
    return Response.json(result);
  } catch (e: any) {
    console.error("[LinkedIn history]", e);
    return new Response(e.message ?? "LinkedIn error", { status: 500 });
  }
} 

