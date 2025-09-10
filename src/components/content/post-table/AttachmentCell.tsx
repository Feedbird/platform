"use client";
import React, { useState, useRef, useEffect } from "react";
import { Plus, X, CircleCheck, FileText, FileImage, FileVideo, File } from "lucide-react";
import { cn, getRowHeightPixels, RowHeightType } from "@/lib/utils";
import { useAttachmentUploader } from "@/lib/hooks/use-attachment-uploader";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";

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
        return { spinner: 12, text: 8, icon: "w-3 h-3" };
      case "Medium":
        return { spinner: 16, text: 10, icon: "w-4 h-4" };
      default:
        return { spinner: 24, text: 14, icon: "w-6 h-6" };
    }
  };

  const sizes = getSizes();

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
    const { updatePost } = useFeedbirdStore.getState();
    const post = useFeedbirdStore.getState().getPost(postId);
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
      className="relative flex items-center w-full h-full cursor-pointer transition-colors duration-150 pl-3 pr-1 py-1"
      // Click selection is handled by the parent FocusCell (like BlocksPreview)
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop overlay - shown when dragging files over the cell */}
      {shouldShowDropOverlay && (
        <div className="absolute inset-0 flex items-center justify-center z-10 border border-[1px] border-solid border-main">
          <div className="flex flex-row items-center gap-2 absolute transition-all duration-200 left-1/2 -translate-x-1/2">
            <span className="text-sm text-main font-normal whitespace-nowrap">
              Drop files here
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
           {uploads.map((up: any) => {
             const thumbHeight = getRowHeightPixels(rowHeight) > 10 ? getRowHeightPixels(rowHeight) - 8 : getRowHeightPixels(rowHeight);

             return (
               <div
                 key={up.id}
                 className="relative flex-shrink-0 rounded-[2px] bg-black/10 overflow-hidden aspect-square"
                 style={{ height: `${thumbHeight}px`, width: `${thumbHeight}px`, border: "0.5px solid #D0D5D0" }}
               >
                 {renderFilePreview(up.file, thumbHeight)}
                 
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
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
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
                      style={{ fontSize: `${sizes.text}px` }}
                    >
                      {typeof up.progress === "number" ? `${Math.round(up.progress)}%` : ""}
                    </span>
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
                      style={{ fontSize: `${sizes.text}px` }}
                    >
                      100%
                    </span>
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

                     {/* Existing attachments */}
           {attachments.map((attachment) => {
             const thumbHeight = getRowHeightPixels(rowHeight) > 10 ? getRowHeightPixels(rowHeight) - 8 : getRowHeightPixels(rowHeight);

             return (
               <div
                 key={attachment.id}
                 className="relative flex-shrink-0 rounded-[2px] bg-gray-100 overflow-hidden aspect-square group"
                 style={{ height: `${thumbHeight}px`, width: `${thumbHeight}px`, border: "0.5px solid #D0D5D0" }}
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

                {/* Remove button - shown on hover */}
                {isHovered && (
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAttachment(attachment.id);
                    }}
                    data-preview-exempt
                  >
                    <X className="w-2 h-2" />
                  </button>
                key={attachment.id}
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
                )}


              </div>
            );
          })}
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
        className="hidden"
        data-preview-exempt
        onChange={handleFileSelect}
      />
    </div>
  );
}
