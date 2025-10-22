/* app/(content)/static/_inner.tsx */
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePostStore, useWorkspaceStore, Post } from "@/lib/store";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";

import { PostTable } from "@/components/content/post-table/post-table";
import CalendarView from "@/components/content/content-calendar/calendar-view";
import GridView from "@/components/content/content-grid/grid-view";
import { PostRecordModal } from "@/components/content/post-record-modal/post-record-modal";
import { PostStore } from "@/lib/store/post-store";

export function ApprovalsInner() {
  // Decide which view: 'table', 'calendar', or 'grid'
  const search = useSearchParams();
  const view = search.get("view") === "calendar" ? "calendar" : 
               search.get("view") === "grid" ? "grid" : "table";

  // Gather posts across *all boards* in the active workspace, filtering for
  // those that are either Pending Approval or Revised.
  const posts = useStoreWithEqualityFn(
    usePostStore,
    (s: PostStore): Post[] => {
      const ws = useWorkspaceStore.getState().getActiveWorkspace();
      const allPosts = ws ? s.getAllPosts() : [];
      return allPosts?.filter(
        (p) => p.status === "Pending Approval" || p.status === "Revised"
      ) ?? [];
    },
    shallow
  );

  // For opening the record modal:
  const [openPostId, setOpenPostId] = useState<string | null>(null);

  // Render the appropriate view:
  return (
    <>
      {view === "calendar" ? (
        <CalendarView
          posts={posts}
          onOpen={(id) => setOpenPostId(id)}
          // If calendar needs to update store, you can do that directly there
          // or pass a store updater function. 
        />
      ) : view === "grid" ? (
        <GridView
          posts={posts}
          onOpen={(id) => setOpenPostId(id)}
        />
      ) : (
        <PostTable
          posts={posts}
          onOpen={(id) => setOpenPostId(id)}
        />
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
