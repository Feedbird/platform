"use client";

import React from "react";
import { useUploadStore } from "@/lib/store/upload-store";

export default function UploadProgressBanner() {
  const uploads = useUploadStore((state) => state.uploads);

  if (!uploads.length) return null;

  // Show the first (oldest) active upload
  const current = uploads[0];

  const pct = Math.max(0, Math.min(100, current.progress));

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] px-4 py-2 rounded-md shadow"
      style={{ backgroundColor: "#E6F0FF" }}
    >
      <span className="text-sm font-medium text-black whitespace-nowrap">
        {`Uploading '${current.file.name}' ${pct}%`}
      </span>
    </div>
  );
} 