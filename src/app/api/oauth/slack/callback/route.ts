import { NextRequest, NextResponse } from 'next/server'
import { encryptIfNeeded } from '@/lib/utils/secret-encryption'
import { supabase } from '@/lib/supabase/client'
import { exchangeSlackCode, SlackService } from '@/lib/services/slack-service'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error') || searchParams.get('error_description')

  if (error || !code || !state) {
    return html(`
      <script>
        window.opener.postMessage({ error: ${JSON.stringify(error || 'Missing parameters')} }, '*');
        window.close();
      </script>
    `)
  }

  // State is a querystring now, parse it safely
  const stateParams = new URLSearchParams(state || '')
  const workspaceId = stateParams.get('workspaceId') || ''
  const desiredChannelFromState = (stateParams.get('channel') || '').trim()
  if (!workspaceId) {
    return html(`
      <script>
        window.opener.postMessage({ error: 'Invalid state' }, '*');
        window.close();
      </script>
    `)
  }

  try {
    const clientId = process.env.SLACK_CLIENT_ID!
    const clientSecret = process.env.SLACK_CLIENT_SECRET!
    const redirectUri = process.env.SLACK_REDIRECT_URI!

    const token = await exchangeSlackCode({ clientId, clientSecret, code, redirectUri })
    if (!token.ok) {
      throw new Error(token.error || 'Slack OAuth failed')
    }

    // Resolve/create the desired channel using the bot access token from OAuth
    const slack = new SlackService(process.env.SLACK_SIGNING_SECRET || 'unused')
    const channelName = desiredChannelFromState || 'feedbird-updates'
    let channelId: string | null = null
    let channelResolvedName: string | null = null
    if (token.access_token) {
      try {
        const created = await slack.createChannel(token.access_token, channelName, false)
        channelId = created.id
        channelResolvedName = created.name
      } catch {}
    }

    const upsertPayload: any = {
      workspace_id: workspaceId,
      team_id: token.team?.id,
      team_name: token.team?.name,
      enterprise_id: token.enterprise?.id || null,
      app_id: token.app_id || null,
      bot_user_id: token.bot_user_id || null,
      bot_access_token: encryptIfNeeded(token.access_token || ''),
      scope: token.scope || null,
      authed_user_id: token.authed_user?.id || null,
      authed_user_access_token: encryptIfNeeded(token.authed_user?.access_token || null),
    }
    if (channelId) {
      upsertPayload.channel_id = channelId
      upsertPayload.channel_name = channelResolvedName || channelName
      upsertPayload.events = ['approved','scheduled','published']
    }

    const { data, error: dbError } = await supabase
      .from('slack_installations')
      .upsert(upsertPayload, { onConflict: 'workspace_id,team_id' })
      .select()
      .single()

    if (dbError) {
      throw dbError
    }

    // Welcome message if a channel is set
    if (channelId) {
      try {
        await slack.postMessageWithBotToken(
          token.access_token!,
          channelId,
          '👋 Feedbird has been connected. We will send updates here for approved, scheduled, and published content.'
        )
      } catch {}
    }

    return html(`
      <script>
        window.opener.postMessage({ success: true, workspaceId: ${JSON.stringify(workspaceId)}, installationId: ${JSON.stringify(data?.id)} }, '*');
        window.close();
      </script>
    `)
  } catch (e: any) {
    return html(`
      <script>
        window.opener.postMessage({ error: ${JSON.stringify(e.message || 'Unknown error')} }, '*');
        window.close();
      </script>
    `)
  }
}

function html(body: string) {
  return new Response(body, { headers: { 'Content-Type': 'text/html' } })
}




