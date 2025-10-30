import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { jsonCamel, readJsonSnake } from '@/lib/utils/http'

// PATCH /api/social-page
// Body: { page_id: string, social_set_id: string | null }
export async function PATCH(req: NextRequest) {
  try {
    const body = await readJsonSnake(req)
    const page_id = body.page_id as string
    const social_set_id = (body.social_set_id ?? null) as string | null

    if (!page_id) {
      return NextResponse.json({ error: 'page_id is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('social_pages')
      .update({ social_set_id })
      .eq('id', page_id)
      .select('*')
      .single()

    if (error) {
      console.error('Failed to update social page set', error)
      return NextResponse.json({ error: 'Failed to update social page' }, { status: 500 })
    }

    return jsonCamel(data)
  } catch (e) {
    console.error('Error in PATCH /api/social-page', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


