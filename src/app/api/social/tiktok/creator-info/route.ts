import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";
import { getSecureToken } from "@/lib/utils/token-manager";
import type { TikTokCreatorInfo } from "@/lib/social/platforms/platform-types";


const Body = z.object({
  pageId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());

    // Create page object with just the ID (token will be fetched securely)
    const page = { id: body.pageId } as any;
    
    const ops = getPlatformOperations("tiktok")!;

    if (!ops.getCreatorInfo) {
      return Response.json({ error: "getCreatorInfo operation not found" }, { status: 500 });
    }

    const creatorInfo: TikTokCreatorInfo = await ops.getCreatorInfo(page);
    return Response.json(creatorInfo);

  } catch (e: any) {
    console.error("[API] TikTok creator info error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
