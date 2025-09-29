import { NextRequest, NextResponse } from "next/server";
import { ApiHandlerError } from "../../shared";
import { SubmissionHandler } from "./handler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const submission = await SubmissionHandler.submitForm(body);

    return NextResponse.json({ data: submission }, { status: 201 });
  } catch (error) {
    const uiMessage =
      "We are unable to submit this form now. Please try again later.";
    console.error("Error in POST /api/form/submission:", error);
    if (error instanceof ApiHandlerError) {
      return NextResponse.json({ error: uiMessage }, { status: error.status });
    }
    return NextResponse.json({ error: uiMessage }, { status: 500 });
  }
}
