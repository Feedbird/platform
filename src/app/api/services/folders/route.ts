import { NextRequest, NextResponse } from "next/server";
import { ApiHandlerError } from "../../shared";
import { ServiceFolderHandler } from "./handler";

export async function GET(req: NextRequest) {
  try {
    const params = new URL(req.url).searchParams;
    const workspaceId = params.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId query parameter is required" },
        { status: 400 }
      );
    }
    const response = await ServiceFolderHandler.getAll(workspaceId);
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
