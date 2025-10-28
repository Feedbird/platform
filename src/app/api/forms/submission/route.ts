import { NextRequest, NextResponse } from "next/server";
import { ApiHandlerError } from "../../shared";
import { SubmissionsHandler } from "./handler";
import { readJsonSnake, jsonCamel } from "@/lib/utils/http";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonSnake(request);

    const submission = await SubmissionsHandler.submitForm(body);

    return jsonCamel({ data: submission }, { status: 201 });
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get("formId");

    if (!formId) {
      throw new ApiHandlerError("formId is required", 400);
    }
    const submissions = await SubmissionsHandler.getSubmissions(formId);

    return jsonCamel({ data: submissions }, { status: 200 });
  } catch (e) {
    const uiMessage =
      "We are unable to fetch form submissions now. Please try again later.";
    console.error("Error in GET /api/form/submission:", e);
    if (e instanceof ApiHandlerError) {
      return NextResponse.json({ error: uiMessage }, { status: e.status });
    }
    return NextResponse.json({ error: uiMessage }, { status: 500 });
  }
}
