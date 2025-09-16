import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
import { clerkClient } from '@clerk/nextjs/server'
import { auth } from '@clerk/nextjs/server'

// -----------------------------
// Request validation
// -----------------------------
const InviteSchema = z.object({
  email: z.string().email('Valid email is required'),
  workspaceIds: z.array(z.string().uuid()).default([]),
  boardIds: z.array(z.string().uuid()).default([]),
  actorId: z.string().optional(), // Optional user ID for activity logging
  organizationId: z.string().optional(),
  role: z.string().default('org:member'),
  memberRole: z.enum(['client', 'team']).default('team'),
  first_name: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, workspaceIds, boardIds, actorId, first_name, memberRole } = InviteSchema.parse(body)

    // ------------------------------------------------------------
    // 1️⃣  Send organization invitation via Clerk
    // ------------------------------------------------------------
    let clerkInvitationSent = false
    try {
      let redirectUrl = process.env.CLERK_INVITE_REDIRECT_URL
      const hasValidRedirect = !!(redirectUrl && /^https?:\/\//i.test(redirectUrl))

      // Resolve Clerk organizationId from: explicit -> workspace mapping -> board->workspace mapping -> env
      let organizationId = (body.organizationId as string | undefined) || ''
      let targetWorkspaceId: string | undefined = (workspaceIds && workspaceIds.length > 0) ? workspaceIds[0] : undefined

      // If no explicit workspace but boards provided, derive workspace from first board
      if (!targetWorkspaceId && Array.isArray(body.boardIds) && body.boardIds.length > 0) {
        const { data: boardRow, error: boardErr } = await supabase
          .from('boards')
          .select('workspace_id')
          .eq('id', body.boardIds[0])
          .single()
        if (!boardErr && boardRow?.workspace_id) {
          targetWorkspaceId = boardRow.workspace_id as string
        }
      }

      if (!organizationId && targetWorkspaceId) {
        const { data: wsRow, error: wsErr } = await supabase
          .from('workspaces')
          .select('clerk_organization_id')
          .eq('id', targetWorkspaceId)
          .single()
        if (!wsErr && wsRow?.clerk_organization_id) {
          organizationId = wsRow.clerk_organization_id as string
        }
      }

      if (!organizationId) {
        return NextResponse.json({ error: 'organizationId is required. Provide a valid Clerk organizationId.' }, { status: 400 })
      }
      if (!/^org_/.test(organizationId)) {
        return NextResponse.json({
          error: 'Invalid organizationId provided',
          details: 'Expected a Clerk organization ID starting with "org_". If you are passing a workspaceId, you need to map your workspace to a Clerk organization and pass that org ID instead.',
          hint: 'Store the Clerk organizationId on your workspace or pass organizationId explicitly in the request.'
        }, { status: 400 })
      }

      // Enforce role rules: board-only invites must be member
      const requestedRole = (body.role || 'org:member') as string
      const isBoardOnly = (!workspaceIds || workspaceIds.length === 0) && Array.isArray(body.boardIds) && body.boardIds.length > 0
      if (isBoardOnly && requestedRole !== 'org:member') {
        return NextResponse.json({
          error: 'Invalid role for board-only invitation',
          details: 'Board-only invitations require role org:member. Select a workspace to invite as org:client or org:admin.'
        }, { status: 400 })
      }

      // Resolve inviter name for template metadata
      let inviterName = (first_name && first_name.trim()) ? first_name.trim() : 'A Feedbird user'
      let inviterUserId: string | undefined


      const clerk = await clerkClient()
      try {
        const params: any = {
          organizationId,
          emailAddress: email,
          role: requestedRole,
          redirectUrl: (() => {
            if (!hasValidRedirect) return undefined
            try {
              // Append invite context for FE routing
              const url = new URL(redirectUrl as string)
              if (targetWorkspaceId) url.searchParams.set('workspaceId', targetWorkspaceId)
              if (memberRole) url.searchParams.set('role', memberRole)
              return url.toString()
            } catch {
              return redirectUrl
            }
          })(),
          publicMetadata: {
            inviter_name: inviterName,
          }
        }
        console.log("params", params)
        await clerk.organizations.createOrganizationInvitation(params)
        clerkInvitationSent = true
      } catch (inviteErr: any) {
        const clerkErrors = inviteErr?.errors as Array<{ code?: string; message?: string }> | undefined
        const hasRedirectIssue =
          Array.isArray(clerkErrors) &&
          clerkErrors.some(e => (e.code || '').toLowerCase().includes('redirect') || (e.message || '').toLowerCase().includes('redirect'))

        if (hasRedirectIssue && hasValidRedirect) {
          // Retry without redirect
          const retryParams: any = {
            organizationId,
            emailAddress: email,
            role: requestedRole,
            publicMetadata: {
              inviter_name: inviterName,
            }
          }
          if (inviterUserId) retryParams.inviterUserId = inviterUserId
          await clerk.organizations.createOrganizationInvitation(retryParams)
          clerkInvitationSent = true
        } else if (inviteErr?.status === 409 || (inviteErr?.message || '').toLowerCase().includes('already')) {
          console.log('Clerk organization invitation already exists for:', email)
          clerkInvitationSent = true
        } else if (inviteErr?.status === 403) {
          // Forbidden: Common causes are invalid org ID or insufficient permissions for inviter
          console.error('Clerk organization invitation forbidden:', clerkErrors || inviteErr)
          return NextResponse.json({
            error: 'Forbidden creating organization invitation',
            details: 'Ensure the organizationId is a valid Clerk ID (starts with org_) and the inviter (if provided) has permission within that organization. Also verify the role exists in your Clerk organization.',
            clerk: clerkErrors || [{ message: inviteErr?.message }]
          }, { status: 403 })
        } else {
          console.error('Clerk organization invitation error (unhandled):', clerkErrors || inviteErr)
          return NextResponse.json({
            error: 'Failed to create organization invitation',
            details: (Array.isArray(clerkErrors) && clerkErrors[0]?.message) || inviteErr?.message || 'Unknown error'
          }, { status: 500 })
        }
      }
    } catch (err: any) {
      console.error('Clerk organization invitation error:', err)
      // Continue with downstream logic but mark as not sent
    }

    // ------------------------------------------------------------
    // 2️⃣  Prepare rows for `members` table
    // ------------------------------------------------------------
    type MemberInsert = {
      email: string
      workspace_id: string
      board_id: string | null
      is_workspace: boolean
      role: 'client' | 'team'
    }

    const rows: MemberInsert[] = []

    // Workspace-level rows
    for (const wsId of workspaceIds) {
      rows.push({
        email,
        workspace_id: wsId,
        board_id: null,
        is_workspace: true,
        role: memberRole,
      })
    }

    // Board-level rows (only for boards not under an already-selected workspace)
    let uniqueBoardIds = boardIds
    if (uniqueBoardIds.length) {
      // Fetch boards to know their workspace
      const { data: boards, error: boardsErr } = await supabase
        .from('boards')
        .select('id, workspace_id')
        .in('id', uniqueBoardIds)

      if (boardsErr) {
        console.error('Error fetching boards:', boardsErr)
        return NextResponse.json({ error: 'Failed fetching boards' }, { status: 500 })
      }

      boards.forEach(b => {
        if (!workspaceIds.includes(b.workspace_id)) {
          rows.push({
            email,
            workspace_id: b.workspace_id,
            board_id: b.id,
            is_workspace: false,
            role: memberRole,
          })
        }
      })
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Nothing to invite' }, { status: 400 })
    }

    // ------------------------------------------------------------
    // 3️⃣  Check for existing records and filter out duplicates
    // ------------------------------------------------------------
    const existingRecords = await Promise.all(
      rows.map(async (row) => {
        let query = supabase
          .from('members')
          .select('id')
          .eq('email', row.email)
          .eq('workspace_id', row.workspace_id)
        
        // Handle null board_id properly
        if (row.board_id === null) {
          query = query.is('board_id', null)
        } else {
          query = query.eq('board_id', row.board_id)
        }
        
        const { data, error } = await query.single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking existing record:', error)
          return null
        }

        return data ? null : row // Return null if exists, row if doesn't exist
      })
    )

    // Filter out null values (existing records) and null entries from errors
    const newRows = existingRecords.filter((row): row is MemberInsert => row !== null)

    if (newRows.length === 0) {
      // All database records already exist
      if (clerkInvitationSent) {
        return NextResponse.json({ 
          message: 'Organization invitation sent', 
          details: 'The user was already invited to all selected workspaces/boards'
        })
      } else {
        return NextResponse.json({ 
          message: 'No changes', 
          details: 'The user was already invited to all selected workspaces/boards. Organization invite may not have been sent.',
          warning: true
        })
      }
    }

    // ------------------------------------------------------------
    // 4️⃣  Insert only new records into members table
    // ------------------------------------------------------------
    const { error: insertErr } = await supabase
      .from('members')
      .insert(newRows)

    if (insertErr) {
      console.error('Supabase insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to save members' }, { status: 500 })
    }

    // ------------------------------------------------------------
    // 5️⃣  Create activities for workspace and board invitations
    // ------------------------------------------------------------
    try {
      // TODO: Fix authentication - Clerk auth() returns null because frontend doesn't send auth headers
      // For now, we'll try to get user ID from Clerk auth, but fall back to actorId from request body
      
      if (actorId) {
        const activityPromises: any[] = []

        // Create individual activity for each invitation
        newRows.forEach(row => {
          if (row.is_workspace) {
            // Create workspace invitation activity
            const workspaceMetadata = {
              invitedEmail: email,
              workspaceId: row.workspace_id
            }

            const workspaceActivity = supabase
              .from('activities')
              .insert({
                workspace_id: row.workspace_id,
                post_id: null,
                type: 'workspace_invited_sent',
                actor_id: actorId,
                metadata: workspaceMetadata
              })
            activityPromises.push(workspaceActivity)
          } else {
            // Create board invitation activity
            const boardMetadata = {
              invitedEmail: email,
              boardId: row.board_id,
              workspaceId: row.workspace_id
            }

            const boardActivity = supabase
              .from('activities')
              .insert({
                workspace_id: row.workspace_id,
                post_id: null,
                type: 'board_invited_sent',
                actor_id: actorId,
                metadata: boardMetadata
              })
            activityPromises.push(boardActivity)
          }
        })

        // Execute all activity insertions
        await Promise.all(activityPromises)
      }
    } catch (activityError) {
      // Log the error but don't fail the request since the main invitation was successful
      console.error('Error creating invitation activities:', activityError)
    }

    // Return appropriate message based on whether Clerk invitation was sent
    if (clerkInvitationSent) {
      return NextResponse.json({ 
        message: 'Organization invitation sent successfully',
        details: `Invited to ${newRows.length} workspace(s)/board(s)`
      })
    } else {
      return NextResponse.json({ 
        message: 'Organization invitation processed',
        details: `Database processed ${newRows.length} workspace(s)/board(s). Organization invite may have failed.`,
        warning: true
      })
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues.map(i => i.message).join(', ') }, { status: 400 })
    }

    console.error('Invite API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
