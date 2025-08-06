import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

// Validation schemas
const CreatePostSchema = z.object({
  workspace_id: z.string().uuid('Invalid workspace ID'),
  board_id: z.string().uuid('Invalid board ID'),
  caption: z.any().refine((val) => val !== null && val !== undefined, 'Caption is required'),
  status: z.string().min(1, 'Status is required'),
  format: z.string().optional(),
  publish_date: z.string().datetime().optional(),
  platforms: z.array(z.string()).optional(),
  pages: z.array(z.string()).optional(),
  billing_month: z.string().optional(),
  month: z.number().min(1).max(12).optional(),
  settings: z.any().optional(),
  hashtags: z.any().optional(),
  blocks: z.array(z.any()).optional(),
  comments: z.array(z.any()).optional(),
  activities: z.array(z.any()).optional(),
})

const UpdatePostSchema = z.object({
  caption: z.any().optional(),
  status: z.string().min(1, 'Status is required').optional(),
  format: z.string().min(1, 'Format is required').optional(),
  publish_date: z.string().datetime().optional(),
  platforms: z.array(z.string()).optional(),
  pages: z.array(z.string()).optional(),
  billing_month: z.string().optional(),
  month: z.number().min(1).max(12).optional(),
  settings: z.any().optional(),
  hashtags: z.any().optional(),
  blocks: z.array(z.any()).optional(),
  comments: z.array(z.any()).optional(),
  activities: z.array(z.any()).optional(),
})

// GET - Get post by ID or list posts by workspace/board
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const workspace_id = searchParams.get('workspace_id')
    const board_id = searchParams.get('board_id')

    if (id) {
      // Get specific post
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching post:', error)
        return NextResponse.json(
          { error: 'Failed to fetch post' },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(data)
    } else if (workspace_id) {
      // Get posts by workspace
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
        return NextResponse.json(
          { error: 'Failed to fetch posts' },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    } else if (board_id) {
      // Get posts by board
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('board_id', board_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
        return NextResponse.json(
          { error: 'Failed to fetch posts' },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    } else {
      return NextResponse.json(
        { error: 'Either id, workspace_id, or board_id parameter is required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in GET /api/post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new post
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = CreatePostSchema.parse(body)

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

    // Verify board exists
    const { data: board } = await supabase
      .from('boards')
      .select('id')
      .eq('id', validatedData.board_id)
      .single()

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update post
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validatedData = UpdatePostSchema.parse(body)

    const { data, error } = await supabase
      .from('posts')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating post:', error)
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Post not found' },
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

    console.error('Error in PUT /api/post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete post
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting post:', error)
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 