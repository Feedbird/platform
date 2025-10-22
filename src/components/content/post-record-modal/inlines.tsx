"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { Post, Status, ContentFormat, usePostStore, useWorkspaceStore, useUserStore } from "@/lib/store";
import { Platform } from "@/lib/social/platforms/platform-types";
import { StatusChip, ChannelIcons, FormatBadge } from "@/components/content/shared/content-post-ui";
import { getSuggestedSlots } from "@/lib/scheduling/getSuggestedSlots";
import { format } from "date-fns";
import {
  ChevronDown as ChevronDownIcon,
  AlarmClock,
  AlarmClockOff,
  Check,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Re-use your table code popups
import { StatusSelectPopup } from "../post-table/StatusSelectPopup";
import { ChannelsMultiSelectPopup } from "../post-table/ChannelsMultiSelectPopup";
import { FormatSelectPopup } from "../post-table/FormatSelectPopup";
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { useUser } from "@clerk/nextjs";

/* ------------------------------------------------------------------
   1) InlineStatusEditor
   uses StatusSelectPopup
------------------------------------------------------------------ */
export function InlineStatusEditor({ post }: { post: Post }) {
  const updatePost = usePostStore(s => s.updatePost);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <div
          className="
            inline-flex items-center
            cursor-pointer
            rounded py-1
            text-xs
            hover:opacity-90
          "
        >
          <StatusChip status={post.status} widthFull={false} />
          <ChevronDownIcon className="ml-1 h-4 w-4 text-muted-foreground" />
        </div>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-auto">
        <StatusSelectPopup
          value={post.status}
          onChange={(newVal) => {
            updatePost(post.id, { status: newVal as Status });
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

const PLATFORMS: Platform[] = [
  'facebook',
  'instagram',
  'linkedin',
  'pinterest',
  'youtube',
  'tiktok',
  'google'
];

/* ------------------------------------------------------------------
   2) InlinePlatformsEditor
   uses ChannelsMultiSelectPopup + optional hover-card
------------------------------------------------------------------ */
export function InlinePlatformsEditor({ post }: { post: Post }) {
  const updatePost = usePostStore((s) => s.updatePost);
  const [open, setOpen] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>(post.platforms);

  // Reset on open
  useEffect(() => {
    if (open) setPlatforms(post.platforms);
  }, [open, post.platforms]);

  // Save on close
  useEffect(() => {
    if (!open) {
      updatePost(post.id, { platforms });
    }
  }, [open, platforms, post.id, updatePost]);

  return (
    <div className="flex items-center gap-2">
      <ChannelIcons
        channels={platforms}
        whiteBorder={false}
      />
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Edit
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Platforms</DialogTitle>
            <DialogDescription>
              Choose which platforms this post will be published to.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            {PLATFORMS.map(platform => (
              <div
                key={platform}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                  platforms.includes(platform) ? 'bg-accent' : ''
                }`}
                onClick={() => {
                  setPlatforms(prev =>
                    prev.includes(platform)
                      ? prev.filter(p => p !== platform)
                      : [...prev, platform]
                  );
                }}
              >
                <ChannelIcons channels={[platform]} />
                <span className="text-sm capitalize">{platform}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------
   3) InlineFormatEditor
   uses FormatSelectPopup
------------------------------------------------------------------ */
export function InlineFormatEditor({ post }: { post: Post }) {
  const updatePost = usePostStore(s => s.updatePost);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <div
          className="
            inline-flex items-center
            cursor-pointer
            rounded py-1
            text-xs
            hover:opacity-90
          "
        >
          <FormatBadge kind={post.format} widthFull={false} />
          <ChevronDownIcon className="ml-1 h-4 w-4 text-muted-foreground" />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-auto"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <FormatSelectPopup
          value={post.format}
          onChange={(fmt) => {
            updatePost(post.id, { format: fmt as ContentFormat });
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------
   4) InlineDateEditor
   similar to your "PublishDateCell", but with local open
------------------------------------------------------------------ */
export function InlineDateEditor({ post }: { post: Post }) {
  const updatePost = usePostStore(s => s.updatePost);
  const addActivity = usePostStore(s => s.addActivity);

  const savedDate  = post.publish_date ? new Date(post.publish_date) : null;
  const hasDate    = !!savedDate;
  const isSched    = post.status === "Scheduled";
  const isPub      = post.status === "Published";

  // Display text
  const display = hasDate
    ? format(savedDate!, "MMM d, hh:mm aa")
    : "Set date";

  const [open, setOpen] = useState(false);

  const [tempDate, setTempDate] = useState<Date>(savedDate ?? new Date());
  const [timeVal, setTimeVal]   = useState(
    savedDate ? format(savedDate, "HH:mm") : "09:00"
  );

  function autoSchedule() {
    const allPosts = usePostStore.getState().getActivePosts();
    const suggestions = getSuggestedSlots(post, allPosts, 5);
    let scheduledDate: Date;
    
    if (suggestions.length) {
      scheduledDate = suggestions[0].date;
      updatePost(post.id, { publish_date: scheduledDate });
    } else {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 7);
      fallback.setHours(9, 0, 0, 0);
      scheduledDate = fallback;
      updatePost(post.id, { publish_date: fallback });
    }
    
    // Add scheduling activity
    addActivity({
      postId: post.id,
      workspaceId: useWorkspaceStore.getState().getActiveWorkspace()?.id || '',
      actorId: useUserStore.getState().user?.id || '',
      type: "scheduled",
      metadata: {
        publishTime: scheduledDate
      }
    });
  }
  function handleSetDate() {
    const [hh, mm] = timeVal.split(":").map(Number);
    const dt = new Date(tempDate);
    dt.setHours(hh, mm, 0, 0);
    updatePost(post.id, { publish_date: dt });
    
    // Add scheduling activity
    addActivity({
      postId: post.id,
      workspaceId: useWorkspaceStore.getState().getActiveWorkspace()?.id || '',
      actorId: useUserStore.getState().user?.id || '',
      type: "scheduled",
      metadata: {
        publishTime: dt
      }
    });
    
    setOpen(false);
  }
  function handleSchedule() {
    updatePost(post.id, { status: "Scheduled" });
    
    // Add scheduling activity
    addActivity({
      postId: post.id,
      workspaceId: useWorkspaceStore.getState().getActiveWorkspace()?.id || '',
      actorId: useUserStore.getState().user?.id || '',
      type: "scheduled",
      metadata: {
        publishTime: post.publish_date || new Date()
      }
    });
  }
  function handleUnsched() {
    updatePost(post.id, { publish_date: undefined, status: "Draft" });
  }
  function handlePublish() {
    const publishTime = new Date();
    updatePost(post.id, { status: "Published", publish_date: publishTime });
    
    // Add publishing activity
    addActivity({
      postId: post.id,
      workspaceId: useWorkspaceStore.getState().getActiveWorkspace()?.id || '',
      actorId: useUserStore.getState().user?.id || '',
      type: "published",
      metadata: {
        publishTime
      }
    });
  }

  const showChevronDown = !isSched && !isPub;
  const showCheck       = hasDate && !isSched && !isPub;
  const showClock       = !isSched && !isPub;
  const showSend        = hasDate && !isPub;
  const showClockOff    = hasDate && isSched && !isPub;

  return (
    <div className="inline-flex items-center gap-1 text-sm rounded py-1 hover:opacity-90">

      <span>{display}</span>

      {/* Popover: date/time picking */}
      {showChevronDown && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 p-0 m-0 cursor-pointer">
              <ChevronDownIcon className="w-3 h-3" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="p-2 w-[240px] space-y-2" side="bottom" sideOffset={6}>
            <Calendar
              mode="single"
              selected={tempDate}
              onSelect={(d) => d && setTempDate(d)}
            />
            <div className="flex items-center gap-1 text-sm">
              <AlarmClock className="w-4 h-4" />
              {/* time select via <Select> */}
              <Select value={timeVal} onValueChange={setTimeVal}>
                <SelectTrigger className="border rounded px-2 py-1 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buildHalfHourSlots().map(slot => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleSetDate}>
              Set date
            </Button>
          </PopoverContent>
        </Popover>
      )}

      {showClock && (
        <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={autoSchedule}>
          <AlarmClock className="w-3 h-3" />
        </Button>
      )}
      {showSend && (
        <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={handlePublish}>
          <Send className="w-3 h-3 text-blue-600" />
        </Button>
      )}
      {showClockOff && (
        <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={handleUnsched}>
          <AlarmClockOff className="w-3 h-3 text-red-600" />
        </Button>
      )}
    </div>
  );
}

// helper
function buildHalfHourSlots() {
  const results: { label: string; value: string }[] = [];
  for (let h=0; h<24; h++){
    for (const m of [0,30]){
      const HH = String(h).padStart(2,"0");
      const MM = String(m).padStart(2,"0");
      const dt = new Date(2020,0,1,h,m);
      const label = format(dt, "hh:mma");
      results.push({ label, value: `${HH}:${MM}`});
    }
  }
  return results;
}

/* ------------------------------------------------------------------
   5) ApproveCell
   A simple button that toggles "Approved" vs something else, or just sets Approved.
   In the table, you had icons. We can replicate that. 
   For the modal, or do you want the same icon? 
------------------------------------------------------------------ */
export function ApproveCell({ post }: { post: Post }) {
  const approvePost = usePostStore(s => s.approvePost);
  const requestChanges = usePostStore(s => s.requestChanges);

  const isApproved = post.status === "Approved";
  const isInRevision = post.status === "Needs Revisions";
  const isScheduledOrPosted = post.status === "Scheduled" || post.status === "Published";

  // Define which statuses allow approval/revision actions
  const allowedStatusesForApproval = [
    "Pending Approval",
    "Revised", 
    "Needs Revisions",
    "Approved"
  ];
  
  const canPerformApprovalAction = allowedStatusesForApproval.includes(post.status);

  // Determine the appropriate checkmark icon based on status
  let checkmarkSrc = "/checkmark/checkmark_draft.svg"; // Default to draft
  if (isApproved || isScheduledOrPosted) {
    checkmarkSrc = "/checkmark/checkmark_approved.svg";
  } else if (isInRevision) {
    checkmarkSrc = "/checkmark/checkmark_revision.svg";
  }

  const handleClick = () => {
    if (!canPerformApprovalAction) {
      return; // Do nothing if not allowed
    }

    if (isApproved) {
      // If currently approved, change to "Needs Revisions"
      requestChanges(post.id);
    } else {
      // For any other allowed status, approve it
      approvePost(post.id);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "p-0 ml-[-8px]",
        canPerformApprovalAction ? "cursor-pointer" : "cursor-not-allowed opacity-50"
      )}
      onClick={handleClick}
    >
      {
        !isInRevision ?
        <Image src={checkmarkSrc} alt="approval status" width={22} height={22} /> :
        <CancelRoundedIcon width={22} height={22} sx={{ color: "#F79009" }}/>
      }
    </Button>
  );
}

/* ------------------------------------------------------------------
   6) UpdateDateCell
   Just a read-only "post.updatedAt"
------------------------------------------------------------------ */
export function UpdateDateCell({ post }: { post: Post }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium">
        {post.updatedAt
          ? post.updatedAt.toLocaleString("en-US", {
              month: "long",
              day: "numeric",
            })
          : "Not updated yet"}
      </span>
      <span className="text-xs text-gray-500">
        {post.updatedAt
          ? post.updatedAt.toLocaleString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })
          : ""}
      </span>
    </div>
  );
}
