import { NextRequest, NextResponse } from 'next/server'
import { SlackService } from '@/lib/services/slack-service'

// This endpoint handles Slack interactive payloads (block_actions, shortcuts)
export async function POST(req: NextRequest) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET!
  const slack = new SlackService(signingSecret)

  const rawBody = await req.text()
  const ts = req.headers.get('x-slack-request-timestamp') || ''
  const sig = req.headers.get('x-slack-signature') || ''
  if (!slack.verifySignature(ts, rawBody, sig)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Slack sends body as application/x-www-form-urlencoded with a single 'payload' field
  const params = new URLSearchParams(rawBody)
  const payload = params.get('payload')
  if (!payload) return NextResponse.json({ error: 'Missing payload' }, { status: 400 })

  const data = JSON.parse(payload)
  const { type, user, actions, channel, message, trigger_id } = data

  // Minimal ack
  // For simple button clicks, optionally respond with a message replacement
  // Here we just acknowledge; app can expand with approve/reject workflows
  return NextResponse.json({ ok: true })
}




