"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MonthEditCellProps {
  value: number;
  onChange: (v: number) => void;

  /* injected by <FocusCell> */
  isFocused?: boolean;
  isEditing?: boolean;
  enterEdit?: () => void;
  exitEdit?: () => void;
}

// Function to generate a unique color for each month
function getMonthColor(month: number): string {
  // Using HSL color space for better color distribution
  const hue = (month * 7) % 360; // Spread colors across the hue spectrum
  return `hsl(${hue}, 70%, 90%)`; // Light pastel colors
}

// Darker variant for the bullet
function getBulletColor(month: number): string {
  const hue = (month * 7) % 360;
  return `hsl(${hue}, 70%, 40%)`;          // same hue, lower lightness
}

export function MonthEditCell({
  value,
  onChange,
  isFocused,
  isEditing,
  enterEdit,
  exitEdit,
}: MonthEditCellProps) {
  /** Popover visibility is driven entirely by `isEditing` */
  const open = !!isEditing;
  const months = Array.from({ length: 50 }, (_, i) => i + 1);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        /* user toggled pop-over: keep <FocusCell> in sync */
        if (o) enterEdit?.();   // opened
        else   exitEdit?.();    // closed
      }}
    >
      {/* -------------- main cell ------------------ */}
      <PopoverTrigger asChild>
        <div
          className={cn(
            "cursor-pointer inline-flex items-center w-full h-full overflow-hidden px-[8px]",
            "hover:opacity-90"
          )}
        >
          <div className="flex items-center flex-nowrap min-w-0">
            <div className="flex-shrink-0">
              <div
                style={{
                  display: "inline-flex",
                  padding: "2px 8px 2px 8px",
                  alignItems: "center",
                  borderRadius: "100px",
                  border: "1px solid rgba(28, 29, 31, 0.05)",
                  background: getMonthColor(value),
                }}
                className="text-xs font-semibold text-black flex items-center gap-1"
              >
                <span
                  className="w-[6px] h-[6px] rounded-full"
                  style={{ background: getBulletColor(value) }}
                />
                <span>Month {value}</span>
              </div>
            </div>
          </div>

          {/* show chevron only while focused & not editing */}
          {isFocused && (
            <ChevronDownIcon
              className="ml-1 h-4 w-4 text-muted-foreground flex-shrink-0"
            />
          )}
        </div>
      </PopoverTrigger>

      {/* -------------- dropdown ------------------- */}
      <PopoverContent
        className="p-0 w-auto"
        /* prevent inside-clicks from bubbling and closing focus early */
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div 
          className="p-2 w-[140px] flex flex-col gap-1"
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "#888 #f1f1f1",
          }}
        >
          {months.map((month) => (
            <Button
              key={month}
              variant="ghost"
              className={cn(
                "justify-start p-0",
                month === value
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/50"
              )}
              size="sm"
              onClick={() => {
                onChange(month);
                exitEdit?.();
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  padding: "2px 8px 2px 8px",
                  alignItems: "center",
                  borderRadius: "100px",
                  border: "1px solid rgba(28, 29, 31, 0.05)",
                  background: getMonthColor(month),
                }}
                className="text-xs font-semibold text-black flex items-center gap-1"
              >
                <span
                  className="w-[6px] h-[6px] rounded-full"
                  style={{ background: getBulletColor(month) }}
                />
                <span>Month {month}</span>
              </div>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}