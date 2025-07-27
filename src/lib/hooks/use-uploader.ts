"use client";

import { useEffect, useMemo } from "react";
// equality function not supported in our zustand version
import { useFeedbirdStore, FileKind } from "@/lib/store/use-feedbird-store";
import { toast } from "sonner";
import { useUploadStore, UploadStatus } from "@/lib/store/upload-store";

export type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  xhr?: XMLHttpRequest;
};

export function useUploader({ postId }: { postId: string }) {
  const allUploads = useUploadStore((state) => state.uploads);
  const uploads = useMemo(() => allUploads.filter((u) => u.postId === postId), [allUploads, postId]);
  const uploadActions = useUploadStore.getState();

  const wid = useFeedbirdStore((s) => s.activeWorkspaceId);
  const bid = useFeedbirdStore((s) => s.activeBrandId);
  const addBlock = useFeedbirdStore((s) => s.addBlock);
  const addVersion = useFeedbirdStore((s) => s.addVersion);
  const updatePost = useFeedbirdStore((s) => s.updatePost);
  // const uploadStore = useUploadStore.getState(); // no longer needed

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

    const newUploads: UploadItem[] = validFiles.map((file) => ({
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
        
        // Show "Uploaded" status for 2 seconds, then add the block and remove the upload
        setTimeout(() => {
          // 3. Update the post with the new block
          const kind: FileKind = up.file.type.startsWith("video") ? "video" : "image";
          const blockId = addBlock(postId, kind);
          addVersion(postId, blockId, { by: "Me", caption: "", file: { kind, url: publicUrl } });
          
          // Remove the upload immediately after adding the block
          uploadActions.removeUpload(up.id);
        }, 2000);

      } catch (err: any) {
        console.error("Upload failed for", up.file.name, err);
        toast.error(`${up.file.name} failed`, { description: err.message ?? "Unknown error" });
        uploadActions.updateUpload(up.id, { status: "error" });
        setTimeout(() => uploadActions.removeUpload(up.id), 3000);
      }
    });

    Promise.allSettled(uploadPromises).then(() => {
      const state = useFeedbirdStore.getState();
      const post = state.getPost(postId);
      if (post) {
        const imgCnt = post.blocks.filter((b) => b.kind === "image").length;
        const vidCnt = post.blocks.filter((b) => b.kind === "video").length;
        let newFormat = post.format;
        if (vidCnt > 0 && imgCnt === 0) newFormat = "video";
        else if (imgCnt === 1 && vidCnt === 0) newFormat = "image";
        else if (imgCnt >= 2 || (imgCnt >= 1 && vidCnt > 0)) newFormat = "carousel";
        if (newFormat !== post.format) updatePost(postId, { format: newFormat });
      }
    });
  };

  useEffect(() => {
    return () => {
      // On unmount, nothing to do because uploads are tracked globally.
    };
  }, []);

  return { uploads, startUploads };
} 