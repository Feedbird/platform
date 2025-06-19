"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Post } from "@/lib/store/use-feedbird-store";
import { getSuggestedSlots } from "@/lib/scheduling/getSuggestedSlots";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronDown, AlarmClock } from "lucide-react";

import { ChannelIcons } from "@/components/content/shared/content-post-ui";
import { Platform, SocialPage } from "@/lib/social/platforms/platform-types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAsyncLoading } from "@/hooks/use-async-loading";

export function PublishDateCell({
  post,
  updatePost,
  allPosts,
}: {
  post: Post;
  updatePost: (id: string, updates: Partial<Post>) => void;
  allPosts: Post[];
}) {
  const savedDate = post.publishDate ? new Date(post.publishDate) : null;
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Local date/time picking state
  const [tempDate, setTempDate] = useState<Date>(savedDate ?? new Date());
  const [timeVal, setTimeVal] = useState(() =>
    savedDate ? format(savedDate, "HH:mm") : "09:00"
  );

  const isScheduled = post.status === "Scheduled";
  const isPublished = post.status === "Published";
  const hasDate = !!savedDate;
  const displayText = hasDate ? formatDateTime(savedDate!) : "No time is set yet";

  const showChevronDown = !isScheduled;
  const showClock = !isScheduled; // auto-schedule button
  const showSend = hasDate;       // "publish now" button
  const showClockOff = hasDate && isScheduled; // "unschedule" button

  // We'll open separate dialogs for scheduling vs publishing
  const [confirmScheduleOpen, setConfirmScheduleOpen] = useState(false);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);

  // Access your store's publish method
  const publishPostToAllPages = useFeedbirdStore((s) => s.publishPostToAllPages);

  /* ---------- Actions ---------- */
  function handleSetDate() {
    const [hh, mm] = timeVal.split(":").map(Number);
    const final = new Date(tempDate);
    final.setHours(hh, mm, 0, 0);
    // We only store the date in the post for now
    updatePost(post.id, { publishDate: final });
    setPopoverOpen(false);
  }

  function handleAutoSchedule() {
    const suggestions = getSuggestedSlots(post, allPosts, 5);
    if (suggestions.length > 0) {
      updatePost(post.id, { publishDate: suggestions[0].date });
    } else {
      // fallback => next week 9:00am
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 7);
      fallback.setHours(9, 0, 0, 0);
      updatePost(post.id, { publishDate: fallback });
    }
  }

  function handleUnschedule() {
    // Revert to draft or remove publishDate
    updatePost(post.id, { status: "Draft", publishDate: undefined });
  }

  function buildHalfHourSlots(): { label: string; value: string }[] {
    const items: { label: string; value: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        const label = format(new Date(2020, 0, 1, h, m), "hh:mma");
        items.push({ label, value: `${hh}:${mm}` });
      }
    }
    return items;
  }

  return (
    <div className="flex items-center justify-between w-full px-2">
      {/* Date text + popover trigger */}
      <div className="flex items-center w-full min-w-0 max-w-full">
        <div
          className={cn(
            "text-sm mr-1 font-normal truncate flex-1 min-w-0 flex flex-row items-center",
            !hasDate ? "text-muted-foreground" : "text-black",
            "gap-2",
          )}
          title={displayText}
        >
          <span className="truncate">{displayText}</span>
          {/* Date/time popover - only if not scheduled/published */}
          {showChevronDown && !isPublished && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "flex-shrink-0 cursor-pointer text-muted-foreground",
                    // More responsive sizing with better breakpoints
                    "h-[18px] w-[18px] p-0 m-0 flex justify-center items-center",
                  )}
                >
                  <ChevronDown className={cn(
                    "w-2.5 h-2.5",
                  )} />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                align="center" 
                side="bottom"
                sideOffset={6} 
                collisionPadding={16} // More padding on mobile
                avoidCollisions={true}
                className={cn(
                  // Responsive width with better mobile support
                  "w-auto min-w-[280px]",
                )}
              >
                <div className={cn(
                  "p-3 space-y-3", // More padding on mobile
                  // Responsive height with mobile considerations
                  "max-h-[calc(100vh-100px)]", // Ensure it fits in viewport
                  "overflow-auto",
                )}>
                  <Calendar
                    mode="single"
                    selected={tempDate}
                    onSelect={(d) => d && setTempDate(d)}
                    className={cn(
                      "w-full mx-auto",
                      "text-sm"
                    )}
                    classNames={{
                      day_today: "bg-[#EDF0FF] rounded-full",
                      day_selected: "bg-[#4D3AF1] rounded-full text-white",
                      // More responsive day cells with better touch targets
                      day: cn(
                        "h-8 w-8 text-sm p-0", // Default
                      ),
                      nav_button: cn(
                        "h-8 w-8", // Default nav buttons
                      ),
                    }}
                  />
                  <div className="text-xs text-muted-foreground text-center">
                    {format(tempDate, "EEE, MMM d yyyy")}
                  </div>
                  <div className="text-xs font-medium text-center">
                    {`Local time (${Intl.DateTimeFormat().resolvedOptions().timeZone})`}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <AlarmClock className={cn(
                      "w-4 h-4 text-muted-foreground flex-shrink-0",
                    )} />
                    <Select value={timeVal} onValueChange={(v) => setTimeVal(v)}>
                      <SelectTrigger className={cn(
                        "border rounded px-2 py-1 flex-1 min-w-0",
                        "text-sm",
                        // More touch-friendly height
                        "h-9",
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={cn(
                        // Better mobile dropdown sizing
                        "max-h-[180px]",
                        "w-full min-w-[140px]"
                      )}>
                        {buildHalfHourSlots().map((slot) => (
                          <SelectItem 
                            key={slot.value} 
                            value={slot.value}
                            className={cn(
                              "text-sm",
                              // Touch-friendly item height
                              "h-8",
                            )}
                          >
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSetDate} 
                    className={cn(
                      "w-full",
                      // More touch-friendly button
                      "h-9",
                      "text-sm",
                    )}
                  >
                    Set date
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      {/* Additional action icons */}
      <div className="flex flex-row gap-2 flex-shrink-0">
        {/* Auto-schedule (only if not published/scheduled) */}
        {showClock && !isPublished && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="border border-border-button rounded-[6px] p-1 text-[#737C8B] cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={handleAutoSchedule}
                >
                  <Image
                    src="/images/publish/auto-schedule.svg"
                    alt="Auto Schedule"
                    width={16}
                    height={16}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-[#151515] text-white border-none text-xs"
              >
                Auto Schedule
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Publish now (only if we have a date & not published) */}
        {showSend && !isPublished && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="border border-border-button rounded-[6px] p-1 text-[#737C8B] cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setConfirmPublishOpen(true)}
                >
                  <Image
                    src="/images/publish/publish.svg"
                    alt="Publish"
                    width={16}
                    height={16}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-[#151515] text-white border-none text-xs"
              >
                Publish Now
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Unschedule (only if status === "Scheduled") */}
        {showClockOff && !isPublished && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="border border-border-button rounded-[6px] p-1 text-[#737C8B] cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={handleUnschedule}
                >
                  <Image
                    src="/images/publish/unschedule.svg"
                    alt="Unschedule"
                    width={16}
                    height={16}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-[#151515] text-white border-none text-xs"
              >
                Unschedule
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* ----- Confirm Scheduling Dialog ----- */}
      {confirmScheduleOpen && (
        <ConfirmScheduleDialog
          post={post}
          onClose={() => setConfirmScheduleOpen(false)}
          onConfirm={async () => {
            // "ScheduledTime" publish
            if (post.publishDate) {
              await publishPostToAllPages(post.id, new Date(post.publishDate));
            } else {
              await publishPostToAllPages(post.id);
            }
          }}
        />
      )}

      {/* ----- Confirm Publish Now Dialog ----- */}
      {confirmPublishOpen && (
        <ConfirmPublishNowDialog
          post={post}
          onClose={() => setConfirmPublishOpen(false)}
          onConfirm={async () => {
            await publishPostToAllPages(post.id);
          }}
        />
      )}
    </div>
  );
}

/*───────────────────────────────────────────────────────────────────
   ConfirmScheduleDialog
  ───────────────────────────────────────────────────────────────────*/
function ConfirmScheduleDialog({
  post,
  onClose,
  onConfirm,
}: {
  post: Post;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const { executeWithLoading } = useAsyncLoading();
  const brand = useFeedbirdStore((s) => s.getActiveBrand());
  const dt = post.publishDate ? formatDateTime(new Date(post.publishDate)) : "(none)";

  // Get the actual pages for post.pages
  const selectedPages: SocialPage[] =
    brand?.socialPages?.filter((pg) => post.pages.includes(pg.id)) ?? [];

  // Group them by platform for a small icon cluster
  const platformCounts = selectedPages.reduce((acc, pg) => {
    acc[pg.platform] = (acc[pg.platform] || 0) + 1;
    return acc;
  }, {} as Record<Platform, number>);

  const handleConfirm = () =>
    executeWithLoading(async () => {
      await onConfirm();
      onClose();
    }, "Scheduling post...");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-md shadow-lg w-[320px] p-5 space-y-4">
        <h3 className="text-base font-semibold text-center">
          Confirm Scheduling
        </h3>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          {/* Instead of "Platforms:", show "Pages" + icon cluster */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Pages:</span>
            <div className="flex items-center gap-1">
              {Object.entries(platformCounts).map(([platform, count], idx) => (
                <ChannelIcons
                  key={platform}
                  channels={[platform as Platform]}
                  counts={count}
                  size={20}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="font-medium text-foreground">Time:</span> {dt}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleConfirm}
          >
            Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}

/*───────────────────────────────────────────────────────────────────
   ConfirmPublishNowDialog
  ───────────────────────────────────────────────────────────────────*/
function ConfirmPublishNowDialog({
  post,
  onClose,
  onConfirm,
}: {
  post: Post;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const { executeWithLoading } = useAsyncLoading();
  const brand = useFeedbirdStore((s) => s.getActiveBrand());
  const dt = post.publishDate ? formatDateTime(new Date(post.publishDate)) : "(none)";

  // Get the actual pages for post.pages
  const selectedPages: SocialPage[] =
    brand?.socialPages?.filter((pg) => post.pages.includes(pg.id)) ?? [];

  // Group them by platform for a small icon cluster
  const platformCounts = selectedPages.reduce((acc, pg) => {
    acc[pg.platform] = (acc[pg.platform] || 0) + 1;
    return acc;
  }, {} as Record<Platform, number>);

  const handleConfirm = () =>
    executeWithLoading(async () => {
      await onConfirm();
      onClose();
    }, "Publishing post...");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-md shadow-lg w-[320px] p-5 space-y-4">
        <h3 className="text-base font-semibold text-center">
          Publish Now?
        </h3>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          {/* Show pages + icon cluster */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Pages:</span>
            <div className="flex items-center gap-1">
              {Object.entries(platformCounts).map(([platform, count]) => (
                <ChannelIcons
                  key={platform}
                  channels={[platform as Platform]}
                  counts={count}
                  size={20}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="font-medium text-foreground">Current date/time:</span> {dt}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleConfirm}
          >
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}

/*───────────────────────────────────────────────────────────────────
   A simple read-only updatedAt cell
  ───────────────────────────────────────────────────────────────────*/
export function UpdateDateCell({ post }: { post: Post }) {
  const d = post.updatedAt ? new Date(post.updatedAt) : null;
  const display = d ? formatDateTime(d) : "—";
  return (
    <span className="text-sm whitespace-nowrap min-w-[110px] overflow-hidden text-ellipsis">
      {display}
    </span>
  );
}

/*───────────────────────────────────────────────────────────────────
   Helpers
  ───────────────────────────────────────────────────────────────────*/
function formatDateTime(date: Date) {
  return format(date, "MMM dd, hh:mm aa");
}
