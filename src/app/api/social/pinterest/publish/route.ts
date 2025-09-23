import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";
import { PlatformApiError } from "@/lib/utils/exceptions/api-errors";
import { BaseError } from "@/lib/utils/exceptions/base-error";
import { SocialPage, PostContent, PublishOptions } from "@/lib/social/platforms/platform-types";

const ops = getPlatformOperations("pinterest")!;

// Updated schema to match Facebook pattern
const Body = z.object({
  page: z.any(), // SocialPage
  content: z.any(),
  options: z.any().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());

    // Cast to the correct types after parsing
    const page = body.page as SocialPage;
    const content = body.content as PostContent;
    const options = body.options as PublishOptions;

    // Validate that a board is selected for Pinterest
    if (!options?.settings?.pinterest?.boardId) {
      return NextResponse.json({
        error: 'Pinterest requires a board to be selected. Please select a board in the settings.'
      }, { status: 400 });
    }

    const pin = await ops.publishPost(page, content, options);

    return NextResponse.json(pin);

  } catch (e: any) {
    console.error("[API] pinterest/publish error:", e);

    // Return structured error response
    if (e.message && e.message.includes('board')) {
      return NextResponse.json({
        error: e.message
      }, { status: 400 });
    }

    return NextResponse.json({
      error: e.message ?? "Internal error"
    }, { status: 500 });
  }
}
