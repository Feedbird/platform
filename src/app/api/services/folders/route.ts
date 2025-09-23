import { NextResponse } from "next/server";
import { ApiHandlerError } from "../../shared";
import { ServiceFolderHandler } from "./handlet";

export async function GET() {
  try {
    const response = await ServiceFolderHandler.getAll();
    return NextResponse.json({ data: response });
  } catch (error) {
    const uiMessage =
      "We are unable to retrieve services now. Please try again later.";
    console.error("Error in GET /api/services:", error);
    if (error instanceof ApiHandlerError) {
      return NextResponse.json({ error: uiMessage }, { status: error.status });
    }
    return NextResponse.json({ error: uiMessage }, { status: 500 });
  }
}
