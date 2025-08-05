import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

// Validation schemas
const CreateCommentSchema = z.object({
  post_id: z.string().uuid('Invalid post ID'),
  text: z.string().min(1, 'Comment text is required'),
  parent_id: z.string().uuid().optional(),
  revision_requested: z.boolean().optional(),
  author: z.string().min(1, 'Author is required'),
})

const UpdateCommentSchema = z.object({
  text: z.string().min(1, 'Comment text is required'),
})

// GET - Get comments for a post
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const post_id = searchParams.get('post_id')

    if (!post_id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Get the post to retrieve its comments
    const { data: post, error } = await supabase
      .from('posts')
      .select('comments')
      .eq('id', post_id)
      .single()

    if (error) {
      console.error('Error fetching post comments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(post.comments || [])
  } catch (error) {
    console.error('Error in GET /api/post/comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add a new comment to a post
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = CreateCommentSchema.parse(body)

    // Verify post exists and get current data
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, comments, status')
      .eq('id', validatedData.post_id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Create new comment
    const newComment = {
      id: crypto.randomUUID(),
      parent_id: validatedData.parent_id,
      created_at: new Date().toISOString(),
      author: validatedData.author,
      text: validatedData.text,
      revision_requested: validatedData.revision_requested || false,
    }

    // Add comment to post's comments array
    const updatedComments = [...(post.comments || []), newComment]

    // Check if this is a revision comment and update post status if needed
    let postUpdateData: any = { comments: updatedComments }
    
    if (validatedData.revision_requested) {
      const allowedStatusesForRevision = [
        "Pending Approval",
        "Revised", 
        "Approved"
      ]
      
      // If current status is in the allowed list, update to "Needs Revisions"
      if (allowedStatusesForRevision.includes(post.status)) {
        postUpdateData.status = "Needs Revisions"
      }
    }

    // Update the post with new comments and potentially updated status
    const { data, error } = await supabase
      .from('posts')
      .update(postUpdateData)
      .eq('id', validatedData.post_id)
      .select()
      .single()

    if (error) {
      console.error('Error adding comment:', error)
      return NextResponse.json(
        { error: 'Failed to add comment' },
        { status: 500 }
      )
    }

    return NextResponse.json(newComment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/post/comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update a comment
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const post_id = searchParams.get('post_id')
    const comment_id = searchParams.get('comment_id')

    if (!post_id || !comment_id) {
      return NextResponse.json(
        { error: 'Post ID and Comment ID are required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validatedData = UpdateCommentSchema.parse(body)

    // Get the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('comments')
      .eq('id', post_id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Find and update the comment
    const comments = post.comments || []
    const commentIndex = comments.findIndex((c: any) => c.id === comment_id)

    if (commentIndex === -1) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Update the comment
    comments[commentIndex] = {
      ...comments[commentIndex],
      text: validatedData.text,
    }

    // Update the post with modified comments
    const { data, error } = await supabase
      .from('posts')
      .update({ comments })
      .eq('id', post_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating comment:', error)
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      )
    }

    return NextResponse.json(comments[commentIndex])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/post/comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a comment
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const post_id = searchParams.get('post_id')
    const comment_id = searchParams.get('comment_id')

    if (!post_id || !comment_id) {
      return NextResponse.json(
        { error: 'Post ID and Comment ID are required' },
        { status: 400 }
      )
    }

    // Get the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('comments')
      .eq('id', post_id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Remove the comment
    const comments = (post.comments || []).filter((c: any) => c.id !== comment_id)

    // Update the post with modified comments
    const { error } = await supabase
      .from('posts')
      .update({ comments })
      .eq('id', post_id)

    if (error) {
      console.error('Error deleting comment:', error)
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/post/comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 