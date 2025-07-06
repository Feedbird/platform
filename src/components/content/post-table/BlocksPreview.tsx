"use client";
import React from "react";
import { Block } from "@/lib/store/use-feedbird-store";
import { Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Renders each block's *current* version in a horizontal strip.
 * Each thumbnail has a 1:1 aspect ratio, so it fits nicely in a row or table cell.
 */
export function BlocksPreview({ 
  blocks, 
  onFilesSelected 
}: { 
  blocks: Block[];
  onFilesSelected?: (files: File[]) => void;
}) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const dragCounter = React.useRef(0);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

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
      setSelectedFiles(files);
      onFilesSelected?.(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      onFilesSelected?.(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // If there are blocks to preview, show them
  if (blocks.length > 0) {
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
