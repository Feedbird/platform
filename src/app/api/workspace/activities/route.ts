import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET - Get all activities for a workspace
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const workspace_id = searchParams.get('workspace_id')

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    // Get activities with user data and post information
    const { data: activities, error } = await supabase
      .from('activities')
      .select(`
        *,
        actor:users!actor_id(
          id,
          first_name,
          last_name,
          email,
          image_url
        ),
        post:posts!post_id(*)
      `)
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      )
    }

    return NextResponse.json(activities ?? [])
  } catch (error) {
    console.error('Error in GET /api/workspace/activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
