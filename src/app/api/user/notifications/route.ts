import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

const ClearNotificationsSchema = z.object({
  user_email: z.string().email('Invalid email')
})

const RemoveNotificationSchema = z.object({
  user_email: z.string().email('Invalid email'),
  notification_id: z.string({ required_error: 'Notification ID is required' })
})

// POST - Clear all notifications for a user
export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const validated = ClearNotificationsSchema.parse(body)

		// Clear all notifications using the database function
		const { error } = await supabase.rpc('remove_all_unread_notifications', {
			user_email: validated.user_email
		})

		if (error) {
			console.error('Error clearing all notifications with RPC, trying fallback:', error)
			// Fallback: direct update
			const { error: fallbackError } = await supabase
				.from('users')
				.update({ unread_notification: [] })
				.eq('email', validated.user_email)

			if (fallbackError) {
				console.error('Fallback clear all failed:', fallbackError)
				return NextResponse.json(
					{ error: 'Failed to clear notifications' },
					{ status: 500 }
				)
			}
		}

		return NextResponse.json({ success: true, cleared: 'all' })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.errors },
				{ status: 400 }
			)
		}

		console.error('Error in POST /api/user/notifications:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

// PATCH - Remove individual notification for a user
export async function PATCH(req: NextRequest) {
	try {
		const body = await req.json()
		const validated = RemoveNotificationSchema.parse(body)

		// Get current user data
		const { data: user, error: fetchError } = await supabase
			.from('users')
			.select('unread_notification')
			.eq('email', validated.user_email)
			.single()

		if (fetchError) {
			console.error('Error fetching user:', fetchError)
			return NextResponse.json(
				{ error: 'User not found' },
				{ status: 404 }
			)
		}

		const currentNotifications = user.unread_notification || []
		const newNotifications = currentNotifications.filter((id: string) => id !== validated.notification_id)

		// Update user's unread notifications
		const { error: updateError } = await supabase
			.from('users')
			.update({ unread_notification: newNotifications })
			.eq('email', validated.user_email)

		if (updateError) {
			console.error('Error updating user notifications:', updateError)
			return NextResponse.json(
				{ error: 'Failed to update notifications' },
				{ status: 500 }
			)
		}

		return NextResponse.json({ 
			success: true, 
			unread_notification: newNotifications 
		})
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.errors },
				{ status: 400 }
			)
		}

		console.error('Error in PATCH /api/user/notifications:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

// GET - Get user's unread notifications
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_email = searchParams.get('user_email')

    if (!user_email) {
      return NextResponse.json(
        { error: 'user_email is required' },
        { status: 400 }
      )
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('unread_notification')
      .eq('email', user_email)
      .single()

    if (error) {
      console.error('Error fetching user notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Get activity details for unread notifications
    const unreadIds = user?.unread_notification || []
    
    if (unreadIds.length === 0) {
      return NextResponse.json({ activities: [] })
    }

    const { data: activities, error: activitiesError } = await supabase
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
      .in('id', unreadIds)
      .order('created_at', { ascending: false })

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError)
      return NextResponse.json(
        { error: 'Failed to fetch activity details' },
        { status: 500 }
      )
    }

    return NextResponse.json({ activities: activities || [] })
  } catch (error) {
    console.error('Error in GET /api/user/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 