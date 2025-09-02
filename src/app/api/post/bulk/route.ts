import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'
import { Platform } from '@/lib/social/platforms/platform-types'

// Validation schemas for bulk operations
const CreatePostSchema = z.object({
  workspace_id: z.string().uuid('Invalid workspace ID'),
  board_id: z.string().uuid('Invalid board ID'),
  caption: z.any().refine((val) => val !== null && val !== undefined, 'Caption is required'),
  status: z.string().min(1, 'Status is required'),
  format: z.string().optional(),
  publish_date: z.string().datetime().optional(),
  platforms: z.array(z.enum(['facebook', 'instagram', 'linkedin', 'pinterest', 'youtube', 'tiktok', 'google'])).optional(),
  pages: z.array(z.string()).optional(),
  billing_month: z.string().nullable().optional(),
  month: z.number().min(1).max(12).optional(),
  settings: z.any().optional(),
  hashtags: z.any().optional(),
  blocks: z.array(z.any()).optional(),
  comments: z.array(z.any()).optional(),
  activities: z.array(z.any()).optional(),
  created_by: z.string().email('Invalid email format for created_by'),
  last_updated_by: z.string().email('Invalid email format for last_updated_by'),
})

const BulkCreateSchema = z.object({
  posts: z.array(CreatePostSchema).min(1, 'At least one post is required').max(100, 'Maximum 100 posts per request')
})

const BulkDeleteSchema = z.object({
  post_ids: z.array(z.string().uuid('Invalid post ID')).min(1, 'At least one post ID is required').max(100, 'Maximum 100 posts per request')
})

// POST - Create multiple posts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = BulkCreateSchema.parse(body)

    // Verify workspace exists
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', validatedData.posts[0].workspace_id)
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
      .eq('id', validatedData.posts[0].board_id)
      .single()

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    // Verify all posts belong to the same workspace and board
    for (const post of validatedData.posts) {
      if (post.workspace_id !== validatedData.posts[0].workspace_id || post.board_id !== validatedData.posts[0].board_id) {
        return NextResponse.json(
          { error: 'All posts must belong to the same workspace and board' },
          { status: 400 }
        )
      }
    }

    // Create all posts
    const { data, error } = await supabase
      .from('posts')
      .insert(validatedData.posts)
      .select()

    if (error) {
      console.error('Error creating posts:', error)
      return NextResponse.json(
        { error: 'Failed to create posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: `Successfully created ${data.length} posts`,
      posts: data 
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/post/bulk:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete multiple posts
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = BulkDeleteSchema.parse(body)

    // Delete all posts
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .in('id', validatedData.post_ids)
      .select()

    if (error) {
      console.error('Error deleting posts:', error)
      return NextResponse.json(
        { error: 'Failed to delete posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: `Successfully deleted ${data.length} posts`,
      deleted_posts: data 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in DELETE /api/post/bulk:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 