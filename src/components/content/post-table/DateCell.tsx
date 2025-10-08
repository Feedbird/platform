"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Post } from "@/lib/store/use-feedbird-store";
import { storeApi } from "@/lib/api/api-service";
import { format } from "date-fns";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { Plus, X, ChevronDown, Send, Clock4 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
  const savedDate = post.publish_date ? new Date(post.publish_date) : undefined;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [showPostingPanel, setShowPostingPanel] = useState(false);

  const isScheduled = post.status === "Scheduled";
  const isApproved = post.status === "Approved";
  const isPublished = post.status === "Published";
  const isFailedPublishing = post.status === "Failed Publishing";
  const hasDate = !!savedDate;

  // Set display text based on status
  let displayText: string;
  if (isPublished) {
    displayText = "Published";
  } else if (isFailedPublishing) {
    displayText = "Failed Publishing";
  } else {
    displayText = hasDate ? formatDateTime(savedDate!) : "No time is set yet";
  }

  // Helper functions to get styling based on status
  const getStatusStyling = () => {
    if (isPublished) {
      return {
        backgroundColor: "#E5EEFF",
        borderColor: "rgba(28, 29, 31, 0.05)",
        iconSrc: "/images/status/published.svg",
        textColor: "#1C1D1F"
      };
    } else if (isFailedPublishing) {
      return {
        backgroundColor: "#F5EEFF",
        borderColor: "#EAE4F4",
        iconSrc: "/images/status/failed-publishing.svg",
        textColor: "#1C1D1F"
      };
    } else {
      return {
        backgroundColor: "#E5EEFF",
        borderColor: "rgba(28, 29, 31, 0.05)",
        iconSrc: "/images/columns/post-time.svg",
        textColor: "#133495"
      };
    }
  };

  const statusStyling = getStatusStyling();

  // Board rule: auto-schedule on?
  const activeWorkspace = useFeedbirdStore((s) => s.getActiveWorkspace());
  const activeBoardId = useFeedbirdStore((s) => s.activeBoardId);
  const currentBoard = React.useMemo(
    () => activeWorkspace?.boards.find((b) => b.id === activeBoardId),
    [activeWorkspace, activeBoardId]
  );
  const isAutoScheduleOn = !!currentBoard?.rules?.autoSchedule;
  const showSwitchInsteadOfIcon = isAutoScheduleOn && hasDate && !isPublished && !isFailedPublishing;

  // Tooltip text depending on state
  const tooltipLabel = React.useMemo(() => {
    if (!hasDate) return "Select publish time";
    if (isScheduled) return `Scheduled: ${displayText}`;
    if (isPublished) return `Published: ${displayText}`;
    if (isFailedPublishing) return `Failed publishing: ${displayText}`;
    return "Edit publish time";
  }, [hasDate, isScheduled, isPublished, isFailedPublishing, displayText]);

  // We'll open separate dialogs for scheduling vs publishing
  const [confirmScheduleOpen, setConfirmScheduleOpen] = useState(false);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);

  // Access your store's publish method
  const publishPostToAllPages = useFeedbirdStore((s) => s.publishPostToAllPages);

  /* ---------- Actions ---------- */
  async function handleAutoSchedule() {
    const nextStatus = post.status === "Approved" ? "Scheduled" : post.status;
    await storeApi.autoScheduleAndUpdateStore(post.id, nextStatus as any);
    setPopoverOpen(false);
  }

  function handleUnschedule() {
    // If it was scheduled, move to Approved; otherwise remain original status.
    const nextStatus = post.status === "Scheduled" ? "Approved" : post.status;
    updatePost(post.id, { status: nextStatus, publish_date: null });
  }

  const handleSwitchToggle = (checked: boolean) => {
    if (checked)
      return;
    handleUnschedule();
  };

  useEffect(() => {
    if (!popoverOpen) setShowSelector(false);
  }, [popoverOpen]);

  return (
    <div className="group/cell flex items-center justify-between w-full px-2 py-[6px]">
      {/* Date text + popover trigger */}
      <div className="flex items-center w-full min-w-0 max-w-full">
        <div className="flex-1 min-w-0">
          {/* Date/time popover - only if not scheduled/published/failed publishing */}
          {!isPublished && !isFailedPublishing ? (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <div className="cursor-pointer" style={{ width: "fit-content" }}>
                        {hasDate ? (
                          /* If has time but not scheduled: show chip style with calendar icon + time */
                          <div className="flex flex-row items-center gap-1 rounded-[4px]" style={{
                            padding: "1px 6px 1px 4px",
                            border: `1px solid #1C1D1F0D`,
                            backgroundColor: "#E5EEFF",
                            width: "fit-content"
                          }}>
                            <div
                              className="px-0.5"
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                              onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                              onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                            >
                              <Switch
                                checked={!!post.publish_date}
                                onCheckedChange={handleSwitchToggle}
                                className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3"
                                icon={
                                  <span className="flex items-center justify-center w-full h-full">
                                    <img
                                      src="/images/boards/stars-01.svg"
                                      alt="star"
                                      className="w-2.5 h-2.5"
                                    />
                                  </span>
                                }
                              />
                            </div>
                            <span className="text-xs text-[#133495] font-semibold whitespace-nowrap" style={{
                              lineHeight: "18px",
                            }}>{displayText}</span>
                          </div>
                        ) : (
                          // If no time set
                          isApproved ? (
                            // Approved + no date: plain text with chevron, no bg/image
                            <div className="flex flex-row items-center gap-1 cursor-pointer">
                              <span className="text-xs text-[#5C5E63] font-medium">No time is set yet</span>
                              <ChevronDown className="w-3 h-3 text-[#5C5E63]" />
                            </div>
                          ) : (
                            <div className="flex flex-row items-center gap-1 w-full cursor-pointer">
                              <div className={cn(
                                (popoverOpen ? "flex" : "hidden group-hover/cell:flex"),
                                "flex-row items-center gap-1 rounded-[4px] bg-white border border-elementStroke",
                              )} style={{
                                padding: "3px 6px 3px 4px",
                              }}>
                                <div className="flex flex-row items-center justify-center w-3.5 h-3.5 rounded-[2px] bg-[#F5EEFF]">
                                  <Clock4 className={cn(
                                    "w-2.5 h-2.5 text-[#A064F5]",
                                  )} />
                                </div>
                                <span className="text-xs text-black font-medium">Select time</span>
                              </div>

                              {/* display publish now button */}
                              {/* <div
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setConfirmPublishOpen(true); }}
                                className={cn(
                                  "flex flex-row items-center gap-1 rounded-[4px] bg-white border border-elementStroke",
                                )} style={{
                                  padding: "3px 6px 3px 4px",
                                }}>
                                <div className="flex flex-row items-center justify-center w-3.5 h-3.5 rounded-[2px] bg-[#E6F3EB]">
                                  <Send className={cn(
                                    "w-2.5 h-2.5 text-[#03985C]",
                                  )} />
                                </div>
                                <span className="text-xs text-black font-medium">Publish Now</span>
                              </div> */}
                            </div>
                          )
                        )}
                      </div>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-[#151515] text-white border-none text-xs whitespace-nowrap">
                    {tooltipLabel}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <PopoverContent
                align={(hasDate || showSelector || showPostingPanel) ? "end" : "center"}
                side="bottom"
                sideOffset={6}
                avoidCollisions
                className={cn(
                  (hasDate || showSelector || showPostingPanel)
                    ? "p-0 border-none bg-transparent max-w-[90vw]"
                    : "w-auto min-w-[250px]"
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
                    onBack={() => setShowPostingPanel(false)}
                    onSave={(tz, slots) => {
                      updatePost(post.id, {
                        timezone: tz,
                        postingSlots: slots,
                      } as any);
                      setShowPostingPanel(false);
                    }}
                  />
                ) : !hasDate && !showSelector ? (
                  <div>
                    {/* Auto Schedule */}
                    <div
                      className="px-[10px] py-[8px] cursor-pointer gap-[2px] hover:bg-gray-100 rounded"
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
                      className="px-[10px] py-[8px] cursor-pointer hover:bg-gray-100 rounded"
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

                    {/* Change workspace Time Zone & Allowed Posting Time */}
                    <div
                      className="px-[10px] py-[8px] cursor-pointer hover:bg-gray-100 rounded"
                      onClick={() => {
                        setShowPostingPanel(true);
                        setShowSelector(false);
                      }}
                    >
                      <div className="flex items-center gap-[6px]">
                        <Image
                          src={"/images/columns/updated-time.svg"}
                          alt="Allowed posting time"
                          width={14}
                          height={14}
                        />
                        <div className="text-sm font-medium text-black">Time Zone & Posting Times</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <DateTimeSelector
                    post={post}
                    allPosts={allPosts}
                    onClose={() => {
                      setPopoverOpen(false);
                      setShowSelector(false);
                    }}
                    onSchedule={(d) => {
                      updatePost(post.id, {
                        publish_date: d,
                        status: post.status === "Approved" ? "Scheduled" : post.status,
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
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col">
                    <div className="flex flex-row items-center gap-1 rounded-[4px]" style={{
                      padding: "2px 6px 2px 3px",
                      border: `1px solid ${statusStyling.borderColor}`,
                      backgroundColor: statusStyling.backgroundColor,
                      width: "fit-content"
                    }}>
                      <Image
                        src={statusStyling.iconSrc}
                        alt="Publish Date"
                        width={16}
                        height={16}
                      />
                      <span className="text-xs font-semibold whitespace-nowrap">{displayText}</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-[#151515] text-white border-none text-xs whitespace-nowrap">
                  {tooltipLabel}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      {hasDate && !isPublished && !isFailedPublishing && (
        <div className="flex flex-row gap-2 flex-shrink-0 opacity-0 group-hover/cell:opacity-100 focus-within:opacity-100 pointer-events-none group-hover/cell:pointer-events-auto transition-opacity">
          {/* Unschedule */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="border border-border-button rounded-[6px] p-1 text-[#EC5050] cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={handleUnschedule}
                >
                  <X className="w-4 h-4" />
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
          if (post.publish_date) {
            await publishPostToAllPages(post.id, new Date(post.publish_date));
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
  const workspace = useFeedbirdStore((s) => s.getActiveWorkspace());
  const dt = post.publish_date ? formatDateTime(new Date(post.publish_date)) : "(none)";

  // Get the actual pages for post.pages
  const selectedPages: SocialPage[] =
    workspace?.socialPages?.filter((pg) => post.pages.includes(pg.id)) ?? [];

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
  const workspace = useFeedbirdStore((s) => s.getActiveWorkspace());
  const dt = format(new Date(), "MMM dd, yyyy 'at' h:mm aa");

  // Get the actual pages for post.pages
  const selectedPages: SocialPage[] =
    workspace?.socialPages?.filter((pg) => post.pages.includes(pg.id)) ?? [];

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
      <DialogContent className="w-[400px] p-5">
        <DialogHeader>
          <DialogTitle className="text-base text-black font-semibold text-center">Publish Now?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            {/* Show pages + icon cluster */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-darkGrey">Pages:</span>
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
              <span className="font-medium text-sm text-darkGrey">Current date/time: {dt} </span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              className="bg-main hover:bg-main/90 text-white cursor-pointer"
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
    <span className="text-xs text-[#5C5E63] font-normal whitespace-nowrap min-w-[110px] overflow-hidden text-ellipsis">
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
