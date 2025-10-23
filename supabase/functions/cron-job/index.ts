// index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateMessage } from "./helpers.ts";  // <-- import local file

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🚀 Cron Job executed at:", new Date().toISOString());
    
    const { message, timestamp } = generateMessage(); // <-- call helper
    console.log("✅ Message:", message);

    const response = {
      success: true,
      message,
      timestamp,
      status: "completed",
      source: "supabase-edge-function",
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Cron job error:", error);
    return new Response(
      JSON.stringify({
        error: "Cron job failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
