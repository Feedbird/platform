"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Post } from "@/lib/store/use-feedbird-store";
import { getSuggestedSlots } from "@/lib/scheduling/getSuggestedSlots";
import { format } from "date-fns";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { ChannelIcons } from "@/components/content/shared/content-post-ui";
import { Platform, SocialPage } from "@/lib/social/platforms/platform-types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAsyncLoading } from "@/hooks/use-async-loading";
import { DateTimeSelector } from "./DateTimeSelector";
import { PostingSettingsPanel } from "./PostingSettingsPanel";

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
  const [showSelector, setShowSelector] = useState(false);
  const [showPostingPanel, setShowPostingPanel] = useState(false);

  const isScheduled = post.status === "Scheduled";
  const isPublished = post.status === "Published";
  const isFailedPublishing = post.status === "Failed Publishing";
  const hasDate = !!savedDate;
  const displayText = hasDate ? formatDateTime(savedDate!) : "No time is set yet";

  const showClock = !isScheduled; // auto-schedule button
  const showSend = hasDate;       // "publish now" button
  const showClockOff = hasDate && isScheduled; // "unschedule" button

  // Helper functions to get styling based on status
  const getStatusStyling = () => {
    if (isPublished) {
      return {
        backgroundColor: "#DDF9E4",
        borderColor: "rgba(28, 29, 31, 0.05)",
        iconBackgroundColor: "#0DAD69",
        iconSrc: "/images/publish/published.svg",
        textColor: "#000000"
      };
    } else if (isFailedPublishing) {
      return {
        backgroundColor: "#F5EEFF",
        borderColor: "#EAE4F4",
        iconBackgroundColor: "#A064F5",
        iconSrc: "/images/publish/failed-published.svg",
        textColor: "#000000"
      };
    } else {
      return {
        backgroundColor: "#E5EEFF",
        borderColor: "rgba(28, 29, 31, 0.05)",
        iconBackgroundColor: "#125AFF",
        iconSrc: "/images/columns/post-time.svg",
        textColor: "#133495"
      };
    }
  };

  const statusStyling = getStatusStyling();

  // We'll open separate dialogs for scheduling vs publishing
  const [confirmScheduleOpen, setConfirmScheduleOpen] = useState(false);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);

  // Access your store's publish method
  const publishPostToAllPages = useFeedbirdStore((s) => s.publishPostToAllPages);

  /* ---------- Actions ---------- */
  function handleAutoSchedule() {
    const suggestions = getSuggestedSlots(post, allPosts, 5);
    if (suggestions.length > 0) {
      updatePost(post.id, { publishDate: suggestions[0].date, status: "Scheduled" });
    } else {
      // fallback => next week 9:00am
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 7);
      fallback.setHours(9, 0, 0, 0);
      updatePost(post.id, { publishDate: fallback, status: "Scheduled" });
    }
    setPopoverOpen(false);
  }

  function handleUnschedule() {
    // Revert to draft or remove publishDate
    updatePost(post.id, { status: "Draft", publishDate: undefined });
  }

  useEffect(() => {
    if (!popoverOpen) setShowSelector(false);
  }, [popoverOpen]);

  return (
    <div className="flex items-center justify-between w-full px-2 py-[6px]">
      {/* Date text + popover trigger */}
      <div className="flex items-center w-full min-w-0 max-w-full">
        <div className="flex-1 min-w-0">
          {/* Date/time popover - only if not scheduled/published/failed publishing */}
          {!isScheduled && !isPublished && !isFailedPublishing ? (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="cursor-pointer" style={{width: "fit-content"}}>
                  {hasDate ? (
                    /* If has time but not scheduled: show chip style with calendar icon + time */
                    <div className="flex flex-row items-center gap-1 rounded-[4px]" style={{
                      padding: "1px 6px 1px 4px",
                      border: `1px solid ${statusStyling.borderColor}`,
                      backgroundColor: statusStyling.backgroundColor,
                      width: "fit-content"
                    }}>
                      <div className="flex flex-row items-center p-[1px] rounded-[3px]" style={{
                        backgroundColor: statusStyling.iconBackgroundColor
                      }}>
                        <Image 
                          src={statusStyling.iconSrc} 
                          alt="Publish Date" 
                          width={12} 
                          height={12}
                          className="filter brightness-0 invert"
                          style={{ filter: 'brightness(0) invert(1)' }}
                        />
                      </div>
                      <span className="text-xs text-[#133495] font-semibold whitespace-nowrap" style={{
                        lineHeight: "18px",
                      }}>{displayText}</span>
                    </div>
                  ) : (
                    /* If no time: show icon button with + icon + "Select time" label */
                    <div className={cn(
                      "flex flex-row items-center gap-1 rounded-[4px] bg-white",
                      )} style={{
                        padding: "3px 6px 3px 4px",
                        boxShadow: "0px 0px 0px 1px #D3D3D3",
                        width: "fit-content"
                      }}>
                        <div className="flex flex-row items-center p-[1px] rounded-[3px] bg-[#E6E4E2]">
                          <Plus className={cn(
                            "w-3 h-3 text-[#5C5E63]",
                          )}/>
                        </div>
                       <span className="text-xs text-[#5C5E63] font-semibold">Select time</span>
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent
                align={(hasDate || showSelector || showPostingPanel) ? "end" : "center"}
                side="bottom"
                sideOffset={6}
                avoidCollisions
                className={cn(
                  (hasDate || showSelector || showPostingPanel) ? "p-0 border-none bg-transparent max-w-[90vw]" : "w-auto min-w-[250px]"
                )}
                style={
                  (!hasDate && !showSelector && !showPostingPanel)
                    ? {
                        display: "flex",
                        width: "250px",
                        padding: "4px 0px",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        borderRadius: "6px",
                        background: "rgba(255, 255, 255, 0.95)",
                        boxShadow:
                          "0px 0px 0px 1px rgba(0, 0, 0, 0.06), 0px 1px 1px -0.5px rgba(0, 0, 0, 0.06), 0px 3px 3px -1.5px rgba(0, 0, 0, 0.06), 0px 6px 6px -3px rgba(0, 0, 0, 0.06), 0px 12px 12px -6px rgba(0, 0, 0, 0.04), 0px 24px 24px -12px rgba(0, 0, 0, 0.04)",
                        backdropFilter: "blur(4px)",
                      }
                    : undefined
                }
              >
                {showPostingPanel ? (
                  <PostingSettingsPanel
                    initialTimezone={(post as any).timezone}
                    initialSlots={(post as any).postingSlots}
                    onBack={()=>setShowPostingPanel(false)}
                    onSave={(tz,slots)=>{
                      updatePost(post.id,{ timezone: tz, postingSlots: slots } as any);
                      setShowPostingPanel(false);
                    }}
                  />
                ) : (!hasDate && !showSelector) ? (
                  <div>
                    {/* Auto Schedule */}
                    <div
                      className="px-[10px] py-[8px] cursor-pointer gap-[2px]"
                      onClick={handleAutoSchedule}
                    >
                      <div className="text-sm font-medium text-black flex flex-row items-center gap-[6px]">
                        <Image
                          src={"/images/publish/clock-check.svg"}
                          alt="Auto Schedule"
                          width={14}
                          height={14}
                        />
                        <p>Auto Schedule</p>
                      </div>
                      <div className="text-sm font-normal text-[#5C5E63]">
                        Scheduled for the optimal time upon approval
                      </div>
                    </div>

                    <div className="h-px bg-[#E6E4E2] mx-2 my-1"></div>

                    {/* Custom Date */}
                    <div
                      className="px-[10px] py-[8px] cursor-pointer"
                      onClick={() => setShowSelector(true)}
                    >
                      <div className="flex items-center gap-[6px]">
                        <Image
                          src={"/images/publish/auto-schedule.svg"}
                          alt="Custom Date"
                          width={14}
                          height={14}
                        />
                        <div className="text-sm font-medium text-black">Custom Date</div>
                      </div>
                    </div>

                    {/* Change Workspace Timezone */}
                    <div
                      className="px-[10px] py-[8px] cursor-pointer"
                      onClick={() => { setShowPostingPanel(true); setShowSelector(false); }}
                    >
                      <div className="flex items-center gap-[6px]">
                        <Image
                          src={"/images/publish/timezone.svg"}
                          alt="Change workspace time zone"
                          width={14}
                          height={14}
                        />
                        <div className="text-sm font-medium text-black">Change workspace time zone</div>
                      </div>
                    </div>

                    {/* Allowed Posting Time */}
                    <div
                      className="px-[10px] py-[8px] cursor-pointer"
                      onClick={() => { setShowPostingPanel(true); setShowSelector(false); }}
                    >
                      <div className="flex items-center gap-[6px]">
                        <Image
                          src={"/images/columns/updated-time.svg"}
                          alt="Allowed posting time"
                          width={14}
                          height={14}
                        />
                        <div className="text-sm font-medium text-black">Allowed posting time</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <DateTimeSelector
                    post={post}
                    allPosts={allPosts}
                    onClose={() => { setPopoverOpen(false); setShowSelector(false); }}
                    onSchedule={(d) => {
                      updatePost(post.id, {
                        publishDate: d,
                        status: "Scheduled",
                      });
                    }}
                    onPublishNow={async () => {
                      await publishPostToAllPages(post.id);
                    }}
                  />
                )}
              </PopoverContent>
            </Popover>
          ) : (
            /* If scheduled/published/failed publishing or has date: show status with icon + time below */
            <div className="flex flex-col">
              <div className="flex flex-row items-center gap-1 rounded-[4px]" style={{
                padding: "1px 6px 1px 4px",
                border: `1px solid ${statusStyling.borderColor}`,
                backgroundColor: statusStyling.backgroundColor,
                width: "fit-content"
              }}>
                <div className="flex flex-row items-center p-[1px] rounded-[3px]" style={{
                  backgroundColor: statusStyling.iconBackgroundColor
                }}>
                  <Image 
                    src={statusStyling.iconSrc} 
                    alt="Publish Date" 
                    width={12} 
                    height={12}
                    className="filter brightness-0 invert"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </div>
                <span className="text-xs font-semibold whitespace-nowrap" style={{
                  lineHeight: "18px",
                  color: statusStyling.textColor
                }}>{displayText}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Additional action icons */}
      {hasDate && (
        <div className="flex flex-row gap-2 flex-shrink-0">
          {/* Unschedule (only if status === "Scheduled" and not published/failed publishing) */}
          {showClockOff && !isPublished && !isFailedPublishing && (
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

          {/* Auto-schedule (only if not published/scheduled/failed publishing) */}
          {showClock && !isPublished && !isFailedPublishing && (
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

          {/* Publish now (only if we have a date & not published/failed publishing) */}
          {showSend && !isPublished && !isFailedPublishing && (
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
        </div>
      )}

      {/* Publish now button for failed publishing posts (even without date) */}
      {isFailedPublishing && (
        <div className="flex flex-row gap-2 flex-shrink-0">
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
        </div>
      )}

      {/* ----- Confirm Scheduling Dialog ----- */}
      <ConfirmScheduleDialog
        open={confirmScheduleOpen}
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

      {/* ----- Confirm Publish Now Dialog ----- */}
      <ConfirmPublishNowDialog
        open={confirmPublishOpen}
        post={post}
        onClose={() => setConfirmPublishOpen(false)}
        onConfirm={async () => {
          await publishPostToAllPages(post.id);
        }}
      />
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
  open,
}: {
  post: Post;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  open: boolean;
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[320px] p-5">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-center">Confirm Scheduling</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
      </DialogContent>
    </Dialog>
  );
}

/*───────────────────────────────────────────────────────────────────
   ConfirmPublishNowDialog
  ───────────────────────────────────────────────────────────────────*/
function ConfirmPublishNowDialog({
  post,
  onClose,
  onConfirm,
  open,
}: {
  post: Post;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  open: boolean;
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[320px] p-5">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-center">Publish Now?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
      </DialogContent>
    </Dialog>
  );
}

/*───────────────────────────────────────────────────────────────────
   A simple read-only updatedAt cell
  ───────────────────────────────────────────────────────────────────*/
export function UpdateDateCell({ post }: { post: Post }) {
  const d = post.updatedAt ? new Date(post.updatedAt) : null;
  const display = d ? formatDateTime(d) : "—";
  return (
    <span className="text-sm text-[#5C5E63] font-normal whitespace-nowrap min-w-[110px] overflow-hidden text-ellipsis">
      {display}
    </span>
  );
}

/*───────────────────────────────────────────────────────────────────
   Helpers
  ───────────────────────────────────────────────────────────────────*/
function formatDateTime(date: Date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = inputDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  const timeStr = format(date, "h:mm aa");
  
  if (diffDays === 0) {
    return `Today, ${timeStr}`;
  } 
  // else if (diffDays === -1) {
  //   return `Yesterday, ${timeStr}`;
  // } 
  // else if (diffDays === 1) {
  //   return `Tomorrow, ${timeStr}`;
  // } 
  else {
    return format(date, "MMM dd, h:mm aa");
  }
}
