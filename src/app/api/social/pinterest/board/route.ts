import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("pinterest")!;

const Body = z.object({
  token  : z.string().min(10),          // page / account token
  boardId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { token, boardId } = Body.parse(await req.json());

    /* fabricate a minimal SocialAccount just for the call */
    const fakeAcc = {
      id         : "tmp",
      platform   : "pinterest",
      name       : "",
      accountId  : "tmp",
      authToken  : token,
      connected  : true,
      status     : "active",
    } as any;

    const page = await ops.connectPage(fakeAcc, boardId);
    return Response.json(page);                     // 200

  } catch (e: any) {
    console.error("[API] board error\n", e);
    return new Response(e.message || "Internal error", { status: 500 });
  }
}
