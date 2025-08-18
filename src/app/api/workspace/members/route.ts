import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET /api/workspace/members?workspace_id=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const workspace_id = searchParams.get('workspace_id')

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    // 1) Members in the workspace
    const { data: memberRows, error: membersErr } = await supabase
      .from('members')
      .select('email')
      .eq('workspace_id', workspace_id)

    if (membersErr) {
      console.error('Error fetching workspace members:', membersErr)
      return NextResponse.json(
        { error: 'Failed to fetch workspace members' },
        { status: 500 }
      )
    }

    const memberEmails = Array.from(new Set((memberRows || []).map((r: any) => r.email)))

    // 2) Workspace creator
    const { data: wsRow, error: wsErr } = await supabase
      .from('workspaces')
      .select('createdby')
      .eq('id', workspace_id)
      .single()
    
    if (wsErr) {
      console.error('Error fetching workspace creator:', wsErr)
      return NextResponse.json(
        { error: 'Failed to fetch workspace creator' },
        { status: 500 }
      )
    }

    const creatorEmail: string | undefined = wsRow?.createdby
    // 3) Combine unique emails
    const combined = [...memberEmails, ...(creatorEmail ? [creatorEmail] : [])]
    const uniqueEmails = Array.from(new Set(combined))

    // 4) Fetch user profiles for first_name and image_url
    let users: Array<{ email: string; first_name?: string; image_url?: string }> = []
    if (uniqueEmails.length > 0) {
      const { data: usersRows, error: usersErr } = await supabase
        .from('users')
        .select('email, first_name, image_url')
        .in('email', uniqueEmails)

      if (usersErr) {
        console.error('Error fetching user profiles:', usersErr)
        return NextResponse.json(
          { error: 'Failed to fetch user profiles' },
          { status: 500 }
        )
      }

      users = (usersRows || []).map((u: any) => ({
        email: u.email,
        first_name: u.first_name,
        image_url: u.image_url,
      }))
    }

    return NextResponse.json({ users, creator_email: creatorEmail })
  } catch (error) {
    console.error('Error in GET /api/workspace/members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


