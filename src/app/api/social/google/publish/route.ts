import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("google")!;

const Body = z.object({
  page: z.any(),
  content: z.any(),
  options: z.any().optional()
});

export async function POST(req: NextRequest) {
  try {
    const { page, content, options } = Body.parse(await req.json());

    const result = await ops.publishPost(page, content, options);
    return Response.json(result);
  } catch (e: any) {
    console.error("[Google Business publish]", e);
    return new Response(e.message ?? "Google Business error",{ status:500 });
  }
}
