"use client";
import React, { useState, useRef, useEffect } from "react";
import { Paperclip, X, CircleCheck, FileText, FileImage, FileVideo, File, ArrowDownCircle } from "lucide-react";
import { cn, getRowHeightPixels, RowHeightType } from "@/lib/utils";
import { useAttachmentUploader } from "@/lib/hooks/use-attachment-uploader";
import { usePostStore, FileKind } from "@/lib/store";
import { AttachmentContentModal } from "@/components/content/content-modal/attachment-content-modal";

export type Attachment = {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
};

export type AttachmentCellProps = {
  attachments: Attachment[];
  postId: string;
  columnId: string;
  rowHeight: RowHeightType;
  isSelected?: boolean;
};

export function AttachmentCell({
  attachments,
  postId,
  columnId,
  rowHeight,
  isSelected = false,
}: AttachmentCellProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [openAttachmentId, setOpenAttachmentId] = useState<string | null>(null);

  const { uploads, startUploads } = useAttachmentUploader({ postId, columnId });

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      // Cleanup any object URLs created for file previews
      uploads.forEach(up => {
        if (up.file && typeof up.file === 'object' && 'previewUrl' in up.file && up.previewUrl) {
          URL.revokeObjectURL(up.previewUrl);
        }
      });
    };
  }, [uploads]);

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

  const mimeToFileKind = (mime: string): FileKind => {
    if (mime.startsWith('image/')) return "image";
    if (mime.startsWith('video/')) return "video";
    if (mime.includes('pdf') || mime.includes('document')) return "document";
    return "other";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
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
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      startUploads(files);
    }
  };

  const handlePlusButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    const newAttachments = attachments.filter(a => a.id !== attachmentId);
    // Update the store directly like BlocksPreview does
    const { updatePost } = usePostStore.getState();
    const post = usePostStore.getState().getPost(postId);
    if (post && post.user_columns) {
      const newUserColumns = [...post.user_columns];
      const columnIndex = newUserColumns.findIndex(col => col.id === columnId);
      if (columnIndex !== -1) {
        newUserColumns[columnIndex] = {
          ...newUserColumns[columnIndex],
          value: JSON.stringify(newAttachments)
        };
        updatePost(postId, { user_columns: newUserColumns } as any);
      }
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return FileImage;
    if (type.startsWith('video/')) return FileVideo;
    if (type.startsWith('text/') || type.includes('document') || type.includes('pdf')) return FileText;
    return File;
  };

  const renderFilePreview = (file: File | { url: string; type: string; name: string }, size: number) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const src = 'url' in file ? file.url : URL.createObjectURL(file);

    if (isImage) {
      return (
        <img
          src={src}
          alt={file.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to icon if image fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }

    if (isVideo) {
      return (
        <video
          src={src}
          className="w-full h-full object-cover"
          muted
          onError={(e) => {
            // Fallback to icon if video fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }

    // For non-media files, show icon
    const FileIcon = getFileIcon(file.type);
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <FileIcon className={sizes.icon} />
        <span className="text-xs text-center px-1" style={{ fontSize: `${sizes.text}px` }}>
          {file.name.length > 8 ? file.name.substring(0, 8) + '...' : file.name}
        </span>
      </div>
    );
  };



  // Show drop overlay when dragging files over the cell
  const shouldShowDropOverlay = isDragOver;

  // Close selection when clicking outside
  useEffect(() => {
    const onDocMouseDown = (ev: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(ev.target as Node)) {
        // Parent owns selection (isFocused). Nothing to update here.
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center w-full h-full cursor-pointer transition-colors duration-150 p-1"
      // Click selection is handled by the parent FocusCell (like BlocksPreview)
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

      {/* Attachments and uploads container */}
      {!shouldShowDropOverlay && (
        <div
          className={cn(
            "attachments-container flex flex-row gap-[2px] h-full overflow-x-hidden overflow-y-hidden"
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
        {/* Upload in progress - shown at the left end */}
          {uploads.length > 0 && uploads.map((up: any) => {
            const thumbHeight = getRowHeightPixels(rowHeight) > 10 ? getRowHeightPixels(rowHeight) - 8 : getRowHeightPixels(rowHeight);

             return (
               <div
                 key={up.id}
                 className={cn(
                  "relative flex-shrink-0 rounded-[2px] overflow-hidden aspect-square",
                  up.status === "uploading" ? "bg-transparent" : "bg-black/10"
                )}
                 style={{ height: `${thumbHeight}px`, width: `${thumbHeight}px`, border: up.status === "uploading" ? "none" : "0.5px solid #D0D5D0" }}
               >
                 {!(up.status === "uploading" || up.status === "processing") && renderFilePreview(up.file, thumbHeight)}
                 
                 {/* Fallback icon for non-media files (hidden by default) */}
                 {!up.file.type.startsWith('image/') && !up.file.type.startsWith('video/') && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center hidden">
                     {(() => {
                       const FileIcon = getFileIcon(up.file.type);
                       return (
                         <>
                           <FileIcon className={sizes.icon} />
                           <span className="text-xs text-center px-1" style={{ fontSize: `${sizes.text}px` }}>
                             {up.file.name.length > 8 ? up.file.name.substring(0, 8) + '...' : up.file.name}
                           </span>
                         </>
                       );
                     })()}
                   </div>
                 )}

                {/* Progress overlay */}
                {up.status === "uploading" && (
                  <div className="absolute inset-0 bg-transparent flex flex-col items-center justify-center">
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

          {/* Existing attachments */}
          {attachments.length > 0 && attachments.map((attachment) => {
            const thumbHeight = getRowHeightPixels(rowHeight) > 10 ? getRowHeightPixels(rowHeight) - 8 : getRowHeightPixels(rowHeight);

            return (
              <div
                key={attachment.id}
                className="relative flex-shrink-0 rounded-[2px] bg-gray-100 overflow-hidden aspect-square"
                style={{ height: `${thumbHeight}px`, width: `${thumbHeight}px`, border: "0.5px solid #D0D5D0" }}
                data-preview-exempt
                onClick={(e) => { if (isSelected) { e.stopPropagation(); setOpenAttachmentId(attachment.id); } }}
              >
                {renderFilePreview(attachment, thumbHeight)}

                {/* Fallback icon for non-media files (hidden by default) */}
                {!attachment.type.startsWith('image/') && !attachment.type.startsWith('video/') && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center hidden">
                    {(() => {
                      const FileIcon = getFileIcon(attachment.type);
                      return (
                        <>
                          <FileIcon className={`${sizes.icon} text-gray-600`} />
                          <span className="text-xs text-center px-1 text-gray-700" style={{ fontSize: `${sizes.text}px` }}>
                            {attachment.name.length > 8 ? attachment.name.substring(0, 8) + '...' : attachment.name}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
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
          {isSelected && !shouldShowDropOverlay && uploads.length === 0 && attachments.length === 0 && (
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
        className="hidden"
        data-preview-exempt
        onChange={handleFileSelect}
      />

      {openAttachmentId && (
        <AttachmentContentModal
          attachments={attachments}
          initialId={openAttachmentId}
          onClose={() => setOpenAttachmentId(null)}
          onRemove={(id) => handleRemoveAttachment(id)}
        />
      )}
    </div>
  );
}
