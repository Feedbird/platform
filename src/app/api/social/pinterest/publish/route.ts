import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("pinterest")!;

const Body = z.object({
  board: z.any(),
  post : z.object({
    content   : z.string().min(1),
    mediaUrls : z.array(z.string().url()).nonempty(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    console.log("[API] publish → body", body);

    const pin = await ops.publishPost(body.board, {
      text: body.post.content,
      media: {
        type: "image",
        urls: body.post.mediaUrls
      }
    });
    console.log("[API] publish → pin", pin);
    return Response.json(pin);

  } catch (e: any) {
    console.error("[API] publish error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
