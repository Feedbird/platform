import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("pinterest")!;

const Body = z.object({
  board: z.any(),
  limit: z.number().int().positive().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body  = Body.parse(await req.json());
    console.log("[API] history → body", body);

    const pins = await ops.getPostHistory(body.board, body.limit ?? 20);
    console.log(`[API] history → ${pins.length} pins`);
    return Response.json(pins);

  } catch (e: any) {
    console.error("[API] history error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
