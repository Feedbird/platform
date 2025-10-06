import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get('workspaceId')
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('slack_installations')
      .select('id, channel_id, channel_name, team_id, team_name, events')
      .eq('workspace_id', workspaceId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = No rows
      console.error('Error fetching slack installation:', error)
      return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: Boolean(data.channel_id),
      channelId: data.channel_id || null,
      channelName: data.channel_name || null,
      teamId: data.team_id || null,
      teamName: data.team_name || null,
      events: Array.isArray(data.events) ? data.events : null,
    })
  } catch (e) {
    console.error('GET /api/oauth/slack/status failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


