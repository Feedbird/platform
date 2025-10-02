import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
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

    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('Error in POST /api/social-set', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


