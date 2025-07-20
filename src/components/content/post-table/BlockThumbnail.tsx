"use client";

import { Block } from "@/lib/store/use-feedbird-store";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

type Orientation = "square" | "portrait" | "landscape";

export function BlockThumbnail({ block, height }: { block: Block; height: number }) {
  const currentVer = block.versions.find((v) => v.id === block.currentVersionId);
  const [orientation, setOrientation] = useState<Orientation>("square");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine orientation for images as soon as they load
  useEffect(() => {
    if (!currentVer) return;

    if (currentVer.file.kind === "image" && currentVer.file.url) {
      const img = new Image();
      img.src = currentVer.file.url;
      img.onload = () => {
        if (img.naturalWidth > img.naturalHeight) {
          setOrientation("landscape");
        } else if (img.naturalHeight > img.naturalWidth) {
          setOrientation("portrait");
        } else {
          setOrientation("square");
        }
      };
    }
  }, [currentVer]);

  // Determine orientation for videos via metadata
  useEffect(() => {
    if (!currentVer || currentVer.file.kind !== "video") return;

    const vid = videoRef.current;
    if (!vid) return;

    const handleMeta = () => {
      const vw = vid.videoWidth;
      const vh = vid.videoHeight;
      if (vw > vh) {
        setOrientation("landscape");
      } else if (vh > vw) {
        setOrientation("portrait");
      } else {
        setOrientation("square");
      }
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

  const widthStyle = (() => {
    switch (orientation) {
      case "landscape":
        return { width: `${(height * 16) / 9}px` };
      case "portrait":
        return { width: `${(height * 9) / 16}px` };
      default:
        return {};
    }
  })();

  return (
    <div
      className={cn(
        "relative flex-shrink-0 rounded-[2px] bg-black/10 overflow-hidden",
        orientation === "square" && "aspect-square"
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
          className={cn(
            "block",
            orientation === "portrait"
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