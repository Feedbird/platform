import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

// Validation schema for notification settings
const NotificationSettingsSchema = z.object({
  user_email: z.string().email(),
  workspace_id: z.string(),
  settings: z.object({
    communication: z.object({
      enabled: z.boolean(),
      commentsAndMentions: z.boolean(),
    }),
    boards: z.object({
      enabled: z.boolean(),
      pendingApproval: z.boolean(),
      scheduled: z.boolean(),
      published: z.boolean(),
      boardInviteSent: z.boolean(),
      boardInviteAccepted: z.boolean(),
    }),
    workspaces: z.object({
      enabled: z.boolean(),
      workspaceInviteSent: z.boolean(),
      workspaceInviteAccepted: z.boolean(),
    }),
  }),
})

// POST - Update notification settings for a user in a specific workspace
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = NotificationSettingsSchema.parse(body)

    // Get current user data
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, notification_settings')
      .eq('email', validatedData.user_email)
      .single()

    if (fetchError) {
      console.error('Error fetching user:', fetchError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get existing notification settings or initialize empty array
    const currentSettings = user.notification_settings || []
    
    // Find existing settings for this workspace
    const existingSettingsIndex = currentSettings.findIndex(
      (setting: any) => setting.workspace_id === validatedData.workspace_id
    )

    const newWorkspaceSettings = {
      workspace_id: validatedData.workspace_id,
      settings: validatedData.settings
    }

    let updatedSettings
    if (existingSettingsIndex >= 0) {
      // Update existing workspace settings
      updatedSettings = [...currentSettings]
      updatedSettings[existingSettingsIndex] = newWorkspaceSettings
    } else {
      // Add new workspace settings
      updatedSettings = [...currentSettings, newWorkspaceSettings]
    }

    // Update user's notification settings
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ notification_settings: updatedSettings })
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

// GET - Get notification settings for a user in a specific workspace
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userEmail = searchParams.get('user_email')
    const workspaceId = searchParams.get('workspace_id')

    if (!userEmail) {
      return NextResponse.json(
        { error: 'user_email parameter is required' },
        { status: 400 }
      )
    }

    // Get user's notification settings
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

    const notificationSettings = user.notification_settings || []

    if (workspaceId) {
      // Return settings for specific workspace
      const workspaceSettings = notificationSettings.find(
        (setting: any) => setting.workspace_id === workspaceId
      )
      
      if (!workspaceSettings) {
        // Return default settings if none exist for this workspace
        return NextResponse.json({
          workspace_id: workspaceId,
          settings: {
            communication: {
              enabled: true,
              commentsAndMentions: true
            },
            boards: {
              enabled: true,
              pendingApproval: true,
              scheduled: true,
              published: true,
              boardInviteSent: true,
              boardInviteAccepted: true
            },
            workspaces: {
              enabled: true,
              workspaceInviteSent: true,
              workspaceInviteAccepted: true
            }
          }
        })
      }

      return NextResponse.json(workspaceSettings)
    } else {
      // Return all notification settings
      return NextResponse.json(notificationSettings)
    }
  } catch (error) {
    console.error('Error in GET /api/user/notification-settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 