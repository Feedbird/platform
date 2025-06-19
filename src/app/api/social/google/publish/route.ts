import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("google")!;

const Body = z.object({
  page: z.any(),
  post: z.object({
    content     : z.string().min(1),
    mediaUrls   : z.array(z.string().url()).optional(),
    scheduledTime: z.coerce.date().optional(),
  }),
});

export async function POST(req:NextRequest){
  try{
    const { page, post } = Body.parse(await req.json());
    const res = await ops.publishPost(page, {
      text: post.content,
      media: post.mediaUrls ? {
        type: "image",
        urls: post.mediaUrls
      } : undefined
    });
    return Response.json(res);
  }catch(e:any){
    console.error("[Google Business publish]", e);
    return new Response(e.message ?? "Google Business error",{ status:500 });
  }
}
