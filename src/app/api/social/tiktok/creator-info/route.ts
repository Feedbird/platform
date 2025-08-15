import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";
import { getSecureToken } from "@/lib/utils/token-manager";

const ops = getPlatformOperations("tiktok")!;

const Body = z.object({
  pageId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    console.log("[API] TikTok creator info → body", body);

    // Create page object with just the ID (token will be fetched securely)
    const page = { id: body.pageId } as any;
    
    const creatorInfo = await ops.getCreatorInfo(page);
    console.log(`[API] TikTok creator info → success`, creatorInfo);
    return Response.json(creatorInfo);

  } catch (e: any) {
    console.error("[API] TikTok creator info error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
