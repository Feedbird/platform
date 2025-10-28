import { NextRequest, NextResponse } from "next/server";
import { ApiHandlerError } from "../../shared";
import { FormFieldsHandler } from "./handler";
import { readJsonSnake, jsonCamel } from "@/lib/utils/http";

export async function POST(req: NextRequest) {
  try {
    const { formId, formFields } = await readJsonSnake(req);

    if (!formId || !formFields) {
      return NextResponse.json(
        { error: "formId and formFields are required" },
        { status: 400 }
      );
    }

    await FormFieldsHandler.updateFormFields(formId, formFields);

    return jsonCamel({ message: "Form fields updated" });
  } catch (error) {
    const uiMessage =
      "We are unable to save this form updates now. Please try again.";
    console.error("Error in GET /api/form:", error);
    if (error instanceof ApiHandlerError) {
      return NextResponse.json({ error: uiMessage }, { status: error.status });
    }
    return NextResponse.json({ error: uiMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");
    if (!formId) {
      return NextResponse.json(
        { error: "formId is required" },
        { status: 400 }
      );
    }
    const formFields = await FormFieldsHandler.fetchFormFields(formId);
    return jsonCamel({ formFields });
  } catch (error) {
    const uiMessage =
      "We are unable to load this form fields now. Please try again.";
    console.error("Error in GET /api/form:", error);
    if (error instanceof ApiHandlerError) {
      return NextResponse.json({ error: uiMessage }, { status: error.status });
    }
    return NextResponse.json({ error: uiMessage }, { status: 500 });
  }
}
