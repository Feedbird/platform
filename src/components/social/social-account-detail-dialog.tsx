"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TikTokAccountInfo } from "./tiktok-account-info";
import { ChannelIcons } from "@/components/content/shared/content-post-ui";
import type { Platform } from "@/lib/social/platforms/platform-types";

interface SocialAccountDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: {
    name: string;
    platform: Platform;
    metadata?: any;
  } | null;
}

export function SocialAccountDetailDialog({
  open,
  onOpenChange,
  account,
}: SocialAccountDetailDialogProps) {
  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChannelIcons channels={[account.platform]} size={20} />
            Account Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about your connected social account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {account.platform === "tiktok" && account.metadata && (
            <TikTokAccountInfo
              metadata={account.metadata}
              displayName={account.name}
            />
          )}

          {/* Add other platform-specific details here */}
          {account.platform !== "tiktok" && (
            <div className="text-sm text-gray-500 text-center py-4">
              No additional details available for this platform
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
