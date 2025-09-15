"use client";
import React, { useState, useRef, useEffect } from "react";
import { Block } from "@/lib/store/use-feedbird-store";
import { Paperclip, X, CircleCheck, ArrowDownCircle } from "lucide-react";
import { cn, calculateAspectRatioWidth, getAspectRatioType, RowHeightType, getRowHeightPixels } from "@/lib/utils";
import { BlockThumbnail } from "./BlockThumbnail";
import ClipLoader from "react-spinners/ClipLoader";
import { useUploader } from "@/lib/hooks/use-uploader";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";

type AspectRatioType = "1:1" | "4:5" | "9:16";

/**
 * Renders each block's *current* version in a horizontal strip.
 * Each thumbnail has a 1:1 aspect ratio, so it fits nicely in a row or table cell.
 */
export function BlocksPreview({
  blocks: initialBlocks,
  postId,
  onFilesSelected,
  rowHeight,
  isSelected,
}: {
  blocks: Block[];
  postId: string;
  onFilesSelected?: (files: File[]) => void;
  rowHeight: RowHeightType;
  isSelected?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadDimensions, setUploadDimensions] = useState<Record<string, { w: number, h: number }>>({});
  const [showText, setShowText] = useState(false);

  // Subscribe directly to the store to get the latest blocks data
  const blocks = useFeedbirdStore((state) => {
    const post = state.getPost(postId);
    return post?.blocks || initialBlocks;
  });

  const { uploads, startUploads } = useUploader({ postId });

  // Calculate sizes based on row height
  const getSizes = () => {
    switch (rowHeight) {
      case "Small":
        return { spinner: 16, text: 8, icon: "w-3 h-3" };
      case "Medium":
        return { spinner: 16, text: 10, icon: "w-4 h-4" };
      default:
        return { spinner: 16, text: 14, icon: "w-6 h-6" };
    }
  };

  const sizes = getSizes();

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
    // Check if the drag contains files
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set drag over to false if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
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



  const handlePlusButtonClick = (e: React.MouseEvent) => {
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

  // Show drop overlay when dragging files over the cell
  const shouldShowDropOverlay = isDragOver;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center w-full h-full cursor-pointer transition-colors duration-150 p-1"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop overlay - shown when dragging files over the cell */}
      {shouldShowDropOverlay && (
        <div className="absolute inset-0 flex items-center justify-center z-10 border border-[1px] border-solid border-main">
          <div
            className={cn(
              "flex flex-row items-center gap-2 justify-center w-[calc(100%-16px)] max-w-[calc(100%-16px)]",
              "absolute transition-all duration-200",
              "left-1/2 -translate-x-1/2"
            )}
          >
            <span className="text-xs text-main font-base truncate">
              Add files to this record
            </span>
          </div>
        </div>
      )}


      {/* Blocks and uploads container */}
      {!shouldShowDropOverlay && (
        <div
          className={cn(
            "block-previews-container flex flex-row gap-[2px] h-full overflow-x-hidden overflow-y-hidden"
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Upload in progress - shown at the left end */}
          {uploads.length > 0 && uploads.map((up) => {
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

            const thumbHeight = getRowHeightPixels(rowHeight) > 10 ? getRowHeightPixels(rowHeight) - 8 : getRowHeightPixels(rowHeight);
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
                  "relative flex-shrink-0 rounded-[2px] overflow-hidden",
                  aspectRatioType === "1:1" && "aspect-square",
                  up.status === "uploading" ? "bg-transparent" : "bg-black/10"
                )}
                style={{ height: `${thumbHeight}px`, ...widthStyle, border: up.status === "uploading" ? "none" : "0.5px solid #D0D5D0" }}
                onMouseEnter={isVideo ? handleMouseEnter : undefined}
                onMouseLeave={isVideo ? handleMouseLeave : undefined}
              >
                {!(up.status === "uploading") && (
                  isVideo ? (
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
                  )
                )}
                {/* Progress overlay */}
                {up.status === "uploading" && (
                  <>
                    {/* Dim overlay */}
                      <div className="absolute inset-0 bg-transparent flex flex-col items-center justify-center">
                      {/* Rotating spinner using inline SVG (three segments) */}
                      <svg
                        width={sizes.spinner}
                        height={sizes.spinner}
                        viewBox="0 0 24 24"
                        className="text-darkGrey"
                        style={{ animation: "spinAccel 1.6s linear infinite" }}
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          pathLength={100}
                          strokeDasharray="20 13.333"
                        />
                      </svg>

                      {/* Add keyframes for continuous acceleration */}
                      <style>
                        {`
                          @keyframes spinAccel {
                            0% { transform: rotate(0deg); }
                            10% { transform: rotate(7.2deg); }
                            20% { transform: rotate(28.8deg); }
                            30% { transform: rotate(64.8deg); }
                            40% { transform: rotate(115.2deg); }
                            50% { transform: rotate(180deg); }
                            60% { transform: rotate(259.2deg); }
                            70% { transform: rotate(352.8deg); }
                            80% { transform: rotate(460.8deg); }
                            90% { transform: rotate(583.2deg); }
                            100% { transform: rotate(720deg); }
                          }
                        `}
                      </style>
                    </div>
                  </>
                )}
                {up.status === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/80 text-white text-xs gap-2">
                    <X className={sizes.icon} />
                    <span style={{ fontSize: `${sizes.text}px` }}>Error</span>
                  </div>
                )}
    
                {up.status === "done" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-600/70 text-white text-xs gap-2">
                    <CircleCheck className={sizes.icon} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Existing blocks - shown after uploads */}
          {blocks.length >0 && blocks.map((block) => (
            <BlockThumbnail key={block.id} block={block} height={getRowHeightPixels(rowHeight) > 10 ? getRowHeightPixels(rowHeight) - 8 : getRowHeightPixels(rowHeight)} rowHeight={rowHeight} />
          ))}

          {/* Plus button - shown at the right when selected */}
          {isSelected && !shouldShowDropOverlay && (
              <div
                className="flex flex-row h-full items-center justify-center bg-elementStroke/50 hover:bg-elementStroke p-1 mr-0.5 w-6 rounded-[2px] cursor-pointer"
                data-preview-exempt
                onClick={handlePlusButtonClick}
              >
                <Paperclip className="w-3.5 h-3.5 text-gray-700" />
              </div>
          )}
          {isSelected && !shouldShowDropOverlay && uploads.length === 0 && blocks.length === 0 && (
            <div className="flex flex-row h-full items-center gap-1" data-preview-exempt>
              <ArrowDownCircle className="w-3.5 h-3.5 text-grey" />
              <span
                className="text-xs text-grey font-base whitespace-nowrap"
              >
                Drop files here
              </span>
            </div>
          )}
        </div>
      )}


      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        data-preview-exempt
        onChange={handleFileSelect}
      />
    </div>
  );
}
