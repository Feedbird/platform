// index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getConnectionInfo, testConnection } from "./supabase-client.ts";
import { UserService, WorkspaceService, DatabaseService } from "./database-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    
    // Get connection info
    const connectionInfo = getConnectionInfo();
    
    // Test database connection
    const connectionTest = await testConnection();
    
    if (!connectionTest.success) {
      throw new Error(`Database connection failed: ${connectionTest.error}`);
    }
    
    // Fetch all users from database using service
    const { users, error } = await UserService.getAllUsers(50);

    if (error) {
      console.error("Database error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Get additional stats
    const { count: userCount } = await UserService.getUserCount();
    const { workspaces } = await WorkspaceService.getAllWorkspaces();


    const response = {
      success: true,
      message: `Cron job completed successfully. Fetched ${users?.length || 0} users from database.`,
      timestamp: new Date().toISOString(),
      status: "completed",
      source: "supabase-edge-function",
      database: connectionInfo.isProduction ? "production" : "local",
      connection: connectionInfo,
      stats: {
        usersFetched: users?.length || 0,
        totalUsers: userCount || 0,
        totalWorkspaces: workspaces?.length || 0
      },
      data: {
        users: users || [],
        workspaces: workspaces || []
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Cron job error:", error);
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
