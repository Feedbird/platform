"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Maximize2 } from "lucide-react";

export interface UserTextCellProps {
  value: string;
  rowHeight: number;
  isFocused?: boolean;
  singleLine?: boolean;
  onValueCommit: (newText: string) => void;
  onExpand?: () => void;
}

/**
 * A lightweight text cell that mirrors the CaptionCell UX without the expand button.
 * - When not focused: shows clamped text based on rowHeight (or 1 line when singleLine=true)
 * - When focused: shows an overlay with input (single line) or textarea (long text)
 * - Commits changes on focus loss; Esc reverts current edit
 */
function UserTextCell(props: UserTextCellProps) {
  const { value, rowHeight, isFocused, singleLine, onValueCommit, onExpand } = props;

  const [editedText, setEditedText] = React.useState<string>("");
  const prevIsFocused = React.useRef<boolean | undefined>(isFocused);
  const clampRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isFocused) {
      setEditedText(value ?? "");
    }
  }, [isFocused, value]);

  React.useEffect(() => {
    if (prevIsFocused.current && !isFocused) {
      if ((editedText ?? "") !== (value ?? "")) {
        onValueCommit(editedText ?? "");
      }
    }
    prevIsFocused.current = isFocused;
  }, [isFocused, editedText, value, onValueCommit]);

  // Clamp lines in display mode
  React.useEffect(() => {
    if (!clampRef.current) return;
    if (singleLine) {
      clampRef.current.style.setProperty("--clamp", "1");
      return;
    }
    const style = getComputedStyle(clampRef.current);
    const lineH = parseFloat(style.lineHeight || "16");
    const maxLines = Math.max(1, Math.floor((rowHeight - 16) / lineH));
    clampRef.current.style.setProperty("--clamp", String(maxLines));
  }, [rowHeight, singleLine]);

  return (
    <div className="relative w-full h-full">
      {/* Display (not focused) */}
      <div
        ref={clampRef}
        className={cn(
          "px-[8px] py-[6px]",
          "w-full h-full text-xs font-normal relative",
          "whitespace-pre-wrap break-words overflow-hidden",
          "tracking-[-0.24px]",
          "[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:var(--clamp)]"
        )}
      >
        {value}
      </div>

      {/* Edit overlay (focused) */}
      {isFocused && (
        <div
          className={cn(
            "absolute z-10 left-[-2px] top-[-3px] border border-[2px] border-[#125AFF]",
            "min-w-[calc(100%+5px)]",
            `min-h-[calc(100%+20px)]`,
            "bg-white pl-[8px] py-[6px]",
            "whitespace-pre-wrap break-words",
            "text-xs font-normal"
          )}
          style={{
            width: 'max-content',
            maxWidth: '400px',
            maxHeight: `${rowHeight + 20}px`,
            position: 'absolute'
          }}
        >
          {/* Expand button for long text */}
          {!singleLine && onExpand && (
            <button
              onClick={(e) => { e.stopPropagation(); onValueCommit(editedText ?? ""); onExpand(); }}
              className="absolute top-1 right-1 inline-flex rounded hover:bg-blue-50 active:bg-blue-100 text-blue-600 border border-transparent focus:outline-none focus:bg-transparent w-4 h-4 z-20"
              title="Open editor"
            >
              <Maximize2 className="w-4 h-4 cursor-pointer" />
            </button>
          )}
          {singleLine ? (
            <input
              type="text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditedText(value ?? "");
                  (e.currentTarget as HTMLInputElement).blur();
                }
              }}
              className="w-full bg-transparent border-none focus:outline-none text-xs font-normal"
              style={{
                height: `${rowHeight}px`,
              }}
            />
          ) : (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditedText(value ?? "");
                  (e.currentTarget as HTMLTextAreaElement).blur();
                }
              }}
              className="w-full h-full bg-transparent resize-none border-none focus:outline-none text-xs font-normal"
              style={{
                minHeight: `${rowHeight}px`,
                overflow: "auto"
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default UserTextCell;
export { UserTextCell };

