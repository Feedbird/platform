"use client";

import { useEffect, useMemo } from "react";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { toast } from "sonner";
import { useUploadStore, UploadStatus } from "@/lib/store/upload-store";
import { getCurrentUserDisplayName } from "@/lib/utils/user-utils";
import { Attachment } from "@/components/content/post-table/AttachmentCell";

export type AttachmentUploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  xhr?: XMLHttpRequest;
};

export function useAttachmentUploader({ postId, columnId }: { postId: string; columnId: string }) {
  const allUploads = useUploadStore((state) => state.uploads);
  const uploads = useMemo(() => allUploads.filter((u) => u.postId === postId && u.columnId === columnId), [allUploads, postId, columnId]);
  const uploadActions = useUploadStore.getState();

  const wid = useFeedbirdStore((s) => s.activeWorkspaceId);
  const bid = useFeedbirdStore((s) => s.activeBrandId);
  const updatePost = useFeedbirdStore((s) => s.updatePost);

  const startUploads = (files: File[]) => {
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    const validFiles = files.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" is too large`, {
          description: "Files cannot exceed 100MB.",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newUploads: AttachmentUploadItem[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: "uploading",
    }));

    newUploads.forEach((up) =>
      uploadActions.addUpload({
        id: up.id,
        postId,
        columnId,
        file: up.file,
        previewUrl: up.previewUrl,
        progress: 0,
        status: "uploading",
      })
    );

    const uploadPromises = newUploads.map(async (up) => {
      try {
        // 1. Get a signed URL from our API
        const qs = new URLSearchParams();
        if (wid) qs.append("wid", wid);
        if (bid) qs.append("bid", bid);
        if (postId) qs.append("pid", postId);
        if (columnId) qs.append("cid", columnId);
        const url = `/api/media/request-upload-url${qs.toString() ? "?" + qs.toString() : ""}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: up.file.name, fileType: up.file.type }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.details || `Server responded with ${res.status}`);
        }
        
        const { uploadUrl, publicUrl } = await res.json();
        if (!uploadUrl || !publicUrl) throw new Error("Invalid response from server");

        // 2. Upload the file to R2 using the signed URL
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          let lastUpdateTime = 0;
          const throttleInterval = 250; // ms

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const now = Date.now();
              if (now - lastUpdateTime > throttleInterval || e.loaded === e.total) {
                lastUpdateTime = now;
                const pct = Math.round((e.loaded / e.total) * 100);
                const newStatus = pct >= 100 ? "processing" : "uploading";
                uploadActions.updateUpload(up.id, { progress: pct, status: newStatus as UploadStatus });
              }
            }
          };

          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else {
                reject(new Error(`Upload to R2 failed with status ${xhr.status}`));
              }
            }
          };

          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader('Content-Type', up.file.type);
          xhr.send(up.file);
        });
        
        toast.success(`${up.file.name} uploaded`);
        uploadActions.updateUpload(up.id, { progress: 100, status: "done" });
        
        // Show "Uploaded" state for 1 second, then remove upload and add attachment
        setTimeout(async () => {
          // First remove the upload (this will hide the "Uploaded" state)
          uploadActions.removeUpload(up.id);
          
          // Then add the attachment to the post
          try {
            // 3. Create the attachment object
            const attachment: Attachment = {
              id: crypto.randomUUID(),
              name: up.file.name,
              url: publicUrl,
              type: up.file.type,
              size: up.file.size,
              uploadedAt: new Date(),
            };

            // 4. Get the current post and update its user columns
            const store = useFeedbirdStore.getState();
            const post = store.getPost(postId);
            
            if (post) {
              // Get current user columns or initialize empty array
              const currentUserColumns = post.user_columns || [];
              
              // Find the column we're updating
              const columnIndex = currentUserColumns.findIndex(col => col.id === columnId);
              
              let newUserColumns;
              if (columnIndex >= 0) {
                // Column exists, update its value
                const currentValue = currentUserColumns[columnIndex].value;
                const currentAttachments = typeof currentValue === 'string' ? JSON.parse(currentValue) : [];
                const newAttachments = [...currentAttachments, attachment];
                
                newUserColumns = [...currentUserColumns];
                newUserColumns[columnIndex] = {
                  ...newUserColumns[columnIndex],
                  value: JSON.stringify(newAttachments)
                };
              } else {
                // Column doesn't exist, create it
                newUserColumns = [
                  ...currentUserColumns,
                  {
                    id: columnId,
                    value: JSON.stringify([attachment])
                  }
                ];
              }

              // 5. Update post in database and sync with Zustand store
              // Note: user_columns values are already stored as JSON strings
              await updatePost(postId, { user_columns: newUserColumns } as any);
              
              // Update the post in the Zustand store
              // Note: The store.updatePost is already called via the updatePost function above
            }
          } catch (error) {
            console.error('Failed to update post after upload:', error);
            toast.error(`Failed to update post data for ${up.file.name}`, { 
              description: error instanceof Error ? error.message : "Unknown error" 
            });
          }
        }, 1000); // Show "Uploaded" for 1 second before removing upload and adding attachment

      } catch (err: any) {
        console.error("Upload failed for", up.file.name, err);
        toast.error(`${up.file.name} failed`, { description: err.message ?? "Unknown error" });
        uploadActions.updateUpload(up.id, { status: "error" });
        setTimeout(() => uploadActions.removeUpload(up.id), 3000);
      }
    });

    Promise.allSettled(uploadPromises);
  };

  useEffect(() => {
    return () => {
      // On unmount, nothing to do because uploads are tracked globally.
    };
  }, []);

  return { uploads, startUploads };
}
