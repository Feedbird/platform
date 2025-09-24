import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";
import { PlatformApiError } from "@/lib/utils/exceptions/api-errors";
import { BaseError } from "@/lib/utils/exceptions/base-error";
import { SocialPage } from "@/lib/social/platforms/platform-types";

const ops = getPlatformOperations("pinterest")!;

const Body = z.object({
  page: z.any(), // SocialPage
  limit: z.number().int().positive().max(100).optional(),
  nextPage: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    const page = body.page as SocialPage;
    const limit = body.limit ?? 20;
    const nextPage = body.nextPage;

    console.log("[API] pinterest/history → body", { pageId: page.id, limit, nextPage });

    const result = await ops.getPostHistory(page, limit, nextPage);
    console.log(`[API] pinterest/history → ${result.posts.length} pins, nextPage: ${result.nextPage}`);

    return NextResponse.json(result);

  } catch (e: unknown) {
    console.error("[API] pinterest/history error:", e);

    if (e instanceof ZodError) {
      return NextResponse.json({
        error: new BaseError('Invalid request body.', 'VALIDATION_ERROR', {
          details: e.errors
        }).toJSON()
      }, { status: 400 });
    }

    if (e instanceof BaseError) {
      return NextResponse.json({ error: e.toJSON() }, { status: 500 });
    }

    // For unexpected errors, wrap them in a generic PlatformApiError
    const error = new PlatformApiError(
      "pinterest",
      e instanceof Error ? e.message : "An unknown error occurred.",
      { details: e }
    );

    return NextResponse.json({ error: error.toJSON() }, { status: 500 });
  }
}
