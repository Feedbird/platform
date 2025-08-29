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
    const formId = searchParams.get("id");
    console.log("FormId: ", formId);
    if (!formId) {
      return NextResponse.json(
        { success: false, error: "Form ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .eq("id", formId)
      .single();

    if (error) {
      console.error("Error fetching form:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch form" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Form not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in GET /api/form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
