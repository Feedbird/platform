import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on the schema
export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  logo?: string
  created_at: string
  updated_at: string
  /**
   * Client-side augmentation – user role within this workspace.
   * "admin" when the workspace was created by the user,
   * "member" when the user was invited.
   */
  role?: 'admin' | 'member'

  /**
   * Boards visible to the current user. Empty when not prefetched by the API.
   */
  boards?: Board[]
}

export interface Brand {
  id: string
  workspace_id: string
  name: string
  logo?: string
  style_guide?: any
  link?: string
  voice?: string
  prefs?: string
  created_at: string
  updated_at: string
}

export interface Board {
  id: string
  workspace_id: string
  name: string
  image?: string
  selected_image?: string
  description?: string
  color?: string
  rules?: any
  group_data?: any
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  brand_id: string
  board_id: string
  caption: any
  status: string
  format: string
  publish_date?: string
  platforms?: string[]
  pages?: string[]
  billing_month?: string
  month?: number
  settings?: any
  hashtags?: any
  blocks?: any[]
  comments?: any[]
  activities?: any[]
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  email: string
  workspace_id: string
  board_id?: string | null
  is_workspace: boolean
  created_at: string
  updated_at: string
} 