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
  // Row index in the table – needed for fill-drag
  rowIndex: number;
  // Callback fired when the user starts a fill-drag from this caption cell
  onFillStart?: (value: Post['caption'], startRowIndex: number) => void;
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
    post,
    rowHeight,
    captionLocked,
    rowIndex,
    onFillStart,
    isFocused,
    isEditing,
    onEdit,
    onCaptionChange,
    selectedPlatform,
  } = props;

  const [editedText, setEditedText] = React.useState("");
  const [hasScroll, setHasScroll] = React.useState(false);
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

  // Check if textarea has scroll
  React.useEffect(() => {
    if (textareaRef.current && isFocused) {
      const checkScroll = () => {
        const textarea = textareaRef.current;
        if (textarea) {
          const hasVerticalScroll = textarea.scrollHeight > textarea.clientHeight;
          setHasScroll(hasVerticalScroll);
        }
      };
      
      checkScroll();
      // Check again after a short delay to account for content changes
      const timeoutId = setTimeout(checkScroll, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isFocused, editedText]);



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
            
            "px-[8px] py-[6px]",
            "w-full h-full text-xs font-normal relative",
            "whitespace-pre-wrap break-words overflow-hidden",
            "tracking-[-0.24px]",
            "[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:var(--clamp)]",
            showOrangeRing ? "ring-2 ring-orange-400" : ""
          )}
          title={errMsg || ""}
        >
          <>{text}</>
        </div>

      {/* The editing overlay with textarea + expand icon */}
      {isFocused && (
                 <div
           className={cn(
             "absolute z-10 left-[-2px] top-[-3px] border border-[2px] border-[#125AFF]",
             "min-w-[calc(100%+5px)]",
             `min-h-[calc(100%+20px)]`,
             "bg-white pl-[8px] py-[6px]",
             "whitespace-pre-wrap break-words",
             "text-xs font-normal",
             !hasScroll && "pr-2"
           )}
          style={{
            width: 'max-content',
            maxWidth: '400px',
            maxHeight: `${rowHeight + 20}px`,
            position: 'absolute'
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
            className="w-full h-full bg-transparent resize-none border-none focus:outline-none text-xs font-normal"
            style={{
              minHeight: `${rowHeight}px`,
              overflow: "auto"
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(post);
            }}
            className="absolute top-1 right-1 inline-flex rounded
            hover:bg-blue-50 active:bg-blue-100 text-blue-600
            border border-transparent 
            focus:outline-none focus:bg-transparent w-4 h-4 z-20"
            title="Open caption editor"
          >
            <Maximize2 className="w-4 h-4 cursor-pointer" />
          </button>
        </div>
      )}
    </div>
  );
}
