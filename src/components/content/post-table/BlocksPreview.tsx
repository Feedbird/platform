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
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
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
        "flex flex-row items-center justify-center w-full h-full gap-2",
        "border border-dashed border-gray-300 rounded-[2px]",
        "cursor-pointer transition-colors duration-200",
        "hover:border-gray-400 hover:bg-gray-50",
        isDragOver && "border-blue-400 bg-blue-50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="flex flex-row items-center px-[4px] py-[1px] h-5 w-5 rounded-[4px] bg-white cursor-pointer"
        style={{
          boxShadow: "0px 0px 0px 1px #D3D3D3, 0px 1px 1px 0px rgba(0, 0, 0, 0.05), 0px 4px 6px 0px rgba(34, 42, 53, 0.04)"
        }}>
        <Plus className={cn(
          "w-3 h-3 text-[#5C5E63] bg-[#D3D3D3] rounded-[3px]",
        )}/>
      </div>
      <span className="text-xs text-[#5C5E63] font-normal">Drop files here</span>
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
