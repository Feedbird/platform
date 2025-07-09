"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormatBadge } from "@/components/content/shared/content-post-ui";

/**
 * Example formats from your code: 
 * "static", "carousel", "story", "video", "email"
 */
const formats = ["static", "carousel", "story", "video", "email", "blog"] as const;

export function FormatSelectPopup({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose?: () => void;
}) {
  return (
    <div className="p-2 w-[140px] flex flex-col gap-1">
      {formats.map((f) => (
        <Button
          key={f}
          variant="ghost"
          className={cn(
            "justify-start p-0",
            f === value
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted/50"
          )}
          size="sm"
          onClick={() => {
            onChange(f);
            onClose?.();
          }}
        >
          <FormatBadge kind={f} widthFull={false} />
        </Button>
      ))}
    </div>
  );
}
