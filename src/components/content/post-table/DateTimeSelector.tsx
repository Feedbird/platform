"use client";

import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Post } from "@/lib/store";
import { getSuggestedSlots } from "@/lib/scheduling/getSuggestedSlots";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  post: Post;
  allPosts: Post[];
  onClose: () => void;
  onSchedule: (date: Date) => void;
  onPublishNow: () => void;
}

export const DateTimeSelector: React.FC<Props> = ({ post, allPosts, onClose, onSchedule, onPublishNow }) => {
  const suggestions = React.useMemo(() => getSuggestedSlots(post, allPosts, 8), [post, allPosts]);

  const [selection, setSelection] = React.useState<
    | { type: "publishNow" }
    | { type: "slot"; date: Date }
    | { type: "custom"; date: Date; time: string }
    | null
  >(null);

  /* ----------------------- custom date/time state ----------------------- */
  const [customDate, setCustomDate] = React.useState<Date>(new Date());
  const [customTime, setCustomTime] = React.useState<string>("09:00");

  /* Half-hour time options */
  const timeOptions = React.useMemo(() => {
    const items: { label: string; value: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 15, 30, 45]) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        items.push({ label: format(new Date(2020, 0, 1, h, m), "h:mm aa"), value: `${hh}:${mm}` });
      }
    }
    return items;
  }, []);

  /* --------------------------- helpers --------------------------- */
  const isPublishNow = selection?.type === "publishNow";

  function handleMainAction() {
    if (!selection) return;

    if (selection.type === "publishNow") {
      onPublishNow();
      onClose();
    } else if (selection.type === "slot") {
      onSchedule(selection.date);
      onClose();
    } else if (selection.type === "custom") {
      const [hh, mm] = selection.time.split(":" ).map(Number);
      const d = new Date(selection.date);
      d.setHours(hh, mm, 0, 0);
      onSchedule(d);
      onClose();
    }
  }

  /* --------------------------- render --------------------------- */
  return (
    <div
      style={{
        display: "flex",
        width: "min(520px, 90vw)",
        flexDirection: "column",
        alignItems: "flex-start",
        borderRadius: 8,
        border: "1px solid #E6E4E2",
        background: "#FFF",
        boxShadow:
          "0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)",
      }}
    >
      {/* content row */}
      <div style={{ display: "flex", width: "100%" }}>
        {/* Left */}
        <div
          style={{
            display: "flex",
            padding: 16,
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 16,
            flex: 1,
          }}
        >
          {/* header */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <img
              src="/images/publish/auto-schedule.svg"
              alt="Calendar"
              width={14}
              height={14}
            />
            Custom Date
          </div>
          {/* today shortcut */}
          <button
            onClick={() => {
              const today = new Date();
              setCustomDate(today);
              setSelection({ type: "custom", date: today, time: customTime });
            }}
            style={{
              display: "flex",
              padding: "8px 12px",
              alignItems: "center",
              gap: 8,
              alignSelf: "stretch",
              borderRadius: 6,
              border: "1px solid #D3D3D3",
              background: "#FFF",
              boxShadow: "0px 1px 2px -1px rgba(7, 10, 22, 0.02)",
              fontSize: 13,
              fontWeight: 500,
              lineHeight: "16px",
            }}
          >
            Today
          </button>
          {/* calendar */}
          <Calendar
            mode="single"
            selected={customDate}
            onSelect={(d) => {
              if (!d) return;
              setCustomDate(d);
              setSelection({ type: "custom", date: d, time: customTime });
            }}
            className="w-full mx-auto text-sm"
            classNames={{
              day_today: "bg-[#EDF0FF] rounded-full",
              day_selected: "bg-[#4D3AF1] rounded-full text-white",
              day: "h-8 w-8 text-sm p-0",
              nav_button: "h-8 w-8",
            }}
          />
          {/* time select */}
          <Select
            value={customTime}
            onValueChange={(v) => {
              setCustomTime(v);
              setSelection({ type: "custom", date: customDate, time: v });
            }}
          >
            <SelectTrigger 
              className="flex items-center gap-2 w-full cursor-pointer hover:bg-gray-50 text-sm h-9 border"
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #D3D3D3",
                background: "#FFF",
                boxShadow: "0px 1px 2px -1px rgba(7, 10, 22, 0.02)",
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[180px] w-full min-w-[140px]">
              {timeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-sm h-8">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right */}
        <div
          style={{
            display: "flex",
            padding: "16px 0px",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 12,
            width: "clamp(160px, 35%, 200px)",
            borderLeft: "1px solid #E6E4E2",
          }}
        >
          <div
            className="flex items-center justify-center gap-2 w-full"
            style={{
              color: "#8451BF",
              fontSize: 13,
              fontWeight: 500,
              lineHeight: "16px",
              letterSpacing: "-0.26px",
              whiteSpace: "nowrap",
            }}
          >
            <img
              src="/images/publish/magic.svg"
              alt="Time Recommendation"
              width={14}
              height={14}
            />
            Time Recommendation
          </div>
          {/* suggested list (Publish Now + dynamic slots) */}
          <div
            className="overflow-y-auto w-full"
            style={{
              display: "flex",
              padding: "0px 8px",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 4,
              alignSelf: "stretch",
            }}
          >
            {/* Publish Now item */}
            <div
              className={cn(
                "cursor-pointer text-sm flex items-center w-full",
                selection?.type === "publishNow" ? "bg-primary text-white" : "hover:bg-gray-100"
              )}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                width: "100%",
              }}
              onClick={() => setSelection({ type: "publishNow" })}
            >
              Publish Now
            </div>
            {suggestions.map((s, idx) => {
              const formatted = `${format(s.date, "d EEEE")}, ${format(s.date, "ha").toLowerCase()}`;
              const isSel = selection?.type === "slot" && selection.date.getTime() === s.date.getTime();
              return (
                <div
                  key={idx}
                  className={cn(
                    "cursor-pointer text-sm flex items-center",
                    isSel ? "bg-primary text-white" : "hover:bg-gray-100"
                  )}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    width: "100%",
                  }}
                  onClick={() => setSelection({ type: "slot", date: s.date })}
                >
                  {formatted}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div
        className="flex items-center justify-between"
        style={{
          display: "flex",
          padding: "12px 16px",
          alignItems: "flex-start",
          gap: 12,
          alignSelf: "stretch",
          width: "100%",
          borderTop: "1px solid #E6E4E2",
        }}
      >
        <button
          onClick={onClose}
          style={{
            display: "flex",
            height: 36,
            padding: "8px 16px",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            borderRadius: 6,
            border: "1px solid #D3D3D3",
            background: "#FFF",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
          className="hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleMainAction}
          disabled={!selection}
          style={{
            display: "flex",
            padding: "8px 16px",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            borderRadius: 6,
            border: "1px solid rgba(28,29,31,0.10)",
            background: "#125AFF",
            color: "#FFFFFF",
            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            fontSize: 13,
            fontWeight: 500,
            opacity: selection ? 1 : 0.5,
            cursor: selection ? "pointer" : "not-allowed",
            transition: "background 0.2s",
          }}
          className={selection ? "hover:bg-[#0F4FE0]" : ""}
        >
          {isPublishNow ? "Publish Now" : "Schedule Post"}
        </button>
      </div>
    </div>
  );
}; 