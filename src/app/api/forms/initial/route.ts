import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CreateFormSchema } from "../route";
import { supabase } from "@/lib/supabase/client";

// Validation schemas

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    return NextResponse.json(data, { status: 201 });
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
