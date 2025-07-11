"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/components/content/shared/content-post-ui";
import { Status } from "@/lib/store/use-feedbird-store";

/**
 * The new status names (8 total).
 * If the user picks "Status" or "Failed Publishing," etc.
 */
const statuses = [
  "Draft",
  "Pending Approval",
  "Needs Revisions",
  "Revised",
  "Approved",
  "Scheduled",
  "Published",
  "Failed Publishing",
];

export function StatusSelectPopup({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose?: () => void;
}) {
  return (
    <div className="w-full flex flex-col rounded-[6px] border border-[1px] border-[#EAECF0] gap-1 pb-1">
      {/* Selected chip (no close button) */}
      <div
        className="flex items-center gap-1 flex-wrap p-2 bg-[#F8F8F8] border-b"
        style={{ borderColor: "#E6E4E2" }}
      >
        <StatusChip status={value as Status} widthFull={false} />
      </div>

      {/* Label */}
      <div className="px-2 pt-1 pb-1 text-sm font-semibold text-black">
        Select Status
      </div>

      {/* Status options */}
      <div className="flex flex-col px-2">
        {statuses.map((st) => (
          <Button
            key={st}
            variant="ghost"
            className={cn(
              "justify-start p-0 rounded-none",
              st === value ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
            )}
            size="sm"
            onClick={() => {
              onChange(st);
              onClose?.();
            }}
          >
            <StatusChip status={st as Status} widthFull={false} />
          </Button>
        ))}
      </div>
    </div>
  );
}
