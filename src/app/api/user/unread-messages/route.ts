import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

// Validation schemas
const UpdateUnreadMessagesSchema = z.object({
  email: z.string().email('Valid email is required'),
  message_id: z.string().uuid('Valid message ID is required'),
  action: z.enum(['add', 'remove'], { message: 'Action must be either "add" or "remove"' }),
})

// POST - Add or remove message from user's unread list
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = UpdateUnreadMessagesSchema.parse(body)

    // Get current user data
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('unread_msg')
      .eq('email', validated.email)
      .single()

    if (fetchError) {
      console.error('Error fetching user:', fetchError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const currentUnread = user.unread_msg || []
    let newUnread: string[]

    if (validated.action === 'add') {
      // Add message ID if not already present
      if (!currentUnread.includes(validated.message_id)) {
        newUnread = [...currentUnread, validated.message_id]
      } else {
        newUnread = currentUnread
      }
    } else {
      // Remove message ID
      newUnread = currentUnread.filter((id: string) => id !== validated.message_id)
    }
    console.log('currentUnread', currentUnread);
    console.log('validated.message_id', validated.message_id);
    console.log('newUnread', newUnread);
    // Update user's unread messages
    const { error: updateError } = await supabase
      .from('users')
      .update({ unread_msg: newUnread })
      .eq('email', validated.email)

    if (updateError) {
      console.error('Error updating unread messages:', updateError)
      return NextResponse.json(
        { error: 'Failed to update unread messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({ unread_msg: newUnread })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error in POST /api/user/unread-messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get unread message count for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('unread_msg')
      .eq('email', email)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const unreadCount = user.unread_msg?.length || 0
    return NextResponse.json({ 
      unread_count: unreadCount,
      has_unread: unreadCount > 0 
    })
  } catch (error) {
    console.error('Error in GET /api/user/unread-messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
