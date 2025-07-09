/* app/(content)/static/_inner.tsx */
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Status, useFeedbirdStore, FeedbirdStore, Post } from "@/lib/store/use-feedbird-store";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";

import { PostTable } from "@/components/content/post-table/post-table";
import CalendarView from "@/components/content/content-calendar/calendar-view";
import { PostRecordModal } from "@/components/content/post-record-modal/post-record-modal";

export function ApprovalsInner() {
  // Decide which view: 'table' or 'calendar'
  const search = useSearchParams();
  const view = search.get("view") === "calendar" ? "calendar" : "table";

  // Gather posts across *all brands* in the active workspace, filtering for
  // those that are either Pending Approval or Revised.
  const posts = useStoreWithEqualityFn(
    useFeedbirdStore,
    (s: FeedbirdStore): Post[] => {
      const ws = s.getActiveWorkspace();
      const allPosts = ws ? ws.brands.flatMap((b) => b.contents) : [];
      return allPosts.filter(
        (p) => p.status === "Pending Approval" || p.status === "Revised"
      );
    },
    shallow
  );

  // For opening the record modal:
  const [openPostId, setOpenPostId] = useState<string | null>(null);

  // Render either the calendar or the table:
  return (
    <>
      {view === "calendar" ? (
        <CalendarView
          posts={posts}
          onOpen={(id) => setOpenPostId(id)}
          // If calendar needs to update store, you can do that directly there
          // or pass a store updater function. 
        />
      ) : (
        <PostTable
          posts={posts}
          onOpen={(id) => setOpenPostId(id)}
        />
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
