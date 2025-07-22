"use client";
import React, { useState, useRef, useEffect } from "react";
import { Block } from "@/lib/store/use-feedbird-store";
import { Plus, Check, X } from "lucide-react";
import { cn, calculateAspectRatioWidth, getAspectRatioType } from "@/lib/utils";
import { BlockThumbnail } from "./BlockThumbnail";
import ClipLoader from "react-spinners/ClipLoader";
import { useUploader } from "@/lib/hooks/use-uploader";

type AspectRatioType = "1:1" | "4:5" | "9:16";

/**
 * Renders each block's *current* version in a horizontal strip.
 * Each thumbnail has a 1:1 aspect ratio, so it fits nicely in a row or table cell.
 */
export function BlocksPreview({
  blocks,
  postId,
  onFilesSelected,
  rowHeight,
}: {
  blocks: Block[];
  postId: string;
  onFilesSelected?: (files: File[]) => void;
  rowHeight: number;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [uploadDimensions, setUploadDimensions] = useState<Record<string, { w: number, h: number }>>({});
  const [showText, setShowText] = useState(false);

  const { uploads, startUploads } = useUploader({ postId });

  // Effect to calculate dimensions for image and video uploads
  useEffect(() => {
    uploads.forEach(up => {
      // Skip if we already have dimensions for this upload
      if (uploadDimensions[up.id]) return;

      if (up.file.type.startsWith("image/")) {
        const img = new Image();
        img.src = up.previewUrl;
        img.onload = () => {
          setUploadDimensions(d => ({ ...d, [up.id]: { w: img.naturalWidth, h: img.naturalHeight } }));
        };
      } else if (up.file.type.startsWith("video/")) {
        const videoEl = document.createElement("video");
        videoEl.preload = "metadata";
        videoEl.muted = true;
        videoEl.src = up.previewUrl;
        videoEl.addEventListener("loadedmetadata", () => {
          setUploadDimensions(d => ({ ...d, [up.id]: { w: videoEl.videoWidth, h: videoEl.videoHeight } }));
        });
      }
    });
  }, [uploads, uploadDimensions]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      startUploads(files);
      onFilesSelected?.(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      startUploads(files);
      onFilesSelected?.(files);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const checkWidthAndUpdateText = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      // Plus button is ~20px, gap is 8px, text is roughly 80px, so we need ~108px minimum
      const minWidthNeeded = 108;
      setShowText(containerWidth >= minWidthNeeded);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    checkWidthAndUpdateText();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center w-full h-full cursor-pointer transition-colors duration-150",
        (isHovered || isDragOver) && "border border-dashed rounded-[2px]",
        (isHovered || isDragOver) && "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={() => setIsDragOver(false)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* Blocks and uploads container */}
      {(blocks.length > 0 || uploads.length > 0) && !isHovered && !isDragOver && (
        <div
          className="
            block-previews-container
            flex flex-row gap-[2px]
            w-full h-full
            overflow-x-hidden
            overflow-y-hidden
          "
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Upload in progress - shown at the left end */}
          {uploads.map((up) => {
            const dims = uploadDimensions[up.id];
            const aspectRatioType = dims ? getAspectRatioType(dims.w, dims.h) : "1:1";
            const isVideo = up.file.type.startsWith("video/");

            const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
              const video = e.currentTarget.querySelector("video");
              if (video) {
                video.play().catch(() => {});
              }
            };

            const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
              const video = e.currentTarget.querySelector("video");
              if (video) {
                video.pause();
                video.currentTime = 0;
              }
            };

            const thumbHeight = rowHeight > 10 ? rowHeight - 8 : rowHeight;
            const widthStyle = (() => {
              if (!dims) {
                // Fallback to square if dimensions not available
                return {};
              }
              
              const calculatedWidth = calculateAspectRatioWidth(dims.w, dims.h, thumbHeight);
              return { width: `${calculatedWidth}px` };
            })();

            return (
              <div
                key={up.id}
                className={cn(
                  "relative flex-shrink-0 rounded-[2px] bg-black/10 overflow-hidden",
                  aspectRatioType === "1:1" && "aspect-square"
                )}
                style={{ height: `${thumbHeight}px`, ...widthStyle, border: "0.5px solid #D0D5D0" }}
                onMouseEnter={isVideo ? handleMouseEnter : undefined}
                onMouseLeave={isVideo ? handleMouseLeave : undefined}
              >
                {isVideo ? (
                  <video
                    src={up.previewUrl}
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={up.previewUrl}
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                )}
                {/* Progress overlay */}
                {up.status === "uploading" && (
                  <>
                    {/* Dim overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      {/* Clip loader always visible while uploading */}
                      <ClipLoader color="#FFFFFF" size={24} />
                    </div>
                    {/* Bottom progress bar */}
                    <div className="absolute left-0 bottom-0 w-full h-[3px] bg-white/20">
                      <div
                        className="h-full bg-blue-400 transition-all"
                        style={{ width: `${up.progress}%` }}
                      />
                    </div>
                  </>
                )}
                {up.status === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/80 text-white text-xs gap-2">
                    <X className="w-6 h-6" />
                    <span>Error</span>
                  </div>
                )}
                {up.status === "processing" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white text-xs gap-2">
                    <ClipLoader color="#FFFFFF" size={24} />
                  </div>
                )}
                {up.status === "done" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-600/70 text-white text-xs gap-2">
                    <Check className="w-6 h-6" />
                    <span>Uploaded</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Existing blocks - shown after uploads */}
          {blocks.map((block) => (
            <BlockThumbnail key={block.id} block={block} height={rowHeight > 10 ? rowHeight - 8 : rowHeight} />
          ))}
        </div>
      )}

      {/* Action group: plus button + optional text - always visible when hovering */}
      {(isHovered || isDragOver) && (
        <div
          className={cn(
            "flex flex-row items-center gap-2",
            "absolute transition-all duration-200",
            isDragOver || isHovered ? "left-1/2 -translate-x-1/2" : "left-0 translate-x-0"
          )}
          // Disable pointer events during drag so nested elements don't cause flicker
          style={{ pointerEvents: isDragOver ? "none" : "auto" }}
        >
          <div
            className="flex flex-row items-center px-[4px] py-[1px] h-5 w-5 rounded-[4px] bg-white"
            style={{
              boxShadow:
                "0px 0px 0px 1px #D3D3D3, 0px 1px 1px 0px rgba(0, 0, 0, 0.05), 0px 4px 6px 0px rgba(34, 42, 53, 0.04)",
            }}
          >
            <Plus className="w-3 h-3 text-[#5C5E63] bg-[#D3D3D3] rounded-[3px]" />
          </div>
          {showText && (
            <span className="text-xs text-[#5C5E63] font-normal whitespace-nowrap">
              Drop files here
            </span>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
