"use client";

import { Block } from "@/lib/store/use-feedbird-store";
import { cn, calculateAspectRatioWidth, getAspectRatioType } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

type AspectRatioType = "1:1" | "4:5" | "9:16";

export function BlockThumbnail({ block, height }: { block: Block; height: number }) {
  const currentVer = block.versions.find((v) => v.id === block.currentVersionId);
  const [aspectRatioType, setAspectRatioType] = useState<AspectRatioType>("1:1");
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine aspect ratio for images as soon as they load
  useEffect(() => {
    if (!currentVer) return;

    if (currentVer.file.kind === "image" && currentVer.file.url) {
      const img = new Image();
      img.src = currentVer.file.url;
      img.onload = () => {
        const aspectType = getAspectRatioType(img.naturalWidth, img.naturalHeight);
        setAspectRatioType(aspectType);
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
    }
  }, [currentVer]);

  // Determine aspect ratio for videos via metadata
  useEffect(() => {
    if (!currentVer || currentVer.file.kind !== "video") return;

    const vid = videoRef.current;
    if (!vid) return;

    const handleMeta = () => {
      const vw = vid.videoWidth;
      const vh = vid.videoHeight;
      const aspectType = getAspectRatioType(vw, vh);
      setAspectRatioType(aspectType);
      setDimensions({ width: vw, height: vh });
    };

    // Metadata might already be available
    if (vid.readyState >= 1) {
      handleMeta();
    } else {
      vid.addEventListener("loadedmetadata", handleMeta);
    }

    return () => {
      vid.removeEventListener("loadedmetadata", handleMeta);
    };
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

  // Calculate width based on the nearest aspect ratio
  const widthStyle = (() => {
    if (!dimensions) {
      // Fallback to square if dimensions not available
      return {};
    }
    
    const calculatedWidth = calculateAspectRatioWidth(dimensions.width, dimensions.height, height);
    return { width: `${calculatedWidth}px` };
  })();

  return (
    <div
      className={cn(
        "relative flex-shrink-0 rounded-[2px] bg-black/10 overflow-hidden",
        aspectRatioType === "1:1" && "aspect-square"
      )}
      style={{ height: `${height}px`, ...widthStyle, border: "0.5px solid #D0D5D0" }}
      onMouseEnter={isVideo ? handleMouseEnter : undefined}
      onMouseLeave={isVideo ? handleMouseLeave : undefined}
    >
      {isVideo ? (
        <>
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
          {/* Play button overlay – keeps original background untouched */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <Play className="w-6 h-6 text-white drop-shadow-md" />
          </div>
        </>
      ) : (
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src={currentVer.file.url}
          alt="preview"
          loading="lazy"
        />
      )}
    </div>
  );
} 