"use client";

import { Block } from "@/lib/store/use-feedbird-store";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export function BlockThumbnail({ block, height }: { block: Block; height: number }) {
  const currentVer = block.versions.find((v) => v.id === block.currentVersionId);
  const [isTall, setIsTall] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (currentVer?.file.kind === "image" && currentVer.file.url) {
      const img = new Image();
      img.src = currentVer.file.url;
      img.onload = () => {
        // A "story" or tall image is taller than it is wide.
        if (img.naturalHeight > img.naturalWidth) {
          setIsTall(true);
        }
      };
    }
  }, [currentVer]);

  const handleMouseEnter = () => {
    videoRef.current?.play().catch(() => {}); // catch errors if play is interrupted
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  if (!currentVer) {
    return null;
  }

  const isVideo = currentVer.file.kind === "video";

  return (
    <div
      className={cn(
        "relative flex-shrink-0 rounded-[2px] bg-black/10 overflow-hidden",
        // Apply 1:1 aspect ratio only to videos and non-tall images
        !isTall && "aspect-square"
      )}
      style={{ height: `${height}px`, border: "0.5px solid #D0D5D0" }}
      onMouseEnter={isVideo ? handleMouseEnter : undefined}
      onMouseLeave={isVideo ? handleMouseLeave : undefined}
    >
      {isVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={`${currentVer.file.url}?v=${currentVer.id}`}
          loop
          muted
          playsInline
          preload="auto"
          crossOrigin="anonymous"
        />
      ) : (
        <img
          className={cn(
            "block",
            // Tall images scale by height, others cover the square container
            isTall
              ? "h-full w-auto"
              : "absolute inset-0 w-full h-full object-cover"
          )}
          src={currentVer.file.url}
          alt="preview"
          loading="lazy"
        />
      )}
    </div>
  );
} 