import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'
import { jsonCamel, readJsonSnake } from '@/lib/utils/http'

// Validation schemas
const CreateChannelSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  createdBy: z.string().email('Valid creator email is required'),
  name: z.string().min(1, 'Channel name is required'),
  description: z.string().optional(),
  members: z.array(z.string()).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

const UpdateChannelSchema = z.object({
  name: z.string().min(1, 'Channel name is required').optional(),
  description: z.string().optional(),
  members: z.array(z.string()).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

// GET - Get channel by ID or list channels by workspace
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const workspace_id = searchParams.get('workspace_id')

    if (id) {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching channel:', error)
        return NextResponse.json(
          { error: 'Failed to fetch channel' },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Channel not found' },
          { status: 404 }
        )
      }

      return jsonCamel(data)
    } else if (workspace_id) {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching channels:', error)
        return NextResponse.json(
          { error: 'Failed to fetch channels' },
          { status: 500 }
        )
      }

      return jsonCamel(data)
    } else {
      return NextResponse.json(
        { error: 'Either id or workspace_id parameter is required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in GET /api/channel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new channel
export async function POST(req: NextRequest) {
  try {
    const body = await readJsonSnake(req)
    const validatedData = CreateChannelSchema.parse(body)

    // Verify workspace exists
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', validatedData.workspaceId)
      .single()

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('channels')
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      console.error('Error creating channel:', error)
      return NextResponse.json(
        { error: 'Failed to create channel' },
        { status: 500 }
      )
    }

    return jsonCamel(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/channel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update channel
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      )
    }

    const body = await readJsonSnake(req)
    const validatedData = UpdateChannelSchema.parse(body)

    const { data, error } = await supabase
      .from('channels')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating channel:', error)
      return NextResponse.json(
        { error: 'Failed to update channel' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    return jsonCamel(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/channel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete channel
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting channel:', error)
      return NextResponse.json(
        { error: 'Failed to delete channel' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Channel deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/channel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


