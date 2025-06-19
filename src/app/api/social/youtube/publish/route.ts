/* Server-side proxy: receives full "page" object + post.
   No DB - just trust the browser payload. */

   import { NextRequest } from "next/server";
   import { z } from "zod";
   import { getPlatformOperations } from "@/lib/social/platforms";
   
   const ops = getPlatformOperations("youtube")!;
   
   const Body = z.object({
     page: z.object({
       id        : z.string(),
       pageId    : z.string(),
       authToken : z.string(),
       name      : z.string(),
       accountId : z.string(),
       platform  : z.literal("youtube"),
     }).passthrough(),                 // keep extra fields
     post: z.object({
       content  : z.string().min(1),
       mediaUrls: z.array(z.string().url()).nonempty(),
     }),
   });
   
   export async function POST(req: NextRequest) {
     try {
       const { page, post } = Body.parse(await req.json());
       const res = await ops.publishPost(page as any, {
         text: post.content,
         media: {
           type: "video",
           urls: post.mediaUrls
         }
       });
       return Response.json(res);                       // 200
     } catch (e: any) {
       console.error("[YouTube publish]", e);
       return new Response(e.message ?? "YouTube error", { status: 500 });
     }
   }
   