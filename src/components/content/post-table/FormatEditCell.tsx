"use client";
import * as React from "react";
import { ChevronDownIcon, Plus } from "lucide-react";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { FormatBadge } from "@/components/content/shared/content-post-ui";
import { FormatSelectPopup } from "./FormatSelectPopup";
import { cn } from "@/lib/utils";

interface FormatEditCellProps {
  value: string;
  onChange: (v: string) => void;
  rowIndex: number;
  onFillStart?: (v: string, startIdx: number) => void;

  /* injected by <FocusCell> */
  isFocused?: boolean;
  isEditing?: boolean;
  enterEdit?: () => void;
  exitEdit?: () => void;
}

export function FormatEditCell({
  value,
  onChange,
  rowIndex,
  onFillStart,
  isFocused,
  isEditing,
  enterEdit,
  exitEdit,
}: FormatEditCellProps) {
  /** Popover visibility is driven entirely by `isEditing` */
  const open = !!isEditing;
  const hasValue = Boolean(value);

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
            "cursor-pointer inline-flex items-center w-full h-full overflow-hidden px-[8px] py-[6px]",
            "hover:opacity-90"
          )}
          /* first click gives focus (handled by <FocusCell>);
             second click toggles `isEditing` (also handled there) */
        >
          <div className="flex items-center flex-nowrap min-w-0">
            {hasValue ? (
              <div className="flex-shrink-0">
                <FormatBadge kind={value} widthFull={false} />
              </div>
            ) : (
              <div
                className="flex flex-row items-center gap-1 rounded-[4px] bg-white"
                style={{
                  padding: "3px 6px 3px 4px",
                  boxShadow: "0px 0px 0px 1px #D3D3D3",
                }}
              >
                <div className="flex flex-row items-center p-[1px] rounded-[3px] bg-[#E6E4E2]">
                  <Plus className="w-3 h-3 text-[#5C5E63]" />
                </div>
                <span className="text-xs text-[#5C5E63] font-semibold">Select format</span>
              </div>
            )}
          </div>

          {/* Fill handle */}
          {isFocused && !isEditing && (
            <div
              className="absolute w-[8px] h-[8px] bg-[#FFF] cursor-crosshair"
              style={{
                right: "-3px",
                bottom: "-3px",
                border: "1px solid #125AFF",
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onFillStart?.(value, rowIndex);
              }}
            />
          )}

          {/* show chevron only while focused & not editing and has value */}
          {isFocused && hasValue && (
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
        <FormatSelectPopup
          value={value}
          onChange={(newVal) => {
            onChange(newVal);  // propagate to parent/table
            exitEdit?.();      // close + leave edit mode
          }}
          onClose={() => exitEdit?.()}
        />
      </PopoverContent>
    </Popover>
  );
}
