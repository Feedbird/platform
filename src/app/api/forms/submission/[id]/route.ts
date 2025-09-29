import { ApiHandlerError } from "@/app/api/shared";
import { supabase } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const extractedParams = await params;
    const submissionId = extractedParams.id;

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: "Submission ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("form_submissions")
      .select(`*`)
      .eq("id", submissionId)
      .single();

    if (error) {
      throw new ApiHandlerError(
        `Failed to fetch submission: ${(error as Error).message}`,
        500
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    const uiMessage =
      "We are unable to retrieve this form now. Please try again later.";
    console.error("Error in GET /api/form:", error);
    if (error instanceof ApiHandlerError) {
      return NextResponse.json({ error: uiMessage }, { status: error.status });
    }
    return NextResponse.json({ error: uiMessage }, { status: 500 });
  }
}
