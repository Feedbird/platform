/* Server-side proxy: receives page object + pagination params.
   No DB - just trust the browser payload. */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("youtube")!;

const Body = z.object({
  page: z.any(),                    // Use flexible validation like other platforms
  limit: z.number().optional(),
  nextPage: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { page, limit = 20, nextPage } = Body.parse(await req.json());
    const res = await ops.getPostHistory(page as any, limit, nextPage);
    return Response.json(res);                       // 200
  } catch (e: any) {
    console.error("[YouTube history]", e);
    return new Response(e.message ?? "YouTube history error", { status: 500 });
  }
}