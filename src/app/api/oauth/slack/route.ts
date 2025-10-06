import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get('workspaceId')
  const channel = searchParams.get('channel') || ''
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
  }

  const clientId = process.env.SLACK_CLIENT_ID!
  const redirectUri = process.env.SLACK_REDIRECT_URI!
  const scopes = [
    'chat:write',
    'chat:write.customize',
    'incoming-webhook',
    'channels:manage',
    'commands',
  ].join(',')

  // Encode state as a querystring so we can safely carry custom params
  const state = new URLSearchParams({ workspaceId, channel }).toString()
  const url = new URL('https://slack.com/oauth/v2/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('scope', scopes)
  url.searchParams.set('user_scope', '')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)

  return NextResponse.redirect(url.toString(), 302)
}



