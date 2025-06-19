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
    <div className="p-2 w-[200px] flex flex-col gap-1">
      {statuses.map((st) => (
        <Button
          key={st}
          variant="ghost"
          className={cn(
            "justify-start p-0",
            st === value
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted/50"
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
  );
}
