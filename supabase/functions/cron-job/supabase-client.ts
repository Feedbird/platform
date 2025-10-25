// supabase-client.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client with production database
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to get database connection info
export function getConnectionInfo() {
  return {
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    isProduction: supabaseUrl.includes('supabase.co')
  };
}

// Helper function to test database connection
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
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
