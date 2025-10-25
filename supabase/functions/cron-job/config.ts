// config.ts
// Environment variable configuration

// Supabase
export const supabaseUrl = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') || Deno.env.get('SUPABASE_URL');
export const supabaseServiceKey = Deno.env.get('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY')

// YouTube
export const youtubeClientId = Deno.env.get('YOUTUBE_CLIENT_ID');
export const youtubeClientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET');
