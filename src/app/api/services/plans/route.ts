import { supabase } from "@/lib/supabase/client";

export async function GET() {
  try {
    const plans = await supabase.from("service_plans").select("*");
    return new Response(JSON.stringify(plans.data), { status: 200 });
  } catch (e) {}
}
