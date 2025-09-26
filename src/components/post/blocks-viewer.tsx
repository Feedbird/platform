"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Block, useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { Paperclip, Maximize2, MessageCircleMore, ImageIcon, Trash2, Play, ArrowLeft, ImagePlus, X } from "lucide-react";
import { cn, calculateAspectRatioWidth, getAspectRatioType } from "@/lib/utils";
import { storeApi } from "@/lib/api/api-service";

// Custom Tooltip Component
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
}

function Tooltip({ children, content, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowClass, setArrowClass] = useState('');
  const triggerRef = useRef<HTMLDivElement>(null);

  const updateTooltipPosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipHeight = 28; // Approximate tooltip height
    const tooltipWidth = content.length * 7 + 16; // Approximate tooltip width
    
    // Calculate position - center horizontally, above the element
    const left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
    const top = triggerRect.top - tooltipHeight - 8; // Position above with 8px gap
    
    // Check if tooltip would be clipped at the top
    const spaceAbove = triggerRect.top;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    
    let finalTop = top;
    let arrowPosition = 'bottom';
    
    if (spaceAbove < tooltipHeight + 16) {
      // Position below if not enough space above
      finalTop = triggerRect.bottom + 8;
      arrowPosition = 'top';
    }
    
    // Ensure tooltip doesn't go off screen horizontally
    const finalLeft = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));
    
    setTooltipStyle({
      position: 'fixed',
      left: finalLeft,
      top: finalTop,
      zIndex: 9999,
      transform: 'none',
    });

    // Set arrow class based on position
    if (arrowPosition === 'top') {
      // Tooltip is below element, arrow points UP
      setArrowClass('absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900');
    } else {
      // Tooltip is above element, arrow points DOWN
      setArrowClass('absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900');
    }
  };

  useEffect(() => {
    if (isVisible) {
      updateTooltipPosition();
      // Update position on scroll/resize
      const handleUpdate = () => updateTooltipPosition();
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isVisible, content]);

  const tooltipElement = isVisible ? (
    <div
      style={tooltipStyle}
      className="px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap pointer-events-none relative"
    >
      {content}
      <div className={arrowClass}></div>
    </div>
  ) : null;

  return (
    <>
      <div 
        ref={triggerRef}
        className={cn("relative inline-block", className)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {typeof window !== 'undefined' && tooltipElement && createPortal(tooltipElement, document.body)}
    </>
  );
}

interface BlocksViewerProps {
  postId: string;
  blocks: Block[];
  onExpandBlock: (b: Block) => void;
  onRemoveBlock?: (blockId: string) => void;
}

export function BlocksViewer({ postId, blocks, onExpandBlock, onRemoveBlock }: BlocksViewerProps) {
  if (!blocks?.length) {
    return (
      <div className="text-sm text-muted-foreground">No blocks</div>
    );
  }

  // Preload image dimensions and capture video dimensions when metadata is available
  const [blockDimensions, setBlockDimensions] = useState<Record<string, { w: number; h: number }>>({});
  // Thumbnail selection state for videos
  const [thumbnailSelectFor, setThumbnailSelectFor] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<number>(0);
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const [savingBlockId, setSavingBlockId] = useState<string | null>(null);
  const [customThumbFor, setCustomThumbFor] = useState<string | null>(null);
  const [customThumbFile, setCustomThumbFile] = useState<File | null>(null);
  const [customThumbPreview, setCustomThumbPreview] = useState<string | null>(null);

  const formatTime = (t: number) => {
    if (!isFinite(t) || t < 0) t = 0;
    const minutes = Math.floor(t / 60);
    const seconds = Math.floor(t % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const drawFrameToCanvas = (blockId: string) => {
    const video = videoRefs.current[blockId];
    const canvas = canvasRefs.current[blockId];
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // cover behavior
    const vW = video.videoWidth;
    const vH = video.videoHeight;
    if (!vW || !vH) return;
    const cW = canvas.width;
    const cH = canvas.height;
    const videoAR = vW / vH;
    const canvasAR = cW / cH;
    let sx = 0, sy = 0, sW = vW, sH = vH;
    if (videoAR > canvasAR) {
      // video is wider than canvas: crop width
      sH = vH;
      sW = sH * canvasAR;
      sx = (vW - sW) / 2;
      sy = 0;
    } else {
      // video is taller than canvas: crop height
      sW = vW;
      sH = sW / canvasAR;
      sx = 0;
      sy = (vH - sH) / 2;
    }
    ctx.clearRect(0, 0, cW, cH);
    ctx.drawImage(video, sx, sy, sW, sH, 0, 0, cW, cH);
  };

  const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
    new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob from canvas"));
      }, "image/jpeg", 0.9);
    });

  async function uploadCanvasAndSave(block: Block) {
    try {
      const canvas = canvasRefs.current[block.id];
      if (!canvas) return;
      setSavingBlockId(block.id);
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], `${block.id}-thumbnail.jpg`, { type: "image/jpeg" });

      const state = useFeedbirdStore.getState();
      const wid = state.activeWorkspaceId;
      const bid = state.activeBrandId;
      if (!wid) throw new Error("Missing workspace id");

      const qs = new URLSearchParams();
      qs.append("wid", wid);
      if (bid) qs.append("bid", bid);
      if (postId) qs.append("pid", postId);

      const res = await fetch(`/api/media/request-upload-url?${qs.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      if (!res.ok) throw new Error("Failed to request upload URL");
      const { uploadUrl, publicUrl } = await res.json();
      if (!uploadUrl || !publicUrl) throw new Error("Invalid upload URL response");

      // Upload image to R2
      await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });

      // Prepare updated blocks
      const updatedBlocks = blocks.map((b) => {
        if (b.id !== block.id) return b;
        const cur = b.versions.find((v) => v.id === b.currentVersionId);
        if (!cur) return b;
        const oldThumb = (cur as any).file?.thumbnailUrl as string | undefined;
        const updatedVersions = b.versions.map((v) =>
          v.id === b.currentVersionId
            ? { ...v, file: { ...v.file, thumbnailUrl: publicUrl } }
            : v
        );
        // Attach temp field for deletion after DB update
        return { ...b, versions: updatedVersions, __oldThumb: oldThumb } as any;
      });

      const userEmail = state.user?.email;
      // Persist to DB and store
      const post = await storeApi.updatePostBlocksAndUpdateStore(postId, updatedBlocks.map(({ __oldThumb, ...rest }: any) => rest), userEmail);

      // Delete old thumbnail if exists
      const updatedBlock = updatedBlocks.find((b: any) => b.id === block.id);
      const oldUrl: string | undefined = updatedBlock?.__oldThumb;
      if (oldUrl) {
        try {
          await fetch("/api/media/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: oldUrl }) });
        } catch (e) {
          console.warn("Failed to delete old thumbnail", e);
        }
      }

      setThumbnailSelectFor(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingBlockId(null);
    }
  }

  async function uploadFileAndSave(block: Block, file: File) {
    try {
      setSavingBlockId(block.id);
      const state = useFeedbirdStore.getState();
      const wid = state.activeWorkspaceId;
      const bid = state.activeBrandId;
      if (!wid) throw new Error("Missing workspace id");

      const qs = new URLSearchParams();
      qs.append("wid", wid);
      if (bid) qs.append("bid", bid);
      if (postId) qs.append("pid", postId);

      const res = await fetch(`/api/media/request-upload-url?${qs.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      if (!res.ok) throw new Error("Failed to request upload URL");
      const { uploadUrl, publicUrl } = await res.json();
      if (!uploadUrl || !publicUrl) throw new Error("Invalid upload URL response");

      await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });

      const updatedBlocks = blocks.map((b) => {
        if (b.id !== block.id) return b;
        const cur = b.versions.find((v) => v.id === b.currentVersionId);
        if (!cur) return b;
        const oldThumb = (cur as any).file?.thumbnailUrl as string | undefined;
        const updatedVersions = b.versions.map((v) =>
          v.id === b.currentVersionId
            ? { ...v, file: { ...v.file, thumbnailUrl: publicUrl } }
            : v
        );
        return { ...b, versions: updatedVersions, __oldThumb: oldThumb } as any;
      });

      const userEmail = state.user?.email;
      await storeApi.updatePostBlocksAndUpdateStore(postId, updatedBlocks.map(({ __oldThumb, ...rest }: any) => rest), userEmail);

      const updatedBlock = updatedBlocks.find((b: any) => b.id === block.id);
      const oldUrl: string | undefined = updatedBlock?.__oldThumb;
      if (oldUrl) {
        try {
          await fetch("/api/media/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: oldUrl }) });
        } catch (e) {
          console.warn("Failed to delete old thumbnail", e);
        }
      }

      if (customThumbPreview) {
        URL.revokeObjectURL(customThumbPreview);
      }
      setCustomThumbFor(null);
      setCustomThumbFile(null);
      setCustomThumbPreview(null);
      setThumbnailSelectFor(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingBlockId(null);
    }
  }

  useEffect(() => {
    // Preload dimensions: images measured via <img>, videos measured off-DOM from metadata
    blocks.forEach((block) => {
      const current = block.versions.find((v) => v.id === block.currentVersionId);
      if (!current) return;
      if (current.file.kind === "image" && current.file.url) {
        if (blockDimensions[block.id]) return;
        const img = new Image();
        img.src = `/api/proxy?url=${encodeURIComponent(current.file.url)}`;
        img.onload = () => {
          setBlockDimensions((prev) => ({ ...prev, [block.id]: { w: img.naturalWidth, h: img.naturalHeight } }));
        };
      } else if (current.file.kind === "video" && current.file.url) {
        if (blockDimensions[block.id]) return;
        const videoEl = document.createElement("video");
        videoEl.preload = "metadata";
        videoEl.crossOrigin = "anonymous";
        videoEl.src = `/api/proxy?url=${encodeURIComponent(current.file.url)}`;
        const onMeta = () => {
          const w = videoEl.videoWidth;
          const h = videoEl.videoHeight;
          if (w && h) {
            setBlockDimensions((prev) => {
              const cur = prev[block.id];
              if (cur && cur.w === w && cur.h === h) return prev;
              return { ...prev, [block.id]: { w, h } };
            });
          }
          videoEl.removeEventListener("loadedmetadata", onMeta);
          videoEl.src = "";
        };
        videoEl.addEventListener("loadedmetadata", onMeta);
      }
    });
  }, [blocks, blockDimensions]);

  return (
    <div className="flex flex-col p-3 rounded-md border border-buttonStroke gap-2 overflow-visible">
      {/* header row: attachment icon + “Visual” label */}
      <div className="flex items-center gap-2 text-sm font-medium mb-2">
        <ImageIcon className="w-4 h-4 text-gray-600" />
        <span>Preview</span>
      </div>

      {/* row of big previews */}
      <div className="w-full overflow-x-auto overflow-y-visible flex gap-4">
        {blocks.map((block) => {
          const versions = block.versions.length;
          const comments = block.comments.length;
          const current = block.versions.find((v) => v.id === block.currentVersionId);
          if (!current) return null;

          const isVideo = current.file.kind === "video";
          // Always prefer video intrinsic dimensions for videos; fallback to stored or image
          let dims = blockDimensions[block.id];

          // Target display height; width adjusts based on nearest supported ratio (1:1, 4:5, 9:16)
          const targetHeight = 480;
          const computedWidth = dims
            ? Math.max(120, Math.round(calculateAspectRatioWidth(dims.w, dims.h, targetHeight)))
            : 480; // fallback to square until dimensions known

          const inThumbSelect = thumbnailSelectFor === block.id;
          return (
            <div
              key={block.id}
              className={cn(
                "relative group overflow-hidden border border-gray-300 rounded-md shadow-sm",
                "flex-shrink-0 transition-transform hover:shadow-md"
              )}
              style={{ width: computedWidth, height: targetHeight }}
              onClick={() => { if (!inThumbSelect) onExpandBlock(block); }}
            >
              {/* media */}
              {isVideo ? (
                <>
                  {inThumbSelect ? (
                    <>
                      {/* hidden video used for frame extraction */}
                      <video
                        ref={(el) => {
                          videoRefs.current[block.id] = el;
                          if (el) {
                            el.crossOrigin = "anonymous";
                          }
                        }}
                        src={`/api/proxy?url=${encodeURIComponent(current.file.url)}`}
                        className="hidden"
                        playsInline
                        muted
                        onLoadedMetadata={(e) => {
                          const v = e.currentTarget;
                          setVideoDurations((prev) => ({ ...prev, [block.id]: v.duration || 0 }));
                          try {
                            v.currentTime = selectedTime || 0;
                          } catch {}
                        }}
                        onSeeked={() => drawFrameToCanvas(block.id)}
                      />
                      {/* canvas displaying the selected frame */}
                      <canvas
                        ref={(el) => {
                          canvasRefs.current[block.id] = el;
                          if (el) {
                            if (el.width !== computedWidth) el.width = computedWidth;
                            if (el.height !== targetHeight) el.height = targetHeight;
                          }
                        }}
                        className="absolute inset-0 w-full h-full"
                      />
                    </>
                  ) : (
                    <>
                      {current.file.thumbnailUrl ? (
                        <img
                          src={`/api/proxy?url=${encodeURIComponent(current.file.thumbnailUrl)}`}
                          alt="video thumbnail"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={current.file.url}
                          alt="video"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      {/* Center play icon overlay */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="h-8 w-8 rounded-sm flex items-center justify-center overflow-hidden drop-shadow" style={{ background: "#1C1D1FCC" }}>
                          <svg viewBox="0 0 12 12" className="fill-white" style={{ width: 18, height: 18, display: "block" }}>
                            <polygon points="3.6,2 10.5,6 3.5,10 3.5,2" />
                          </svg>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <img
                  src={`/api/proxy?url=${encodeURIComponent(current.file.url)}`}
                  alt="preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* center expand icon on hover */}
              {!inThumbSelect && (
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/30",
                    "opacity-0 group-hover:opacity-100 transition-opacity"
                  )}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExpandBlock(block);
                    }}
                    className="
                      w-10 h-10 rounded-full bg-transparent text-white
                      flex items-center justify-center cursor-pointer
                    "
                  >
                    <Maximize2 size={22} />
                  </button>
                </div>
              )}

              {/* Top-left small image icon */}
              {isVideo && !inThumbSelect && (
                <div className="absolute top-[20px] left-[20px] ">
                  <Tooltip content="Select thumbnail">
                    <div
                      className="px-3 py-1 rounded-full flex items-center justify-center bg-[#101828dd] cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setThumbnailSelectFor(block.id);
                        setSelectedTime(0);
                        // Attempt initial draw shortly after to catch metadata
                        setTimeout(() => drawFrameToCanvas(block.id), 150);
                      }}
                    >
                      <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                  </Tooltip>
                </div>
              )}

              {/* Thumbnail selection controls */}
              {isVideo && inThumbSelect && (
                <>
                  {/* Go back (arrow icon with tooltip) */}
                  <div className="absolute top-[20px] left-[20px] ">
                    <div className="relative">
                      <Tooltip content="Go back">
                        <button
                          className="flex items-center px-2 py-1 rounded-full bg-[#101828dd] text-white cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setThumbnailSelectFor(null);
                          }}
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  {/* Add Custom Thumbnail (icon triggers file picker) */}
                  <div className="absolute top-[20px] right-[20px] ">
                    <div className="relative">
                      <Tooltip content="Add Custom Thumbnail">
                        <button
                          className="flex items-center px-2 py-1 rounded-full bg-[#101828dd] text-white cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomThumbFor(block.id);
                            setTimeout(() => {
                              const input = document.getElementById(`custom-thumb-input-${block.id}`) as HTMLInputElement | null;
                              input?.click();
                            }, 0);
                          }}
                        >
                          <ImagePlus className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  {/* hidden file input for picking custom thumbnail */}
                  {inThumbSelect && (
                    <input
                      id={`custom-thumb-input-${block.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0] || null;
                        if (!file) return;
                        setCustomThumbFile(file);
                        const url = URL.createObjectURL(file);
                        if (customThumbPreview) URL.revokeObjectURL(customThumbPreview);
                        setCustomThumbPreview(url);
                      }}
                    />
                  )}
                  {/* Bottom controls */}
                  {!customThumbFile ? (
                    <div className="absolute left-0 right-0 bottom-0 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {(() => {
                          const durationSec = videoDurations[block.id] || 0;
                          const maxSeconds = Math.ceil(Math.max(0.01, durationSec));
                          return (
                            <>
                              <input
                                type="range"
                                min={0}
                                max={maxSeconds}
                                step={1.0}
                                value={Math.min(selectedTime, maxSeconds)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const t = parseFloat(e.target.value);
                                  setSelectedTime(t);
                                  const v = videoRefs.current[block.id];
                                  if (v && !Number.isNaN(t)) {
                                    const safeT = Math.min(t, durationSec || t);
                                    try { v.currentTime = safeT; } catch {}
                                  }
                                }}
                                className="flex-auto min-w-0 accent-[#2183FF]"
                              />
                            </>
                          );
                        })()}
                        <span className="text-white text-xs font-semibold whitespace-nowrap shrink-0">
                          {formatTime(selectedTime)}
                        </span>
                        <button
                          className="ml-auto px-3 py-1 rounded-[6px] bg-[#125AFF] text-white text-xs font-semibold cursor-pointer disabled:opacity-60 shrink-0"
                          disabled={savingBlockId === block.id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await uploadCanvasAndSave(block);
                          }}
                        >
                          {savingBlockId === block.id ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {customThumbPreview && (
                        <img src={customThumbPreview} alt="custom thumbnail" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      <div className="absolute top-[20px] right-[20px] ">
                        <Tooltip content="Cancel">
                          <button
                            className="flex items-center px-2 py-1 rounded-full bg-[#101828dd] text-white cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (customThumbPreview) URL.revokeObjectURL(customThumbPreview);
                              setCustomThumbFile(null);
                              setCustomThumbPreview(null);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                      <div className="absolute left-0 right-0 bottom-0 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="flex-1" />
                          <button
                            className="ml-auto px-3 py-1 rounded-[6px] bg-[#125AFF] text-white text-xs font-semibold cursor-pointer disabled:opacity-60 shrink-0"
                            disabled={savingBlockId === block.id}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (customThumbFile) {
                                await uploadFileAndSave(block, customThumbFile);
                              }
                            }}
                          >
                            {savingBlockId === block.id ? "Uploading..." : "Upload"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
              {/* bottom-left overlay: versions + comments */}
              {!inThumbSelect && (
                <div
                  className="
                    absolute bottom-[20px] left-[20px]
                    text-xs font-medium
                    flex items-center gap-2
                    px-2 py-1
                  "
                >
                  <span className="rounded-full px-3 py-1 bg-[#101828dd] text-white font-bold">V{versions}</span>
                  <span className="rounded-full px-3 py-1 bg-[#101828dd] text-white font-bold flex flex-row justify-center items-center"><MessageCircleMore className="w-4 h-4 mr-1" />{comments}</span>
                </div>
              )}

              {/* bottom-right overlay: trash icon */}
              {onRemoveBlock && !inThumbSelect && (
                <div className="absolute bottom-[20px] right-[20px] px-2 py-1">
                  <Tooltip content="Remove block">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBlock(block.id);
                      }}
                      className="rounded-full px-3 py-1 bg-[#101828dd] text-white font-bold cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </div>
                  </Tooltip>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
