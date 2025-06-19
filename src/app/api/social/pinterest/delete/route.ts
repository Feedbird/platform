import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("pinterest")!;

const Body = z.object({
  board: z.any(),
  pinId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    console.log("[API] delete → body", body);

    await ops.deletePost(body.board, body.pinId);
    return new Response("OK");

  } catch (e: any) {
    console.error("[API] delete error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
