import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

// Validation schemas
const CreateBoardSchema = z.object({
  workspace_id: z.string().uuid('Invalid workspace ID'),
  name: z.string().min(1, 'Board name is required'),
  image: z.string().optional().or(z.literal('')).or(z.undefined()).or(z.null()),
  description: z.string().optional(),
  color: z.string().optional(),
  rules: z.any().optional(),
})

const UpdateBoardSchema = z.object({
  name: z.string().min(1, 'Board name is required').optional(),
  image: z.string().optional().or(z.literal('')).or(z.undefined()).or(z.null()),
  description: z.string().optional(),
  color: z.string().optional(),
  rules: z.any().optional(),
  group_data: z.any().optional(),
})

// GET - Get board by ID or list boards by workspace
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const workspace_id = searchParams.get('workspace_id')

    if (id) {
      // Get specific board
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching board:', error)
        return NextResponse.json(
          { error: 'Failed to fetch board' },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Board not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(data)
    } else if (workspace_id) {
      // Get boards by workspace
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching boards:', error)
        return NextResponse.json(
          { error: 'Failed to fetch boards' },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    } else {
      return NextResponse.json(
        { error: 'Either id or workspace_id parameter is required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in GET /api/board:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new board
export async function POST(req: NextRequest) {
  console.log("@@@@@@@POST /api/board");
  try {
    const body = await req.json()
    const validatedData = CreateBoardSchema.parse(body)
    console.log("validatedData:", validatedData);
    // Verify workspace exists
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', validatedData.workspace_id)
      .single()

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('boards')
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      console.error('Error creating board:', error)
      return NextResponse.json(
        { error: 'Failed to create board' },
        { status: 500 }
      )
    }

    // Create three default posts for the new board
    const defaultPosts = [
      {
        workspace_id: validatedData.workspace_id,
        board_id: data.id,
        caption: { synced: true, default: "" },
        status: "Draft",
        format: "",
        platforms: [],
        pages: [],
        month: 1,
        blocks: [],
        comments: [],
        activities: []
      },
      {
        workspace_id: validatedData.workspace_id,
        board_id: data.id,
        caption: { synced: true, default: "" },
        status: "Draft",
        format: "",
        platforms: [],
        pages: [],
        month: 1,
        blocks: [],
        comments: [],
        activities: []
      },
      {
        workspace_id: validatedData.workspace_id,
        board_id: data.id,
        caption: { synced: true, default: "" },
        status: "Draft",
        format: "",
        platforms: [],
        pages: [],
        month: 1,
        blocks: [],
        comments: [],
        activities: []
      }
    ]

    // Insert the default posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .insert(defaultPosts)
      .select()

    if (postsError) {
      console.error('Error creating default posts:', postsError)
      // Don't fail the board creation if posts fail, just log the error
      console.warn('Board created but failed to create default posts')
    } else {
      console.log(`Created ${posts?.length || 0} default posts for board ${data.id}`)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/board:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update board
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Board ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validatedData = UpdateBoardSchema.parse(body)

    const { data, error } = await supabase
      .from('boards')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating board:', error)
      return NextResponse.json(
        { error: 'Failed to update board' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/board:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete board
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Board ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting board:', error)
      return NextResponse.json(
        { error: 'Failed to delete board' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Board deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/board:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 