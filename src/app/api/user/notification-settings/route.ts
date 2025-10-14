import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

// Validation schema for notification settings (per user, no workspace)
const NotificationSettingsSchema = z.object({
  user_email: z.string().email(),
  settings: z.object({
    communication: z.object({
      commentsAndMentions: z.boolean(),
    }),
    boards: z.object({
      pendingApproval: z.boolean(),
      scheduled: z.boolean(),
      published: z.boolean(),
      boardInviteSent: z.boolean(),
      boardInviteAccepted: z.boolean(),
    }),
    workspaces: z.object({
      workspaceInviteSent: z.boolean(),
      workspaceInviteAccepted: z.boolean(),
    }),
  }),
})

// POST - Update notification settings for a user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = NotificationSettingsSchema.parse(body)

    // Ensure user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.user_email)
      .single()

    if (fetchError || !user) {
      console.error('Error fetching user:', fetchError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Overwrite user's notification settings (single object)
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ notification_settings: validatedData.settings })
      .eq('email', validatedData.user_email)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating notification settings:', updateError)
      return NextResponse.json(
        { error: 'Failed to update notification settings' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/user/notification-settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get notification settings for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userEmail = searchParams.get('user_email')

    if (!userEmail) {
      return NextResponse.json(
        { error: 'user_email parameter is required' },
        { status: 400 }
      )
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('notification_settings')
      .eq('email', userEmail)
      .single()

    if (fetchError) {
      console.error('Error fetching user:', fetchError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const defaultSettings = {
      communication: { commentsAndMentions: true },
      boards: {
        pendingApproval: true,
        scheduled: true,
        published: true,
        boardInviteSent: true,
        boardInviteAccepted: true,
      },
      workspaces: {
        workspaceInviteSent: true,
        workspaceInviteAccepted: true,
      },
    }

    const settings = user?.notification_settings || defaultSettings
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error in GET /api/user/notification-settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 