import * as React from "react";
import { Post, BoardRules, useWorkspaceStore, BoardColumn, useUserStore, GroupComment, ConditionGroup, UserColumn, Platform, Board, Workspace, BoardGroupData } from "@/lib/store";
import { FinalGroup, nameToDefaultId, normalizeOrder } from "./utils";
import { Column, ColumnSizingInfoState, Table } from "@tanstack/react-table";
import { RowHeightType } from "@/lib/utils";
import { SortingState } from "@tanstack/react-table";


export interface PostTableEffectsParams {
  // State
  mounted: boolean;
  posts: Post[];
  tableData: Post[];
  selectedPreviewCell: string | null;
  selectedGroupData: { month: number; comments: GroupComment[] } | null;
  prevStoreDataRef: React.MutableRefObject<string>;
  userInitiatedChangeRef: React.MutableRefObject<boolean>;
  lastBoardIdRef: React.MutableRefObject<string | null>;
  groupRevisionRef: React.MutableRefObject<Map<string, number>>;
  columnSizingInfo: ColumnSizingInfoState;
  rowHeight: RowHeightType;
  boardRules: BoardRules | undefined;
  grouping: string[];
  sorting: SortingState;
  editFieldOpen: boolean;
  editFieldTypeOpen: boolean;
  editFieldPanelRef: React.MutableRefObject<HTMLDivElement | null>;
  filterTree: ConditionGroup;
  tableDataLength: number;
  checkIfScrollable: () => void;
  captionLocked: boolean;
  undoTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  duplicateUndoTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  
  // Setters
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  setTableData: React.Dispatch<React.SetStateAction<Post[]>>;
  setSelectedPreviewCell: React.Dispatch<React.SetStateAction<string | null>>;
  setUserColumns: React.Dispatch<React.SetStateAction<UserColumn[]>>;
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
  setColumnSizing: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  setGrouping: React.Dispatch<React.SetStateAction<string[]>>;
  setRowHeight: React.Dispatch<React.SetStateAction<RowHeightType>>;
  setSelectedGroupData: React.Dispatch<React.SetStateAction<{ month: number; comments: GroupComment[] } | null>>;
  setEditFieldOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedPlatform: React.Dispatch<React.SetStateAction<Platform | null>>;
  setFlatGroupExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  
  // External functions
  updateBoard: (boardId: string, data: Partial<Board>) => void;
  markGroupCommentRead: (boardId: string, month: number, commentId: string) => void;
  
  // Board/workspace data
  activeBoardId: string | null;
  currentBoard: Board | null;
  activeWorkspace: Workspace | null;
  table: Table<Post> | null;
}

export function usePostTableEffects(params: PostTableEffectsParams) {
  const {
    // State
    mounted,
    posts,
    tableData,
    selectedPreviewCell,
    selectedGroupData,
    prevStoreDataRef,
    userInitiatedChangeRef,
    lastBoardIdRef,
    groupRevisionRef,
    columnSizingInfo,
    rowHeight,
    boardRules,
    grouping,
    sorting,
    editFieldOpen,
    editFieldTypeOpen,
    editFieldPanelRef,
    filterTree,
    tableDataLength,
    checkIfScrollable,
    captionLocked,
    undoTimeoutRef,
    duplicateUndoTimeoutRef,
    
    // Setters
    setMounted,
    setTableData,
    setSelectedPreviewCell,
    setUserColumns,
    setColumnOrder,
    setColumnSizing,
    setSorting,
    setGrouping,
    setRowHeight,
    setSelectedGroupData,
    setEditFieldOpen,
    setSelectedPlatform,
    setFlatGroupExpanded,
    
    // External functions
    updateBoard,
    markGroupCommentRead,
    
    // Board/workspace data
    activeBoardId,
    currentBoard,
    activeWorkspace,
    table,
  } = params;

  // Keep ref in sync with state
  React.useEffect(() => {
    // This will be handled by the component
  }, [selectedPreviewCell]);

  // Initialize mounted state
  React.useEffect(() => {
    setMounted(true);
  }, [setMounted]);

  // Initialize tableData with posts prop
  React.useEffect(() => {
    setTableData(posts);
  }, [posts, setTableData]);

  // Reset stored randoms when board or revision limit changes
  React.useEffect(() => {
    groupRevisionRef.current = new Map();
  }, [activeBoardId, boardRules?.firstMonth, groupRevisionRef]);

  // Update selectedGroupData when store data changes
  React.useEffect(() => {
    if (selectedGroupData && activeBoardId) {
      const updatedBoard = activeWorkspace?.boards.find(
        (b: Board) => b.id === activeBoardId
      );
      const updatedGroupData = updatedBoard?.groupData?.find(
        (gd: BoardGroupData) => gd.month === selectedGroupData.month
      );

      if (updatedGroupData) {
        const currentStoreData = JSON.stringify(updatedGroupData.comments);

        // Only update if store data has actually changed
        if (currentStoreData !== prevStoreDataRef.current) {
          prevStoreDataRef.current = currentStoreData;

          setSelectedGroupData({
            month: selectedGroupData.month,
            comments: updatedGroupData.comments,
          });
        }
      }
    }
  }, [activeWorkspace, activeBoardId, selectedGroupData, prevStoreDataRef, setSelectedGroupData]);

  // Initialize from board.columns when switching boards
  React.useEffect(() => {
    if (!currentBoard?.columns) return;
    const sorted = [...currentBoard.columns].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    const newUserCols: UserColumn[] = [];
    const newOrder: string[] = [];
    for (const col of sorted) {
      if (col.isDefault) {
        const id = nameToDefaultId[col.name];
        if (id) newOrder.push(id);
      } else {
        const anyCol: any = col;
        // Use existing ID from database if available, otherwise generate new one
        const columnId = anyCol.id || require("nanoid").nanoid();
        newUserCols.push({
          id: columnId,
          label: col.name,
          type: anyCol.type || "singleLine",
          options: anyCol.options,
        });
        newOrder.push(columnId);
      }
    }
    if (newUserCols.length) setUserColumns(newUserCols);
    if (newOrder.length) setColumnOrder(() => normalizeOrder(newOrder));
  }, [currentBoard?.columns, nameToDefaultId, normalizeOrder, setUserColumns, setColumnOrder]);

  // Auto-adjust default Preview column width when row height changes
  React.useEffect(() => {
    const rh = require("@/lib/utils").getRowHeightPixels(rowHeight);
    const thumbHeight = rh > 10 ? rh - 8 : rh; // matches BlocksPreview thumbnail height logic
    const paddings = 12 + 4; // pl-3 + pr-1
    const gap = 2; // small inter-item gap
    const target = Math.max(90, thumbHeight + paddings + gap);

    setColumnSizing((prev: Record<string, number>) => {
      return { ...prev, preview: target };
    });
  }, [rowHeight, setColumnSizing]);

  // Maintain global col-resize cursor and suppress hovers while resizing
  React.useEffect(() => {
    const root = document.documentElement;
    if (columnSizingInfo.isResizingColumn) {
      root.classList.add("is-resizing-columns");
    } else {
      root.classList.remove("is-resizing-columns");
    }
    return () => {
      root.classList.remove("is-resizing-columns");
    };
  }, [columnSizingInfo.isResizingColumn]);

  // Update table state when board rules change
  React.useEffect(() => {
    if (boardRules) {
      // Reset user-initiated flag when switching boards
      userInitiatedChangeRef.current = false;
      lastBoardIdRef.current = activeBoardId;

      // Always apply board rules when they become available
      if (boardRules.sortBy) {
        setSorting([{ id: boardRules.sortBy, desc: false }]);
      } else {
        setSorting([]);
      }

      if (boardRules.groupBy) {
        setGrouping([boardRules.groupBy]);
      } else {
        setGrouping([]);
      }

      if (boardRules.rowHeight) {
        setRowHeight(boardRules.rowHeight);
      }
    }
  }, [boardRules, userInitiatedChangeRef, lastBoardIdRef, activeBoardId, setSorting, setGrouping, setRowHeight]);

  // Persist board rule changes on user actions
  React.useEffect(() => {
    if (!currentBoard || !activeBoardId || !userInitiatedChangeRef.current)
      return;

    // Only persist if we're still on the same board where the change was initiated
    if (lastBoardIdRef.current !== activeBoardId) return;

    const newGroupBy = grouping[0] ?? null;
    const newSortBy = sorting.length ? sorting[0].id : null;
    const newRowH = rowHeight;

    const prevRules: BoardRules | undefined = currentBoard.rules;

    // If nothing changed, skip update
    if (
      prevRules &&
      prevRules.groupBy === newGroupBy &&
      prevRules.sortBy === newSortBy &&
      prevRules.rowHeight === newRowH
    ) {
      return;
    }

    // Build a complete BoardRules object, preserving other existing rule fields or defaulting to false/undefined
    const mergedRules: BoardRules = {
      autoSchedule: prevRules?.autoSchedule ?? false,
      revisionRules: prevRules?.revisionRules ?? false,
      approvalDeadline: prevRules?.approvalDeadline ?? false,
      firstMonth: prevRules?.firstMonth,
      ongoingMonth: prevRules?.ongoingMonth,
      approvalDays: prevRules?.approvalDays,
      groupBy: newGroupBy,
      sortBy: newSortBy,
      rowHeight: newRowH,
    };

    updateBoard(activeBoardId, { rules: mergedRules });
  }, [grouping, sorting, rowHeight, currentBoard, activeBoardId, updateBoard, userInitiatedChangeRef, lastBoardIdRef]);

  // Mark user-initiated changes
  React.useEffect(() => {
    if (lastBoardIdRef.current === activeBoardId) {
      userInitiatedChangeRef.current = true;
    }
  }, [grouping, sorting, rowHeight, lastBoardIdRef, activeBoardId, userInitiatedChangeRef]);

  // Check if scrolling is needed when table data changes
  React.useEffect(() => {
    // Use a small delay to ensure the DOM has updated
    const timer = setTimeout(checkIfScrollable, 100);
    return () => clearTimeout(timer);
  }, [tableDataLength, checkIfScrollable]);

  // Check if scrolling is needed when window resizes
  React.useEffect(() => {
    const handleResize = () => {
      checkIfScrollable();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkIfScrollable]);

  // Close edit panel when clicking outside
  React.useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (!editFieldOpen) return;
      if (editFieldTypeOpen) return; // keep open while select is open
      const panel = editFieldPanelRef.current;
      if (panel && e.target instanceof Node) {
        if (!panel.contains(e.target)) {
          setEditFieldOpen(false);
        }
      }
    }
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [editFieldOpen, editFieldTypeOpen, editFieldPanelRef, setEditFieldOpen]);

  // For grouping expansions
  React.useEffect(() => {
    if (grouping.length) {
      const groups = require("./utils").getFinalGroupRows(table?.getGroupedRowModel().rows);
      const newExpandedState: Record<string, boolean> = {};
      groups.forEach((group: FinalGroup) => {
        const key = JSON.stringify(group.groupValues);
        newExpandedState[key] = true;
      });
      setFlatGroupExpanded(newExpandedState);
    } else {
      setFlatGroupExpanded({});
    }
  }, [grouping, tableDataLength, table, setFlatGroupExpanded]);

  // Caption Editor states
  React.useEffect(() => {
    if (captionLocked) {
      setSelectedPlatform(null);
    }
  }, [captionLocked, setSelectedPlatform]);

  // Add CSS variables for background colors
  React.useEffect(() => {
    document.documentElement.style.setProperty("--background", "#FFFFFF");
    document.documentElement.style.setProperty(
      "--background-selected",
      "#EBF5FF"
    );
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      if (duplicateUndoTimeoutRef.current) {
        clearTimeout(duplicateUndoTimeoutRef.current);
      }
    };
  }, [undoTimeoutRef, duplicateUndoTimeoutRef]);
}
