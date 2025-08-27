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
  actorId: z.string().optional() // Optional user ID for activity logging
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, workspaceIds, boardIds, actorId } = InviteSchema.parse(body)

    // ------------------------------------------------------------
    // 1️⃣  Send invitation via Clerk
    // ------------------------------------------------------------
    let clerkInvitationSent = false
    // try {
    //     const clerk = await clerkClient()      
    //     await clerk.invitations.createInvitation({
    //       emailAddress: email,
    //       redirectUrl: process.env.CLERK_INVITE_REDIRECT_URL,
    //     })
    //     clerkInvitationSent = true
    // } catch (err: any) {
    //   // Check if it's an existing invitation error
    //   if (err?.message?.includes('already exists') || 
    //       err?.message?.includes('already invited') ||
    //       err?.message?.includes('duplicate')) {
    //     console.log('Clerk invitation already exists for:', email)
    //   } else {
    //     console.error('Clerk invitation error:', err)
    //     // For other errors, we'll still proceed with database operations
    //     // but note that Clerk invitation failed
    //   }
    // }

    // ------------------------------------------------------------
    // 2️⃣  Prepare rows for `members` table
    // ------------------------------------------------------------
    type MemberInsert = {
      email: string
      workspace_id: string
      board_id: string | null
      is_workspace: boolean
    }

    const rows: MemberInsert[] = []

    // Workspace-level rows
    for (const wsId of workspaceIds) {
      rows.push({
        email,
        workspace_id: wsId,
        board_id: null,
        is_workspace: true,
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
    console.log("existingRecords: ", existingRecords);

    // Filter out null values (existing records) and null entries from errors
    const newRows = existingRecords.filter((row): row is MemberInsert => row !== null)

    if (newRows.length === 0) {
      // All database records already exist
      if (clerkInvitationSent) {
        return NextResponse.json({ 
          message: 'Invitation already exists', 
          details: 'The user has already been invited to all selected workspaces/boards' 
        })
      } else {
        return NextResponse.json({ 
          message: 'Invitation already exists', 
          details: 'The user has already been invited to all selected workspaces/boards. Note: Clerk invitation may have failed.',
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
      console.log("actorId: ", actorId);
      
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

        console.log(`Creating ${activityPromises.length} individual invitation activities`);
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
        message: 'Invitation sent successfully',
        details: `Invited to ${newRows.length} workspace(s)/board(s)`
      })
    } else {
      return NextResponse.json({ 
        message: 'Invitation success',
        details: `The user already be invited or signed up. He/she invited additional for ${newRows.length} workspace(s)/board(s).`,
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
