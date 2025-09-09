import { NextRequest, NextResponse } from "next/server";
import { ApiHandlerError } from "../shared";
import { ServicesHandler } from "./handler";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json(
        {
          error: "Workspace is necessary to fetch services",
        },
        { status: 400 }
      );
    }
    const available = searchParams.get("available") || {};
    const services = await ServicesHandler.getServices(
      workspaceId,
      available && available === "1"
    );

    return NextResponse.json({ data: services });
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
