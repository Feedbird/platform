import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

const CreateActivitySchema = z.object({
  workspace_id: z.string().uuid('Invalid workspace ID'),
  post_id: z.string().uuid('Invalid post ID').optional(),
  type: z.enum(['revision_request','revised','approved','scheduled','published','failed_publishing', 'comment', 'workspace_invited_sent', 'board_invited_sent']),
  actor_id: z.string().min(1, 'Actor ID is required'),
  metadata: z.any().optional()
})

// Helper function to get all workspace members (including creator)
async function getWorkspaceMembers(workspaceId: string): Promise<string[]> {
  try {
    // 1) Get members from the members table
    const { data: memberRows, error: membersErr } = await supabase
      .from('members')
      .select('email')
      .eq('workspace_id', workspaceId)

    if (membersErr) {
      console.error('Error fetching workspace members:', membersErr)
      return []
    }

    const memberEmails = (memberRows || []).map((r: any) => r.email)

    // 2) Get workspace creator
    const { data: wsRow, error: wsErr } = await supabase
      .from('workspaces')
      .select('createdby')
      .eq('id', workspaceId)
      .single()
    
    if (wsErr) {
      console.error('Error fetching workspace creator:', wsErr)
      return memberEmails
    }

    const creatorEmail = wsRow?.createdby
    
    // 3) Combine and deduplicate emails
    const allEmails = [...memberEmails, ...(creatorEmail ? [creatorEmail] : [])]
    return Array.from(new Set(allEmails))
  } catch (error) {
    console.error('Error getting workspace members:', error)
    return []
  }
}

// Helper function to update unread notifications for all workspace members
async function updateUnreadNotifications(workspaceId: string, activityId: string, actorEmail: string) {
  try {
    // Get all workspace member emails
    const memberEmails = await getWorkspaceMembers(workspaceId)
    
    // Filter out the actor (don't notify themselves)
    const emailsToNotify = memberEmails.filter(email => email !== actorEmail)
    
    if (emailsToNotify.length === 0) {
      return
    }

    // Update unread_notification field for all members except the actor
    const { error } = await supabase.rpc('add_unread_notification', {
      emails: emailsToNotify,
      activity_id: activityId
    })

    if (error) {
      console.error('Error updating unread notifications with RPC, trying fallback:', error)
      // Fallback: Update each user individually
      for (const email of emailsToNotify) {
        try {
          // Get current unread_notification array
          const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('unread_notification')
            .eq('email', email)
            .single()

          if (fetchError) {
            console.error(`Error fetching user ${email}:`, fetchError)
            continue
          }

          // Update the array
          const currentNotifications = user?.unread_notification || []
          const updatedNotifications = [...currentNotifications, activityId]

          const { error: updateError } = await supabase
            .from('users')
            .update({ unread_notification: updatedNotifications })
            .eq('email', email)

          if (updateError) {
            console.error(`Error updating notifications for ${email}:`, updateError)
          }
        } catch (fallbackError) {
          console.error(`Fallback update failed for ${email}:`, fallbackError)
        }
      }
    }
  } catch (error) {
    console.error('Error in updateUnreadNotifications:', error)
  }
}

// GET - Get activities for a workspace
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const post_id = searchParams.get('post_id') // Optional filter by post

    // Get activities with user data using proper foreign key relationship
    let query = supabase
      .from('activities')
      .select(`
        *,
        actor:users!actor_id(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('post_id', post_id)

    const { data: activities, error } = await query.order('created_at', { ascending: true })
    return NextResponse.json(activities ?? [])
  } catch (error) {
    console.error('Error in GET /api/post/activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new activity for a workspace
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = CreateActivitySchema.parse(body)
    
    // Verify workspace exists
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', validated.workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const insert = {
      workspace_id: validated.workspace_id,
      post_id: validated.post_id,
      type: validated.type,
      actor_id: validated.actor_id,
      metadata: validated.metadata ?? null,
    }

    const { data, error } = await supabase
      .from('activities')
      .insert([insert])
      .select(`
        *,
        actor:users!actor_id(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single()
    if (error) {
      console.error('Error creating activity:', error)
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      )
    }

    // Update unread notifications for all workspace members (except the actor)
    if (data && data.id) {
      const actorEmail = data.actor?.email
      if (actorEmail) {
        // Run notification update in background (don't wait for it)
        updateUnreadNotifications(validated.workspace_id, data.id, actorEmail)
          .catch(error => console.error('Background notification update failed:', error))
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/post/activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


