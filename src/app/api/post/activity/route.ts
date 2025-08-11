import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

const CreateActivitySchema = z.object({
  post_id: z.string().uuid('Invalid post ID'),
  actor: z.string().min(1, 'Actor is required'),
  action: z.string().min(1, 'Action is required'),
  type: z.enum(['revision_request','revised','approved','scheduled','published','failed_publishing']),
  metadata: z.any().optional()
})

// GET - Get activities for a post
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

    // Ensure post exists (optional but helpful for 404)
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', post_id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('post_id', post_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      )
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error in GET /api/post/activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new activity for a post
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = CreateActivitySchema.parse(body)

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', validated.post_id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const insert = {
      post_id: validated.post_id,
      actor: validated.actor,
      action: validated.action,
      type: validated.type,
      metadata: validated.metadata ?? null,
    }

    const { data, error } = await supabase
      .from('activities')
      .insert([insert])
      .select()
      .single()

    if (error) {
      console.error('Error creating activity:', error)
      return NextResponse.json(
        { error: 'Failed to create activity' },
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

    console.error('Error in POST /api/post/activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


