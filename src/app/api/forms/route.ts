import { supabase } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const CreateFormSchema = z.object({
  type: z.enum(["intake", "template"]),
  workspace_id: z.string().uuid(),
  service_id: z.string().uuid().optional(),
  title: z.string().min(4),
  thumbnail_url: z.string().url().optional(),
  cover_url: z.string().url().optional(),
  description: z.string().max(900).optional(),
  location_tags: z.array(z.string()).default([]),
  account_tags: z.array(z.string()).default([]),
  createdBy: z.string().email(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const workspaceId = searchParams.get("workspace_id");

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    const { data: forms, error } = await supabase
      .from("forms")
      .select("*")
      .eq("workspace_id", workspaceId);

    if (error) {
      console.error("Error fetching forms:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch forms" },
        { status: 500 }
      );
    }

    if (!forms) {
      return NextResponse.json(
        { success: false, error: "Forms not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: forms });
  } catch (error) {
    console.error("Error in GET /api/forms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
