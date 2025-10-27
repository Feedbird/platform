import { supabase } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

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
      .select(
        `
        *,
        submissions_count:form_submissions(count),
        fields_count:form_fields(count),
        services:services(id, name)
      `
      )
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

    // Transform the forms to flatten the count arrays
    const transformedForms = forms.map((form: any) => ({
      ...form,
      submissionsCount: form.submissions_count?.[0]?.count || 0,
      fieldsCount: form.fields_count?.[0]?.count || 0,
      services: form.services || [], // Keep services as array since one form can have multiple services
    }));

    return NextResponse.json({ data: transformedForms });
  } catch (error) {
    console.error("Error in GET /api/forms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
