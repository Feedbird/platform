"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Post } from "@/lib/store/use-feedbird-store";
import { Platform } from "@/lib/social/platforms/platform-types";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { Lock, Unlock } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";
import { ChannelIcons } from "@/components/content/shared/content-post-ui";

function removePhoneNumbersForPlatform(platform: Platform, text: string) {
  // your logic
  if (platform === "google") {
    const phoneRegex = /\b\d{3}-\d{4}\b/g;
    return text.replace(phoneRegex, "[removed]");
  }
  return text;
}

function updateCaption(post: Post, platform: Platform, text: string) {
  const cleaned = text.trim();
  if (post.caption.synced) {
    return {
      ...post.caption,
      default: cleaned,
    };
  } else {
    return {
      ...post.caption,
      perPlatform: {
        ...post.caption.perPlatform,
        [platform]: cleaned,
      }
    };
  }
}

export function CaptionEditor({
  post,
  onChange,
}: {
  post: Post;
  onChange: (cap: Partial<Post["caption"]>) => void;
}) {
  const updatePost = useFeedbirdStore((s) => s.updatePost);

  const [currentPlatform, setCurrentPlatform] = useState<Platform>(
    post.platforms[0] || "instagram"
  );
  const isSynced = post.caption.synced;

  // toggle
  const handleToggleSync = () => {
    if (isSynced) {
      // from synced => unsynced
      const perCh: Record<string, string> = {};
      post.platforms.forEach(platform => {
        perCh[platform] = post.caption.default || "";
      });
      const newCap = {
        synced: false,
        default: post.caption.default,
        perChannel: perCh
      };
      updatePost(post.id, { caption: newCap });
      onChange(newCap);
    } else {
      // unsynced => synced
      const newCap = {
        synced: true,
        default: post.caption.default || "",
        perChannel: {}
      };
      updatePost(post.id, { caption: newCap });
      onChange(newCap);
    }
  };

  // handle typed changes in synced vs unsynced mode
  const handleSyncedChange = (val: string) => {
    const cleaned = removePhoneNumbersForPlatform("instagram", val);
    const updated = {
      ...post.caption,
      default: cleaned,
    };
    
    // Prepare updates object
    const updates: Partial<Post> = { caption: updated };
    
    // Auto-set status to "Pending Approval" if non-empty caption is set on post with blocks
    const hasNonEmptyCaption = cleaned && cleaned.trim() !== "";
    const hasBlocks = post.blocks.length > 0;
    const isDraftStatus = post.status === "Draft";
    
    if (hasNonEmptyCaption && hasBlocks && isDraftStatus) {
      updates.status = "Pending Approval";
    }
    
    // Apply all updates in a single call
    updatePost(post.id, updates);
    onChange(updated);
  };

  const handleUnsyncedChange = (platform: Platform, val: string) => {
    const cleaned = removePhoneNumbersForPlatform(platform, val);
    const updated = {
      ...post.caption,
      perPlatform: {
        ...post.caption.perPlatform,
        [platform]: cleaned,
      }
    };
    
    // Prepare updates object
    const updates: Partial<Post> = { caption: updated };
    
    // Auto-set status to "Pending Approval" if non-empty caption is set on post with blocks
    const hasNonEmptyCaption = cleaned && cleaned.trim() !== "";
    const hasBlocks = post.blocks.length > 0;
    const isDraftStatus = post.status === "Draft";
    if (hasNonEmptyCaption && hasBlocks && isDraftStatus) {
      updates.status = "Pending Approval";
    }
    
    // Apply all updates in a single call
    updatePost(post.id, updates);
    onChange(updated);
  };

  return (
    <div className="flex flex-col p-3 rounded-md border border-buttonStroke gap-2">
      {/* heading: icon + label + lock toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {/* your icon */}
          <Image src="/images/columns/caption.svg" alt="caption" width={16} height={16} />
          <span className="text-sm font-medium text-black">Caption</span>
          { !isSynced &&
          <Select
              value={currentPlatform}
              onValueChange={(v) => setCurrentPlatform(v as Platform)}
            >
            <SelectTrigger className="w-28 text-sm border-none shadow-none p-0 text-black">
              <SelectValue placeholder="Pick platform" />
            </SelectTrigger>
            <SelectContent>
              {post.platforms.map(platform => (
                <SelectItem
                  key={platform}
                  value={platform}
                  className="flex items-center gap-2 text-black"
                >
                  {/* platform icons + label */}
                  <ChannelIcons channels={[platform]} />
                  <span className="text-sm capitalize">{platform}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          }
        </div>
        {/* lock/unlock toggle */}
        <button
          onClick={handleToggleSync}
          className="flex items-center gap-1 text-sm font-medium text-black border border-buttonStroke px-2 py-1 rounded-sm"
        >
          {isSynced ? (
            <>
              <Lock size={14} />
              Synced
            </>
          ) : (
            <>
              <Unlock size={14} />
              Unsynced
            </>
          )}
        </button>
      </div>

      {isSynced ? (
        // single text area
        <textarea
          className="w-full text-sm focus:outline-none text-black"
          value={post.caption.default}
          onChange={(e) => handleSyncedChange(e.target.value)}
        />
      ) : (
        // unsynced => show platform dropdown with icon + label
        <div className="flex flex-col gap-2">
          {/* text area for chosen platform */}
          <textarea
            className="w-full text-sm focus:outline-none text-black"
            value={post.caption.perPlatform?.[currentPlatform] ?? ""}
            onChange={(e) => handleUnsyncedChange(currentPlatform, e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
