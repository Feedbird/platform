import crypto from "crypto";

export interface SlackOAuthAccessResponse {
  ok: boolean;
  app_id?: string;
  authed_user?: { id: string; access_token?: string };
  scope?: string;
  token_type?: string;
  access_token?: string; // legacy
  bot_user_id?: string;
  team?: { id: string; name?: string };
  enterprise?: { id: string; name?: string };
  incoming_webhook?: {
    url: string;
    channel: string;
    channel_id: string;
    configuration_url?: string;
  };
  error?: string;
}

export class SlackService {
  constructor(
    private readonly signingSecret: string,
  ) {}

  verifySignature(requestTimestamp: string, rawBody: string, slackSignature: string): boolean {
    if (!requestTimestamp || !slackSignature) return false;
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
    if (parseInt(requestTimestamp, 10) < fiveMinutesAgo) return false;

    const baseString = `v0:${requestTimestamp}:${rawBody}`;
    const hmac = crypto.createHmac("sha256", this.signingSecret);
    hmac.update(baseString);
    const mySignature = `v0=${hmac.digest("hex")}`;
    try {
      return crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(slackSignature));
    } catch {
      return false;
    }
  }

  async postMessageWithBotToken(botAccessToken: string, channelId: string, text: string, blocks?: any): Promise<void> {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${botAccessToken}`,
      },
      body: JSON.stringify({ channel: channelId, text, blocks }),
    });
    const json = await res.json();
    if (!json.ok) {
      throw new Error(`Slack chat.postMessage failed: ${json.error || res.statusText}`);
    }
  }

  async postIncomingWebhook(webhookUrl: string, payload: { text?: string; blocks?: any }): Promise<void> {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Slack webhook failed: ${res.status} ${txt}`);
    }
  }

  async createChannel(botAccessToken: string, name: string, isPrivate: boolean = false): Promise<{ id: string; name: string }> {
    const res = await fetch("https://slack.com/api/conversations.create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${botAccessToken}`,
      },
      body: JSON.stringify({ name, is_private: isPrivate }),
    });
    const json = await res.json();
    if (!json.ok) {
      throw new Error(`Slack conversations.create failed: ${json.error || res.statusText}`);
    }
    return { id: json.channel.id, name: json.channel.name };
  }
}

export async function exchangeSlackCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<SlackOAuthAccessResponse> {
  const body = new URLSearchParams();
  body.set("client_id", params.clientId);
  body.set("client_secret", params.clientSecret);
  body.set("code", params.code);
  body.set("redirect_uri", params.redirectUri);

  const res = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as SlackOAuthAccessResponse;
  return json;
}



