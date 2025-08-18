import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

// Validation schemas
const CreateChannelMessageSchema = z.object({
  workspace_id: z.string().uuid('Invalid workspace ID'),
  channel_id: z.string().uuid('Invalid channel ID'),
  content: z.string().min(1, 'Content is required'),
  parent_id: z.string().uuid().nullable().optional(),
  addon: z.any().optional(),
  readby: z.array(z.any()).optional(),
  author_email: z.string().email('Valid author email is required'),
  emoticons: z.array(z.any()).optional(),
})

const UpdateChannelMessageSchema = z.object({
  content: z.string().min(1).optional(),
  addon: z.any().optional(),
  readby: z.array(z.any()).optional(),
  emoticons: z.array(z.any()).optional(),
})

// GET - Get message by ID or list messages by channel (with author name/image)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const channel_id = searchParams.get('channel_id')
    const workspace_id = searchParams.get('workspace_id')

    if (id) {
      const { data, error } = await supabase
        .from('channel_messages')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching channel message:', error)
        return NextResponse.json({ error: 'Failed to fetch message' }, { status: 500 })
      }

      if (!data) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 })
      }

      // Join author data by email
      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('first_name, image_url')
        .eq('email', data.author_email)
        .single()

      const enriched = {
        ...data,
        author_name: user?.first_name || data.author_email,
        author_image_url: user?.image_url || null,
      }

      return NextResponse.json(enriched)
    }

    if (channel_id || workspace_id) {
      let query = supabase.from('channel_messages').select('*')
      if (channel_id) query = query.eq('channel_id', channel_id)
      if (workspace_id) query = query.eq('workspace_id', workspace_id)

      const { data, error } = await query.order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching channel messages:', error)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
      }

      // Batch fetch author profiles for unique emails
      const emails = Array.from(new Set((data || []).map(m => m.author_email)))
      let profiles: Record<string, { first_name?: string; image_url?: string }> = {}
      if (emails.length > 0) {
        const { data: users, error: usersErr } = await supabase
          .from('users')
          .select('email, first_name, image_url')
          .in('email', emails)

        if (usersErr) {
          console.error('Error fetching user profiles for messages:', usersErr)
        } else {
          for (const u of users || []) {
            profiles[u.email] = { first_name: u.first_name, image_url: u.image_url }
          }
        }
      }

      const enriched = (data || []).map(m => ({
        ...m,
        author_name: profiles[m.author_email]?.first_name || m.author_email,
        author_image_url: profiles[m.author_email]?.image_url || null,
      }))

      return NextResponse.json(enriched)
    }

    return NextResponse.json(
      { error: 'Either id, channel_id or workspace_id parameter is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in GET /api/channel-message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new channel message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = CreateChannelMessageSchema.parse(body)

    // Verify workspace and channel exist
    const [{ data: ws }, { data: ch }] = await Promise.all([
      supabase.from('workspaces').select('id').eq('id', validated.workspace_id).single(),
      supabase.from('channels').select('id').eq('id', validated.channel_id).single(),
    ])

    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    if (!ch) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('channel_messages')
      .insert([validated])
      .select()
      .single()

    if (error) {
      console.error('Error creating channel message:', error)
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error in POST /api/channel-message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a channel message
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })

    const body = await req.json()
    const validated = UpdateChannelMessageSchema.parse(body)

    const { data, error } = await supabase
      .from('channel_messages')
      .update(validated)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating channel message:', error)
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }

    if (!data) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error in PUT /api/channel-message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a channel message
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })

    const { error } = await supabase
      .from('channel_messages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting channel message:', error)
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Message deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/channel-message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


