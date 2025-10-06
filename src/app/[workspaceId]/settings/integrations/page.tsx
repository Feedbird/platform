"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { LucideSquareArrowOutUpRight } from "lucide-react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export default function SettingsIntegrationsPage() {
  const params = useParams() as { workspaceId?: string }
  const workspaceId = params?.workspaceId || ""

  const [channelName, setChannelName] = React.useState("")

  function sanitizeChannelName(name: string) {
    const trimmed = name.trim().toLowerCase()
    const cleaned = trimmed.replace(/[^a-z0-9-_]/g, "-")
    return cleaned.replace(/^-+|[-_]+$/g, "").slice(0, 80) || 'feedbird-updates'
  }

  function connectSlack() {
    if (!workspaceId) return;
    const w = 600, h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const desired = sanitizeChannelName(channelName)
    const url = `/api/oauth/slack?workspaceId=${workspaceId}&channel=${encodeURIComponent(desired)}`
    window.open(url, "_blank", `width=${w},height=${h},left=${left},top=${top}`);
  }

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Topbar */}
      <div className="w-full border-b px-4 h-10 flex items-center justify-between">
        <div className="text-sm text-grey font-medium">Integrations</div>
      </div>

      {/* Main */}
      <div className="w-full pt-2 flex flex-1 items-start justify-center overflow-y-auto">
        <div className="w-[512px] space-y-6">
          {/* Section header */}
          <div className="border-b border-elementStroke pb-4">
            <div className="text-sm text-black font-medium">Integrations</div>
          </div>

          {/* Slack Integration */}
          <div className="space-y-6">
            {/* Slack Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-[5px] border border-buttonStroke flex items-center justify-center">
                  <img src="/images/settings/slack.svg" alt="Slack" />
                </div>
                <div className="max-w-[311px]">
                  <div className="text-sm font-medium text-black">Slack Notification</div>
                  <div className="text-[13px] font-normal text-darkGrey">Connect Feedbird to your Slack workspaces to setup notifications when data in Feedbird changes</div>
                </div>
              </div>
              <button onClick={connectSlack} className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-[5px] cursor-pointer bg-main text-white hover:bg-main/90">
                Connect Slack
                <LucideSquareArrowOutUpRight style={{ width: "14px", height: "14px" }} />
              </button>
            </div>

            {/* Channel name input */}
            <div className="flex items-center gap-2">
              <div className="text-[13px] text-darkGrey w-40">Channel name:</div>
              <Input
                placeholder="e.g. feedbird-updates"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="h-8 border-elementStroke text-sm text-black font-normal"
              />
            </div>

            <div className="border-b border-elementStroke"></div>

            {/* Description */}
            <div className="">
              <div className="text-base font-semibold text-black mb-1">
                Keep your team in sync with every update from Feedbird — right inside Slack.
              </div>
              <div className="text-[13px] text-darkGrey font-normal leading-6 mb-6">
                With the Feedbird Slack integration, you can automatically share important updates—like a new post being scheduled, content approved by a client, or analytics hitting a milestone—directly into your Slack channels. No more switching tabs: your team sees it all in real time.
              </div>
              <div className="text-[13px] text-darkGrey font-normal leading-6">
                And to make collaboration even smoother, you can trigger actions straight from Slack. Approve, review, or comment on updates without leaving your workspace.
              </div>
            </div>

            

            {/* Features */}
            <div className="text-[13px] font-normal text-darkGrey leading-6">
              <div className="text-base text-black font-semibold mb-1">Features</div>

              <div>
                <div>Automated notifications</div>
                <div>
                  &nbsp;Stay on top of your workflow by sending instant Slack alerts for key events in Feedbird — from scheduled posts to published campaigns.
                </div>
              </div>

              <div>
                <div>Workflow actions</div>
                <div className="flex gap-1">
                  <span className="text-darkGrey px-1">•</span>
                  <div>
                    Post messages to channels: Share custom updates from Feedbird into any Slack channel you choose.
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className="text-darkGrey px-1">•</span>
                  <div>
                    Post interactive actions: Let your team take action in Slack (like approving content or syncing captions) with just one click.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}



