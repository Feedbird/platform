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

  // Pull all store-based posts, then filter for static formats:
  const posts = useStoreWithEqualityFn(
    useFeedbirdStore,
    (s: FeedbirdStore): Post[] =>
      s
        .getActivePosts()
        .filter(
          (p) => p.status === 'Pending' as Status
        ),
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
