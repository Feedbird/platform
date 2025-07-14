"use client";
import React, { useState, useRef, useEffect } from "react";
import { Block } from "@/lib/store/use-feedbird-store";
import { Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlockThumbnail } from "./BlockThumbnail";
import ClipLoader from "react-spinners/ClipLoader";
import { useUploader } from "@/lib/hooks/use-uploader";

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
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [uploadDimensions, setUploadDimensions] = useState<Record<string, { w: number, h: number }>>({});

  const { uploads, startUploads } = useUploader({ postId });

  // Effect to calculate dimensions for image uploads
  useEffect(() => {
    uploads.forEach(up => {
      if (up.file.type.startsWith("image/") && !uploadDimensions[up.id]) {
        const img = new Image();
        img.src = up.previewUrl;
        img.onload = () => {
          setUploadDimensions(d => ({...d, [up.id]: { w: img.naturalWidth, h: img.naturalHeight }}));
        };
      }
    });
  }, [uploads, uploadDimensions]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
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

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // If there are blocks to preview, show them
  if (blocks.length > 0 || uploads.length > 0) {
    return (
      <div
        className="
          block-previews-container
          flex flex-row gap-[2px]
          w-full h-full
          overflow-x-auto
          overflow-y-hidden
        "
      >
        {blocks.map((block) => (
          <BlockThumbnail key={block.id} block={block} height={rowHeight > 10 ? rowHeight - 8 : rowHeight} />
        ))}

        {/* Upload in progress */}
        {uploads.map((up) => {
          const dims = uploadDimensions[up.id];
          const isTall = dims && dims.h > dims.w;
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

          return (
            <div
              key={up.id}
              className={cn(
                "relative flex-shrink-0 rounded-[2px] bg-black/10 overflow-hidden",
                !isTall && "aspect-square"
              )}
              style={{ height: `${rowHeight > 10 ? rowHeight - 8 : rowHeight}px`, border: "0.5px solid #D0D5D0" }}
              onMouseEnter={isVideo ? handleMouseEnter : undefined}
              onMouseLeave={isVideo ? handleMouseLeave : undefined}
            >
              {isVideo ? (
                <video
                  src={up.previewUrl}
                  className={cn(
                    "block opacity-50",
                    isTall
                      ? "h-full w-auto"
                      : "absolute inset-0 w-full h-full object-cover"
                  )}
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={up.previewUrl}
                  className={cn(
                    "block opacity-50",
                    isTall
                      ? "h-full w-auto"
                      : "absolute inset-0 w-full h-full object-cover"
                  )}
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
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center w-full h-full cursor-pointer transition-colors duration-150",
        (isHovered || isDragOver) && "border border-dashed rounded-[2px]",
        isHovered && !isDragOver && "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
        isDragOver && "border-blue-400 bg-blue-50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* Action group: plus button + optional text */}
      <div
        className={cn(
          "flex flex-row items-center gap-2",
          "absolute transition-all duration-200",
          isDragOver || isHovered ? "left-1/2 -translate-x-1/2" : "left-0 translate-x-0"
        )}
        // Disable pointer events during drag so nested elements don\'t cause flicker
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
        {(isHovered || isDragOver) && (
          <span className="text-xs text-[#5C5E63] font-normal whitespace-nowrap">
            Drop files here
          </span>
        )}
      </div>

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
