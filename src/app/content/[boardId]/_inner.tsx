"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { useFeedbirdStore, FeedbirdStore, Post } from "@/lib/store/use-feedbird-store";
import { shallow } from "zustand/shallow";

import dynamic from "next/dynamic";

const PostTable = dynamic(() => import("@/components/content/post-table/post-table").then(m => m.PostTable), {
  ssr: false,
  loading: () => <div className="p-4">Loading table...</div>,
});

const CalendarView = dynamic(() => import("@/components/content/content-calendar/calendar-view"), {
  ssr: false,
  loading: () => <div className="p-4">Loading calendar...</div>,
});
import { PostRecordModal } from "@/components/content/post-record-modal/post-record-modal";

/**
 * Generic, data-driven board inner component. Works for any board whose slug is
 * provided via the `[boardId]` route segment under `/content`.
 */
export function BoardInner() {
  // 1. Grab the slug from the URL.
  const params = useParams();
  const boardId = (params?.boardId as string) ?? "";

  // 2. Ensure the correct board is active in the global store so that nav etc. update.
  const setActiveBoard = useFeedbirdStore((s) => s.setActiveBoard);
  useEffect(() => {
    if (boardId) setActiveBoard(boardId);
  }, [setActiveBoard, boardId]);

  // 3. Decide which view: `table` (default) or `calendar` based on query param.
  const search = useSearchParams();
  const view = search.get("view") === "calendar" ? "calendar" : "table";

  // 4. Pull all posts for the current brand, filtered by the active board.
  // Grab the entire contents array of the active brand once. Because the array
  // reference only changes when posts themselves change, this prevents
  // re-rendering on unrelated store updates (e.g. other settings toggles).
  const allPosts = useStoreWithEqualityFn(
    useFeedbirdStore,
    (s: FeedbirdStore): Post[] => s.getAllPosts(),
    shallow,
  );

  // Memo-filter by board so the `posts` array keeps a stable reference unless
  // its members actually change.
  const posts = React.useMemo(() => allPosts.filter((p) => p.boardId === boardId), [allPosts, boardId]);

  // 5. For opening the record modal.
  const [openPostId, setOpenPostId] = useState<string | null>(null);

  // 6. Render either the calendar or the table, plus the modal if needed.
  return (
    <>
      {view === "calendar" ? (
        <CalendarView posts={posts} onOpen={(id) => setOpenPostId(id)} />
      ) : (
        <PostTable posts={posts} onOpen={(id) => setOpenPostId(id)} />
      )}

      {openPostId && (
        <PostRecordModal
          postId={openPostId}
          open
          onClose={() => setOpenPostId(null)}
        />
      )}
    </>
  );
} 