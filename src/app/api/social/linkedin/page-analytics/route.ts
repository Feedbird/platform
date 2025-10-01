import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("linkedin")!;

const Body = z.object({
  page: z.any(),
});

export async function POST(req: NextRequest) {
  try {
    const body: any = Body.parse(await req.json());

    if (!body.page) {
      return Response.json({ error: "Missing required fields: page" }, { status: 400 });
    }

    if (!ops.getPageAnalytics) {
      return Response.json({ error: "getPageAnalytics is not implemented" }, { status: 500 });
    }
    
    const result = await ops.getPageAnalytics(body.page);
    
    return Response.json(result);

  } catch (e: any) {
    console.error("[API] LinkedIn page analytics error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}

