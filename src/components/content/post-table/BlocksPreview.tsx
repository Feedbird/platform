"use client";
import React from "react";
import { Block } from "@/lib/store/use-feedbird-store";

/**
 * Renders each block's *current* version in a horizontal strip.
 * Each thumbnail has a 1:1 aspect ratio, so it fits nicely in a row or table cell.
 */
export function BlocksPreview({ blocks }: { blocks: Block[] }) {
  return (
    <div
      className="
        flex flex-row gap-[2px]
        w-full h-full
        overflow-x-hidden
        overflow-y-hidden
      "
    >
      {blocks.map((block) => {
        // Find the current version for each block
        const currentVer = block.versions.find(
          (v) => v.id === block.currentVersionId
        );
        if (!currentVer) {
          // If no currentVersionId or missing version, skip
          return null;
        }

        const url = currentVer.file.url;
        const isVideo = currentVer.file.kind == "video";

        return (
          <div
            key={block.id}
            className="
              relative flex-shrink-0
              rounded-[2px] bg-black/10 overflow-hidden
            "
            style={{ aspectRatio: "1 / 1", height: "100%", border: "0.5px solid #D0D5D0", borderRadius: "2px" }}
          >
            {isVideo ? (
              <video
                className="absolute inset-0 w-full h-full object-cover"
                src={url}
                loop
                muted
                playsInline
                preload="auto"
                crossOrigin="anonymous"
              />
            ) : (
              <img
                className="absolute inset-0 w-full h-full object-cover"
                src={url}
                alt="preview"
                loading="lazy"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
