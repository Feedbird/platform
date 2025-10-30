import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { clerkClient } from '@clerk/nextjs/server'
import { jsonCamel, readJsonSnake } from '@/lib/utils/http'

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

    // 1) Members in the workspace (include role for each membership)
    const { data: memberRows, error: membersErr } = await supabase
      .from('members')
      .select('email, role, is_workspace, board_id, accept')
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
      .select('created_by')
      .eq('id', workspace_id)
      .single()
    
    if (wsErr) {
      console.error('Error fetching workspace creator:', wsErr)
      return NextResponse.json(
        { error: 'Failed to fetch workspace creator' },
        { status: 500 }
      )
    }

    const creatorEmail: string | undefined = wsRow?.created_by
    // 3) Combine unique emails
    const combined = [...memberEmails, ...(creatorEmail ? [creatorEmail] : [])]
    const uniqueEmails = Array.from(new Set(combined))

    // 4) Fetch user profiles for first_name and image_url
    let users: Array<{ email: string; first_name?: string; image_url?: string; role?: 'admin' | 'client' | 'team'; accept?: boolean }> = []
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

      // Build maps:
      // - email -> resolved role (prefer workspace-level row, else any row, default 'team')
      // - email -> accepted status (true if any membership row has accept=true)
      const emailToRole = new Map<string, 'admin' | 'client' | 'team'>()
      const emailToAccept = new Map<string, boolean>()
      if (creatorEmail) {
        emailToRole.set(creatorEmail, 'admin')
        emailToAccept.set(creatorEmail, true)
      }
      ;(memberRows || []).forEach((m: any) => {
        const current = emailToRole.get(m.email)
        // Prefer workspace-level explicitly
        const candidateRole = (m.role == 'admin' || m.role === 'client' || m.role === 'team') ? m.role : 'team'
        if (!current) {
          emailToRole.set(m.email, candidateRole)
        }
        if (m.is_workspace) {
          emailToRole.set(m.email, candidateRole)
        }
        // Accept map: accepted if any row accepted
        const prevAccept = emailToAccept.get(m.email) || false
        const nextAccept = prevAccept || !!m.accept
        emailToAccept.set(m.email, nextAccept)
      })

      // Build a profile map for quick lookup
      const emailToProfile = new Map<string, { first_name?: string; image_url?: string }>()
      ;(usersRows || []).forEach((u: any) => {
        emailToProfile.set(u.email, { first_name: u.first_name, image_url: u.image_url })
      })

      // Construct response for all emails (even if not in users table)
      users = uniqueEmails.map((email) => {
        const profile = emailToProfile.get(email) || {}
        return {
          email,
          first_name: profile.first_name,
          image_url: profile.image_url,
          role: emailToRole.get(email) || 'team',
          accept: emailToAccept.get(email) ?? false,
        }
      })
    }

    return jsonCamel({ users, creator_email: creatorEmail })
  } catch (error) {
    console.error('Error in GET /api/workspace/members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


// PATCH /api/workspace/members  { workspace_id, email, role }
export async function PATCH(req: NextRequest) {
  try {
    const body = await readJsonSnake(req)
    const workspace_id = body?.workspace_id as string | undefined
    const email = body?.email as string | undefined
    const role = body?.role as 'client' | 'team' | undefined

    if (!workspace_id || !email || !role || !['client', 'team'].includes(role)) {
      return NextResponse.json({ error: 'workspace_id, email and role (client|team) are required' }, { status: 400 })
    }

    // Update all membership rows for this user within the workspace to keep role consistent
    const { data: updated, error: updateErr } = await supabase
      .from('members')
      .update({ role })
      .eq('workspace_id', workspace_id)
      .eq('email', email)
      .select('id')

    if (updateErr) {
      console.error('Error updating member role:', updateErr)
      return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 })
    }

    // If there were no rows to update, create a workspace-level membership row
    if (!updated || updated.length === 0) {
      const { error: insertErr } = await supabase
        .from('members')
        .insert({
          email,
          workspace_id,
          board_id: null,
          is_workspace: true,
          role,
        })
      if (insertErr) {
        console.error('Error inserting workspace-level member row:', insertErr)
        return NextResponse.json({ error: 'Failed to set member role' }, { status: 500 })
      }
    }

    // Sync role to Clerk organization membership
    try {
      // 1) Lookup Clerk organizationId from workspace
      const { data: ws, error: wsErr } = await supabase
        .from('workspaces')
        .select('clerk_organization_id')
        .eq('id', workspace_id)
        .single()
      const organizationId: string | undefined = (ws as any)?.clerk_organization_id
      if (!wsErr && organizationId) {
        const clerk = await clerkClient()
        // 2) Find Clerk user by email
        let clerkUserId: string | undefined
        try {
          const usersList: any = await (clerk.users as any).getUserList({ emailAddress: [email] })
          const match = Array.isArray(usersList?.data) ? usersList.data[0] : undefined
          clerkUserId = match?.id
        } catch (e) {
          // No user yet (not registered) – skip Clerk role sync
        }
        if (clerkUserId) {
          try {
            const clerkRole = role === 'client' ? 'org:admin' : 'org:member'
            await (clerk.organizations as any).updateOrganizationMembership({ organizationId: organizationId, userId: clerkUserId, role: clerkRole })
          } catch (syncErr) {
            console.warn('Failed to sync Clerk org role:', syncErr)
          }
        }
      }
    } catch (clerkErr) {
      console.warn('Clerk role sync error:', clerkErr)
    }

    return NextResponse.json({ message: 'Role updated' })
  } catch (error) {
    console.error('Error in PATCH /api/workspace/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

