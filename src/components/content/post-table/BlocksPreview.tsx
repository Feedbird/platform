"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Block,
  useFeedbirdStore,
  FileKind,
} from "@/lib/store/use-feedbird-store";
import { Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BlockThumbnail } from "./BlockThumbnail";
import { ClipLoader } from "react-spinners";

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

  /*────────────────── Upload state ──────────────────*/
  type UploadItem = {
    id: string;
    file: File;
    previewUrl: string;
    progress: number;   // 0-100
    status: "uploading" | "processing" | "done" | "error";
    xhr?: XMLHttpRequest;
  };
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [uploadDimensions, setUploadDimensions] = useState<Record<string, { w: number, h: number }>>({});
  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;

  const wid = useFeedbirdStore((s) => s.activeWorkspaceId);
  const bid = useFeedbirdStore((s) => s.activeBrandId);
  const addBlock = useFeedbirdStore((s) => s.addBlock);
  const addVersion = useFeedbirdStore((s) => s.addVersion);
  const updatePost = useFeedbirdStore((s) => s.updatePost);

  /** Start uploading the given files and track progress */
  const startUploads = (files: File[]) => {
    files.forEach((file) => {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);

      // Pre-calculate dimensions for aspect ratio styling
      if (file.type.startsWith("image/")) {
        const img = new Image();
        img.src = previewUrl;
        img.onload = () => {
          setUploadDimensions(d => ({...d, [id]: { w: img.naturalWidth, h: img.naturalHeight }}));
        };
      }

      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append("file", file);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          const newStatus = pct >= 100 ? "processing" : "uploading";
          setUploads((u) => u.map((it) => it.id === id ? { ...it, progress: pct, status: newStatus } : it));
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resJson = JSON.parse(xhr.responseText);
              const uploadedUrl = resJson.url as string | undefined;
              if (uploadedUrl) {
                const kind: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
                const blockId = addBlock(postId, kind);
                addVersion(postId, blockId, {
                  by: "Me",
                  caption: "",
                  file: { kind, url: uploadedUrl },
                });

                /* ----- Determine new post format ----- */
                const state = useFeedbirdStore.getState();
                const post = state.getPost(postId);
                if (post) {
                  const imgCnt = post.blocks.filter((b) => b.kind === "image").length;
                  const vidCnt = post.blocks.filter((b) => b.kind === "video").length;

                  let newFormat = post.format;
                  if (vidCnt > 0 && imgCnt === 0) {
                    newFormat = "video";
                  } else if (imgCnt === 1 && vidCnt === 0) {
                    newFormat = "static";
                  } else if (imgCnt >= 2 || (imgCnt >= 1 && vidCnt > 0)) {
                    newFormat = "carousel";
                  }

                  if (newFormat !== post.format) {
                    updatePost(postId, { format: newFormat });
                  }
                }
              }
              toast.success(`${file.name} uploaded`);
              setUploads((u) => u.map((it) => it.id === id ? { ...it, progress: 100, status: "done" } : it));
            } catch (e) {
              console.error("Failed to update store after upload", e);
              toast.error(`Upload processed but failed to update UI`);
              setUploads((u) => u.map((it) => it.id === id ? { ...it, status: "error" } : it));
            }
          } else if (xhr.status === 0) {
            // request aborted (unlikely now that cancel removed)
            setUploads((u) => u.map((it) => it.id === id ? { ...it, status: "error" } : it));
          } else {
            toast.error(`${file.name} failed`, {
              description: `Server responded with ${xhr.status}`,
            });
            setUploads((u) => u.map((it) => it.id === id ? { ...it, status: "error" } : it));
          }
        }
      };

      // Build query string: /api/media/upload?wid=...&bid=...&pid=...
      const qs = new URLSearchParams();
      if (wid) qs.append("wid", wid);
      if (bid) qs.append("bid", bid);
      if (postId) qs.append("pid", postId);

      const url = `/api/media/upload${qs.toString() ? "?" + qs.toString() : ""}`;

      xhr.open("POST", url);
      xhr.send(form);

      setUploads((u) => [...u, { id, file, previewUrl, progress: 0, status: "uploading", xhr }]);
    });
  };

  // Auto-remove completed uploads after short delay and revoke their blob URLs
  useEffect(() => {
    const timer = setInterval(() => {
      setUploads((prev) => {
        const kept = prev.filter((u) => u.status !== "done");
        const removed = prev.filter((u) => u.status === "done");
        // Revoke URLs for the items we are removing from the display
        removed.forEach((u) => URL.revokeObjectURL(u.previewUrl));
        return kept;
      });
    }, 1500);

    // On unmount, clear interval and revoke any remaining blob URLs to prevent memory leaks
    return () => {
      clearInterval(timer);
      uploadsRef.current.forEach((u) => URL.revokeObjectURL(u.previewUrl));
    };
  }, []); // This effect should only run once on mount

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
                  {isVideo ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <ClipLoader color="#FFFFFF" size={24} />
                    </div>
                  ) : (
                    <>
                      {/* Dim overlay but leave preview visible */}
                      <div className="absolute inset-0 bg-black/40" />
                      {/* Bottom progress bar */}
                      <div className="absolute left-0 bottom-0 w-full h-[3px] bg-white/20">
                        <div
                          className="h-full bg-blue-400 transition-all"
                          style={{ width: `${up.progress}%` }}
                        />
                      </div>
                      {/* Percent text top-right (hide on very small widths) */}
                      <span className="absolute top-0 right-0 m-[2px] px-[2px] rounded bg-black/60 text-[10px] text-white leading-none">
                        {up.progress}%
                      </span>
                    </>
                  )}
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
