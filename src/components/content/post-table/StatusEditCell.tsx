"use client";
import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";

import { StatusChip } from "@/components/content/shared/content-post-ui";
import { StatusSelectPopup } from "./StatusSelectPopup";
import { Status } from "@/lib/store/use-feedbird-store";
import { cn } from "@/lib/utils";

interface StatusEditCellProps {
  value: string;
  onChange: (v: string) => void;

  /* focus-manager (injected from <FocusCell>) */
  isFocused?: boolean;
  isEditing?: boolean;
  enterEdit?: () => void;
  exitEdit?: () => void;
}

export function StatusEditCell({
  value,
  onChange,
  isFocused,
  isEditing,
  enterEdit,
  exitEdit,
}: StatusEditCellProps) {
  /** Popover is fully *controlled* by the “editing” flag coming
      from <FocusCell>. */
  const open = !!isEditing;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        /* If the user closes the popover (click outside / ESC)
           we drop back to “focused” but not editing.             */
        if (o) enterEdit?.();
        else   exitEdit?.();
      }}
    >
      {/* main cell ---------------------------------------------------- */}
      <PopoverTrigger asChild>
        <div
          /* 1st click → FocusCell gives focus ring.
             2nd click (while focused) → FocusCell toggles `inEdit`,
             so we do not need to call enterEdit() ourselves here.    */
          className="inline-flex items-center pl-2 cursor-pointer w-full overflow-x-hidden
        overflow-y-hidden"
        >
          <StatusChip status={value as Status} widthFull={false} />

          {/* little chevron appears only while the cell is focused
              *and* not yet in edit mode, signalling “click again”. */}
          {isFocused && (
            <ChevronDownIcon
              className={cn("ml-1 h-4 w-4 text-muted-foreground")}
            />
          )}
        </div>
      </PopoverTrigger>

      {/* dropdown ----------------------------------------------------- */}
      <PopoverContent className="p-0 w-auto">
        <StatusSelectPopup
          value={value}
          onChange={(newVal) => {
            // onChange(newVal);
            exitEdit?.();          // close + leave edit mode
          }}
          onClose={() => exitEdit?.()}
        />
      </PopoverContent>
    </Popover>
  );
}
