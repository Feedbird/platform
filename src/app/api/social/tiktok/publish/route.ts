import { NextRequest } from "next/server";
import { z } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";

const ops = getPlatformOperations("tiktok")!;

const Body = z.object({
  pageId: z.string(),
  post: z.object({
    content: z.string(),
    mediaUrls: z.array(z.string()),
    privacyLevel: z.string().optional(),
    disableDuet: z.boolean().optional(),
    disableStitch: z.boolean().optional(),
    disableComment: z.boolean().optional(),
    brandContentToggle: z.boolean().optional(),
    brandOrganicToggle: z.boolean().optional(),
    autoAddMusic: z.boolean().optional(),
    allowDownload: z.boolean().optional(),
    allowStitch: z.boolean().optional(),
    allowDuet: z.boolean().optional(),
    videoCovers: z.object({
      coverImageId: z.string().optional(),
      coverTapTime: z.number().optional(),
    }).optional(),
    contentDisclosure: z.object({
      contentDisclosure: z.boolean(),
      contentDisclosureIcon: z.string().optional(),
    }).optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    console.log("[API] TikTok publish → body", body);

    // Create page object with just the ID (token will be fetched securely)
    const page = { id: body.pageId } as any;
    
    const result = await ops.publishPost(page, {
      text: body.post.content,
      media: {
        type: "video" as const,
        urls: body.post.mediaUrls
      }
    }, {
      visibility: body.post.privacyLevel === 'SELF_ONLY' ? 'private' : 'public',
      disableDuet: body.post.disableDuet,
      disableStitch: body.post.disableStitch,
      disableComment: body.post.disableComment,
      brandContentToggle: body.post.brandContentToggle,
      brandOrganicToggle: body.post.brandOrganicToggle,
      autoAddMusic: body.post.autoAddMusic,
      allowDownload: body.post.allowDownload,
      allowStitch: body.post.allowStitch,
      allowDuet: body.post.allowDuet,
      videoCovers: body.post.videoCovers,
      contentDisclosure: body.post.contentDisclosure,
    });
    
    console.log(`[API] TikTok publish → success`, result);
    return Response.json(result);

  } catch (e: any) {
    console.error("[API] TikTok publish error\n", e);
    return new Response(e.message ?? "Internal error", { status: 500 });
  }
}
