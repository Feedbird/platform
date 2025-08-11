import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'

const AutoScheduleSchema = z.object({
  post_id: z.string().uuid('Invalid post ID'),
  status: z.string().optional(),
})

// Basic per-platform preferred hours used to compute suggested slots
const BEST_TIMES: Record<string, Record<number, number[]>> = {
  instagram: { 0: [10, 15], 1: [9, 13], 2: [9, 13], 3: [9, 13], 4: [9, 13], 5: [9, 13], 6: [10, 14] },
  tiktok:    { 0: [12, 20], 1: [9, 14], 2: [9, 14], 3: [9, 14], 4: [9, 14], 5: [9, 14], 6: [12, 20] },
  google:    { 0: [12, 20], 1: [9, 14], 2: [9, 14], 3: [9, 14], 4: [9, 14], 5: [9, 14], 6: [12, 20] },
  linkedin:  { 0: [],       1: [9],     2: [9],     3: [9],     4: [9],     5: [9],     6: []       },
  facebook:  { 0: [11, 16], 1: [9, 14], 2: [9, 14], 3: [9, 14], 4: [9, 14], 5: [9, 14], 6: [11, 16] },
  youtube:   { 0: [12],     1: [12],    2: [12],    3: [12],    4: [12],    5: [12],    6: [12]     },
  pinterest: { 0: [10, 20], 1: [8, 12], 2: [8, 12], 3: [8, 12], 4: [8, 12], 5: [8, 12], 6: [10, 20] },
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 13)
}

function pickSuggestedSlot(platforms: string[], taken: Set<string>): Date | null {
  const now = new Date()
  const DAYS_LOOKAHEAD = 30

  for (let d = 0; d < DAYS_LOOKAHEAD; d++) {
    const day = new Date(now)
    day.setDate(now.getDate() + d)

    const hoursSet = new Set<number>()
    for (const platform of platforms) {
      const best = BEST_TIMES[platform]?.[day.getDay()] ?? []
      best.forEach(h => hoursSet.add(h))
    }

    const candidateHours = Array.from(hoursSet).sort((a, b) => a - b)
    for (const h of candidateHours) {
      const slot = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h)
      if (slot <= now) continue
      if (taken.has(toKey(slot))) continue
      return slot
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { post_id, status } = AutoScheduleSchema.parse(body)

    // Load the post to schedule
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('*')
      .eq('id', post_id)
      .single()

    if (postErr) {
      console.error('Error fetching post for auto-schedule:', postErr)
      return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
    }
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Fetch other scheduled posts in the same board to avoid collisions
    const { data: boardPosts, error: postsErr } = await supabase
      .from('posts')
      .select('id,status,publish_date')
      .eq('board_id', post.board_id)

    if (postsErr) {
      console.error('Error fetching board posts:', postsErr)
      return NextResponse.json({ error: 'Failed to fetch related posts' }, { status: 500 })
    }

    const taken = new Set<string>(
      (boardPosts || [])
        .filter(p => p.id !== post.id && p.status === 'Scheduled' && p.publish_date)
        .map(p => toKey(new Date(p.publish_date as string)))
    )

    const platforms: string[] = Array.isArray(post.platforms) ? post.platforms : []
    let selected = pickSuggestedSlot(platforms, taken)

    // Fallback: next full hour
    if (!selected) {
      const now = new Date()
      selected = new Date(now)
      selected.setHours(now.getHours() + 1, 0, 0, 0)
    }

    // Determine next status based on input or existing post status
    const nextStatus = status ?? (post.status === 'Approved' ? 'Scheduled' : post.status)

    const { data: updated, error: updErr } = await supabase
      .from('posts')
      .update({
        publish_date: selected.toISOString(),
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post_id)
      .select('*')
      .single()

    if (updErr) {
      console.error('Error updating post publish_date:', updErr)
      return NextResponse.json({ error: 'Failed to autoschedule post' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error in POST /api/post/auto-schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


