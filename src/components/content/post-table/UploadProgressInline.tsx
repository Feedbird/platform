"use client";

import React from "react";
import { useUploadStore } from "@/lib/store/upload-store";
import { cn } from "@/lib/utils";

export default function UploadProgressInline({ className }: { className?: string }) {
  const uploads = useUploadStore((state) => state.uploads);
  if (!uploads.length) return null;
  const current = uploads[0];
  const pct = Math.max(0, Math.min(100, current.progress));
  return (
    <div
      className={cn("px-3 py-1 rounded-md", className)}
      style={{ backgroundColor: "#B6D3FF" }}
    >
      <span className="text-sm font-medium text-black whitespace-nowrap">
        {`Uploading '${current.file.name}' ${pct}%`}
      </span>
    </div>
  );
}