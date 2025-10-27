"use client";

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface UserDateCellProps {
  value: string;
  isFocused?: boolean;
  isEditing?: boolean;
  enterEdit?: () => void;
  exitEdit?: () => void;
  onChange: (newValue: string) => void;
}

export function UserDateCell({
  value,
  isFocused,
  isEditing,
  enterEdit,
  exitEdit,
  onChange,
}: UserDateCellProps) {
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [isCalendarInteracting, setIsCalendarInteracting] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(() => {
    if (!value) return undefined;
    try {
      // Try to parse as ISO string first, then as regular date string
      const parsed = parseISO(value);
      return isValid(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  });

  // Update selectedDate when value changes
  React.useEffect(() => {
    if (!value) {
      setSelectedDate(undefined);
      return;
    }
    try {
      const parsed = parseISO(value);
      if (isValid(parsed)) {
        setSelectedDate(parsed);
      }
    } catch {
      // Keep existing selectedDate if parsing fails
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    setSelectedDate(date);
    // Store as ISO string for consistent database storage
    const isoString = format(date, "yyyy-MM-dd");
    onChange(isoString);
    setCalendarOpen(false);
    setIsCalendarInteracting(false);
    exitEdit?.();
  };

  const handleDoubleClick = () => {
    if (isFocused) {
      enterEdit?.();
      setCalendarOpen(true);
    }
  };

  const displayValue = React.useMemo(() => {
    if (!selectedDate) return "";
    try {
      return format(selectedDate, "MMM dd, yyyy");
    } catch {
      return "";
    }
  }, [selectedDate]);

  const open = !!isEditing && calendarOpen;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        // Don't close if we're interacting with the calendar
        if (!o && isCalendarInteracting) {
          return;
        }
        setCalendarOpen(o);
        if (!o) {
          exitEdit?.();
        }
      }}
    >
      <PopoverTrigger asChild>
        <div
          className={cn(
            "cursor-pointer inline-flex items-center w-full h-full overflow-hidden px-[8px] py-[6px]",
            "hover:opacity-90"
          )}
          onDoubleClick={handleDoubleClick}
        >
          {value && selectedDate ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#111827] font-normal">
                {displayValue}
              </span>
            </div>
          ) : (
            <div
              className="flex flex-row items-center gap-1 rounded-[4px] bg-white"
              style={{ padding: "3px 6px 3px 4px", boxShadow: "0px 0px 0px 1px #D3D3D3" }}
            >
              <div className="flex flex-row items-center p-[1px] rounded-[3px] bg-[#E6E4E2]">
                <Plus className="w-3 h-3 text-[#5C5E63]" />
              </div>
              <span className="text-xs text-[#5C5E63] font-semibold">Select date</span>
            </div>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-auto !z-[9999]"
        align="start"
        side="bottom"
        sideOffset={6}
        style={{ zIndex: 9999 }}
      >
        <div className="p-3 bg-white rounded-lg border shadow-lg">
          <div
            onMouseDown={() => setIsCalendarInteracting(true)}
            onMouseUp={() => setTimeout(() => setIsCalendarInteracting(false), 100)}
            onClick={(e) => e.stopPropagation()}
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="w-full mx-auto text-sm"
              classNames={{
                day_today: "bg-[#EDF0FF] rounded-full",
                day_selected: "bg-[#4D3AF1] rounded-full text-white",
                day: "h-8 w-8 text-sm p-0",
                nav_button: "h-7 w-7 [&>svg]:pointer-events-none flex items-center justify-center",
                nav: "[&>button]:pointer-events-auto flex items-center",
                caption: "flex justify-center relative items-center w-full h-8",
                caption_label: "text-sm font-medium flex items-center justify-center h-full",
                nav_button_previous: "absolute left-1 top-1/2 -translate-y-1/2",
                nav_button_next: "absolute right-1 top-1/2 -translate-y-1/2",
              }}
              components={{
                IconLeft: ({ ...props }) => (
                  <ChevronLeft
                    className="size-4"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsCalendarInteracting(true);
                    }}
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      setTimeout(() => setIsCalendarInteracting(false), 100);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                ),
                IconRight: ({ ...props }) => (
                  <ChevronRight
                    className="size-4"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsCalendarInteracting(true);
                    }}
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      setTimeout(() => setIsCalendarInteracting(false), 100);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                ),
              }}
            />
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCalendarOpen(false);
                setIsCalendarInteracting(false);
                exitEdit?.();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDate(undefined);
                onChange("");
                setCalendarOpen(false);
                setIsCalendarInteracting(false);
                exitEdit?.();
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default UserDateCell;
