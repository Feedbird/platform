"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface AttachmentLike {
  id: string;
  url: string;
  type: string;
  name?: string;
}

export function AttachmentContentModal({
  attachments: initialAttachments,
  initialId,
  onClose,
  onRemove,
}: {
  attachments: AttachmentLike[];
  initialId: string;
  onClose: () => void;
  onRemove: (attachmentId: string) => void;
}) {
  const [attachments, setAttachments] = React.useState<AttachmentLike[]>(initialAttachments);
  const initialIndex = Math.max(0, attachments.findIndex(a => a.id === initialId));
  const [currentIndex, setCurrentIndex] = React.useState<number>(initialIndex);

  const current = attachments[currentIndex];
  const isImage = current?.type?.startsWith("image/");
  const isVideo = current?.type?.startsWith("video/");

  async function doDownload() {
    const params = new URLSearchParams({ url: current.url });
    if (current?.name) params.set('filename', current.name);
    const dlUrl = `/api/download?${params.toString()}`;
    const a = document.createElement("a");
    a.href = dlUrl;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function handleRemove() {
    const removingId = current.id;
    onRemove(removingId);
    setAttachments(prev => {
      const next = prev.filter(a => a.id !== removingId);
      if (next.length === 0) {
        // nothing left => close
        onClose();
        return next;
      }
      // adjust current index
      setCurrentIndex(idx => Math.min(idx, next.length - 1));
      return next;
    });
  }

  function prev() {
    setCurrentIndex(idx => Math.max(0, idx - 1));
  }

  function next() {
    setCurrentIndex(idx => Math.min(attachments.length - 1, idx + 1));
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "w-screen h-screen max-w-none sm:max-w-none p-0 border-0 rounded-none pointer-events-auto",
          "bg-[#404653]",
          "[&>button:last-child]:hidden",
          "gap-0",
        )}
        style={{ width: "100vw", height: "100vh" }}
      >
        <DialogTitle className="sr-only">Attachment viewer</DialogTitle>

        <div className="w-full h-full flex flex-col">
          {/* top bar */}
          <div className="h-14 bg-[#404653] text-white flex items-center justify-between px-6 py-5 shrink-0 w-full border-b border-[#ffffff10]">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white cursor-pointer" onClick={onClose}>
                <X size={20} />
              </Button>
              <span className="text-sm font-bold truncate max-w-[400px]">
                {current?.name || current?.url}
              </span>
            </div>
          </div>

          {/* media area */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {isVideo ? (
                <video src={current.url} controls className="max-w-[80vw] max-h-[80vh] object-contain" />
              ) : isImage ? (
                <img src={current.url} className="max-w-[80vw] max-h-[80vh] object-contain" />
              ) : (
                <div className="text-white text-sm">{current?.name || current?.url}</div>
              )}
            </div>

            {/* prev/next controls */}
            <button
              className="absolute z-10 left-4 top-1/2 -translate-y-1/2 cursor-pointer w-8 h-8 rounded-full text-white flex items-center justify-center"
              onClick={prev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="absolute z-10 right-4 top-1/2 -translate-y-1/2 cursor-pointer w-8 h-8 rounded-full text-white flex items-center justify-center"
              onClick={next}
              disabled={currentIndex >= attachments.length - 1}
            >
              <ChevronRight size={18} />
            </button>

            {/* bottom-right actions */}
            <div className="absolute z-10 bottom-4 right-4 flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    onClick={handleRemove}
                    className="cursor-pointer"
                  >
                    <Trash2 size={16} className="text-white"/>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-white text-black border-elementStroke text-xs font-medium whitespace-nowrap">
                  <p>Remove attachment</p>
                </TooltipContent>
              </Tooltip>
              <div
                onClick={doDownload}
                className="flex items-center px-2 py-1.5 bg-main cursor-pointer text-sm font-semibold text-white rounded-md border-none gap-1"
              >
                <Download size={16} />
                Download
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


