// supabase-client.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { supabaseUrl, supabaseServiceKey } from "./config.ts";

// Initialize Supabase client with production database
export const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Helper function to test database connection
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('social_pages')
      .select('count')
      .limit(1);
    
    return {
      success: !error,
      error: error?.message,
      connected: true
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      connected: false
    };
  }
}
