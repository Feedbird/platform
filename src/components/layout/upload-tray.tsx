"use client";

import React, { useMemo, useState } from "react";
import { useUploadStore } from "@/lib/store/upload-store";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[i]}`;
}

export default function UploadTray() {
  const uploads = useUploadStore((s) => s.uploads);

  const [expanded, setExpanded] = useState<boolean>(false);
  const [pausedAll, setPausedAll] = useState<boolean>(false);
  const [hidden, setHidden] = useState<boolean>(false);

  const totals = useMemo(() => {
    const total = uploads.length;
    const uploaded = uploads.filter((u) => u.status === "done").length;
    const paused = 0; // pause not wired yet
    const queued = 0; // queue not implemented; show 0 for now
    const avgProgress = total === 0 ? 0 : Math.round(uploads.reduce((acc, u) => acc + (u.progress ?? 0), 0) / total);
    return { total, uploaded, paused, queued, avgProgress };
  }, [uploads]);

  if (!uploads.length || hidden) return null;

  const statusText = (() => {
    if (totals.uploaded === totals.total && totals.total > 0) return (
      <span className="text-sm text-[#03985C] font-normal">Upload complete</span>
    );
    if (pausedAll) return <span className="text-sm text-white font-normal">All uploads paused</span>;
    return <span className="text-sm text-white font-normal">a few seconds remaining</span>;
  })();

  const rightActionIcon = pausedAll ? <img src="/images/boards/resume.svg" alt="Play" className="w-4 h-4" /> : <img src="/images/boards/pause.svg" alt="Pause" className="w-4 h-4" />;

  return (
    <div className="fixed bottom-4 right-4 z-[2000] w-[360px] select-none">
      {/* Main area */}
      <div className="rounded-[10px] overflow-hidden shadow-lg bg-[#EEEEEE]">
        <div className="bg-black px-4 py-3">
        {/* Header Row */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <span className="text-white text-base font-medium">
              Uploading {totals.total} {totals.total === 1 ? "file" : "files"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Pause/Resume All (UI only) */}
            <button
              className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-white/10 cursor-pointer"
              title={pausedAll ? "Resume all (not yet wired)" : "Pause all (not yet wired)"}
              onClick={() => setPausedAll((p) => !p)}
            >
              {rightActionIcon}
            </button>
            {/* Expand/Collapse */}
            <button
              className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-white/10 cursor-pointer"
              title={expanded ? "Collapse" : "Expand"}
              onClick={() => setExpanded((e) => !e)}
            >
              <img src="/images/boards/expand.svg" alt="Expand" className="w-4 h-4" />
            </button>
            {/* Close */}
            <button
              className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-white/10 cursor-pointer"
              title="Close"
              onClick={() => setHidden(true)}
            >
              <img src="/images/boards/close.svg" alt="Close" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtext */}
          <div className="flex items-center gap-1.5 pb-3">
            <span className="text-sm text-grey font-normal">{totals.uploaded}/{totals.total} uploaded</span>
            <span className="w-1 h-1 rounded-full bg-grey" />
            {statusText}
          </div>

        {/* Progress bar (figma-inspired) */}
          <div className="self-stretch h-1 relative bg-[#4F4F4F] rounded-[100px] overflow-hidden">
            <div
              className="h-1 left-0 top-0 absolute bg-gradient-to-r from-blue-500 to-indigo-300 rounded-[100px]"
              style={{ width: `${totals.avgProgress}%` }}
            />
          </div>
        </div>

        {/* Details area */}
        {expanded && (
          <div>
            <div className="flex flex-col bg-white border-l-2 border-main">
              {uploads.map((u) => {
                const isDone = u.status === "done";
                const isPaused = pausedAll; // per-item pause not wired yet
                const showBar = !isPaused && !isDone;
                const pct = Math.max(0, Math.min(100, u.progress ?? 0));
                return (
                  <div key={u.id} className="px-4 py-3.5">
                    <div className="flex items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            {/* First line: file name and size */}
                            <div className="flex items-center gap-2">
                              <span className="truncate text-black text-base font-medium">{u.file.name}</span>
                              <span className="text-xs text-grey font-normal">{formatBytes(u.file.size)}</span>
                            </div>
                            {/* Second line: status */}
                            <div className="flex items-center gap-1.5 text-sm text-grey font-normal mt-2">
                              {isDone ? (
                                <span style={{ color: "#03985C" }}>Upload complete</span>
                              ) : isPaused ? (
                                <>
                                  <span>{pct}%</span>
                                  <span className="w-1 h-1 rounded-full bg-[#D9D9D9]" />
                                  <span>Paused</span>
                                </>
                              ) : (
                                <span>{pct}%</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isDone ? (
                              <div
                                className="inline-flex items-center justify-center cursor-pointer"
                                onClick={() => setPausedAll((p) => !p)}
                              >
                                {isPaused ? (
                                  <img src="/images/boards/resume.svg" alt="Resume" className="w-4 h-4" />
                                ) : (
                                  <img src="/images/boards/pause.svg" alt="Pause" className="w-4 h-4" />
                                )}
                              </div>
                            ) : (
                              <a
                                className="inline-flex items-center text-sm text-main font-normal cursor-pointer"
                                title="View"
                                href={u.previewUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View
                              </a>
                            )}
                            {/* X shows when paused (UI only) */}
                            {isPaused && !isDone && (
                              <div
                                className="inline-flex items-center justify-center cursor-pointer"
                              >
                                <img src="/images/boards/close.svg" alt="Remove" className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                        {showBar && (
                          <div className="mt-3">
                            <div className="h-1 relative bg-elementStroke rounded-[100px] overflow-hidden">
                              <div
                                className="h-1 left-0 top-0 absolute bg-gradient-to-r from-blue-500 to-indigo-300 rounded-[100px]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between bg-[#EEEEEE] text-sm text-grey font-medium px-4 py-1.5 shadow-lg">
              <div className="flex items-center">
                {[
                  { label: "All", count: totals.total },
                  { label: "Queued", count: totals.queued },
                  { label: "Paused", count: totals.paused },
                  { label: "Uploaded", count: totals.uploaded },
                ]
                  .filter(item => item.count > 0)
                  .map((item, idx, arr) => (
                    <React.Fragment key={item.label}>
                      <span>{item.label} ({item.count})</span>
                      {idx < arr.length - 1 && (
                        <span className="mx-2 text-buttonStroke">|</span>
                      )}
                    </React.Fragment>
                  ))}
              </div>
              {totals.uploaded !== totals.total && (
                <div
                  className="cursor-pointer"
                  title="Cancel all (not yet wired)"
                >
                  Cancel All
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


