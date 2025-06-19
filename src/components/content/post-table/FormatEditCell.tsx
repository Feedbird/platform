"use client";
import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { FormatBadge } from "@/components/content/shared/content-post-ui";
import { FormatSelectPopup } from "./FormatSelectPopup";
import { cn } from "@/lib/utils";

interface FormatEditCellProps {
  value: string;
  onChange: (v: string) => void;

  /* injected by <FocusCell> */
  isFocused?: boolean;
  isEditing?: boolean;
  enterEdit?: () => void;
  exitEdit?: () => void;
}

export function FormatEditCell({
  value,
  onChange,
  isFocused,
  isEditing,
  enterEdit,
  exitEdit,
}: FormatEditCellProps) {
  /** Popover visibility is driven entirely by `isEditing` */
  const open = !!isEditing;

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
            <div className="flex-shrink-0">
              <FormatBadge kind={value} widthFull={false} />
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
