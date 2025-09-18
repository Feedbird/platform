/* Server-side proxy: receives full "page" object + post.
   No DB - just trust the browser payload. */

   import { NextRequest } from "next/server";
   import { z } from "zod";
   import { getPlatformOperations } from "@/lib/social/platforms";
   
   const ops = getPlatformOperations("youtube")!;
   
   const Body = z.object({
     page: z.any(),                    // Use flexible validation like other platforms
     post: z.any(),
     options: z.any().optional(),
   });
   
   export async function POST(req: NextRequest) {
     try {
       const { page, post, options } = Body.parse(await req.json());
      const res = await ops.publishPost(page as any, {
        id: post.id,
        text: post.content,
        media: {
          type: "video",
          urls: post.mediaUrls
        }
      }, options);
       return Response.json(res);                       // 200
     } catch (e: any) {
       console.error("[YouTube publish]", e);
       return new Response(e.message ?? "YouTube error", { status: 500 });
     }
   }
   