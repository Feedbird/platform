"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin, {
  EventDragStartArg,
} from "@fullcalendar/interaction";
import { DurationInput } from "@fullcalendar/core";
import { format } from "date-fns";

import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Archive,
  X,
  Calendar,
} from "lucide-react";

// Toggle import removed as it's not used presently
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DateTimeSelector } from "@/components/content/post-table/DateTimeSelector";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

import { Post, Status } from "@/lib/store/use-feedbird-store";
import { Platform } from "@/lib/social/platforms/platform-types";
import {
  ChannelIcons,
  statusConfig,
} from "@/components/content/shared/content-post-ui";
import { cn, getMonthColor, getBulletColor } from '@/lib/utils'
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { useSidebar } from "@/components/ui/sidebar";
// Reuse existing thumbnail component for consistent video/image preview


/* ------------------------------------------------------------------
   CSS overrides for FullCalendar
   ------------------------------------------------------------------ */
const calendarStyles = `
  .my-toolbar * {
    font-size: 0.85rem !important;
  }

  /* Day-of-week headers smaller, lighter text (we will hide the entire header row) */
  .fc .fc-col-header-cell {
    font-size: calc(0.75rem * var(--calendar-scale, 1));
    font-weight: 400;
    color: #666;
  }

  /* Hide the default day-of-week header row – we will render it inside each cell instead */
  .fc .fc-col-header {
    display: none !important;
  }

  /* All days => white background */
  .fc-day-mon, .fc-day-tue, .fc-day-wed, .fc-day-thu, .fc-day-fri,
  .fc-day-sat, .fc-day-sun {
    background-color: #fff !important;
  }

  /* Past days => light grey */
  .fc-day-past,
  .fc-past {
    background-color: #f2f2f2 !important;
  }

  /* Remove any default highlight for "today" in dayGrid + timeGrid */
  .fc-day-today {
    background: transparent !important;
    border: none !important;
  }
  .fc-timegrid .fc-day-today,
  .fc-timegrid .fc-day-today .fc-timegrid-col-frame {
    background-color: transparent !important;
    border: none !important;
  }

  /* Maintain 169:240 (width:height) scale with 12px padding but without hard-coding exact pixel sizes */
  .fc-daygrid-day-frame {
    position: relative;
    padding: calc(12px * var(--calendar-scale, 1)) !important;
    overflow: visible;
  }

  /* The top-right day number. We'll remove default FC text, do it ourselves. */
  /* No longer using .myDayHeader wrapper – we inject two spans directly */
  .fc .fc-more-popover .fc-popover-body .fc-more-popover-misc .myDayHeader {
    display : none !important;
  }

  .fc-day-past .myDayNumber {
    color: #999;
  }
  .fc-day-today .myDayNumber::before {
    content: "TODAY";
    position: absolute;
    top: -2px;
    right: -6px;
    font-size: 0.55rem;
    background: #c136ff;
    color: #fff;
    padding: 1px 6px;
    border-radius: 9999px;
    transform: translateY(-100%);
  }
  /* Highlight current day number in blue */
  .fc-day-today .dom {
    color: #2563eb; /* Tailwind blue-600 */
  }
  /* Grey color for past days */
  .fc-day-past .dom,
  .dow {
    color: #9ca3af; /* Tailwind gray-400 */
  }

  /* -------------------------------------------------------------
     Event appearance tweaks
     ------------------------------------------------------------------ */
  /* Remove FullCalendar's default blue background & border so only our custom card shows */
  .fc-daygrid-event, .fc-timegrid-event, .fc-event, .fc-h-event {
    background-color: transparent !important;
    border: none !important;
  }

  .fc .fc-daygrid-body-natural .fc-daygrid-day-events {
    margin: 0 !important;
  }

  .fc .fc-daygrid-body-natural .fc-daygrid-day-events:not(:has(a.fc-event))::before {
    content: '';
    display: block;
  }

  /* Allow taller events in compact mode */
  .compact-mode .fc-daygrid-day-events {
    overflow: visible !important;
  }
  .compact-mode .fc-daygrid-event-harness,
  .compact-mode .fc-daygrid-event,
  .compact-mode .fc-event,
  .compact-mode .fc-h-event {
    height: auto !important;
    max-height: none !important;
  }

  
  /* Empty cell aspect ratios for grid consistency */
  .fc-dayGridMonth-view .fc-daygrid-day-events:not(:has(a.fc-event))::before {
    aspect-ratio: 145 / 188;
  }

  .compact-mode .fc-dayGridMonth-view .fc-daygrid-day-events:not(:has(a.fc-event))::before {
    aspect-ratio: 145 / 80;
  }

  .fc-dayGridWeek-view .fc-daygrid-day-events:not(:has(a.fc-event))::before {
    height: calc(100vh - 158px);
  }

  .fc-theme-standard .fc-popover {
    z-index: 3 !important;
  }

  .fc-theme-standard .fc-popover-header {
    background-color : #d1d1d1;
  }

  .fc .fc-more-popover .fc-popover-body{
    background-color : #f9fbfc;    
  }

  /* -------------------------------------------------------------
     Event card styling (visible in calendar grid)
     ------------------------------------------------------------- */
  .my-event-item {
    display: flex;
    background-color: #fff;
    flex-direction: column;
    gap: calc(8px * var(--calendar-scale, 1));
    width: 100%;
    border-radius: calc(6px * var(--calendar-scale, 1));
    aspect-ratio: 145 / 188;
    cursor: pointer;
    border: 1px solid #e5e7eb; /* light border */
    box-shadow: 0 2px 4px rgba(0,0,0,0.12); /* subtle bottom shadow */
    overflow: hidden; /* ensure rounded corners clip children */
    position: relative;
  }
  .my-event-item:hover {
    opacity: 0.95;
  }

  .my-event-item .thumb {
    width: 100%;
    aspect-ratio: 145 / 112;
    background-size: cover;
    background-position: center;
    background-color: #e5e7eb; /* gray placeholder */
    border-radius: calc(6px * var(--calendar-scale, 1));
  }

  .my-event-item .caption-box {
    background-color: #fff;
    border-radius: calc(6px * var(--calendar-scale, 1));
    padding: calc(4px * var(--calendar-scale, 1)) calc(6px * var(--calendar-scale, 1));
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1 1 auto;
  }

 .my-event-item .caption-text {
    font-weight: 500 !important; /* font-medium */
    font-size: calc(0.875rem * var(--calendar-scale, 1)) !important;
    line-height: calc(1.125rem * var(--calendar-scale, 1)) !important; /* tighter line height */
    color: #000 !important;
    display: -webkit-box !important;
    -webkit-box-orient: vertical !important;
    -webkit-line-clamp: 2 !important; /* show exactly two lines */
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    /* Force a consistent two-line block height regardless of title length */
    min-height: calc(2.25rem * var(--calendar-scale, 1)) !important; /* 2 * line-height */
    max-height: calc(2.25rem * var(--calendar-scale, 1)) !important; /* 2 * line-height */
    height: calc(2.25rem * var(--calendar-scale, 1)) !important;        /* 2 * line-height */
    word-break: break-word !important;
    white-space: normal !important; /* ensure text wraps */
  }

  .my-event-item .meta {
    font-size: calc(0.6rem * var(--calendar-scale, 1));
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Platform icon stack overlap */
  .platform-stack > * + * {
    margin-left: calc(-8px * var(--calendar-scale, 1)); /* overlap amount */
  }

  /* Compact specific overlap */
  .my-event-item-compact .platform-stack > * + * {
    margin-left: calc(-6px * var(--calendar-scale, 1));
  }

  /* blue tint for the time icon */
  .time-icon {
    filter: invert(29%) sepia(93%) saturate(2612%) hue-rotate(203deg) brightness(94%) contrast(101%);
    width: calc(14px * var(--calendar-scale, 1)) !important;
    height: calc(14px * var(--calendar-scale, 1)) !important;
  }

  /* Time label text scaling */
  .my-event-item .time-label { 
    font-size: calc(0.875rem * var(--calendar-scale, 1));
  }
  .my-event-item-compact .time-label {
    font-size: calc(0.7rem * var(--compact-scale, var(--calendar-scale, 1)));
  }

  /* Ensure time icon scales in compact card */
  .my-event-item-compact .time-icon {
    width: calc(14px * var(--compact-scale, var(--calendar-scale, 1))) !important;
    height: calc(14px * var(--compact-scale, var(--calendar-scale, 1))) !important;
  }

  /* Format icon scaling */
  .my-event-item .format-icon {
    width: calc(22px * var(--calendar-scale, 1)) !important;
    height: calc(22px * var(--calendar-scale, 1)) !important;
  }
  .my-event-item-compact .format-icon {
    width: calc(16px * var(--compact-scale, var(--calendar-scale, 1))) !important;
    height: calc(16px * var(--compact-scale, var(--calendar-scale, 1))) !important;
  }

  /* Status badge scaling */
  .my-event-item .status-badge {
    padding: calc(4px * var(--calendar-scale, 1)) calc(6px * var(--calendar-scale, 1));
    border-radius: calc(4px * var(--calendar-scale, 1));
  }
  .my-event-item .status-badge img {
    width: calc(14px * var(--calendar-scale, 1)) !important;
    height: calc(14px * var(--calendar-scale, 1)) !important;
  }
  .my-event-item .status-badge span {
    font-size: calc(0.75rem * var(--calendar-scale, 1));
  }

  /* Platform icon sizes */
  .my-event-item .platform-stack img {
    width: calc(24px * var(--calendar-scale, 1)) !important;
    height: calc(24px * var(--calendar-scale, 1)) !important;
  }
  .my-event-item-compact .platform-stack img {
    width: calc(16px * var(--compact-scale, var(--calendar-scale, 1))) !important;
    height: calc(16px * var(--compact-scale, var(--calendar-scale, 1))) !important;
  }

  /* More badge (e.g., 3+) sizing for platform stacks */
  .platform-more-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background-color: #d1d5db; /* gray-300 */
    color: #374151; /* gray-700 */
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }
  .platform-more-badge-lg {
    height: calc(24px * var(--calendar-scale, 1));
    min-width: calc(24px * var(--calendar-scale, 1));
    padding: 0 calc(6px * var(--calendar-scale, 1));
    font-size: calc(0.75rem * var(--calendar-scale, 1));
  }
  .platform-more-badge-sm {
    height: calc(20px * var(--calendar-scale, 1));
    min-width: calc(20px * var(--calendar-scale, 1));
    padding: 0 calc(6px * var(--calendar-scale, 1));
    font-size: calc(0.7rem * var(--calendar-scale, 1));
  }

  /* In compact cards, make +N badge match platform icon size */
  .my-event-item-compact .platform-more-badge {
    height: calc(16px * var(--compact-scale, var(--calendar-scale, 1)));
    min-width: calc(16px * var(--compact-scale, var(--calendar-scale, 1)));
    padding: 0;
    font-size: calc(0.55rem * var(--compact-scale, var(--calendar-scale, 1)));
    line-height: 1;
  }

  /* Play overlay scaling */
  .my-event-item .play-overlay .circle {
    width: calc(32px * var(--calendar-scale, 1));
    height: calc(32px * var(--calendar-scale, 1));
  }
  .my-event-item .play-overlay .triangle {
    border-top-width: calc(6px * var(--calendar-scale, 1));
    border-bottom-width: calc(6px * var(--calendar-scale, 1));
    border-left-width: calc(8px * var(--calendar-scale, 1));
  }

  /* -------------------------------------------------------------
     Compact view event card
     ------------------------------------------------------------- */
  .my-event-item-compact {
    display: flex;
    align-items: stretch;
    width: 100%;
    aspect-ratio: 145 / 48; /* ensures card height scales with width */
    border-radius: calc(6px * var(--compact-scale, var(--calendar-scale, 1)));
    border: 1px solid #e5e7eb;
    background-color: #fff;
    padding: calc(4px * var(--calendar-scale, 1)) calc(4px * var(--calendar-scale, 1));
    gap: calc(8px * var(--calendar-scale, 1));
    cursor: pointer;
    margin-bottom: calc(6px * var(--compact-scale, var(--calendar-scale, 1)));
    box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    overflow: hidden;
  }
  .my-event-item-compact:hover {
    opacity: 0.95;
  }
  .my-event-item-compact .thumb {
    height: 100%;
    aspect-ratio: 1 / 1;
    width: auto;
    flex-shrink: 0;
    align-self: stretch;
    border-radius: calc(4px * var(--compact-scale, var(--calendar-scale, 1)));
    background-size: cover;
    background-position: center;
    background-color: #e5e7eb;
    position: relative;
    overflow: hidden;
  }
  /* Right column fills card height so rows can pin top/bottom */
  .my-event-item-compact .right-col {
    height: 100%;
    align-self: stretch;
  }
  .my-event-item-compact .platform-stack img + img {
    margin-left: -6px;
  }

  /* ------------------------------------------------------------------
     Popover ("more" link) fixes
     ------------------------------------------------------------------ */
  .fc-popover {
    z-index: 1050 !important; /* sit above everything */
    pointer-events: auto !important; /* ensure buttons receive clicks */
  }
  .fc-popover-close {
    cursor: pointer;
  }

  /* ------------------------------------------------------------------
     Day header tweaks (inside each cell)
     ------------------------------------------------------------------ */
  /* Day header styling using FullCalendar's default "day number" anchor */
  .fc .fc-daygrid-day-top {
    padding: calc(4px * var(--calendar-scale, 1)) 0; /* small top padding */
  }

  .fc .fc-daygrid-day-number {
    display: flex !important; /* turn anchor into flex container */
    justify-content: space-between;
    width: 100%;
    font-size: calc(0.7rem * var(--calendar-scale, 1));
    font-weight: 500;
    color: #333;
    text-decoration: none; /* remove default underline */
  }

  /* inside anchor, our injected spans */
  .fc .fc-daygrid-day-number .dow,
  .fc .fc-daygrid-day-number .dom {
    pointer-events: none; /* ensure clicks still hit anchor */
  }
`;

/** Extended data for each event from your Post model */
interface EventProps {
  status: Status;
  platforms: Platform[];
  thumb?: string; // still useful fallback
  format: string;
  month: number;
  block?: import("@/lib/store/use-feedbird-store").Block;
}

/** Convert Post[] -> FC events */
function postsToEvents(posts: Post[]) {
  return posts.map((p) => {
    const start = p.publish_date || undefined;
    const end = start ? new Date(start.getTime() + 1000) : undefined; // +1 s to avoid FC's default 2-hour span

    return {
      id: p.id,
      title: p.caption.default,
      month: p.month,
      start,
      end,
      allDay: false,
      extendedProps: {
        status: p.status,
        platforms: p.platforms,
        block: p.blocks[0],
        thumb: p.blocks[0]?.versions.find(
          (v) => v.id === p.blocks[0].currentVersionId
        )?.file.url,
        format: p.format,
      } as EventProps,
    };
  });
}

/** Example fallback color if no status-based color is found */
function bgColour(status: Status) {
  return statusConfig[status]?.bgColor ?? "#fafafa";
}

export default function CalendarView({
  posts,
  onOpen,
}: {
  posts: Post[];
  onOpen?: (postId: string) => void;
}) {
  const calendarRef = useRef<FullCalendar | null>(null);

  const [viewId, setViewId] = useState("dayGridMonth");
  const [showWeekends, setShowWeekends] = useState(true);
  const [isCompact, setIsCompact] = useState(false);

  // const [titleHTML, setTitleHTML] = useState(""); // Removed unused title state
  const [periodLabel, setPeriodLabel] = useState<string>("");

  // Local "post record" dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<
    (EventProps & { start?: Date }) | null
  >(null);

  // Context menu state for compact cards
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Approximate dropdown width used for edge detection / positioning
  const MENU_WIDTH = 200;

  // When the app sidebar collapses/expands, FullCalendar needs a nudge to recompute widths.
  const { state: sidebarState } = useSidebar();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const api = calendarRef.current?.getApi();
      api?.updateSize();
    }, 240); // align with sidebar transition
    return () => window.clearTimeout(timer);
  }, [sidebarState]);

  // Also listen for the actual CSS width transition end of the sidebar gap
  useEffect(() => {
    const gapEl = document.querySelector('[data-slot="sidebar-gap"]') as HTMLElement | null;
    if (!gapEl) return;
    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'width') return;
      const api = calendarRef.current?.getApi();
      api?.updateSize();
    };
    gapEl.addEventListener('transitionend', onTransitionEnd);
    return () => gapEl.removeEventListener('transitionend', onTransitionEnd);
  }, []);

  // Custom date/time selector dialog state (for compact hover action)
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorEvent, setSelectorEvent] = useState<{
    id: string;
    publish_date?: Date | null;
    platforms: Platform[];
  } | null>(null);

  const openDateSelectorForEvent = (arg: any) => {
    const eprops = arg.event.extendedProps as EventProps;
    setSelectorEvent({
      id: arg.event.id,
      publish_date: (arg.event.start as Date) ?? null,
      platforms: eprops.platforms ?? [],
    });
    setSelectorOpen(true);
  };

  /**
   * Responsive scale factor based on container width.
   * We target ~1200px as the design baseline and scale down to 0.75 at 768px.
   */
  useEffect(() => {
    const root = document.getElementById('calendar-responsive-root');
    if (!root) return;

    const computeScale = (width: number) => {
      const baseline = 1200; // px
      const minScale = 0.6;
      const raw = width / baseline;
      const scale = Math.max(minScale, Math.min(raw, 1));
      return Number.isFinite(scale) ? scale : 1;
    };

    let resizeTimer: number | null = null;

    const applyScaleAndResize = (width: number) => {
      const scale = computeScale(width);
      root.style.setProperty('--calendar-scale', String(scale));

      // Debounce FullCalendar resize to align with sidebar transition (~200ms)
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        const api = calendarRef.current?.getApi();
        if (api) {
          api.updateSize();
        }
      }, 220);
    };

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        applyScaleAndResize(cr.width);
      }
    });
    ro.observe(root);
    // Initial
    applyScaleAndResize(root.clientWidth);
    return () => {
      ro.disconnect();
      if (resizeTimer) window.clearTimeout(resizeTimer);
    };
  }, []);

  // Build FC events from posts
  const events = useMemo(() => postsToEvents(posts), [posts]);

  /** On date range change => parse e.g. "May 2025" => bold "May." */
  function handleDatesSet(arg: any) {
    // Previously updated titleHTML for bold month-year, now unused

    // Compute period range label (e.g., "1 Jun - 30 Jun")
    const startDate: Date = arg.view.activeStart || arg.start || new Date();
    // activeEnd is exclusive – subtract 1 day
    const endExclusive: Date = arg.view.activeEnd || arg.end || new Date();
    const endDate = new Date(endExclusive.getTime() - 1);

    const startFmt = format(startDate, "d MMM");
    const endFmt = format(endDate, "d MMM");
    setPeriodLabel(`${startFmt} - ${endFmt}`);
  }
  function handleDatesSetAndReset(arg: any) {
    handleDatesSet(arg);
  }

  /** Toolbar => prev/next/today */
  function goto(dir: "prev" | "next" | "today") {
    if (!calendarRef.current) return;
    const api = calendarRef.current.getApi();
    if (dir === "today") api.today();
    else if (dir === "prev") api.prev();
    else if (dir === "next") api.next();
  }

  /** Change view (Month, Week, 3 Day, etc.) */
  function handleChangeView(newView: string) {
    setViewId(newView);
    if (!calendarRef.current) return;
    calendarRef.current.getApi().changeView(newView);
  }

  /** Show/hide weekends */
  function handleToggleWeekends(val: string) {
    setShowWeekends(val === "show");
  }

  // Drag-n-drop event
  function handleEventDragStart(arg: EventDragStartArg) {
    /* Reserved for potential future use (e.g. highlighting). */
  }



  /**
   * When a user drags a post to a new date we:
   * 1. Prevent dropping into the past (revert UI & show error).
   * 2. Persist the new date to the global Feedbird store so it is saved.
   */
  function handleEventDrop(arg: any) {
    const newDate = arg.event.start;
    if (!newDate) return;

    // Normalise dates by stripping the time portion so comparisons are by day.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newDate < today) {
      // Reject scheduling in the past
      toast.error("Cannot schedule in the past!");
      arg.revert();
      return;
    }

    // Persist the change to the Zustand store so it's saved (and persisted by the middleware)
    const updatePost = useFeedbirdStore.getState().updatePost;
    updatePost(arg.event.id, {
      publish_date: newDate,
      status: "Scheduled",
    });

    toast.success("Post rescheduled");
  }

  // On event click => open local "post record" modal or call onOpen
  function handleEventClick(arg: any) {
    const eprops = arg.event.extendedProps as EventProps;
    if (onOpen) {
      onOpen(arg.event.id);
      return;
    }
    setDialogData({
      ...eprops,
      start: arg.event.start || undefined,
    });
    setDialogOpen(true);
  }

  // Close local dialog
  function closeDialog() {
    setDialogOpen(false);
    setDialogData(null);
  }

  /**
   * Overlapping channel icons
   */
  function renderOverlappingPlatforms(platforms: Platform[]) {
    return (
      <div className="flex gap-1">
        {platforms.map(platform => (
          <ChannelIcons key={platform} channels={[platform]} />
        ))}
      </div>
    );
  }

  /**
   * We customize the "more" link in dayGrid to say "2+ more" etc.
   * By default, clicking it shows a popover with the hidden events.
   */
  function renderMoreLink(arg: any) {
    return (
      <button onClick={arg.onClick} className="text-sm text-blue-600 underline cursor-pointer">
        {arg.num}+ more
      </button>
    );
  }

  // Reusable action list component (Post Now, Unschedule, Archive)
  const ActionList = ({ onSelectAnotherDate }: { onSelectAnotherDate?: () => void }) => (
    <div className="flex flex-col bg-white rounded-md shadow-lg min-w-[200px] p-2 text-sm">
      <button className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">
        <Send className="w-4 h-4 text-gray-700" />
        Post Now
      </button>
      <button
        className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelectAnotherDate?.();
        }}
      >
        <Calendar className="w-4 h-4 text-gray-700" />
        Select another date
      </button>
      <button className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">
        <X className="w-4 h-4 text-gray-700" />
        Unschedule
      </button>
      <button className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">
        <Archive className="w-4 h-4 text-gray-700" />
        Archive
      </button>
    </div>
  );

  /**
   * Renders each event's content (only "expanded" mode now).
   * We also show a wider popover on hover with:
   * - a single row for time + status
   * - large caption area
   * - action buttons
   */
  function renderEventContent(arg: any) {
    const eprops = arg.event.extendedProps as EventProps;
    const timeLabel = arg.event.start ? format(arg.event.start, "p") : "";

    /* Helper to render up to 5 platform icons, with "+N" overflow */
    const renderPlatforms = (size: "lg" | "sm") => {
      const total = eprops.platforms.length;
      const maxIcons = 5;
      const iconClass = size === "lg" ? "w-6 h-6" : "w-5 h-5";
      const moreBadgeClass = size === "lg" ? "platform-more-badge platform-more-badge-lg" : "platform-more-badge platform-more-badge-sm";
      const displayed = total > maxIcons ? eprops.platforms.slice(0, 4) : eprops.platforms;

      return (
        <>
          {displayed.map((pl) => (
            <img
              key={pl}
              src={`/images/platforms/${pl}.svg`}
              alt={pl}
              className={iconClass}
            />
          ))}
          {total > maxIcons && (
            <span key="more" className={moreBadgeClass}>{total - 4}+</span>
          )}
        </>
      );
    };

    /* -------------------------------------------------------------
       Compact card (listMonth view)
       ------------------------------------------------------------- */
    if (isCompact) {
      // For hover card content details
      const scheduleDisplay = arg.event.start ? format(arg.event.start, "MMMM d, p") : "";
      const monthDisplay = eprops.month;

      return (
        <HoverCard openDelay={100}>
          <HoverCardTrigger asChild>
            <div
              className="my-event-item-compact"
              onClick={() => handleEventClick(arg)}
              onContextMenu={(e) => {
                e.preventDefault();
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const padding = 4;
                const viewportWidth = window.innerWidth;
                const placeRight = rect.right + MENU_WIDTH + padding <= viewportWidth;
                const x = placeRight ? rect.right + padding : rect.left - MENU_WIDTH - padding;
                const y = rect.top + rect.height / 2;

                setContextMenuOpen(false);
                setContextMenuPosition({ x, y });
                requestAnimationFrame(() => setContextMenuOpen(true));
              }}
            >
              {/* Thumbnail */}
              {(() => {
                if (!eprops.block) {
                  return (
                    <div
                      className="thumb"
                      style={{
                        backgroundImage: eprops.thumb ? `url('${eprops.thumb}')` : undefined,
                      }}
                    />
                  );
                }

                const currentVer = eprops.block.versions.find((v) => v.id === eprops.block!.currentVersionId);
                if (!currentVer) {
                  return <div className="thumb" />;
                }

                const isVideo = currentVer.file.kind === "video";

                return (
                  <div className="thumb relative">
                    {isVideo ? (
                      <>
                        <video
                          src={`${currentVer.file.url}?v=${currentVer.id}`}
                          className="absolute inset-0 w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                        {/* Play icon overlay */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden drop-shadow">
                            <svg viewBox="0 0 12 12" className="w-3 h-3 fill-white" style={{ display: "block" }}>
                              <polygon points="4,2 11,6 4,10 4,2" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : (
                      <img
                        src={currentVer.file.url}
                        alt="preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                  </div>
                );
              })()}

              {/* Right side details inside card */}
              <div className="right-col flex flex-col justify-between flex-1">
                <div className="flex items-start gap-1 text-xs">
                  <img
                    src="/images/columns/updated-time.svg"
                    alt="time"
                    className="time-icon w-4 h-4 object-contain"
                  />
                  <span className="time-label text-blue-600 font-medium">{timeLabel}</span>
                </div>
                <div className="flex items-end justify-between mt-auto">
                  <div className="flex platform-stack">{renderPlatforms("sm")}</div>
                  {eprops.format && (
                    <img
                      src={`/images/format/${eprops.format}.svg`}
                      alt={eprops.format}
                      className="format-icon object-contain"
                    />
                  )}
                </div>
              </div>
            </div>
          </HoverCardTrigger>
          {/* <HoverCardContent
            side="right"
            align="center"
            sideOffset={8}
            className="relative p-3 bg-white rounded-md shadow-lg flex gap-2 w-100 justify-between
              after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:w-3 after:h-3 after:bg-white after:rotate-45
              data-[side=right]:after:-left-1.5 data-[side=right]:after:shadow-md
              data-[side=left]:after:-right-1.5"
          >
            <div className="flex flex-col justify-between">
              <div>
                <div className="text-xs font-medium text-gray-500">Schedule</div>
                <div className="flex items-center gap-1 bg-sky-100 rounded px-2 py-0.5 h-5 mt-2">
                  <div className="w-3.5 h-3.5 bg-blue-600 rounded-[3px] flex items-center justify-center">
                    <img
                      src="/images/columns/post-time.svg"
                      alt="calendar"
                      className="w-2.5 h-2.5"
                      style={{ filter: "brightness(0) invert(1)" }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-900 leading-none">{scheduleDisplay}</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500">Socials</div>
                <div className="flex items-center gap-0.5 mt-2">{renderPlatforms("sm")}</div>
              </div>

              {eprops.format && (
              <div>
                <div className="text-xs font-medium text-gray-500">Format</div>
                <div className="inline-flex items-center gap-1 bg-gray-200 rounded-full pl-0.5 pr-2 py-0.5 h-5 mt-2">
                  <img src={`/images/format/${eprops.format}.svg`} alt={eprops.format} className="w-5 h-5" />
                  <span className="text-xs font-semibold text-gray-900 leading-none capitalize">{eprops.format}</span>
                </div>
              </div>
              )}

              <div>
                <div className="text-xs font-medium text-gray-500">Month</div>
                  <div className="flex items-center gap-1 rounded-full py-0.5 h-5 mt-2">
                    <div
                    style={{
                      display: "inline-flex",
                      padding: "2px 8px 2px 8px",
                      alignItems: "center",
                      borderRadius: "100px",
                      border: "1px solid rgba(28, 29, 31, 0.05)",
                      background: getMonthColor(monthDisplay),
                    }}
                    className="text-xs font-semibold text-black flex items-center gap-1"
                  >
                    <span
                      className="w-[6px] h-[6px] rounded-full"
                      style={{ background: getBulletColor(monthDisplay) }}
                    />
                    <span>Month {monthDisplay}</span>
                  </div>
                  </div>
              </div>
            </div>

            <div className="relative w-56 h-56 rounded overflow-hidden shadow">
              {(() => {
                if (!eprops.block) {
                  return (
                    <img
                      src={eprops.thumb}
                      alt="preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  );
                }

                const currentVer = eprops.block.versions.find((v) => v.id === eprops.block!.currentVersionId);
                if (!currentVer) return null;

                const isVideo = currentVer.file.kind === "video";
                if (isVideo) {
                  return (
                    <>
                      <video
                        src={`${currentVer.file.url}?v=${currentVer.id}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                      />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden drop-shadow-md">
                          <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-white" />
                        </div>
                      </div>
                    </>
                  );
                }

                return (
                  <img
                    src={currentVer.file.url}
                    alt="preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                );
              })()}
            </div>
          </HoverCardContent> */}
          <HoverCardContent className="p-0 shadow-lg w-[200px]" side="right" sideOffset={8} align="start">
            <ActionList onSelectAnotherDate={() => openDateSelectorForEvent(arg)} />
          </HoverCardContent>
        </HoverCard>
      );
    }

    /* -------------------------------------------------------------
       Default (month/week) card with hover actions
       ------------------------------------------------------------- */

    // Action list shown on hover is now rendered via the reusable <ActionList /> component

    return (
      <HoverCard openDelay={100}>
        <HoverCardTrigger asChild>
          <div
            className="my-event-item"
            onClick={() => handleEventClick(arg)}
          >
            {/* Status badge overlay – use same colours as table view */}
            <div
              className="absolute top-2 left-2 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm status-badge"
              style={{
                pointerEvents: 'none',
                zIndex: 10,
                backgroundColor: statusConfig[eprops.status].bgColor,
                border: `1px solid ${statusConfig[eprops.status].borderColor}`,
                color: statusConfig[eprops.status].textColor,
              }}
            >
              <img
                src={statusConfig[eprops.status].icon}
                alt={eprops.status}
                className="w-[14px] h-[14px]"
              />
              <span className="text-xs font-semibold leading-none whitespace-nowrap">
                {eprops.status}
              </span>
            </div>

            {/* Media preview area (keeps scale 145:112) */}
            {(() => {
              if (!eprops.block) {
                return (
                  <div
                    className="thumb relative"
                    style={{
                      backgroundImage: eprops.thumb ? `url('${eprops.thumb}')` : undefined,
                    }}
                  >
                    {/* Platform icons overlay */}
                    <div className="absolute left-2 bottom-0 flex platform-stack" style={{ transform: 'translateY(50%)' }}>
                      {renderPlatforms("lg")}
                    </div>
                  </div>
                );
              }

              const currentVer = eprops.block.versions.find(v => v.id === eprops.block!.currentVersionId);
              if (!currentVer) {
                return <div className="thumb" />;
              }

              const isVideo = currentVer.file.kind === 'video';

              return (
                <div className="thumb relative">
                  {isVideo ? (
                    <>
                      <video
                        src={`${currentVer.file.url}?v=${currentVer.id}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                      />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none play-overlay">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden drop-shadow-md circle">
                          <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-white triangle" />
                        </div>
                      </div>
                      {/* Platform icons overlay */}
                      <div className="absolute left-2 bottom-0 flex platform-stack" style={{ transform: 'translateY(50%)' }}>
                        {renderPlatforms("lg")}
                      </div>
                    </>
                  ) : (
                    <>
                      <img src={currentVer.file.url} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                      {/* Platform icons overlay */}
                      <div className="absolute left-2 bottom-0 flex platform-stack" style={{ transform: 'translateY(50%)' }}>
                        {renderPlatforms("lg")}
                      </div>
                     </>
                   )}
                 </div>
               );
               // End custom render
             })()}

            {/* Caption box */}
            <div className="caption-box">
              <div className="caption-text">
                {arg.event.title}
              </div>
              <div className="meta">
                <div className="flex items-center gap-1">
                  <img
                    src="/images/columns/updated-time.svg"
                    alt="time"
                    className="time-icon w-3.5 h-3.5 object-contain"
                  />
                  <span className="time-label text-blue-600 leading-none">{timeLabel}</span>
                </div>
                {eprops.format && (
                <img
                  src={`/images/format/${eprops.format}.svg`}
                  alt={eprops.format}
                  className="format-icon object-contain"
                />
                )}
              </div>
            </div>
          </div>
        </HoverCardTrigger>
        {/* Action list popover */}
        <HoverCardContent className="p-0 shadow-lg w-[200px]" side="right" sideOffset={8} align="start">
          <ActionList onSelectAnotherDate={() => openDateSelectorForEvent(arg)} />
        </HoverCardContent>
      </HoverCard>
    );
  }

  /**
   * Overriding the day cell => place day number top-right, remove default text,
   * apply "past/today" classes for styling.
   */
  function dayCellContent(arg: any) {
    arg.dayNumberText = "";

    const dow = format(arg.date, "EEE"); // e.g., Mon, Tue
    const dayOfMonth = arg.date.getDate();

    let classes: string[] = [];
    if (arg.isPast) classes.push("fc-day-past");
    if (arg.isToday) classes.push("fc-day-today");

    // Inject two spans (dow left, dom right). They will live inside .fc-daygrid-day-top flex
    return {
      html: `<span class="dow">${dow}</span><span class="dom">${dayOfMonth}</span>` ,
      classNames: classes,
    };
  }

  return (
    <div className={cn("w-full flex flex-1 relative h-full", isCompact && "compact-mode")} id="calendar-responsive-root">
      <style>{calendarStyles}</style>

      {/* Custom Date/Time selector dialog for compact hover -> 'Select another date' */}
      <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Select custom date and time</DialogTitle>
          {selectorEvent && (
            <DateTimeSelector
              post={{ id: selectorEvent.id, publish_date: selectorEvent.publish_date as any, platforms: selectorEvent.platforms as any } as Post}
              allPosts={posts}
              onClose={() => setSelectorOpen(false)}
              onSchedule={(d) => {
                const api = calendarRef.current?.getApi();
                const event = api?.getEventById(selectorEvent.id);
                event?.setStart?.(d);
                event?.setEnd?.(new Date(d.getTime() + 1000));
                useFeedbirdStore.getState().updatePost(selectorEvent.id, {
                  publish_date: d,
                  status: "Scheduled",
                });
                setSelectorOpen(false);
              }}
              onPublishNow={() => {
                const publishNow = useFeedbirdStore.getState().publishPostToAllPages as any;
                if (typeof publishNow === 'function') publishNow(selectorEvent.id);
                setSelectorOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>


      <div className="rounded-lg bg-background text-foreground shadow-sm flex flex-col relative overflow-auto min-w-[814px]">
        {/* Top toolbar */}
        <div className="my-toolbar flex flex-col gap-2 md:flex-row md:items-center md:justify-end p-2.5 sticky top-0 z-10 bg-background border-b">
          {/* Left side controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer h-[24px] px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm"
              onClick={() => goto("today")}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-[24px] w-[24px] flex items-center justify-center"
              onClick={() => goto("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {/* Period label */}
            <div className="text-sm font-medium whitespace-nowrap">
              {periodLabel}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-[24px] w-[24px] flex items-center justify-center"
              onClick={() => goto("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Right side view toggles */}
          <div className="flex items-center gap-[4px] p-[2px] bg-[#F4F5F6] rounded-[6px]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleChangeView("dayGridWeek")}
              className={cn(
                'px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px] cursor-pointer',
                viewId === 'dayGridWeek'
                  ? 'bg-white shadow'
                  : ''
              )}
            >
              Week
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleChangeView("dayGridMonth")}
              className={cn(
                'px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px] cursor-pointer',
                viewId === 'dayGridMonth'
                  ? 'bg-white shadow'
                  : ''
              )}
            >
              Month
            </Button>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-sm text-black font-medium">Compact</span>
            <Switch 
              checked={isCompact} 
              onCheckedChange={setIsCompact} 
              className="data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer"
            />
          </div>
        </div>

        {/* FullCalendar instance */}
        <FullCalendar
          ref={(el) => {
            if (el) {
              calendarRef.current = el;
            }
          }}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={viewId}
          // Provide 3-day + 2-week custom views
          views={{
            timeGridThreeDay: {
              type: "timeGrid",
              duration: { days: 3 } as DurationInput,
            },
            dayGridTwoWeeks: {
              type: "dayGrid",
              duration: { weeks: 2 },
            },
          }}
          // Show/hide weekends
          weekends={showWeekends}
          // Provide event data
          events={events}
          // Called when date range changes (so we can parse month-year)
          datesSet={handleDatesSetAndReset}
          // No default header toolbar, we do our custom
          headerToolbar={false}
          // Show actual time in timeGrid views
          displayEventTime
          /* Show all events – no more link */
          dayMaxEventRows={false}
          // For timeGrid, the event is rendered at the correct hour if "allDay=false"
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          // We'll let FullCalendar handle the actual text for the event, but override with eventContent
          eventContent={renderEventContent}
          // We want to show them stacked in dayGrid => no absolute "poker" style
          eventDisplay="block"
          // Keep day cell override
          dayCellContent={dayCellContent}
          // Allow drag-n-drop in the UI
          editable
          eventDragStart={handleEventDragStart}
          eventDrop={handleEventDrop}
          // Layout considerations
          expandRows={viewId === 'dayGridWeek'}
          fixedWeekCount={false}
          height="auto"
          handleWindowResize
          windowResizeDelay={220}
        />
      </div>
    </div>
  );
}
