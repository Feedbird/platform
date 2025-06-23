import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getPlatformOperations } from "@/lib/social/platforms";
import { PlatformApiError } from "@/lib/utils/exceptions/api-errors";
import { BaseError } from "@/lib/utils/exceptions/base-error";
import { SocialPage, PostContent } from "@/lib/social/platforms/platform-types";

const ops = getPlatformOperations("pinterest")!;

// The Zod schema for a social page is complex, so we'll use 'any' for now
// and rely on runtime validation within the platform operations.
const Body = z.object({
  page: z.any(),
  post: z.object({
    text: z.string().min(1),
    media: z.object({
      type: z.enum(["image", "video"]),
      urls: z.array(z.string().url()).nonempty(),
    }),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());

    // Cast to the correct types after parsing
    const page = body.page as SocialPage;
    const post = body.post as PostContent;

    const pin = await ops.publishPost(page, post);

    return NextResponse.json(pin);

  } catch (e: unknown) {
    console.error("[API] pinterest/publish error:", e);

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
