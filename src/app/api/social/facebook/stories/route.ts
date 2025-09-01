import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("facebook")!;

const Body = z.object({
  page: z.any(),
  limit: z.number().optional(),
  nextPage: z.union([z.number(), z.string()]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body: any = Body.parse(await req.json());

    if (!ops.getStoryHistory) {
      return Response.json({ error: "Facebook stories are not supported" }, { status: 500 });
    }
    
    const result = await ops.getStoryHistory(body.page, body.limit, body.nextPage);
    
    return Response.json(result);

  } catch (e: any) {
    console.error("[API] Facebook stories error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
