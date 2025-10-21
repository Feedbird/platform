import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);



export interface FormSubmission {
  id: string;
  workspace_id: string;
  form_id: string;
  form_version: number;
  submitted_by: string;
  answers: Record<string, { type: string; value: string | string[] }>;
  schema_snapshot: Record<string, string>;
  created_at: string;
}
