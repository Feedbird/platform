"use client";

import { useState, useRef, useEffect } from "react";
import { useFeedbirdStore, FileKind } from "@/lib/store/use-feedbird-store";
import { toast } from "sonner";

export type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  xhr?: XMLHttpRequest;
};

export function useUploader({ postId }: { postId: string }) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;

  const wid = useFeedbirdStore((s) => s.activeWorkspaceId);
  const bid = useFeedbirdStore((s) => s.activeBrandId);
  const addBlock = useFeedbirdStore((s) => s.addBlock);
  const addVersion = useFeedbirdStore((s) => s.addVersion);
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

    const newUploads: UploadItem[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: "uploading",
    }));

    setUploads((u) => [...u, ...newUploads]);

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
          setUploads((current) => current.map((u) => (u.id === up.id ? { ...u, xhr } : u)));

          let lastUpdateTime = 0;
          const throttleInterval = 250; // ms

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const now = Date.now();
              if (now - lastUpdateTime > throttleInterval || e.loaded === e.total) {
                lastUpdateTime = now;
                const pct = Math.round((e.loaded / e.total) * 100);
                const newStatus = pct >= 100 ? "processing" : "uploading";
                setUploads((current) =>
                  current.map((it) => (it.id === up.id ? { ...it, progress: pct, status: newStatus } : it))
                );
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
        
        // 3. Update the post with the new block
        const kind: FileKind = up.file.type.startsWith("video") ? "video" : "image";
        const blockId = addBlock(postId, kind);
        addVersion(postId, blockId, { by: "Me", caption: "", file: { kind, url: publicUrl } });
        
        toast.success(`${up.file.name} uploaded`);
        setUploads((current) => current.map((it) => (it.id === up.id ? { ...it, progress: 100, status: "done" } : it)));

      } catch (err: any) {
        console.error("Upload failed for", up.file.name, err);
        toast.error(`${up.file.name} failed`, { description: err.message ?? "Unknown error" });
        setUploads((current) => current.map((it) => (it.id === up.id ? { ...it, status: "error" } : it)));
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
        else if (imgCnt === 1 && vidCnt === 0) newFormat = "static";
        else if (imgCnt >= 2 || (imgCnt >= 1 && vidCnt > 0)) newFormat = "carousel";
        if (newFormat !== post.format) updatePost(postId, { format: newFormat });
      }
    });
  };

  useEffect(() => {
    const currentUploads = uploadsRef.current;
    const timer = setInterval(() => {
      setUploads((prev) => {
        const kept = prev.filter((u) => u.status !== "done");
        const removed = prev.filter((u) => u.status === "done");
        removed.forEach((u) => URL.revokeObjectURL(u.previewUrl));
        return kept;
      });
    }, 1500);

    return () => {
      clearInterval(timer);
      // Abort any pending uploads and revoke all blob URLs
      currentUploads.forEach((u) => {
        if (u.xhr && u.status === "uploading") {
          u.xhr.abort();
        }
        URL.revokeObjectURL(u.previewUrl);
      });
    };
  }, []);

  return { uploads, startUploads };
} 