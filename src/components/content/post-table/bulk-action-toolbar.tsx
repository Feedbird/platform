import * as React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { X as XIcon } from "lucide-react";
import { Post } from "@/lib/store";
import { Table } from "@tanstack/react-table";

export interface BulkActionToolbarProps {
  // Selected posts
  selectedPosts: Post[];
  
  // Undo message states
  showUndoMessage: boolean;
  showDuplicateUndoMessage: boolean;
  lastTrashedCount: number;
  lastDuplicatedCount: number;
  
  // Handlers
  updatePost: (postId: string, data: Partial<Post>) => void;
  handleDuplicatePosts: (posts: Post[]) => void;
  handleDeletePosts: (posts: Post[]) => void;
  handleUndoTrash: () => void;
  handleUndoDuplicate: () => void;
  
  // Table reference
  table: Table<Post>; // Table instance from react-table
}

export function BulkActionToolbar({
  selectedPosts,
  showUndoMessage,
  showDuplicateUndoMessage,
  lastTrashedCount,
  lastDuplicatedCount,
  updatePost,
  handleDuplicatePosts,
  handleDeletePosts,
  handleUndoTrash,
  handleUndoDuplicate,
  table,
}: BulkActionToolbarProps) {
  return (
    <>
      {/* ────────────────────────────────────────────────────────────────
          Bulk-action toolbar – shows up when rows are selected
      ────────────────────────────────────────────────────────────────── */}
      {selectedPosts.length > 0 &&
        !showUndoMessage &&
        !showDuplicateUndoMessage && (
        <div
          className="
            fixed bottom-4 left-1/2 -translate-x-1/2 z-10
            flex items-center gap-4
            bg-black border rounded-lg shadow-xl
            pl-2 pr-3 py-1.5 text-white gap-3
          "
        >
          {/* how many rows? */}
          <div
            className="py-2 px-3 rounded-md outline outline-1 outline-offset-[-1px] outline-white/20 inline-flex justify-start items-center gap-1 cursor-pointer"
            onClick={() => table.resetRowSelection()}
          >
            <span className="text-sm font-medium whitespace-nowrap">
              {selectedPosts.length} Selected
            </span>
            <XIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex justify-start items-center">
            {/* approve */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                // Define which statuses allow approval actions
                const allowedStatusesForApproval = [
                  "Pending Approval",
                  "Revised",
                  "Needs Revisions",
                    "Approved",
                ];

                  selectedPosts.forEach((post) => {
                  // Only approve if the status allows it
                  if (allowedStatusesForApproval.includes(post.status)) {
                    updatePost(post.id, { status: "Approved" });
                  }
                });
                table.resetRowSelection();
              }}
              className="gap-1.5 text-sm cursor-pointer"
            >
                <Image
                  src="/images/status/approved.svg"
                  alt="approved"
                  width={16}
                  height={16}
                />
              Approve
            </Button>

            {/* auto-schedule */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                  selectedPosts.forEach((post) => {
                  // Add your auto-schedule logic here
                  updatePost(post.id, { status: "Scheduled" });
                });
                table.resetRowSelection();
              }}
              className="gap-1 cursor-pointer"
            >
                <Image
                  src="/images/publish/clock-check.svg"
                  alt="approved"
                  width={16}
                  height={16}
                />
              Auto-Schedule
            </Button>

            {/* unschedule */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                  selectedPosts.forEach((post) => {
                  // Add your unschedule logic here
                  updatePost(post.id, { status: "Draft" });
                });
                table.resetRowSelection();
              }}
              className="gap-1 cursor-pointer"
            >
                <Image
                  src="/images/publish/clock-plus.svg"
                  alt="approved"
                  width={16}
                  height={16}
                />
              Unschedule
            </Button>

            {/* duplicate */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDuplicatePosts(selectedPosts)}
              className="gap-1 cursor-pointer"
            >
                <Image
                  src="/images/boards/duplicate.svg"
                  alt="approved"
                  width={16}
                  height={16}
                />
              Duplicate
            </Button>

            {/* delete */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeletePosts(selectedPosts)}
              className="gap-1 cursor-pointer"
            >
                <Image
                  src="/images/boards/delete-red.svg"
                  alt="approved"
                  width={16}
                  height={16}
                />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────
          Undo message – shows up when posts are moved to trash
      ────────────────────────────────────────────────────────────────── */}
      {showUndoMessage && (
        <div
          className="
            absolute bottom-4 left-4 z-10
            flex items-center
            bg-black border rounded-lg shadow-xl
            pl-4 pr-1 py-2 text-white gap-1
          "
        >
          <span className="text-sm font-medium whitespace-nowrap mr-3">
            {lastTrashedCount} record{lastTrashedCount > 1 ? "s" : ""} moved to
            trash
          </span>
          <div className="h-[16px] w-[1px] bg-white/20" />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUndoTrash}
            className="gap-1 cursor-pointer hover:text-black"
          >
            <span className="text-sm">Undo</span>
          </Button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────
          Duplicate undo message – shows up when posts are duplicated
      ────────────────────────────────────────────────────────────────── */}
      {showDuplicateUndoMessage && (
        <div
          className="
            absolute bottom-4 left-4 z-10
            flex items-center
            bg-black border rounded-lg shadow-xl
            pl-4 pr-1 py-2 text-white gap-1
          "
        >
          <span className="text-sm font-medium whitespace-nowrap mr-3">
            {lastDuplicatedCount} record{lastDuplicatedCount > 1 ? "s" : ""}{" "}
            duplicated
          </span>
          <div className="h-[16px] w-[1px] bg-white/20" />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUndoDuplicate}
            className="gap-1 cursor-pointer hover:text-black"
          >
            <span className="text-sm">Undo</span>
          </Button>
        </div>
      )}
    </>
  );
}
