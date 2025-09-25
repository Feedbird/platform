"use client";
import React, { useEffect, useState } from "react";
import { Block } from "@/lib/store/use-feedbird-store";
import { Paperclip, Maximize2, MessageCircleMore, ImageIcon, Trash2 } from "lucide-react";
import { cn, calculateAspectRatioWidth, getAspectRatioType } from "@/lib/utils";

interface BlocksViewerProps {
  blocks: Block[];
  onExpandBlock: (b: Block) => void;
  onRemoveBlock?: (blockId: string) => void;
}

export function BlocksViewer({ blocks, onExpandBlock, onRemoveBlock }: BlocksViewerProps) {
  if (!blocks?.length) {
    return (
      <div className="text-sm text-muted-foreground">No blocks</div>
    );
  }

  // Preload image dimensions and capture video dimensions when metadata is available
  const [blockDimensions, setBlockDimensions] = useState<Record<string, { w: number; h: number }>>({});

  useEffect(() => {
    // Preload dimensions for image blocks
    blocks.forEach((block) => {
      if (blockDimensions[block.id]) return;
      const current = block.versions.find((v) => v.id === block.currentVersionId);
      if (!current) return;
      if (current.file.kind === "image" && current.file.url) {
        const img = new Image();
        img.src = `/api/proxy?url=${encodeURIComponent(current.file.url)}`;
        img.onload = () => {
          setBlockDimensions((prev) => ({ ...prev, [block.id]: { w: img.naturalWidth, h: img.naturalHeight } }));
        };
      }
    });
  }, [blocks, blockDimensions]);

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
          const dims = blockDimensions[block.id];

          // Target display height; width adjusts based on nearest supported ratio (1:1, 4:5, 9:16)
          const targetHeight = 480;
          const computedWidth = dims
            ? Math.max(120, Math.round(calculateAspectRatioWidth(dims.w, dims.h, targetHeight)))
            : 480; // fallback to square until dimensions known

          return (
            <div
              key={block.id}
              className={cn(
                "relative group overflow-hidden border border-gray-300 rounded-md shadow-sm",
                "flex-shrink-0 transition-transform hover:shadow-md"
              )}
              style={{ width: computedWidth, height: targetHeight }}
              onClick={() => onExpandBlock(block)}
            >
              {/* media */}
              {isVideo ? (
                <>
                  {current.file.thumbnailUrl ? (
                    <img
                      src={`/api/proxy?url=${encodeURIComponent(current.file.thumbnailUrl)}`}
                      alt="video thumbnail"
                      className="absolute inset-0 w-full h-full object-cover"
                      onLoad={(e) => {
                        const el = e.currentTarget as HTMLImageElement;
                        if (!el.naturalWidth || !el.naturalHeight) return;
                        setBlockDimensions((prev) => ({ ...prev, [block.id]: { w: el.naturalWidth, h: el.naturalHeight } }));
                      }}
                    />
                  ) : (
                    <img
                      src={current.file.url}
                      alt="video"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  {/* Center play icon overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="h-8 w-8 rounded-sm flex items-center justify-center overflow-hidden drop-shadow" style={{ background: "#1C1D1FCC" }}>
                      <svg viewBox="0 0 12 12" className="fill-white" style={{ width: 18, height: 18, display: "block" }}>
                        <polygon points="3.6,2 10.5,6 3.5,10 3.5,2" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                  <img
                    src={`/api/proxy?url=${encodeURIComponent(current.file.url)}`}
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

              {/* bottom-right overlay: trash icon */}
              {onRemoveBlock && (
                <div className="absolute bottom-[20px] right-[20px] px-2 py-1">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveBlock(block.id);
                    }}
                    className="rounded-full px-3 py-1 bg-[#101828dd] text-white font-bold cursor-pointer"
                    title="Remove block"
                  >
                    <Trash2 className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
