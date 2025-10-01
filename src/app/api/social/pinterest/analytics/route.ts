import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("pinterest")!;

const Body = z.object({
  page: z.any(),
  postId: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body: any = Body.parse(await req.json());

    if (!body.page || !body.postId) {
      return Response.json({ error: "Missing required fields: page and postId" }, { status: 400 });
    }

    if (!ops.getPostAnalytics) {
      return Response.json({ error: "getPostAnalytics is not implemented" }, { status: 500 });
    }
    
    const result = await ops.getPostAnalytics(body.page, body.postId, body.startDate, body.endDate);
    
    return Response.json(result);

  } catch (e: any) {
    console.error("[API] Pinterest analytics error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
