import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

// Validation schemas
const CreateVersionCommentSchema = z.object({
  post_id: z.string().uuid('Invalid post ID'),
  block_id: z.string().uuid('Invalid block ID'),
  version_id: z.string().uuid('Invalid version ID'),
  text: z.string().min(1, 'Comment text is required'),
  parent_id: z.string().uuid().optional(),
  revision_requested: z.boolean().optional(),
  author: z.string().min(1, 'Author is required'),
  authorEmail: z.string().email().optional(),
  authorImageUrl: z.string().url().optional(),
  rect: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }).optional(),
})

const UpdateVersionCommentSchema = z.object({
  text: z.string().min(1, 'Comment text is required'),
})

// GET - Get comments for a version
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const post_id = searchParams.get('post_id')
    const block_id = searchParams.get('block_id')
    const version_id = searchParams.get('version_id')

    if (!post_id || !block_id || !version_id) {
      return NextResponse.json(
        { error: 'Post ID, Block ID, and Version ID are required' },
        { status: 400 }
      )
    }

    // Get the post to retrieve the specific version's comments
    const { data: post, error } = await supabase
      .from('posts')
      .select('blocks')
      .eq('id', post_id)
      .single()

    if (error) {
      console.error('Error fetching version comments:', error)
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

    // Find the specific block
    const block = post.blocks?.find((b: any) => b.id === block_id)
    if (!block) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      )
    }

    // Find the specific version
    const version = block.versions?.find((v: any) => v.id === version_id)
    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(version.comments || [])
  } catch (error) {
    console.error('Error in GET /api/post/block/version/comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add a new comment to a version
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = CreateVersionCommentSchema.parse(body)

    // Get the post with current data
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('blocks, status')
      .eq('id', validatedData.post_id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Find the block
    const blockIndex = post.blocks?.findIndex((b: any) => b.id === validatedData.block_id)
    if (blockIndex === -1 || blockIndex === undefined) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      )
    }

    // Find the version
    const versionIndex = post.blocks![blockIndex].versions?.findIndex((v: any) => v.id === validatedData.version_id)
    if (versionIndex === -1 || versionIndex === undefined) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    // Create new comment
    const newComment: any = {
      id: crypto.randomUUID(),
      parent_id: validatedData.parent_id,
      created_at: new Date().toISOString(),
      author: validatedData.author,
      authorEmail: validatedData.authorEmail,
      authorImageUrl: validatedData.authorImageUrl,
      text: validatedData.text,
      revision_requested: validatedData.revision_requested || false,
    }

    // Add rect if provided
    if (validatedData.rect) {
      newComment.rect = validatedData.rect
    }

    // Add comment to version's comments array
    const updatedBlocks = [...post.blocks!]
    const updatedVersions = [...updatedBlocks[blockIndex].versions!]
    updatedVersions[versionIndex] = {
      ...updatedVersions[versionIndex],
      comments: [...(updatedVersions[versionIndex].comments || []), newComment]
    }
    updatedBlocks[blockIndex] = {
      ...updatedBlocks[blockIndex],
      versions: updatedVersions
    }

    // Check if this is a revision comment and update post status if needed
    let postUpdateData: any = { blocks: updatedBlocks }
    
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

    // Update the post with new version comments and potentially updated status
    const { data, error } = await supabase
      .from('posts')
      .update(postUpdateData)
      .eq('id', validatedData.post_id)
      .select()
      .single()

    if (error) {
      console.error('Error adding version comment:', error)
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

    console.error('Error in POST /api/post/block/version/comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update a version comment
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const post_id = searchParams.get('post_id')
    const block_id = searchParams.get('block_id')
    const version_id = searchParams.get('version_id')
    const comment_id = searchParams.get('comment_id')

    if (!post_id || !block_id || !version_id || !comment_id) {
      return NextResponse.json(
        { error: 'Post ID, Block ID, Version ID, and Comment ID are required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validatedData = UpdateVersionCommentSchema.parse(body)

    // Get the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('blocks')
      .eq('id', post_id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Find the block
    const blockIndex = post.blocks?.findIndex((b: any) => b.id === block_id)
    if (blockIndex === -1 || blockIndex === undefined) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      )
    }

    // Find the version
    const versionIndex = post.blocks![blockIndex].versions?.findIndex((v: any) => v.id === version_id)
    if (versionIndex === -1 || versionIndex === undefined) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    // Find and update the comment
    const comments = post.blocks![blockIndex].versions![versionIndex].comments || []
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

    // Update the version with modified comments
    const updatedBlocks = [...post.blocks!]
    const updatedVersions = [...updatedBlocks[blockIndex].versions!]
    updatedVersions[versionIndex] = {
      ...updatedVersions[versionIndex],
      comments
    }
    updatedBlocks[blockIndex] = {
      ...updatedBlocks[blockIndex],
      versions: updatedVersions
    }

    // Update the post with modified blocks
    const { data, error } = await supabase
      .from('posts')
      .update({ blocks: updatedBlocks })
      .eq('id', post_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating version comment:', error)
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

    console.error('Error in PUT /api/post/block/version/comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a version comment
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const post_id = searchParams.get('post_id')
    const block_id = searchParams.get('block_id')
    const version_id = searchParams.get('version_id')
    const comment_id = searchParams.get('comment_id')

    if (!post_id || !block_id || !version_id || !comment_id) {
      return NextResponse.json(
        { error: 'Post ID, Block ID, Version ID, and Comment ID are required' },
        { status: 400 }
      )
    }

    // Get the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('blocks')
      .eq('id', post_id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Find the block
    const blockIndex = post.blocks?.findIndex((b: any) => b.id === block_id)
    if (blockIndex === -1 || blockIndex === undefined) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      )
    }

    // Find the version
    const versionIndex = post.blocks![blockIndex].versions?.findIndex((v: any) => v.id === version_id)
    if (versionIndex === -1 || versionIndex === undefined) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    // Remove the comment
    const comments = (post.blocks![blockIndex].versions![versionIndex].comments || []).filter((c: any) => c.id !== comment_id)

    // Update the version with modified comments
    const updatedBlocks = [...post.blocks!]
    const updatedVersions = [...updatedBlocks[blockIndex].versions!]
    updatedVersions[versionIndex] = {
      ...updatedVersions[versionIndex],
      comments
    }
    updatedBlocks[blockIndex] = {
      ...updatedBlocks[blockIndex],
      versions: updatedVersions
    }

    // Update the post with modified blocks
    const { error } = await supabase
      .from('posts')
      .update({ blocks: updatedBlocks })
      .eq('id', post_id)

    if (error) {
      console.error('Error deleting version comment:', error)
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/post/block/version/comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 