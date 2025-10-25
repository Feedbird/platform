// index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { testConnection } from "./supabase-client.ts";
import { syncAllAnalytics } from "./analytics-sync.ts";
import { 
  youtubeClientId, 
  youtubeClientSecret,
  supabaseUrl,
  supabaseServiceKey
} from "./config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate environment variables first
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('SUPABASE_URL');
    if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!youtubeClientId) missingVars.push('YOUTUBE_CLIENT_ID');
    if (!youtubeClientSecret) missingVars.push('YOUTUBE_CLIENT_SECRET');
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    // Test database connection
    const connectionTest = await testConnection();
    
    if (!connectionTest.success) {
      throw new Error(`Database connection failed: ${connectionTest.error}`);
    }
    
    // Run analytics sync
    console.log('[Cron] Starting analytics sync...');
    await syncAllAnalytics();
    
    console.log('[Cron] Analytics sync completed successfully');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Analytics sync completed',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[Cron] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Analytics sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
