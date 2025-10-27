import * as React from "react";
import { Row } from "@tanstack/react-table";
import { parse } from "date-fns";
import { Post, Status, ContentFormat, BoardRules, BoardGroupData, useWorkspaceStore, usePostStore, useUserStore } from "@/lib/store";
import { getCurrentUserDisplayName } from "@/lib/utils/user-utils";
import { getUserColumnValue, buildUpdatedUserColumnsArr, getFinalGroupRows } from "./utils";

export interface PostTableHandlersParams {
  // State
  tableData: Post[];
  trashedPosts: Post[];
  duplicatedPosts: Post[];
  selectedGroupData: { month: number; comments: any[] } | null;
  userColumns: any[];
  columnOrder: string[];
  editFieldOpen: boolean;
  editFieldTypeOpen: boolean;
  pendingInsertRef: { targetId: string; side: "left" | "right" } | null;
  grouping: string[];
  sorting: any[];
  rowHeight: any;
  captionLocked: boolean;
  selectedPlatform: any;
  editingPost: Post | null;
  editingUserText: { postId: string; colId: string } | null;
  
  // Setters
  setTableData: React.Dispatch<React.SetStateAction<Post[]>>;
  setTrashedPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setShowUndoMessage: React.Dispatch<React.SetStateAction<boolean>>;
  setLastTrashedCount: React.Dispatch<React.SetStateAction<number>>;
  setDuplicatedPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setShowDuplicateUndoMessage: React.Dispatch<React.SetStateAction<boolean>>;
  setLastDuplicatedCount: React.Dispatch<React.SetStateAction<number>>;
  setGroupFeedbackSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedGroupData: React.Dispatch<React.SetStateAction<{ month: number; comments: any[] } | null>>;
  setUserColumns: React.Dispatch<React.SetStateAction<any[]>>;
  setEditFieldOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditFieldColumnId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditFieldType: React.Dispatch<React.SetStateAction<string>>;
  setEditFieldOptions: React.Dispatch<React.SetStateAction<any[]>>;
  setEditFieldPanelPos: React.Dispatch<React.SetStateAction<{ top: number; left: number; align: "left" | "right" } | null>>;
  setPendingInsertRef: React.Dispatch<React.SetStateAction<{ targetId: string; side: "left" | "right" } | null>>;
  setNewFieldLabel: React.Dispatch<React.SetStateAction<string>>;
  setCaptionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingPost: React.Dispatch<React.SetStateAction<Post | null>>;
  setSelectedPlatform: React.Dispatch<React.SetStateAction<any>>;
  setCaptionLocked: React.Dispatch<React.SetStateAction<boolean>>;
  setUserTextOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingUserText: React.Dispatch<React.SetStateAction<{ postId: string; colId: string } | null>>;
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
  
  // Refs
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  undoTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  duplicateUndoTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  scrollTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  lastScrollLeftRef: React.MutableRefObject<number>;
  editFieldPanelRef: React.MutableRefObject<HTMLDivElement | null>;
  scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  tableRef: React.MutableRefObject<any>;
  anchorRowIdRef: React.MutableRefObject<string | null>;
  
  // External functions
  updatePost: (postId: string, data: any) => void;
  updateBoard: (boardId: string, data: any) => void;
  addGroupComment: (boardId: string, month: number, text: string, author: string) => void;
  addGroupMessage: (boardId: string, month: number, commentId: string, text: string, author: string, parentMessageId?: string) => void;
  resolveGroupComment: (boardId: string, month: number, commentId: string, author: string) => void;
  markGroupCommentRead: (boardId: string, month: number, commentId: string) => void;
  deleteGroupCommentAiSummaryItem: (boardId: string, month: number, commentId: string, summaryIndex: number) => void;
  setIsScrollable: React.Dispatch<React.SetStateAction<boolean>>;
  checkIfScrollable: () => void;
  openEditPanelAtElement: (el: HTMLElement | null) => void;
  onOpen?: (id: string) => void;
  
  // Board/workspace data
  activeBoardId: string | null;
  boardRules: BoardRules | undefined;
  table: any;
  rowComparator?: (a: Row<Post>, b: Row<Post>) => number;
}

export function usePostTableHandlers(params: PostTableHandlersParams) {
  const {
    // State
    tableData,
    trashedPosts,
    duplicatedPosts,
    selectedGroupData,
    userColumns,
    columnOrder,
    editFieldOpen,
    editFieldTypeOpen,
    pendingInsertRef,
    grouping,
    sorting,
    rowHeight,
    captionLocked,
    selectedPlatform,
    editingPost,
    editingUserText,
    
    // Setters
    setTableData,
    setTrashedPosts,
    setShowUndoMessage,
    setLastTrashedCount,
    setDuplicatedPosts,
    setShowDuplicateUndoMessage,
    setLastDuplicatedCount,
    setGroupFeedbackSidebarOpen,
    setSelectedGroupData,
    setUserColumns,
    setEditFieldOpen,
    setEditFieldColumnId,
    setEditFieldType,
    setEditFieldOptions,
    setEditFieldPanelPos,
    setPendingInsertRef,
    setNewFieldLabel,
    setCaptionOpen,
    setEditingPost,
    setSelectedPlatform,
    setCaptionLocked,
    setUserTextOpen,
    setEditingUserText,
    setColumnOrder,
    
    // Refs
    fileInputRef,
    undoTimeoutRef,
    duplicateUndoTimeoutRef,
    scrollTimeoutRef,
    lastScrollLeftRef,
    editFieldPanelRef,
    scrollContainerRef,
    tableRef,
    anchorRowIdRef,
    
    // External functions
    updatePost,
    updateBoard,
    addGroupComment,
    addGroupMessage,
    resolveGroupComment,
    markGroupCommentRead,
    deleteGroupCommentAiSummaryItem,
    setIsScrollable,
    checkIfScrollable,
    openEditPanelAtElement,
    onOpen,
    
    // Board/workspace data
    activeBoardId,
    boardRules,
    table,
    rowComparator,
  } = params;

  // CSV import / export handlers
  const handleExport = React.useCallback(() => {
    // dynamically import to avoid circular deps
    import("./csv").then(({ exportPostsToCSV }) => exportPostsToCSV(tableData));
  }, [tableData]);

  const onFileChange = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { importPostsFromCSV } = await import("./csv");
    const imported = await importPostsFromCSV(file);
    const merged = [...tableData, ...imported];
    setTableData(merged);
    usePostStore.getState().setActivePosts(merged);
    e.target.value = "";
  }, [tableData, setTableData]);

  const handleImport = React.useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  // Group feedback sidebar handlers
  const handleOpenGroupFeedback = React.useCallback((groupData: BoardGroupData, month: number) => {
    setSelectedGroupData({
      month: month,
      comments: groupData?.comments || [],
    });
    // Mark unresolved and unread comments as read for current user
    if (activeBoardId) {
      const email = useUserStore.getState().user?.email;
      if (email) {
        (groupData?.comments || [])
          .filter((c: any) => !c.resolved && !(c.readBy || []).includes(email))
          .forEach((c: any) => markGroupCommentRead(activeBoardId, month, c.id));
      }
    }
    setGroupFeedbackSidebarOpen(true);
  }, [activeBoardId, setSelectedGroupData, setGroupFeedbackSidebarOpen, markGroupCommentRead]);

  const handleCloseGroupFeedback = React.useCallback(() => {
    setGroupFeedbackSidebarOpen(false);
    setSelectedGroupData(null);
  }, [setGroupFeedbackSidebarOpen, setSelectedGroupData]);

  const handleAddGroupComment = React.useCallback((text: string) => {
    if (selectedGroupData && activeBoardId) {
      // Update the store first
      addGroupComment(
        activeBoardId,
        selectedGroupData.month,
        text,
        getCurrentUserDisplayName()
      );
    }
  }, [selectedGroupData, activeBoardId, addGroupComment]);

  const handleAddGroupMessage = React.useCallback((
    commentId: string,
    text: string,
    parentMessageId?: string
  ) => {
    if (selectedGroupData && activeBoardId) {
      // Update the store first
      addGroupMessage(
        activeBoardId,
        selectedGroupData.month,
        commentId,
        text,
        getCurrentUserDisplayName(),
        parentMessageId
      );
    }
  }, [selectedGroupData, activeBoardId, addGroupMessage]);

  const handleResolveGroupComment = React.useCallback((commentId: string) => {
    if (selectedGroupData && activeBoardId) {
      // Update the store first
      resolveGroupComment(
        activeBoardId,
        selectedGroupData.month,
        commentId,
        getCurrentUserDisplayName()
      );
    }
  }, [selectedGroupData, activeBoardId, resolveGroupComment]);

  const handleDeleteAiSummary = React.useCallback((commentId: string, summaryIndex: number) => {
    if (selectedGroupData && activeBoardId) {
      deleteGroupCommentAiSummaryItem(
        activeBoardId,
        selectedGroupData.month,
        commentId,
        summaryIndex
      );
    }
  }, [selectedGroupData, activeBoardId, deleteGroupCommentAiSummaryItem]);

  // Scroll handler
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;

    if (el.scrollLeft !== lastScrollLeftRef.current) {
      // Add the class immediately on any horizontal scroll
      el.classList.add("scrolling-horiz");

      // Clear previous timer and schedule its removal
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        el.classList.remove("scrolling-horiz");
      }, 150); // duration after scroll stops
    }

    lastScrollLeftRef.current = el.scrollLeft;
  }, [lastScrollLeftRef, scrollTimeoutRef]);

  // Edit field panel handlers
  const handlePointerDown = React.useCallback((e: PointerEvent) => {
    if (!editFieldOpen) return;
    if (editFieldTypeOpen) return; // keep open while select is open
    const panel = editFieldPanelRef.current;
    if (panel && e.target instanceof Node) {
      if (!panel.contains(e.target)) {
        setEditFieldOpen(false);
      }
    }
  }, [editFieldOpen, editFieldTypeOpen, editFieldPanelRef, setEditFieldOpen]);

  const handleOpenAddFieldFromPlus = React.useCallback(() => {
    // Set insertion to the far right
    const visible = table
      .getAllLeafColumns()
      .map((c: any) => c.id)
      .filter((id: any) => id !== "drag" && id !== "rowIndex");
    const lastId = visible[visible.length - 1];
    if (lastId) setPendingInsertRef({ targetId: lastId, side: "right" });
    setEditFieldColumnId(null);
    setNewFieldLabel("");
    setEditFieldType("single line text"); // Reset to default type for new columns
    // Reset options to defaults for new columns
    setEditFieldOptions([
      { id: "opt_1", value: "Option A", color: "#3B82F6" },
      { id: "opt_2", value: "Option B", color: "#10B981" },
      { id: "opt_3", value: "Option C", color: "#F59E0B" },
    ]);
    openEditPanelAtElement(null); // Will be set to plusHeaderRef in the component
    setEditFieldOpen(true);
  }, [table, setPendingInsertRef, setEditFieldColumnId, setNewFieldLabel, setEditFieldType, setEditFieldOptions, openEditPanelAtElement, setEditFieldOpen]);

  // Row management handlers
  const handleAddRowUngrouped = React.useCallback(async () => {
    // Only create 3 posts if there are no posts at all
    if (tableData.length === 0) {
      // Create 3 posts with Draft status using bulkAddPosts
      const postsData = Array(3)
        .fill(null)
        .map(() => ({
          caption: { synced: false, default: "" },
          status: "Draft" as Status,
          format: "",
          publishDate: null,
          platforms: [],
          pages: [],
          month: 1,
          blocks: [],
          comments: [],
          activities: [],
        }));

      const boardId = tableData[0]?.boardId || useWorkspaceStore.getState().activeBoardId;
      if (boardId) {
        await usePostStore.getState().bulkAddPosts(boardId, postsData);
      }
    } else {
      const newPost = await usePostStore.getState().addPost();
    }
  }, [tableData]);

  const handleAddRowForGroup = React.useCallback(async (groupValues: Record<string, any>) => {
    const newPost = await usePostStore.getState().addPost();
    if (!newPost) return;

    // Apply group values to the new post
    Object.entries(groupValues).forEach(([key, value]) => {
      if (key === "status") newPost.status = value as Status;
      if (key === "format") newPost.format = value as ContentFormat;
      if (key === "publish_date") {
        const dt = parse(String(value), "MMM, yyyy", new Date());
        if (!isNaN(dt.getTime())) {
          dt.setDate(15);
          newPost.publishDate = dt;
        }
      }
      // Add other properties as needed based on your grouping columns
    });
    // Ensure store reflects any direct mutations
    await updatePost(newPost.id, { status: newPost.status });
  }, [updatePost]);

  const handleDuplicatePosts = React.useCallback(async (posts: Post[]) => {
    // Clear any existing timeout
    if (duplicateUndoTimeoutRef.current) {
      clearTimeout(duplicateUndoTimeoutRef.current);
    }

    const duplicatedPosts: Post[] = [];

    if (posts.length > 1) {
      // For multiple posts, use bulkAddPosts for better performance
      const postsData = posts.map((orig) => ({
        caption: orig.caption,
        status: orig.status,
        format: orig.format,
        publishDate: orig.publishDate,
        platforms: orig.platforms,
        pages: orig.pages,
        billingMonth: orig.billingMonth,
        month: orig.month,
        settings: orig.settings,
        hashtags: orig.hashtags,
        blocks: orig.blocks,
        comments: orig.comments,
        activities: orig.activities,
      }));

      const board_id = posts[0].boardId;
      duplicatedPosts.push(...(await usePostStore.getState().bulkAddPosts(board_id, postsData)));
    } else {
      // For single post, use the existing duplicatePost method
      for (const orig of posts) {
        const dup = await usePostStore.getState().duplicatePost(orig);
        if (dup) {
          duplicatedPosts.push(dup);
        }
      }
    }

    // Store duplicated posts and show undo message
    setDuplicatedPosts((prev) => [...prev, ...duplicatedPosts]);
    setLastDuplicatedCount(duplicatedPosts.length);
    setShowDuplicateUndoMessage(true);
    table.resetRowSelection();

    // Auto-hide duplicate undo message after 5 seconds
    duplicateUndoTimeoutRef.current = setTimeout(() => {
      setShowDuplicateUndoMessage(false);
    }, 5000);
  }, [duplicateUndoTimeoutRef, setDuplicatedPosts, setLastDuplicatedCount, setShowDuplicateUndoMessage, table]);

  const handleUndoDuplicate = React.useCallback(async () => {
    // Clear the timeout
    if (duplicateUndoTimeoutRef.current) {
      clearTimeout(duplicateUndoTimeoutRef.current);
      duplicateUndoTimeoutRef.current = null;
    }

    // Remove the last duplicated posts
    const postsToRemove = duplicatedPosts.slice(-duplicatedPosts.length);
    setDuplicatedPosts((prev) => prev.slice(0, -duplicatedPosts.length));
    setTableData((prev) =>
      prev.filter((p) => !postsToRemove.map((dp) => dp.id).includes(p.id))
    );

    // Use bulk delete for better performance
    const postIdsToRemove = postsToRemove.map((post) => post.id);
    if (postIdsToRemove.length > 0) {
      await usePostStore.getState().bulkDeletePosts(postIdsToRemove);
    }

    setShowDuplicateUndoMessage(false);
  }, [duplicateUndoTimeoutRef, duplicatedPosts, setDuplicatedPosts, setTableData, setShowDuplicateUndoMessage]);

  const handleEditPost = React.useCallback((post: Post) => {
    onOpen?.(post.id);
  }, [onOpen]);

  const handleDeletePosts = React.useCallback((selected: Post[]) => {
    // Clear any existing timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    // Move posts to trash instead of permanently deleting
    setTrashedPosts((prev) => [...prev, ...selected]);
    setTableData((prev) =>
      prev.filter((p) => !selected.map((xx) => xx.id).includes(p.id))
    );
    setLastTrashedCount(selected.length);
    setShowUndoMessage(true);
    table.resetRowSelection();

    // Auto-hide undo message after 5 seconds
    undoTimeoutRef.current = setTimeout(async () => {
      setShowUndoMessage(false);
      // When timeout expires, permanently delete the posts from store using bulk delete
      const postIds = selected.map((p) => p.id);
      await usePostStore.getState().bulkDeletePosts(postIds);
    }, 5000);
  }, [undoTimeoutRef, setTrashedPosts, setTableData, setLastTrashedCount, setShowUndoMessage, table]);

  const handleUndoTrash = React.useCallback(() => {
    // Clear the timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }

    // Restore the last trashed posts
    const postsToRestore = trashedPosts.slice(-trashedPosts.length);
    setTrashedPosts((prev) => prev.slice(0, -trashedPosts.length));
    setTableData((prev) => [...prev, ...postsToRestore]);

    // The posts are already in the store (they were just moved to trash locally)
    // No need to update the store - just restore them to the table display

    setShowUndoMessage(false);
  }, [undoTimeoutRef, trashedPosts, setTrashedPosts, setTableData, setShowUndoMessage]);

  // Column management handlers
  const handleAddColumn = React.useCallback((
    label: string,
    type: any,
    options?: Array<{ id: string; value: string; color: string }> | string[]
  ) => {
    const nextUserColumns: any[] = [
      ...userColumns,
      {
        id: require("nanoid").nanoid(),
        label,
        type,
        options:
          type === "singleSelect" || type === "multiSelect"
            ? (options as Array<{ id: string; value: string; color: string }>)
            : undefined,
      },
    ];
    setUserColumns(nextUserColumns);
    if (pendingInsertRef) {
      const { targetId, side } = pendingInsertRef;
      setColumnOrder((orderPrev) => {
        const order = orderPrev.length
          ? orderPrev
          : table.getAllLeafColumns().map((c: any) => c.id);
        const idx = order.indexOf(targetId);
        if (idx === -1) return orderPrev;
        const insertIndex = side === "left" ? idx : idx + 1;
        const newOrder = [...order];
        // Use the new column's ID instead of label for the order
        const newColumnId = nextUserColumns[nextUserColumns.length - 1].id;
        newOrder.splice(insertIndex, 0, newColumnId);
        try {
          table.setColumnOrder(newOrder);
        } catch {}
        // Persist board columns with the newly added user column
        try {
          if (activeBoardId) {
            // This would need the buildColumnsPayloadForOrder function
            // updateBoard(activeBoardId, { columns: payload as any });
          }
        } catch {}
        return newOrder;
      });
      setPendingInsertRef(null);
    } else {
      // If no pendingInsertRef, add the new column to the end of the order
      setColumnOrder((orderPrev) => {
        const order = orderPrev.length
          ? orderPrev
          : table.getAllLeafColumns().map((c: any) => c.id);
        const newOrder = [...order];
        const newColumnId = nextUserColumns[nextUserColumns.length - 1].id;
        newOrder.push(newColumnId);

        // Persist board columns with the newly added user column
        try {
          if (activeBoardId) {
            // This would need the buildColumnsPayloadForOrder function
            // updateBoard(activeBoardId, { columns: payload as any });
          }
        } catch {}

        return newOrder;
      });
    }
  }, [userColumns, pendingInsertRef, setUserColumns, setColumnOrder, table, activeBoardId, setPendingInsertRef]);

  // UI interaction handlers
  const handleCheckboxClick = React.useCallback((e: React.MouseEvent, row: Row<Post>) => {
    const table = tableRef.current;
    if (!table || !e.shiftKey || !anchorRowIdRef.current) {
      return;
    }

    e.preventDefault();
    window.getSelection()?.removeAllRanges();

    let allRows: Row<Post>[] = [];
    let anchorIndex = -1;
    let currentIndex = -1;

    if (grouping.length > 0) {
      // For grouped tables, get all leaf rows from all groups
      const groups = getFinalGroupRows(
        table.getGroupedRowModel().rows,
        {},
        rowComparator
      );
      allRows = groups.flatMap((group) => group.leafRows);
    } else {
      // For ungrouped tables, use the regular row model
      allRows = table.getRowModel().rows;
    }

    anchorIndex = allRows.findIndex((r) => r.id === anchorRowIdRef.current);
    currentIndex = allRows.findIndex((r) => r.id === row.id);

    if (anchorIndex === -1) {
      return;
    }

    const start = Math.min(anchorIndex, currentIndex);
    const end = Math.max(anchorIndex, currentIndex);

    const newSelection = { ...table.getState().rowSelection };
    const isChecking = !row.getIsSelected();

    for (let i = start; i <= end; i++) {
      const rowInRange = allRows[i];
      if (rowInRange) {
        if (isChecking) {
          newSelection[rowInRange.id] = true;
        } else {
          delete newSelection[rowInRange.id];
        }
      }
    }
    table.setRowSelection(newSelection);
  }, [tableRef, anchorRowIdRef, grouping, rowComparator]);

  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, row: Row<Post>) => {
      e.preventDefault();
      if (!row.getIsSelected()) {
        table.resetRowSelection();
        row.toggleSelected(true);
      }
      // These would need to be passed as parameters or handled differently
      // setContextMenuOpen(false);
      // setContextMenuRow(row);
      // setContextMenuPosition({ x: e.clientX, y: e.clientY });
      // requestAnimationFrame(() => {
      //   setContextMenuOpen(true);
      // });
    },
    [table]
  );

  const handleRowClick = React.useCallback(
    (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, row: Row<Post>) => {
      // If the click originates from the row-selection checkbox (Radix) or its indicator, ignore
      const targetEl = e.target as HTMLElement;
      if (targetEl.closest('[data-slot="checkbox"]')) {
        return;
      }

      // Shift — select range between anchor and current
      if (e.shiftKey && anchorRowIdRef.current) {
        // Prevent browser text-selection artefacts
        e.preventDefault();
        window.getSelection?.()?.removeAllRanges();

        let anchorIndex = -1;
        let currentIndex = -1;
        let allRows: Row<Post>[] = [];

        if (grouping.length > 0) {
          // For grouped tables, get all leaf rows from all groups
          const groups = getFinalGroupRows(
            table.getGroupedRowModel().rows,
            {},
            rowComparator
          );
          allRows = groups.flatMap((group) => group.leafRows);
        } else {
          // For ungrouped tables, use the regular row model
          allRows = table.getRowModel().rows;
        }

        anchorIndex = allRows.findIndex((r) => r.id === anchorRowIdRef.current);
        currentIndex = allRows.findIndex((r) => r.id === row.id);

        if (anchorIndex === -1 || currentIndex === -1) {
          anchorRowIdRef.current = row.id;
          return;
        }

        const start = Math.min(anchorIndex, currentIndex);
        const end = Math.max(anchorIndex, currentIndex);

        // Build selection map in one pass for better perf
        const newSelection: Record<string, boolean> = {};
        for (let i = start; i <= end; i++) {
          const rid = allRows[i]?.id;
          if (rid) newSelection[rid] = true;
        }

        table.setRowSelection(newSelection as any);
      } else if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl — toggle the clicked row while preserving others
        table.setRowSelection((prev: Record<string, boolean>) => {
          const isSelected = !!prev[row.id];
          const next = { ...prev } as Record<string, boolean>;
          if (isSelected) delete next[row.id];
          else next[row.id] = true;
          return next;
        });
      } else {
        // Plain click: just set new anchor & clear selection
        table.setRowSelection({});
      }

      // When the click is NOT done with Shift held, update the anchor
      if (!e.shiftKey) {
        anchorRowIdRef.current = row.id;
      }
    },
    [table, grouping, anchorRowIdRef, rowComparator]
  );

  // Helper function to handle option removal from posts
  const handleOptionRemoval = React.useCallback(
    async (columnId: string, removedOptionId: string) => {
      if (!activeBoardId || !tableData.length) return;

      // Find the column to match with post user_columns
      const column = userColumns.find((col) => col.id === columnId);
      if (!column) return;

      // Find all posts that have the removed option ID as a value for this column
      const postsToUpdate = tableData.filter((post) => {
        if (!post.userColumns) return false;

        const userColumn = post.userColumns.find((uc: any) => uc.id === columnId);
        return userColumn && userColumn.value === removedOptionId;
      });

      if (postsToUpdate.length === 0) return;

      // Update each post to remove the option value
      const updatePromises = postsToUpdate.map(async (post) => {
        const updatedUserColumns =
          post.userColumns?.map((uc: any) =>
            uc.id === columnId ? { ...uc, value: "" } : uc
          ) || [];

        // Update local state immediately for better UX
        setTableData((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, user_columns: updatedUserColumns } : p
          )
        );

        // Update in database
        try {
          await updatePost(post.id, {
            user_columns: updatedUserColumns,
          } as any);
        } catch (error) {
          console.error(
            `Failed to update post ${post.id} after option removal:`,
            error
          );
          // Revert local state on error
          setTableData((prev) =>
            prev.map((p) => (p.id === post.id ? post : p))
          );
        }
      });

      try {
        await Promise.all(updatePromises);
      } catch (error) {
        console.error("Failed to update posts after option removal:", error);
      }
    },
    [activeBoardId, tableData, userColumns, updatePost, setTableData]
  );

  // Window resize handler
  const handleResize = React.useCallback(() => {
    checkIfScrollable();
  }, [checkIfScrollable]);

  return {
    // CSV handlers
    handleExport,
    onFileChange,
    handleImport,
    
    // Group feedback handlers
    handleOpenGroupFeedback,
    handleCloseGroupFeedback,
    handleAddGroupComment,
    handleAddGroupMessage,
    handleResolveGroupComment,
    handleDeleteAiSummary,
    
    // Scroll handlers
    handleScroll,
    handleResize,
    
    // Edit field handlers
    handlePointerDown,
    handleOpenAddFieldFromPlus,
    
    // Row management handlers
    handleAddRowUngrouped,
    handleAddRowForGroup,
    handleDuplicatePosts,
    handleUndoDuplicate,
    handleEditPost,
    handleDeletePosts,
    handleUndoTrash,
    
    // Column management handlers
    handleAddColumn,
    
    // UI interaction handlers
    handleCheckboxClick,
    handleContextMenu,
    handleRowClick,
    handleOptionRemoval,
  };
}
