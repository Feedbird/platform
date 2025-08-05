import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

// Validation schema for updating post blocks
const UpdatePostBlocksSchema = z.object({
  postId: z.string().uuid('Invalid post ID'),
  blocks: z.array(z.object({
    id: z.string(),
    kind: z.enum(['image', 'video']),
    currentVersionId: z.string(),
    versions: z.array(z.object({
      id: z.string(),
      createdAt: z.string().datetime(),
      by: z.string(),
      caption: z.string(),
      file: z.object({
        kind: z.enum(['image', 'video']),
        url: z.string().url()
      }),
      comments: z.array(z.any()).optional()
    })),
    comments: z.array(z.any()).optional()
  }))
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = UpdatePostBlocksSchema.parse(body)

    // Verify post exists
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('id, blocks')
      .eq('id', validatedData.postId)
      .single()

    if (fetchError) {
      console.error('Error fetching post:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch post' },
        { status: 500 }
      )
    }

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Update the post with new blocks
    const { data, error } = await supabase
      .from('posts')
      .update({ 
        blocks: validatedData.blocks,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.postId)
      .select()
      .single()

    if (error) {
      console.error('Error updating post blocks:', error)
      return NextResponse.json(
        { error: 'Failed to update post blocks' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      post: data,
      message: 'Post blocks updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/post/update-blocks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 