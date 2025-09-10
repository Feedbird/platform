"use client";
import React, { useState, useRef, useEffect } from "react";
import { Block } from "@/lib/store/use-feedbird-store";
import { Plus, X, CircleCheck } from "lucide-react";
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
        return { spinner: 12, text: 8, icon: "w-3 h-3" };
      case "Medium":
        return { spinner: 16, text: 10, icon: "w-4 h-4" };
      default:
        return { spinner: 24, text: 14, icon: "w-6 h-6" };
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
      className="relative flex items-center w-full h-full cursor-pointer transition-colors duration-150 pl-3 pr-1 py-1"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop overlay - shown when dragging files over the cell */}
      {shouldShowDropOverlay && (
        <div className="absolute inset-0 flex items-center justify-center z-10 border border-[1px] border-solid border-main">
          <div
            className={cn(
              "flex flex-row items-center gap-2",
              "absolute transition-all duration-200",
              "left-1/2 -translate-x-1/2"
            )}
          >
            <span className="text-sm text-main font-normal whitespace-nowrap">
              Drop files here
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
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                      {/* Rotating spinner using inline style for rotation */}
                      <img
                        src="/images/icons/spinner-gradient.svg"
                        alt="Upload progress bar"
                        style={{
                          width: `${sizes.spinner}px`,
                          height: `${sizes.spinner}px`,
                          animation: "spin 1s linear infinite"
                        }}
                      />
                      <span 
                        className="mt-1 text-white font-medium"
                        style={{
                          fontSize: `${sizes.text}px`
                        }}
                      >
                        {typeof up.progress === "number" ? `${Math.round(up.progress)}%` : ""}
                      </span>
                      {/* Add keyframes for spin animation */}
                      <style>
                        {`
                          @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                          }
                        `}
                      </style>
                    </div>
                    {/* Bottom progress bar */}
                    {/* <div className="absolute left-0 bottom-0 w-full h-[3px] bg-white/20">
                      <div
                        className="h-full bg-blue-400 transition-all"
                        style={{ width: `${up.progress}%` }}
                      />
                    </div> */}
                  </>
                )}
                {up.status === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/80 text-white text-xs gap-2">
                    <X className={sizes.icon} />
                    <span style={{ fontSize: `${sizes.text}px` }}>Error</span>
                  </div>
                )}
                {up.status === "processing" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                    <img
                        src="/images/icons/spinner-gradient.svg"
                        alt="Upload progress bar"
                        style={{
                          width: `${sizes.spinner}px`,
                          height: `${sizes.spinner}px`,
                          animation: "spin 1s linear infinite"
                        }}
                      />
                      <span 
                        className="mt-1 text-white font-medium"
                        style={{
                          fontSize: `${sizes.text}px`
                        }}
                      >
                        100%
                      </span>
                      {/* Add keyframes for spin animation */}
                      <style>
                        {`
                          @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                          }
                        `}
                      </style>
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
            <div className="flex-shrink-0 px-1 h-full flex items-center">
              <div
                className="flex flex-row items-center justify-center px-[4px] py-[1px] h-5.5 w-5.5 rounded-[4px] bg-white cursor-pointer"
                style={{
                  boxShadow:
                    "0px 0px 0px 1px #D3D3D3, 0px 1px 1px 0px rgba(0, 0, 0, 0.05), 0px 4px 6px 0px rgba(34, 42, 53, 0.04)",
                }}
                data-preview-exempt
                onClick={handlePlusButtonClick}
              >
                <Plus className="w-3 h-3 text-[#5C5E63] bg-[#D3D3D3] rounded-[3px]" />
              </div>
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
