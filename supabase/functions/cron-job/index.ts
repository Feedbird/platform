// index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client with production database
const supabaseUrl = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') || 'https://your-actual-project-ref.supabase.co';
const supabaseServiceKey = Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'your-actual-production-service-role-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🚀 Cron Job executed at:", new Date().toISOString());
    console.log("🔗 Connecting to database:", supabaseUrl);
    
    // Fetch all users from production database
    console.log("📊 Fetching users from production database...");
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, created_at')
      .limit(50); // Limit to 50 users for performance

    if (error) {
      console.error("❌ Database error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`✅ Successfully fetched ${users?.length || 0} users from production database`);
    console.log("👥 Users:", users?.map(user => ({ id: user.id, email: user.email, name: `${user.first_name} ${user.last_name}` })));

    const response = {
      success: true,
      message: `Cron job completed successfully. Fetched ${users?.length || 0} users from production database.`,
      timestamp: new Date().toISOString(),
      status: "completed",
      source: "supabase-edge-function",
      database: "production",
      data: {
        userCount: users?.length || 0,
        users: users || []
      }
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
