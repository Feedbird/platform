import { NextRequest, NextResponse } from 'next/server'
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

    const { data, error: dbError } = await supabase
      .from('slack_installations')
      .upsert({
        workspace_id: workspaceId,
        team_id: token.team?.id,
        team_name: token.team?.name,
        enterprise_id: token.enterprise?.id || null,
        app_id: token.app_id || null,
        bot_user_id: token.bot_user_id || null,
        bot_access_token: token.access_token || '',
        scope: token.scope || null,
        authed_user_id: token.authed_user?.id || null,
        authed_user_access_token: token.authed_user?.access_token || null,
        incoming_webhook_url: token.incoming_webhook?.url || null,
        incoming_webhook_channel_id: token.incoming_webhook?.channel_id || null,
        incoming_webhook_channel: token.incoming_webhook?.channel || null,
      }, { onConflict: 'workspace_id,team_id' })
      .select()
      .single()

    if (dbError) {
      throw dbError
    }

    // Create a default channel for Feedbird in this workspace
    const slack = new SlackService(process.env.SLACK_SIGNING_SECRET || 'unused')
    const desiredChannelName = desiredChannelFromState || 'feedbird-updates'
    let createdChannel: { id: string; name: string } | null = null
    try {
      if (data?.bot_access_token) {
        createdChannel = await slack.createChannel(data.bot_access_token, desiredChannelName, false)
      }
    } catch (e) {
      // If channel exists or permissions missing, skip gracefully
      console.warn('Slack channel creation skipped:', (e as any)?.message)
    }

    // If we created a channel, bind it for default events
    if (createdChannel) {
      await supabase
        .from('slack_channel_bindings')
        .upsert({
          workspace_id: workspaceId,
          team_id: token.team?.id || '',
          channel_id: createdChannel.id,
          channel_name: createdChannel.name,
          events: ['approved','scheduled','published'],
        }, { onConflict: 'workspace_id,team_id,channel_id' })

      // Post welcome message
      try {
        await slack.postMessageWithBotToken(
          data!.bot_access_token,
          createdChannel.id,
          '👋 Feedbird has been connected. We will send updates here for approved, scheduled, and published content.'
        )
      } catch (e) {
        console.warn('Failed to post welcome message:', (e as any)?.message)
      }
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




