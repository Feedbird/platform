import { supabase } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";
import { FormHandler } from "./handlers";
import { ApiHandlerError } from "../../shared";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const extractedParams = await params;
    const formId = extractedParams.id;

    if (!formId) {
      return NextResponse.json(
        { success: false, error: "Form ID is required" },
        { status: 400 }
      );
    }

    const data = await FormHandler.fetchFormById(formId);

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

// TODO ASK: Soft delete?
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const extractedParams = await params;
    const formId = extractedParams.id;

    if (!formId) {
      return NextResponse.json(
        { success: false, error: "Form ID is required" },
        { status: 400 }
      );
    }

    await FormHandler.deleteForm(formId);

    return NextResponse.json({ data: "Deleted" });
  } catch (error) {
    const uiMessage = "Unable to delete form. Please try again later.";
    console.error("Error in DELETE /api/form:", error);
    if (error instanceof ApiHandlerError) {
      return NextResponse.json({ error: uiMessage }, { status: error.status });
    }
    return NextResponse.json({ error: uiMessage }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const extractedParams = await params;
    const formId = extractedParams.id;
    const body = await req.json();

    if (!formId) {
      return NextResponse.json(
        { success: false, error: "Form ID is required" },
        { status: 400 }
      );
    }

    const updatedForm = await FormHandler.updateForm(formId, body);

    return NextResponse.json({ data: updatedForm });
  } catch (error) {
    console.error("Error in DELETE /api/form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
