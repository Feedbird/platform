import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("youtube")!;

const Body = z.object({
  page: z.object({
    id       : z.string(),
    pageId   : z.string(),
    authToken: z.string(),
  }).passthrough(),
  limit: z.number().int().min(1).max(50).default(20),
});

export async function POST(req: NextRequest) {
  try {
    const { page, limit } = Body.parse(await req.json());
    const list = await ops.getPostHistory(page as any, limit);
    return Response.json(list);                    // 200
  } catch (e: any) {
    console.error("[YouTube history]", e);
    return new Response(e.message ?? "YouTube error", { status: 500 });
  }
}
