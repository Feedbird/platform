"use client";

import { useEffect, useMemo } from "react";
// equality function not supported in our zustand version
import { useFeedbirdStore, FileKind, Post } from "@/lib/store/use-feedbird-store";
import { toast } from "sonner";
import { useUploadStore, UploadStatus } from "@/lib/store/upload-store";
import { getCurrentUserDisplayName } from "@/lib/utils/user-utils";
let ffmpegInstance: any = null;
async function ensureFfmpegLoaded() {
  if (!ffmpegInstance) {
    const mod = await import("@ffmpeg/ffmpeg/dist/ffmpeg.min.js");
    const coreBase = typeof window !== 'undefined' ? `${window.location.origin}/ffmpeg/` : undefined;
    const primaryCorePath = coreBase ? `${coreBase}ffmpeg-core.js` : undefined;
    ffmpegInstance = mod.createFFmpeg({ log: false, corePath: primaryCorePath });
    console.log("ffmpegInstance", ffmpegInstance);
    (ffmpegInstance as any)._fetchFile = mod.fetchFile;
  }
  if (!ffmpegInstance.isLoaded()) {
    console.log("ffmpegInstance is not loaded");
    try {
      await ffmpegInstance.load();
    } catch (e) {
      // If local assets are unavailable, propagate to let caller use canvas fallback
      console.warn('[ffmpeg] Failed to load local core at /ffmpeg. Falling back to canvas thumbnail. Error:', e);
      throw e;
    }
  }
  return ffmpegInstance;
}

async function generateThumbWithFfmpeg(file: File): Promise<Blob> {
  const ffmpeg = await ensureFfmpegLoaded();
  console.log("ffmpeg is loaded", ffmpeg.isLoaded());
  // Use safe fixed name in MEMFS; keep correct extension for container sniffing
  const ext = file.type.includes('webm') ? 'webm' : file.type.includes('quicktime') ? 'mov' : 'mp4';
  const inName = `input.${ext}`;
  const outName = 'thumb.jpg';
  ffmpeg.FS('writeFile', inName, await (ffmpeg as any)._fetchFile(file));
  // Faster seek by placing -ss before -i; limit work to a single frame
  await ffmpeg.run(
    '-ss', '1',
    '-i', inName,
    '-frames:v', '1',
    '-vf', 'scale=640:-1',
    '-q:v', '2',
    outName
  );
  const data = ffmpeg.FS('readFile', outName);
  ffmpeg.FS('unlink', inName);
  ffmpeg.FS('unlink', outName);
  return new Blob([data.buffer], { type: 'image/jpeg' });
}

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
  const updatePostAfterUpload = useUploadStore.getState().updatePostAfterUpload;
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

        // If video: generate a thumbnail client-side before uploading
        let thumbnailPublicUrl: string | undefined;
        if (up.file.type.startsWith("video/")) {
          try {
            // Try ffmpeg.wasm first
            let thumbBlob: Blob | null = null;
            try {
              thumbBlob = await generateThumbWithFfmpeg(up.file);
              console.log("Thumbnail generated with ffmpeg.wasm");
            } catch(e) {
              console.log("Thumbnail generation failed with ffmpeg.wasm", e);
              thumbBlob = null;
            }
            if (!thumbBlob) {
              // Fallback to canvas capture
              const dataUrl = await new Promise<string>((resolve, reject) => {
                const video = document.createElement('video');
                video.muted = true;
                video.playsInline = true;
                video.preload = 'metadata';
                const objectUrl = URL.createObjectURL(up.file);
                video.src = objectUrl;
                const onError = () => {
                  URL.revokeObjectURL(objectUrl);
                  reject(new Error('Failed to load video for thumbnail'));
                };
                video.onerror = onError;
                video.onloadeddata = () => {
                  const target = Math.min(Math.max(0.5, video.duration * 0.1), Math.max(video.duration - 0.1, 0.5));
                  const capture = () => {
                    try {
                      const canvas = document.createElement('canvas');
                      const maxWidth = 640;
                      const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
                      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
                      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
                      const ctx = canvas.getContext('2d');
                      if (!ctx) throw new Error('Canvas not supported');
                      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                      const url = canvas.toDataURL('image/jpeg', 0.85);
                      URL.revokeObjectURL(objectUrl);
                      resolve(url);
                    } catch (e) {
                      URL.revokeObjectURL(objectUrl);
                      reject(e);
                    }
                  };
                  try {
                    video.currentTime = target;
                    video.onseeked = capture;
                    setTimeout(() => { if (!video.seeking) capture(); }, 500);
                  } catch { capture(); }
                };
              });
              const res2 = await fetch(dataUrl);
              thumbBlob = await res2.blob();
              console.log("Thumbnail generated with canvas capture", thumbBlob);
            }

            const thumbFile = new File([thumbBlob], `${up.file.name.replace(/\.[^.]+$/, '')}-thumb.jpg`, { type: 'image/jpeg' });

            // Request signed URL for thumbnail
            const thumbRes = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileName: thumbFile.name, fileType: thumbFile.type }),
            });
            if (thumbRes.ok) {
              const { uploadUrl: thumbUploadUrl, publicUrl: thumbPublicUrl } = await thumbRes.json();
              await fetch(thumbUploadUrl, { method: 'PUT', headers: { 'Content-Type': thumbFile.type }, body: thumbFile });
              thumbnailPublicUrl = thumbPublicUrl;
            }
          } catch (e) {
            console.warn('Thumbnail generation failed; continuing without thumbnail', e);
          }
        }

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
        
        //toast.success(`${up.file.name} uploaded`);
        uploadActions.updateUpload(up.id, { progress: 100, status: "done" });
        
                 // Show "Uploaded" state for 1 second, then remove upload and add block
         setTimeout(async () => {
           // First remove the upload (this will hide the "Uploaded" state)
           uploadActions.removeUpload(up.id);
           
           // Then add the block to the store (this will make it appear in the UI)
           try {
             // 3. Update the post with the new block in Zustand store
             const kind: FileKind = up.file.type.startsWith("video") ? "video" : "image";
             const blockId = addBlock(postId, kind);
             const currentUser = getCurrentUserDisplayName();
             const versionId = addVersion(postId, blockId, { by: currentUser, caption: "", file: { kind, url: publicUrl, ...(thumbnailPublicUrl ? { thumbnailUrl: thumbnailPublicUrl } : {}) } });
             
             // 4. Get the updated post data from Zustand store
             const store = useFeedbirdStore.getState();
             const post = store.getPost(postId);
             
             if (post) {
               // 5. Update post data in database and sync with Zustand store
               await updatePostAfterUpload(postId, post.blocks);
               
               // 6. Update format and status after block is added
               const imgCnt = post.blocks.filter((b) => b.kind === "image").length;
               const vidCnt = post.blocks.filter((b) => b.kind === "video").length;
               let newFormat = post.format;
               if (vidCnt > 0 && imgCnt === 0) newFormat = "video";
               else if (imgCnt === 1 && vidCnt === 0) newFormat = "image";
               else if (imgCnt >= 2 || (imgCnt >= 1 && vidCnt > 0)) newFormat = "carousel";
               
               // Prepare updates object
               const updates: Partial<Post> = {};
               if (newFormat !== post.format) {
                 updates.format = newFormat;
               }
               
               // Auto-set status to "Pending Approval" if conditions are met
               const hasNonEmptyCaption = post.caption.default && post.caption.default.trim() !== "";
               const isFirstBlock = post.blocks.length === 1; // This is the first block being added
               const isDraftStatus = post.status === "Draft";
               
               if (isFirstBlock && isDraftStatus && hasNonEmptyCaption) {
                 updates.status = "Pending Approval";
               }
               
               // Apply all updates in a single call
               if (Object.keys(updates).length > 0) {
                 updatePost(postId, updates);
               }
             }
           } catch (error) {
             console.error('Failed to update post after upload:', error);
             toast.error(`Failed to update post data for ${up.file.name}`, { 
               description: error instanceof Error ? error.message : "Unknown error" 
             });
           }
         }, 1000); // Show "Uploaded" for 1 second before removing upload and adding block

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