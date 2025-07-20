"use client";

import React, { useRef, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin, {
  EventDragStartArg,
  EventDragStopArg,
} from "@fullcalendar/interaction";
import { DurationInput } from "@fullcalendar/core";
import { format } from "date-fns";

import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  Send,
} from "lucide-react";

// Toggle import for view mode toggle group
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

import { Post, Status } from "@/lib/store/use-feedbird-store";
import { Platform } from "@/lib/social/platforms/platform-types";
import {
  StatusChip,
  ChannelIcons,
  statusConfig,
} from "@/components/content/shared/content-post-ui";
import { cn }                 from '@/lib/utils'

/* ------------------------------------------------------------------
   CSS overrides for FullCalendar
   ------------------------------------------------------------------ */
const calendarStyles = `
  /* Basic text in the toolbar is smaller */
  .my-toolbar * {
    font-size: 0.85rem !important;
  }

  /* Day-of-week headers smaller, lighter text */
  .fc .fc-col-header-cell {
    font-size: 0.75rem;
    font-weight: 400;
    color: #666;
  }

  /* Monday–Friday => white; Sat/Sun => light grey */
  .fc-day-mon, .fc-day-tue, .fc-day-wed, .fc-day-thu, .fc-day-fri {
    background-color: #fff !important;
  }
  .fc-day-sat, .fc-day-sun {
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

  /* Slight top padding so events appear lower, leaving room for the day label */
  .fc-daygrid-day-frame {
    position: relative;
    height: 120px;
    padding-top: 12px; /* push events down so day number is more visible */
    overflow: visible;
  }

  /* The top-right day number. We'll remove default FC text, do it ourselves. */
  .myDayNumber {
    font-size: 0.7rem;
    color: #333;
  }

  .fc .fc-more-popover .fc-popover-body .fc-more-popover-misc .myDayNumber {
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

  /* ------------------------------------------------------------------
     Event appearance tweaks
     ------------------------------------------------------------------ */
  /* Remove FullCalendar's default blue background & border so only our custom card shows */
  .fc-daygrid-event, .fc-timegrid-event, .fc-event, .fc-h-event {
    background-color: transparent !important;
    border: none !important;
  }

  .fc .fc-daygrid-body-natural .fc-daygrid-day-events {
    margin-top: 1em !important;
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

  /* Our event item styling: white card with shadow and rounded corners */
  .my-event-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 4px 6px;
    border-radius: 6px;
    font-size: 0.7rem;
    cursor: pointer;
    overflow: hidden;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.18);
    color: #000; /* ensure time is black-ish */
  }
  .my-event-item:hover {
    opacity: 0.9;
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
`;

/** Extended data for each event from your Post model */
interface EventProps {
  status: Status;
  platforms: Platform[];
  thumb?: string;
}

/** Convert Post[] -> FC events */
function postsToEvents(posts: Post[]) {
  return posts.map((p) => ({
    id: p.id,
    title: p.caption.default,
    start: p.publishDate || undefined,
    end: p.publishDate || undefined,
    extendedProps: {
      status: p.status,
      platforms: p.platforms,
      thumb: p.blocks[0]?.versions.find(
        (v) => v.id === p.blocks[0].currentVersionId
      )?.file.url,
    } as EventProps,
  }));
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

  // const [titleHTML, setTitleHTML] = useState(""); // Removed unused title state
  const [periodLabel, setPeriodLabel] = useState<string>("");

  // Local "post record" dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<
    (EventProps & { start?: Date }) | null
  >(null);

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
    // optional
  }
  function handleEventDrop(arg: EventDragStopArg) {
    const newDate = arg.event.start;
    if (!newDate) return;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (newDate < now) {
      toast.error("Cannot schedule in the past!");
      return;
    }
    // else update your data store...
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

  /**
   * Renders each event's content (only "expanded" mode now).
   * We also show a wider popover on hover with:
   * - a single row for time + status
   * - large caption area
   * - action buttons
   */
  function renderEventContent(arg: any) {
    const eprops = arg.event.extendedProps as EventProps;
    const bg = bgColour(eprops.status);
    const timeLabel = arg.event.start ? format(arg.event.start, "p") : "";

    // Hover content (popover)
    const hoverContent = (
      <div className="flex flex-col space-y-4 w-[520px] text-xs">
        {/* Row 1: image, (time + status on one row), big caption below */}
        <div className="flex items-start space-x-4">
          {/* Image */}
          <div className="w-24 h-24 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
            {eprops.thumb && (
              <img
                src={eprops.thumb}
                alt="preview"
                className="object-cover w-full h-full"
              />
            )}
          </div>
          {/* Right side: time + status (same row), then caption */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between">
              <div className="font-medium whitespace-nowrap">
                {timeLabel ? timeLabel + " CT" : ""}
              </div>
              <StatusChip status={eprops.status as Status} widthFull={false} />
            </div>
            <div className="mt-2 leading-tight whitespace-pre-wrap">
              {arg.event.title}
            </div>
          </div>
        </div>

        {/* Row 2: action buttons */}
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            className="gap-1 cursor-pointer hover:bg-gray-100"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </Button>
          <Button
            variant="outline"
            className="gap-1 cursor-pointer"
            onClick={() => navigator.clipboard.writeText(arg.event.title)}
          >
            <Copy className="w-3 h-3" />
            Copy
          </Button>
          <Button variant="outline" className="gap-1 cursor-pointer">
            <Send className="w-3 h-3" />
            Post Now
          </Button>
        </div>
      </div>
    );

    // The visible event card in the calendar grid
    return (
      <HoverCard openDelay={100}>
        <HoverCardTrigger asChild>
          <div
            className="my-event-item"
            style={{ backgroundColor: bg }}
            onClick={() => handleEventClick(arg)}
          >
            {/* avatar */}
            {eprops.thumb ? (
              <img
                src={eprops.thumb}
                alt="thumb"
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300" />
            )}
            {/* time */}
            <div className="text-[0.65rem] font-medium whitespace-nowrap">
              {timeLabel}
            </div>
            {/* channels */}
            {renderOverlappingPlatforms(eprops.platforms)}
          </div>
        </HoverCardTrigger>
        {/* Larger popover content */}
        <HoverCardContent className="p-4 shadow-lg w-full" sideOffset={8}>
          {hoverContent}
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
    let classes: string[] = [];
    if (arg.isPast) classes.push("fc-day-past");
    if (arg.isToday) classes.push("fc-day-today");
    return {
      html: `<div class="myDayNumber">${arg.date.getDate()}</div>` ,
      classNames: classes,
    };
  }

  return (
    <div className="w-full flex justify-center relative h-full">
      <style>{calendarStyles}</style>

      <div className="rounded-lg bg-background text-foreground shadow-sm flex flex-col relative">
        {/* Top toolbar */}
        <div className="my-toolbar flex flex-col gap-2 md:flex-row md:items-center md:justify-between p-2.5">
          {/* Left side controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => goto("today")}
            >
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={() => goto("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {/* Period label */}
            <div className="text-sm font-medium whitespace-nowrap">
              {periodLabel}
            </div>
            <Button variant="ghost" size="icon" onClick={() => goto("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Right side view toggles */}
          <div className="flex items-center gap-[4px] p-[2px] bg-[#F4F5F6] rounded-[6px] h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleChangeView("timeGridWeek")}
              className={cn(
                'px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px] cursor-pointer',
                viewId === 'timeGridWeek'
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleChangeView("listMonth")}
              className={cn(
                'px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px] cursor-pointer',
                viewId === 'listMonth'
                  ? 'bg-white shadow'
                  : ''
              )}
            >
              Compact
            </Button>
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
          // Let FullCalendar do a "2+ more" link if day is crowded
          dayMaxEventRows={2}
          moreLinkContent={renderMoreLink}
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
          expandRows={false}
          fixedWeekCount={false}
          height="auto"
        />
      </div>
    </div>
  );
}
