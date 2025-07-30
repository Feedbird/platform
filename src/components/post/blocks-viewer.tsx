"use client";
import React from "react";
import { Block } from "@/lib/store/use-feedbird-store";
import { Paperclip, Maximize2, MessageCircleMore, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlocksViewerProps {
  blocks: Block[];
  onExpandBlock: (b: Block) => void;
}

export function BlocksViewer({ blocks, onExpandBlock }: BlocksViewerProps) {
  if (!blocks?.length) {
    return (
      <div className="text-sm text-muted-foreground">No blocks</div>
    );
  }

  return (
    <div className="flex flex-col p-3 rounded-md border border-buttonStroke gap-2">
      {/* header row: attachment icon + “Visual” label */}
      <div className="flex items-center gap-2 text-sm font-medium mb-2">
        <ImageIcon className="w-4 h-4 text-gray-600" />
        <span>Preview</span>
      </div>

      {/* row of big previews */}
      <div className="w-full overflow-x-auto flex gap-4">
        {blocks.map((block) => {
          const versions = block.versions.length;
          const comments = block.comments.length;
          const current = block.versions.find((v) => v.id === block.currentVersionId);
          if (!current) return null;

          const isVideo = current.file.kind === "video";

          return (
            <div
              key={block.id}
              className={cn(
                "relative group overflow-hidden border border-gray-300 rounded-md shadow-sm",
                "flex-shrink-0 transition-transform hover:shadow-md"
              )}
              style={{ width: 480, height: 480 }} // normal ~480x480
              onClick={() => onExpandBlock(block)}
            >
              {/* media */}
              {isVideo ? (
                <video
                  src={current.file.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <img
                  src={current.file.url}
                  alt="preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* center expand icon on hover */}
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-black/30",
                  "opacity-0 group-hover:opacity-100 transition-opacity"
                )}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpandBlock(block);
                  }}
                  className="
                    w-10 h-10 rounded-full bg-transparent text-white
                    flex items-center justify-center cursor-pointer
                  "
                >
                  <Maximize2 size={22} />
                </button>
              </div>

              {/* bottom-left overlay: versions + comments */}
              <div
                className="
                  absolute bottom-[20px] left-[20px]
                  text-xs font-medium
                  flex items-center gap-2
                  px-2 py-1
                "
              >
                <span className="rounded-full px-3 py-1 bg-[#101828dd] text-white font-bold">V{versions}</span>
                <span className="rounded-full px-3 py-1 bg-[#101828dd] text-white font-bold flex flex-row justify-center items-center"><MessageCircleMore className="w-4 h-4 mr-1" />{comments}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
