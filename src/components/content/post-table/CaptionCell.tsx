"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Post } from "@/lib/store/use-feedbird-store";
import { Platform } from "@/lib/social/platforms/platform-types";
import { checkCaptionQuality } from "./CaptionRules";
import { Maximize2 } from "lucide-react"; // or any icon you prefer

/**
 * Props from your <FocusCell> usage, plus an `onEdit` 
 * callback for opening the external `CaptionEditor`.
 */
export interface CaptionCellProps {
  post: Post;
  rowHeight: number;
  captionLocked: boolean;
  isFocused?: boolean;   // from FocusCell
  isEditing?: boolean;   // from FocusCell (not used in this design)
  exitEdit?: () => void; // from FocusCell (not used in this design)
  enterEdit?: () => void; // from FocusCell (not used in this design)
  onEdit?: (p: Post) => void; // triggers the big external dialog
  selectedPlatform: Platform | null;
  onCaptionChange?: (newText: string) => void;
}

/**
 * "CaptionCell" – 
 *   • If NOT focused => show truncated text + optional orange ring if there's an error. 
 *   • If focused => show the same truncated text on left, plus a small "expand" icon button on right 
 *       that calls onEdit?.(post) when clicked.
 */
export function CaptionCell(props: CaptionCellProps) {
  const {
    post, rowHeight, captionLocked,
    isFocused,
    onEdit,
    onCaptionChange,
    selectedPlatform,
  } = props;

  const [editedText, setEditedText] = React.useState("");
  const prevIsFocused = React.useRef(isFocused);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  /* --------------- determine the text we should show -------------- */
  const chosenPlatform: Platform = selectedPlatform ?? post.platforms[0] as Platform;

  const text = (captionLocked || post.caption.synced)
      ? post.caption.default
      : post.caption.perPlatform?.[chosenPlatform] ?? "";

  const ref = React.useRef<HTMLDivElement>(null);
  const cellRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isFocused) {
      setEditedText(text);
    }
  }, [isFocused, text]);

  React.useEffect(() => {
    if (prevIsFocused.current && !isFocused) {
      if (editedText !== text) {
        onCaptionChange?.(editedText);
      }
    }
    prevIsFocused.current = isFocused;
  }, [isFocused, editedText, text, onCaptionChange]);

  React.useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      const newHeight = Math.max(textareaRef.current.scrollHeight, rowHeight - 12);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [isFocused, editedText, rowHeight]);

  // 1) line-clamp logic
  React.useEffect(() => {
    if (!ref.current) return;
    const style = getComputedStyle(ref.current);
    const lineH = parseFloat(style.lineHeight || "16");
    const maxLines = Math.max(1, Math.floor((rowHeight - 16) / lineH));
    ref.current.style.setProperty("--clamp", String(maxLines));
  }, [rowHeight]);

  // 2) For quick validation, pick first platform
  const firstPl = post.platforms[0] ?? "instagram";

  // 3) Check for error/warning
  const errMsg = checkCaptionQuality(text, firstPl as Platform);
  // Show an orange ring if there's an error and it's not focused
  const showOrangeRing = !!errMsg && !isFocused;

  return (
    <div ref={cellRef} className="relative w-full h-full">
      <div
        ref={ref}
        className={cn(
          isFocused ? "text-[#125AFF] bg-[#EDF6FF]" : "",
          "px-[8px] py-[6px]",
          "w-full h-full text-xs font-normal relative",
          "whitespace-pre-wrap break-words overflow-hidden",
          "tracking-[-0.24px]",
          "[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:var(--clamp)]",
          showOrangeRing ? "ring-2 ring-orange-400" : ""
        )}
        title={errMsg || ""}
      >
        <>{text || <span className="text-muted-foreground">No caption</span>}</>
      </div>

      {isFocused && (
        <div 
          className={cn(
            "absolute z-10 left-[-2px] top-[-3px] border border-[2px] border-[#125AFF]",
            "min-w-[calc(100%+5px)]",
            `min-h-[${rowHeight + 12}px]`, 
            "bg-[#EDF6FF] px-[8px] py-[6px]",
            "whitespace-pre-wrap break-words",
            "text-[#125AFF] text-xs font-normal",
            "flex flex-row",
            "justify-between"
          )}
          style={{
            width: 'max-content',
            maxWidth: '400px',
            minHeight: rowHeight,
          }}
        >
          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setEditedText(text);
                e.currentTarget.blur();
              }
            }}
            className="flex-grow bg-transparent resize-none border-none focus:outline-none text-[#125AFF] text-xs font-normal"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(post);
            }}
            className="inline-flex rounded
                        hover:bg-blue-50 active:bg-blue-100 text-blue-600
                        border border-transparent 
                        focus:outline-none focus:bg-transparent w-3 h-3 ml-2 self-start"
            title="Open caption editor"
          >
            <Maximize2 className="w-3 h-3 cursor-pointer" />
          </button>
        </div>
      )}
    </div>
  );
}
