import { ApiHandlerError } from "@/app/api/shared";
import { NextRequest, NextResponse } from "next/server";
import { SubmissionHandler } from "./handler";
import { jsonCamel } from "@/lib/utils/http";

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

    const submission = await SubmissionHandler.getSubmission(submissionId);

    return jsonCamel({ data: submission }, { status: 200 });
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
