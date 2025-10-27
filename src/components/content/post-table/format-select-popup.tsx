"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormatBadge } from "@/components/content/shared/content-post-ui";
import { Plus } from "lucide-react";

/**
 * Example formats from your code: 
 * "image", "carousel", "story", "video", "email"
 */
const formats = ["image", "carousel", "story", "video", "email", "blog"] as const;

export function FormatSelectPopup({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose?: () => void;
}) {
  const hasValue = Boolean(value);

  return (
    <div className="w-full flex flex-col rounded-[6px] border border-[1px] border-[#EAECF0] gap-1 pb-1">
      {/* Selected chip with clear button */}
      {hasValue && (
        <div
          className="flex items-center gap-1 flex-wrap p-2 bg-[#F8F8F8] border-b"
          style={{ borderColor: "#E6E4E2" }}
        >
          <div className="relative">
            <FormatBadge kind={value as typeof formats[number]} widthFull={false} />
            {/* clear selection */}
            <button
              className="absolute -top-1 -right-1 bg-[#5C5E63] rounded-full p-[1px] flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange(""); // clear selection
              }}
            >
              <Plus className="w-[10px] h-[10px] rotate-45 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Label */}
      <div className="px-2 pt-1 pb-1 text-sm font-semibold text-black">
        Select Format
      </div>

      {/* Formats list */}
      <div className="flex flex-col px-2">
        {formats.map((f) => (
          <Button
            key={f}
            variant="ghost"
            className={cn(
              "justify-start p-0 rounded-none",
              f === value ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
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

      {/* Select Format button when none chosen */}
      {!hasValue && (
        <Button
          variant="ghost"
          className="justify-start hover:bg-[#F4F5F6] cursor-pointer rounded-none"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // no-op: list is already visible; could optionally close popup
          }}
        >
          <div className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium text-black">Select Format</span>
          </div>
        </Button>
      )}
    </div>
  );
}
