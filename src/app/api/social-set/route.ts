import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { jsonCamel, readJsonSnake } from '@/lib/utils/http'

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonSnake(req)
    const workspace_id = body.workspace_id as string
    const name = (body.name as string)?.trim()

    if (!workspace_id || !name) {
      return NextResponse.json({ error: 'workspace_id and name are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('social_sets')
      .insert([{ workspace_id, name }])
      .select('*')
      .single()

    if (error) {
      console.error('Failed to create social set', error)
      return NextResponse.json({ error: 'Failed to create social set' }, { status: 500 })
    }

    return jsonCamel(data, { status: 201 })
  } catch (e) {
    console.error('Error in POST /api/social-set', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


// PATCH /api/social-set
// Body: { id: string, name: string }
export async function PATCH(req: NextRequest) {
  try {
    const body = await readJsonSnake(req)
    const id = (body.id as string) || ''
    const name = ((body.name as string) || '').trim()

    if (!id || !name) {
      return NextResponse.json({ error: 'id and name are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('social_sets')
      .update({ name })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Failed to update social set', error)
      return NextResponse.json({ error: 'Failed to update social set' }, { status: 500 })
    }

    return jsonCamel(data)
  } catch (e) {
    console.error('Error in PATCH /api/social-set', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


