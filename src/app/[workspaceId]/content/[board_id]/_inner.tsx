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

const GridView = dynamic(() => import("@/components/content/content-grid/grid-view"), {
  ssr: false,
  loading: () => <div className="p-4">Loading grid...</div>,
});
import { PostRecordModal } from "@/components/content/post-record-modal/post-record-modal";

/**
 * Generic, data-driven board inner component. Works for any board whose slug is
 * provided via the `[board_id]` route segment under `/content`.
 */
export function BoardInner() {
  // 1. Grab the slug from the URL.
  const params = useParams();
  const board_id = (params?.board_id as string) ?? "";
  // 2. Ensure the correct board is active in the global store so that nav etc. update.
  const setActiveBoard = useFeedbirdStore((s) => s.setActiveBoard);
  useEffect(() => {
    if (board_id) setActiveBoard(board_id);
  }, [setActiveBoard, board_id]);

  // 3. Decide which view: `table` (default), `calendar`, or `grid` based on query param.
  const search = useSearchParams();
  const view = search.get("view") === "calendar" ? "calendar" : 
               search.get("view") === "grid" ? "grid" : "table";

  // 4. Pull all posts for the current workspace, filtered by the active board.
  // Grab the entire contents array of the active workspace once. Because the array
  // reference only changes when posts themselves change, this prevents
  // re-rendering on unrelated store updates (e.g. other settings toggles).
  const allPosts = useStoreWithEqualityFn(
    useFeedbirdStore,
    (s: FeedbirdStore): Post[] => s.getAllPosts(),
    shallow,
  );

  // Memo-filter by board so the `posts` array keeps a stable reference unless
  // its members actually change.
  const posts = React.useMemo(() => allPosts.filter((p) => p.board_id === board_id), [allPosts, board_id]);
  // 5. For opening the record modal.
  const [openPostId, setOpenPostId] = useState<string | null>(null);

  // 6. Render the appropriate view, plus the modal if needed.
  return (
    <>
      {view === "calendar" ? (
        <CalendarView posts={posts} onOpen={(id) => setOpenPostId(id)} />
      ) : view === "grid" ? (
        <GridView posts={posts} onOpen={(id) => setOpenPostId(id)} />
      ) : (
        <PostTable posts={posts} onOpen={(id) => setOpenPostId(id)} />
      )}

      {openPostId && (
        <PostRecordModal
          selectedPost={posts.find(p => p.id === openPostId)!}
          open
          onClose={() => setOpenPostId(null)}
          onPostSelect={(postId) => setOpenPostId(postId)}
        />
      )}
    </>
  );
} 