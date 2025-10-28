import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { readJsonSnake, jsonCamel } from "@/lib/utils/http";

const CreateFormSchema = z.object({
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

// Validation schemas

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonSnake(req);
    const validatedData = CreateFormSchema.parse(body);

    const { data, error } = await supabase
      .from("forms")
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      console.error("Error creating form:", error);
      return NextResponse.json(
        { error: "Failed to create form" },
        { status: 500 }
      );
    }

    return jsonCamel(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
