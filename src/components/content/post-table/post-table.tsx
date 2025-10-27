"use client";

import * as React from "react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnResizeMode,
  ColumnSizingInfoState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
  Table as ReactTableType,
  Column,
} from "@tanstack/react-table";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PlusIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  X as XIcon,
  MoreHorizontal,
  Link2,
  File,
} from "lucide-react";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import { Platform } from "@/lib/social/platforms/platform-types";
import { getRowHeightPixels } from "@/lib/utils";
import {
  FilterPopover,
  ConditionGroup,
  ColumnMeta,
  Condition,
} from "./filter-popover";
import { GroupMenu } from "./group-menu";
import { SortMenu } from "./sort-menu";
import { RowHeightMenu } from "./row-height-menu";
import { MemoBlocksPreview } from "./memo-blocks-preview";
import { CellFocusProvider } from "./focus-provider";
import {
  ContentFormat,
  Post,
  Status,
  UserColumn,
  BoardRules,
  useWorkspaceStore,
  usePostStore,
  useSocialStore,
} from "@/lib/store";
import {
  StatusChip,
  ChannelIcons,
  FormatBadge,
} from "@/components/content/shared/content-post-ui";
import { CaptionEditor } from "./caption-editor";
import { AddColumnDialog } from "./add-column-dialog";
import { PostContextMenu } from "./post-context-menu";
import UserTextEditor from "./user-text-editor";
import { GroupFeedbackSidebar } from "./group-feedback-sidebar";
import { createBaseColumns } from "./columns/base-columns";
import { createUserColumns } from "./columns/user-columns";
import { statusFilterFn, formatFilterFn, monthFilterFn, previewFilterFn, publishDateFilterFn, approveFilterFn, createPlatformsFilterFn } from "./filters";
import { statusSortingFn, formatSortingFn, createPlatformsSortingFn } from "./sort";
import { RenderGroupedTable } from "./render-grouped-table";
import { RenderGroupedTableHeader } from "./render-grouped-table-header";
import { RenderUngroupedTable } from "./render-ungrouped-table";
import { InlineEditFieldPanel } from "./inline-edit-field-panel";
import { BulkActionToolbar } from "./bulk-action-toolbar";
import {
  getFinalGroupRows,
  getUserColumnValue,
  buildUpdatedUserColumnsArr,
  nameToDefaultId,
  normalizeOrder,
  buildColumnsPayloadForOrder,
  isSticky,
  stickyStyles,
  mapEditFieldTypeToColumnType,
} from "./utils";
import { useFillDrag } from "./fill-utils";
import { useHeaderMenuAction } from "./header-menu-utils";
import { usePostTableState } from "./use-post-table-state";
import { useDragHandlers } from "./use-drag-handlers";
import { usePostTableHandlers } from "./use-post-table-handlers";
import { usePostTableEffects } from "./use-post-table-effects";
import { usePostTableMemoizedValues } from "./use-post-table-memoized-values";
import { usePostTableCallbacks } from "./use-post-table-callbacks";

/** ---------- The PostTable ---------- **/
export function PostTable({
  posts: initialPosts,
  onOpen,
}: {
  posts: Post[];
  onOpen?: (id: string) => void;
}) {
  // Use the centralized state hook
  const { state, setters, refs } = usePostTableState(initialPosts);
  
  // Destructure state for easier access
  const {
    mounted,
    tableData,
    trashedPosts,
    showUndoMessage,
    lastTrashedCount,
    duplicatedPosts,
    showDuplicateUndoMessage,
    lastDuplicatedCount,
    groupFeedbackSidebarOpen,
    selectedGroupData,
    selectedPreviewCell,
    userColumns,
    addColumnOpen,
    headerMenuOpenFor,
    headerMenuAlign,
    headerMenuAlignOffset,
    headerMenuSideOffset,
    contextMenuOpen,
    contextMenuRow,
    contextMenuPosition,
    sorting,
    columnFilters,
    grouping,
    columnVisibility,
    columnOrder,
    expanded,
    columnSizing,
    columnSizingInfo,
    resizingColumnId,
    rowHeight,
    isScrollable,
    filterOpen,
    columnNames,
    renameColumnId,
    renameValue,
    editFieldOpen,
    editFieldColumnId,
    editFieldType,
    editFieldPanelPos,
    editFieldTypeOpen,
    newFieldLabel,
    editFieldOptions,
    captionOpen,
    editingPost,
    selectedPlatform,
    captionLocked,
    userTextOpen,
    editingUserText,
    flatGroupExpanded,
    pendingInsertRef,
  } = state;

  // Destructure setters for easier access
  const {
    setMounted,
    setTableData,
    setTrashedPosts,
    setShowUndoMessage,
    setLastTrashedCount,
    setDuplicatedPosts,
    setShowDuplicateUndoMessage,
    setLastDuplicatedCount,
    setGroupFeedbackSidebarOpen,
    setSelectedGroupData,
    setSelectedPreviewCell,
    setUserColumns,
    setAddColumnOpen,
    setHeaderMenuOpenFor,
    setHeaderMenuAlign,
    setHeaderMenuAlignOffset,
    setHeaderMenuSideOffset,
    setContextMenuOpen,
    setContextMenuRow,
    setContextMenuPosition,
    setSorting,
    setColumnFilters,
    setGrouping,
    setColumnVisibility,
    setColumnOrder,
    setExpanded,
    setColumnSizing,
    setColumnSizingInfo,
    setResizingColumnId,
    setRowHeight,
    setIsScrollable,
    setFilterOpen,
    setColumnNames,
    setRenameColumnId,
    setRenameValue,
    setEditFieldOpen,
    setEditFieldColumnId,
    setEditFieldType,
    setEditFieldPanelPos,
    setEditFieldTypeOpen,
    setNewFieldLabel,
    setEditFieldOptions,
    setCaptionOpen,
    setEditingPost,
    setSelectedPlatform,
    setCaptionLocked,
    setUserTextOpen,
    setEditingUserText,
    setFlatGroupExpanded,
    setPendingInsertRef,
  } = setters;

  // Destructure refs for easier access
  const {
    undoTimeoutRef,
    duplicateUndoTimeoutRef,
    selectedPreviewCellRef,
    groupRevisionRef,
    fileInputRef,
    prevStoreDataRef,
    userInitiatedChangeRef,
    lastBoardIdRef,
    scrollContainerRef,
    scrollTimeoutRef,
    lastScrollLeftRef,
    emptyFilterRef,
    editFieldPanelRef,
    plusHeaderRef,
    tableRef,
    headerRefs,
    anchorRowIdRef,
  } = refs;
  const setBoardFilterConditions = useWorkspaceStore((s) => s.setBoardFilterConditions);  

  const updatePost = usePostStore((s) => s.updatePost);
  const updateBoard = useWorkspaceStore((s) => s.updateBoard);
  const getPageCounts = useSocialStore((s) => s.getPageCounts);
  const addGroupComment = useWorkspaceStore((s) => s.addGroupComment);
  const addGroupMessage = useWorkspaceStore((s) => s.addGroupMessage);
  const resolveGroupComment = useWorkspaceStore((s) => s.resolveGroupComment);
  const markGroupCommentRead = useWorkspaceStore((s) => s.markGroupCommentRead);
  const deleteGroupCommentAiSummaryItem = useWorkspaceStore(
    (s) => s.deleteGroupCommentAiSummaryItem
  );
  // Store subscriptions - subscribe to the actual data that changes
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activeBoardId = useWorkspaceStore((s) => s.activeBoardId);

  // Post table callbacks hook
  const callbacks = usePostTableCallbacks({
    scrollContainerRef,
    tableData,
    rowHeight,
    onOpen,
    setIsScrollable,
    setFilterTree: (conditions: any) => {
      if (activeBoardId) {
        setBoardFilterConditions(activeBoardId, conditions);
      }
    },
    checkIfScrollable: () => {
      // This will be replaced by the actual function
    },
  });

  const ws = useWorkspaceStore((s) => s.getActiveWorkspace());
  
  // Reactively subscribe to current board filter conditions from the store
  const filterTree = useWorkspaceStore((s) => {
    const aw = s.workspaces.find((w: any) => w.id === s.activeWorkspaceId);
    const ab = aw?.boards.find((b: any) => b.id === s.activeBoardId);
    return ab?.filterConditions ?? emptyFilterRef.current;
  });

  // Post table memoized values hook
  const memoizedValues = usePostTableMemoizedValues({
    workspaces,
    activeWorkspaceId,
    activeBoardId,
    tableData,
    userColumns,
    columnOrder,
    columnNames,
    rowHeight,
    selectedPlatform,
    availablePlatforms: [], // Will be set by the hook
    captionLocked,
    platformsFilterFn: null, // Will be set by the hook
    platformsSortingFn: null, // Will be set by the hook
    statusFilterFn,
    statusSortingFn,
    formatFilterFn,
    formatSortingFn,
    monthFilterFn,
    previewFilterFn,
    publishDateFilterFn,
    approveFilterFn,
    boardRules: undefined, // Will be set by the hook
    sorting,
    filterTree,
    ws,
    selectedRows: [], // Will be updated after table is created
    setTableData,
    setCaptionLocked,
    updateBoard,
    updatePost,
    setUserColumns,
    onOpen,
    getPageCounts,
    handleFillStartCaption: null, // Will be set later
    handleFillStartPages: null, // Will be set later
    handleFillStartFormat: null, // Will be set later
    handleFillStartMonth: null, // Will be set later
    previewCellFn: callbacks.previewCellFn,
    handleRowDragStart: null, // Will be set later
    handleCheckboxClick: null, // Will be set later
    handleEditPost: null, // Will be set later
    anchorRowIdRef,
    tableRef,
    table: null as unknown as ReturnType<typeof useReactTable<Post>>, // Will be set later
  });

  const { activeWorkspace, currentBoard, boardRules } = memoizedValues;

  // Derive posts from current board computed via workspace state
  const posts = currentBoard?.posts || initialPosts;
  
  // Reset stored randoms when board or revision limit changes
  React.useEffect(() => {
    groupRevisionRef.current = new Map();
  }, [activeBoardId, boardRules?.firstMonth]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize tableData with posts prop, but don't sync with global store changes
  // This prevents the global store from overwriting local user column updates
  React.useEffect(() => {
    setTableData(posts);
  }, [posts]); // Run when posts change to keep table data in sync

  // Update selectedGroupData when store data changes
  React.useEffect(() => {
    if (selectedGroupData && activeBoardId) {
      const updatedBoard = activeWorkspace?.boards.find(
        (b: any) => b.id === activeBoardId
      );
      const updatedGroupData = updatedBoard?.groupData?.find(
        (gd: any) => gd.month === selectedGroupData.month
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
  }, [activeWorkspace, activeBoardId]); // React to workspace and board changes

  // Initialize from board.columns when switching boards
  React.useEffect(() => {
    if (!currentBoard?.columns) return;
    const sorted = [...currentBoard.columns].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    const newUserCols: UserColumn[] = [];
    const newOrder: string[] = [];
    for (const col of sorted) {
      if (col.is_default) {
        const id = nameToDefaultId[col.name];
        if (id) newOrder.push(id);
      } else {
        const anyCol: any = col as any;
        // Use existing ID from database if available, otherwise generate new one
        const columnId = anyCol.id || nanoid();
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
  }, [currentBoard?.columns, nameToDefaultId, normalizeOrder]);


  // Post table effects hook
  usePostTableEffects({
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
    tableDataLength: tableData.length,
    checkIfScrollable: callbacks.checkIfScrollableCallback,
    captionLocked,
    undoTimeoutRef,
    duplicateUndoTimeoutRef,
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
    updateBoard,
    markGroupCommentRead,
    activeBoardId,
    currentBoard,
    activeWorkspace,
    table: null, // Will be set later
  });












  // Set filter conditions in store for current board
  const setFilterTree = callbacks.setFilterTreeCallback;

  // At the top level of your PostTable component:
  // Fill-drag functionality using custom hook
  const {
    fillDragRange,
    fillDragColumn,
    isFillSource,
    isFillTarget,
    handleFillStartMonth,
    handleFillStartCaption,
    handleFillStartPages,
    handleFillStartFormat,
  } = useFillDrag(tableData, setTableData, updatePost);


  // Function to check if scrolling is needed
  const checkIfScrollable = callbacks.checkIfScrollableCallback;

  function openEditPanelAtElement(el: HTMLElement | null) {
    const container = scrollContainerRef.current;
    if (el && container) {
      const hRect = el.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      const columnWidth = hRect.width;
      const panelWidth = 280;
      const top = hRect.bottom - cRect.top + container.scrollTop;
      let left: number;
      let align: "left" | "right";
      // If this is the plus column header, always align panel's right edge to header's right edge
      if (el === plusHeaderRef.current) {
        left = hRect.right - cRect.left - panelWidth + container.scrollLeft;
        align = "right";
      } else if (panelWidth <= columnWidth) {
        left = hRect.right - cRect.left - panelWidth + container.scrollLeft;
        align = "right";
      } else {
        left = hRect.left - cRect.left + container.scrollLeft;
        align = "left";
      }
      setEditFieldPanelPos({ top, left, align });
    } else {
      setEditFieldPanelPos(null);
    }
  }

  // Build the flattened column filters from a nested filter tree
  const { hasActiveFilters } = memoizedValues;




  // Get memoized values from the hook
  const {
    pageIdToPlatformMap, 
    platformsFilterFn: platformsFilterFnMemo, 
    platformsSortingFn: platformsSortingFnMemo, 
    availablePlatforms: availablePlatformsMemo 
  } = memoizedValues;

  // Use the memoized values
  const platformsFilterFn = platformsFilterFnMemo;
  const platformsSortingFn = platformsSortingFnMemo;
  const availablePlatforms = availablePlatformsMemo;


  /** Preview cell function - separate from baseColumns to avoid refresh **/
  const previewCellFn = callbacks.previewCellFn;

  // Placeholder for handleRowDragStart - will be replaced after drag handlers are created
  const handleRowDragStart = React.useCallback((e: React.DragEvent, fromIndex: number) => {
    // This will be replaced by the actual drag handler
  }, []);

  // Placeholder handlers for baseColumns - will be replaced after handlers hook is created
  const handleCheckboxClick = React.useCallback((e: React.MouseEvent, row: Row<Post>) => {
    // This will be replaced by the actual handler
  }, []);

  const handleEditPost = React.useCallback((post: Post) => {
    // This will be replaced by the actual handler
  }, []);

  // Get column definitions from memoized values
  const { baseColumns, userColumnDefs, columns, filterableColumns } = memoizedValues;

  // Create table
  const tableConfig = React.useMemo(
    () => ({
    data: (() => {
      // Helpers to determine if a condition has a user-provided value
      const isConditionActive = (c: any): boolean => {
        if (!c) return false;
        if (c.operator === "is_empty" || c.operator === "not_empty") return true;
        const vals: string[] = Array.isArray(c.selectedValues) ? c.selectedValues : [];
        return vals.some((v) => v != null && String(v).trim() !== "");
      };
      const treeHasActive = (node: any): boolean => {
        if (!node) return false;
        if (node.type === "condition") return isConditionActive(node);
        if (node.type === "group") return (node.children || []).some((ch: any) => treeHasActive(ch));
        return false;
      };

      // Evaluate full tree with AND/OR semantics; apply here so table receives pre-filtered data
      const evalTree = (post: Post, node: any): { active: boolean; result: boolean } => {
        const getVal = (columnId: string) => {
          switch (columnId) {
            case "status": return post.status as any;
            case "format": return post.format as any;
            case "month": return post.month as any;
            case "platforms": return post.pages as any;
            case "preview": return post.blocks as any;
            case "publish_date": return (post as any).publish_date as any;
            case "approve": return post.status as any;
            default: return (post as any)[columnId];
          }
        };
        const fakeRow = {
          original: post,
          getValue: (colId: string) => getVal(colId),
        } as any;
        const evalCond = (c: any): { active: boolean; result: boolean } => {
          if (!isConditionActive(c)) return { active: false, result: true };
          const value: any = (c.operator === "is_empty" || c.operator === "not_empty")
            ? { operator: c.operator }
            : { operator: c.operator, values: c.selectedValues || [] };
          switch (c.field) {
            case "status": return { active: true, result: statusFilterFn(fakeRow, "status", value as any, undefined as any) };
            case "format": return { active: true, result: formatFilterFn(fakeRow, "format", value as any, undefined as any) };
            case "month": return { active: true, result: monthFilterFn(fakeRow, "month", value as any, undefined as any) };
            case "platforms": return { active: true, result: platformsFilterFn(fakeRow, "pages", value as any, undefined as any) };
            case "preview": return { active: true, result: previewFilterFn(fakeRow, "blocks", value as any, undefined as any) };
            case "publish_date": return { active: true, result: publishDateFilterFn(fakeRow, "publish_date", value as any, undefined as any) };
            case "approve": return { active: true, result: approveFilterFn(fakeRow, "approve", value as any, undefined as any) };
            default: return { active: false, result: true };
          }
        };
        if (!node) return { active: false, result: true };
        if ((node as any).type === "condition") return evalCond(node);
        const group = node as any;
        const children = group.children || [];
        if (children.length === 0) return { active: false, result: true };
        const joinVal: "and" | "or" = (children[1]?.join as any) || "and";
        const results: Array<{ active: boolean; result: boolean }> = children.map((ch: any) => evalTree(post, ch));
        const activeChildren = results.filter((r) => r.active);
        if (activeChildren.length === 0) return { active: false, result: true };
        if (joinVal === "or") {
          return { active: true, result: activeChildren.some((r) => r.result) };
        }
        return { active: true, result: activeChildren.every((r) => r.result) };
      };
      const treeActive = treeHasActive(filterTree);
      if (!treeActive) return tableData;
      return tableData.filter((p) => evalTree(p, filterTree).result);
    })(),
    columns,
    groupedColumnMode: false as const,
    state: {
      sorting,
      columnFilters,
      grouping,
      columnVisibility,
      columnOrder,
      expanded,
      // needed for resizing:
      columnSizing,
      columnSizingInfo,
    },
    columnResizeMode: "onChange" as ColumnResizeMode,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGroupingChange: setGrouping,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onExpandedChange: setExpanded,
    // needed for resizing:
    onColumnSizingChange: setColumnSizing,
      onColumnSizingInfoChange: (
        updaterOrValue:
          | ColumnSizingInfoState
          | ((old: ColumnSizingInfoState) => ColumnSizingInfoState)
      ) => {
      setColumnSizingInfo(updaterOrValue);
      // Track which column is being resized
        const newInfo =
          typeof updaterOrValue === "function"
        ? updaterOrValue(columnSizingInfo) 
        : updaterOrValue;
      
      if (newInfo.isResizingColumn && newInfo.columnSizingStart.length > 0) {
        // Get the column ID from the first column being resized
        const firstColumn = newInfo.columnSizingStart[0];
          setResizingColumnId(
            Array.isArray(firstColumn) ? firstColumn[0] : firstColumn
          );
      } else if (!newInfo.isResizingColumn) {
        setResizingColumnId(null);
      }
    },

    enableRowSelection: true,
    enableExpanding: true,
    enableColumnResizing: true, // main toggle
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    autoResetAll: false,
    filterFns: {
      statusFilterFn,
      formatFilterFn,
      monthFilterFn,
      platformsFilterFn,
    },
    }),
    [
    tableData,
    columns,
    sorting,
    columnFilters,
    grouping,
    columnVisibility,
    columnOrder,
    expanded,
    columnSizing,
    columnSizingInfo,
    setSorting,
    setColumnFilters,
    setGrouping,
    setColumnVisibility,
    setColumnOrder,
    setExpanded,
    setColumnSizing,
    setColumnSizingInfo,
    ]
  );

  const table = useReactTable<Post>(tableConfig);
  tableRef.current = table;

  // Create rowComparator after table is created
  const rowComparator = React.useMemo<
    ((a: any, b: any) => number) | undefined
  >(() => {
    if (!sorting.length || !table) return undefined;

    const sorters = sorting
      .map((rule) => {
        const col = table.getColumn(rule.id as string);
        const sortingFn = (col?.columnDef as any)?.sortingFn as (
          rowA: any,
          rowB: any,
          columnId: string
        ) => number | undefined;
        return {
          id: rule.id as string,
          desc: !!rule.desc,
          fn: sortingFn,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      desc: boolean;
      fn?: (rowA: any, rowB: any, columnId: string) => number;
    }>;

    const fallbackCompare = (va: any, vb: any): number => {
      const norm = (v: any): any => {
        if (v === null || v === undefined) return "";
        if (typeof v === "number") return v;
        if (typeof v === "string") return v.toLowerCase();
        if (v instanceof Date) return v.getTime();
        if (typeof v === "boolean") return v ? 1 : 0;
        if (Array.isArray(v)) return v.join(",");
        return String(v);
      };
      const a = norm(va);
      const b = norm(vb);
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    };

    return (a: any, b: any) => {
      for (const s of sorters) {
        let res = 0;
        if (typeof s.fn === "function") {
          try {
            res = s.fn(a, b, s.id) ?? 0;
          } catch {
            const va = (a as any).getValue(s.id);
            const vb = (b as any).getValue(s.id);
            res = fallbackCompare(va, vb);
          }
        } else {
          const va = (a as any).getValue(s.id);
          const vb = (b as any).getValue(s.id);
          res = fallbackCompare(va, vb);
        }
        if (res !== 0) return s.desc ? -res : res;
      }
      try {
        return a.id.localeCompare(b.id);
      } catch {
        return 0;
      }
    };
  }, [sorting, table]);

  // Drag handlers hook
  const {
    dragState,
    dragStateSetters,
    dragRefs,
    dragHandlers,
  } = useDragHandlers({
    tableData,
    setTableData,
    grouping,
    scrollContainerRef,
    headerRefs,
    table,
  });


  // Destructure drag state for easier access
  const {
    dragOverIndex,
    isRowDragging,
    rowDragIndex,
    rowDragPos,
    rowDragAngle,
    rowDragScale,
    rowIndicatorTop,
    draggingColumnId,
    dragOverColumnId,
    dragInsertAfter,
    dragOverlayLeft,
    dragOverlayWidth,
    dragStartOffsetX,
  } = dragState;

  // Destructure drag handlers for easier access
  const {
    handleRowDragStart: actualHandleRowDragStart,
    handleRowDrop,
    endRowDragOverlay,
    beginColumnDrag,
    endColumnDrag,
    finalizeColumnDrag,
    startColumnMouseDrag,
    updateOverlayForMouseX,
  } = dragHandlers;

  // Update the placeholder with the actual drag handler
  React.useEffect(() => {
    // Replace the placeholder function with the actual one
    Object.assign(handleRowDragStart, actualHandleRowDragStart);
  }, [actualHandleRowDragStart]);


  // Post table handlers hook
  const handlers = usePostTableHandlers({
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
  });

  // Replace placeholder functions with actual handlers
  React.useEffect(() => {
    Object.assign(handleCheckboxClick, handlers.handleCheckboxClick);
    Object.assign(handleEditPost, handlers.handleEditPost);
  }, [handlers.handleCheckboxClick, handlers.handleEditPost]);


  // Track where to insert newly added user columns from header menu

  // Check if a column is a default/system column
  const isDefaultColumn = callbacks.isDefaultColumn;

  const handleHeaderMenuAction = useHeaderMenuAction(
    userColumns,
    columnOrder,
    tableData,
    activeBoardId,
    headerRefs,
    scrollContainerRef,
    table,
    updatePost,
    updateBoard,
    isDefaultColumn,
    openEditPanelAtElement,
    setEditFieldColumnId,
    setEditFieldType,
    setEditFieldOptions,
    setEditFieldPanelPos,
    setHeaderMenuOpenFor,
    setEditFieldOpen,
    setPendingInsertRef,
    setNewFieldLabel,
    setUserColumns,
    setColumnOrder,
    setTableData
  );

  function renderGroupValue(colId: string, val: any): React.ReactNode {
    switch (colId) {
      case "status":
        return <StatusChip status={String(val) as Status} widthFull={false} />;
      case "platforms": {
        // Grouping value may be page IDs – convert to platform names
        const ids: string[] = Array.isArray(val)
          ? (val as string[])
          : String(val || "")
              .split(",")
              .filter(Boolean);

        const platformsArr: Platform[] = ids
          .map((id) => pageIdToPlatformMap.get(id))
          .filter((p): p is Platform => !!p);

        if (platformsArr.length === 0) {
          // placeholder UI similar to ChannelsEditCell when empty
          return (
            <div
              className={cn(
                "flex flex-row items-center gap-1 rounded-[4px] bg-white border border-elementStroke"
              )}
              style={{
                padding: "3px 6px 3px 4px",
              }}
            >
                <div className="flex flex-row items-center justify-center w-3.5 h-3.5 rounded-[2px] bg-[#E5EEFF]">
                <Link2 className={cn("w-2.5 h-2.5 text-main")} />
                </div>
              <span className="text-xs text-black font-medium">
                Add socials
              </span>
            </div>
          );
        }
        return <ChannelIcons channels={platformsArr} />;
      }
      case "format": {
        const fmt = String(val || "");
        if (!fmt) {
          return (
            <div
              className={cn(
                "flex flex-row items-center gap-1 rounded-[4px] bg-white border border-elementStroke"
              )}
              style={{
              padding: "3px 6px 3px 4px",
              }}
            >
              <div className="flex flex-row items-center justify-center w-3.5 h-3.5 rounded-[2px] bg-[#FFEEE0]">
                <File className={cn("w-2.5 h-2.5 text-[#FD9038]")} />
              </div>
              <span className="text-xs text-black font-medium">
                Select format
              </span>
            </div>
          );
        }
        return <FormatBadge kind={fmt as ContentFormat} widthFull={false} />;
      }
      case "publish_date":
        if (!val)
          return (
            <span className="text-base text-muted-foreground font-semibold">
              No time is set yet
            </span>
          );
        return <span className="text-base font-semibold">{String(val)}</span>;
      case "month":
        return <span className="text-base font-semibold">Month {val}</span>;
      default:
        return <span>{String(val)}</span>;
    }
  }

  // Get selectedPosts from memoized values
  const { selectedPosts } = memoizedValues;


  if (!mounted) return null;

  return (
    <div className="w-full h-full relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handlers.onFileChange}
      />
      <div className="bg-background text-black flex flex-col h-full relative rounded-none border-none">
        {/* Context Menu */}
        <DropdownMenu
          open={contextMenuOpen}
          onOpenChange={setContextMenuOpen}
          modal={false}
        >
          <DropdownMenuTrigger className="hidden" />
          <PostContextMenu
            selectedPosts={selectedPosts}
            onEdit={(post) => handlers.handleEditPost(post)}
            onDuplicate={(posts) => handlers.handleDuplicatePosts(posts)}
            onDelete={handlers.handleDeletePosts}
            contextMenuPosition={contextMenuPosition}
          />
        </DropdownMenu>

        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-border-primary">
          <div className="flex gap-[6px] relative pl-[14px]">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 p-2 bg-white">
              <div className="flex items-center gap-2">
                <FilterPopover
                  open={filterOpen}
                  onOpenChange={setFilterOpen}
                  columns={filterableColumns as ColumnMeta[]}
                  rootGroup={filterTree}
                  setRootGroup={setFilterTree}
                  hasFilters={hasActiveFilters}
                />
              </div>
              <GroupMenu
                grouping={grouping as string[]}
                setGrouping={setGrouping}
              />
              <SortMenu
                sorting={sorting}
                setSorting={setSorting}
                columnNames={columnNames}
                columns={table.getAllLeafColumns().map((col) => ({
                  id: col.id,
                  getCanSort: col.getCanSort.bind(col),
                }))}
                userColumns={userColumns}
              />
              <RowHeightMenu
                rowHeight={rowHeight}
                setRowHeight={setRowHeight}
              />
            </div>
          </div>
          <div className="pr-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center p-[2px] rounded-full border border-[#D3D3D3] shadow-none cursor-pointer bg-[#FBFBFB]">
                  <MoreHorizontal className="h-4 w-4 text-black" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="!min-w-[105px]">
                <DropdownMenuItem
                  onClick={handlers.handleImport}
                  className="cursor-pointer"
                >
                  <ArrowUpFromLine className="mr-2 h-4 w-4" />
                  <span className="text-sm text-black font-medium leading-[16px]">
                    Import
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handlers.handleExport}
                  className="cursor-pointer"
                >
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  <span className="text-sm text-black font-medium leading-[16px]">
                    Export
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table region */}
        <CellFocusProvider>
          <div className="flex-1 bg-[#F8F8F8] relative">
            <div
              ref={scrollContainerRef}
              className="absolute inset-0 overflow-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#D0D5DD #F9FAFB",
                paddingBottom:
                  grouping.length === 0 && isScrollable ? "32px" : "0px", // Add padding for fixed button only when scrollable
              }}
              onScroll={handlers.handleScroll}
            >
              <style jsx global>{`
                /* Webkit scrollbar styling */
                .overflow-auto::-webkit-scrollbar {
                  width: 8px;
                  height: 8px;
                }
                .overflow-auto::-webkit-scrollbar-track {
                  background: #f9fafb;
                }
                .overflow-auto::-webkit-scrollbar-thumb {
                  background-color: #d0d5dd;
                  border-radius: 4px;
                  border: 2px solid #f9fafb;
                }
                .overflow-auto::-webkit-scrollbar-thumb:hover {
                  background-color: #98a2b3;
                }

                /* Sticky status shadow handling */
                .sticky-status-shadow {
                  transition: box-shadow 0.2s ease-in-out;
                }

                .scrolling-horiz .sticky-status-shadow {
                  box-shadow: 5px 0px 0px 0px rgba(16, 24, 40, 0.05);
                  transition: none;
                }

                /* Force grabbing cursor globally during column drag */
                .fbp-dragging-cursor,
                .fbp-dragging-cursor * {
                  cursor: grabbing !important;
                  cursor: -webkit-grabbing !important;
                }

                /* Platform icon stack overlap for column headers */
                .platform-stack-header > * + * {
                  margin-left: -4px; /* overlap amount for column header */
                }

                /* Platform icon sizes for column headers */
                .platform-stack-header img {
                  width: 16px !important;
                  height: 16px !important;
                }

                /* More badge styling for column headers */
                .platform-more-badge-header {
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 9999px;
                  background-color: #d1d5db;
                  color: #374151;
                  font-weight: 600;
                  line-height: 1;
                  white-space: nowrap;
                  height: 16px;
                  min-width: 16px;
                  padding: 0 4px;
                  font-size: 0.65rem;
                }
              `}</style>
              {/* Column drag overlay following cursor */}
              {draggingColumnId &&
                dragOverlayLeft != null &&
                dragOverlayWidth != null && (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    top: 0,
                    left: dragOverlayLeft,
                    width: dragOverlayWidth,
                      height: scrollContainerRef.current?.scrollHeight || 0,
                      background: "#E5E7EB",
                    opacity: 0.6,
                      border: "1px dashed #A3A3A3",
                    zIndex: 50,
                  }}
                />
              )}

              {/* Blue gap indicator showing insertion point (header-only height) */}
              {draggingColumnId &&
                dragOverColumnId &&
                (() => {
                const overEl = headerRefs.current[dragOverColumnId!];
                const container = scrollContainerRef.current;
                if (!overEl || !container) return null;
                const rect = overEl.getBoundingClientRect();
                const cRect = container.getBoundingClientRect();
                  const left =
                    (dragInsertAfter ? rect.right : rect.left) -
                    cRect.left +
                    container.scrollLeft;
                // Limit the indicator to the header height area only
                  const headerEl = container.querySelector(
                    "thead"
                  ) as HTMLElement | null;
                  const headerHeight = headerEl
                    ? headerEl.getBoundingClientRect().height
                    : 40;
                return (
                  <div
                    className="pointer-events-none absolute"
                    style={{
                      top: 0,
                      left,
                      width: 3,
                      height: headerHeight,
                        background: "#3B82F6",
                      zIndex: 60,
                    }}
                  />
                );
              })()}

              {/* Row blue gap indicator */}
              {isRowDragging && rowIndicatorTop != null && (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: grouping.length > 0 ? 14 : 0,
                    right: 0,
                    top: rowIndicatorTop,
                    height: 3,
                    background: "#3B82F6",
                    zIndex: 65,
                  }}
                />
              )}

              {/* Row drag overlay that follows cursor, showing 3-7 cells */}
              {isRowDragging &&
                rowDragIndex != null &&
                rowDragPos &&
                (() => {
                const container = scrollContainerRef.current;
                if (!container) return null;
                const cRect = container.getBoundingClientRect();
                const top = rowDragPos.y - cRect.top + container.scrollTop;
                const left = rowDragPos.x - cRect.left + container.scrollLeft;

                // Build a visual of 5 cells (skip drag and rowIndex); min-width:100px each, expand to content
                let row: Row<Post> | null = null;
                if (grouping.length > 0) {
                  // For grouped tables, get the row from the grouped model
                    const groups = getFinalGroupRows(
                      table.getGroupedRowModel().rows,
                      {},
                      rowComparator
                    );
                    const allLeafRows = groups.flatMap(
                      (group) => group.leafRows
                    );
                  row = allLeafRows[rowDragIndex] || null;
                } else {
                  // For ungrouped tables, use the regular row model
                  row = table.getRowModel().rows[rowDragIndex] || null;
                }
                if (!row) return null;
                const dataCellsAll = row
                  .getVisibleCells()
                    .filter(
                      (c) =>
                        c.column.id !== "drag" && c.column.id !== "rowIndex"
                    );
                const count = Math.min(5, dataCellsAll.length);
                const cells = dataCellsAll.slice(0, count);

                return (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      top,
                      left,
                      transform: `translate(-8px, -12px) rotate(${rowDragAngle}deg) scale(${rowDragScale})`,
                        transformOrigin: "center center",
                      zIndex: 70,
                        transition: "transform 140ms ease-out",
                        filter: "drop-shadow(0 8px 16px rgba(16,24,40,0.18))",
                    }}
                  >
                    <div
                      className="bg-white border border-[#E4E7EC]"
                      style={{
                          display: "flex",
                          alignItems: "stretch",
                        padding: 0,
                      }}
                    >
                      {cells.map((cell) => (
                        <div
                          key={cell.id}
                          className="px-2"
                          style={{
                            minWidth: 100,
                              borderRight: "1px solid #EAE9E9",
                              background: "#FFFFFF",
                              display: "flex",
                              alignItems:
                                cell.column.id === "caption"
                                  ? "flex-start"
                                  : "center",
                              justifyContent: "flex-start",
                            height: getRowHeightPixels(rowHeight),
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, {
                            ...(cell.getContext() as any),
                            isFocused: false,
                            isEditing: false,
                              enterEdit: () => {},
                              exitEdit: () => {},
                          } as any)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="min-w-full inline-block relative">
                {grouping.length > 0 ? (
                  <div className="p-0 m-0">
                    <RenderGroupedTable
                      table={table}
                      grouping={grouping}
                      userColumns={userColumns}
                      columnOrder={columnOrder}
                      getFinalGroupRows={getFinalGroupRows}
                      rowComparator={rowComparator}
                      isSticky={isSticky}
                      stickyStyles={stickyStyles}
                      flatGroupExpanded={flatGroupExpanded}
                      setFlatGroupExpanded={setFlatGroupExpanded}
                      currentBoard={currentBoard}
                      boardRules={boardRules as BoardRules}
                      handleOpenGroupFeedback={handlers.handleOpenGroupFeedback}
                      renderGroupValue={renderGroupValue}
                      getRowHeightPixels={getRowHeightPixels}
                      rowHeight={rowHeight}
                      handleRowClick={handlers.handleRowClick}
                      handleContextMenu={handlers.handleContextMenu}
                      handleRowDragStart={handleRowDragStart}
                      handleRowDrop={handleRowDrop}
                      setDragOverIndex={dragStateSetters.setDragOverIndex}
                      draggingColumnId={draggingColumnId}
                      fillDragRange={fillDragRange}
                      fillDragColumn={fillDragColumn}
                      handleAddRowForGroup={handlers.handleAddRowForGroup}
                      PlusIcon={PlusIcon}
                      ChevronUpIcon={ChevronUpIcon}
                      ChevronDownIcon={ChevronDownIcon}
                      // Props for RenderGroupedTableHeader
                      headerMenuOpenFor={headerMenuOpenFor}
                      setHeaderMenuOpenFor={setHeaderMenuOpenFor}
                      headerMenuAlign={headerMenuAlign}
                      setHeaderMenuAlign={setHeaderMenuAlign}
                      headerMenuAlignOffset={headerMenuAlignOffset}
                      setHeaderMenuAlignOffset={setHeaderMenuAlignOffset}
                      headerMenuSideOffset={headerMenuSideOffset}
                      setHeaderMenuSideOffset={setHeaderMenuSideOffset}
                      resizingColumnId={resizingColumnId}
                      headerRefs={headerRefs}
                      plusHeaderRef={plusHeaderRef}
                      handleHeaderMenuAction={handleHeaderMenuAction}
                      handleOpenAddFieldFromPlus={handlers.handleOpenAddFieldFromPlus}
                      startColumnMouseDrag={startColumnMouseDrag}
                      isDefaultColumn={isDefaultColumn}
                      RenderGroupedTableHeader={RenderGroupedTableHeader}
                    />
                  </div>
                ) : (
                  <RenderUngroupedTable
                    table={table}
                    stickyStyles={stickyStyles}
                    headerMenuOpenFor={headerMenuOpenFor}
                    setHeaderMenuOpenFor={setHeaderMenuOpenFor}
                    headerMenuAlign={headerMenuAlign}
                    setHeaderMenuAlign={setHeaderMenuAlign}
                    headerMenuAlignOffset={headerMenuAlignOffset}
                    setHeaderMenuAlignOffset={setHeaderMenuAlignOffset}
                    headerMenuSideOffset={headerMenuSideOffset}
                    setHeaderMenuSideOffset={setHeaderMenuSideOffset}
                    draggingColumnId={draggingColumnId}
                    resizingColumnId={resizingColumnId}
                    headerRefs={headerRefs}
                    plusHeaderRef={plusHeaderRef}
                    isSticky={isSticky}
                    handleHeaderMenuAction={handleHeaderMenuAction}
                    handleOpenAddFieldFromPlus={handlers.handleOpenAddFieldFromPlus}
                    startColumnMouseDrag={startColumnMouseDrag}
                    isDefaultColumn={isDefaultColumn}
                    columnOrder={columnOrder}
                    isFillTarget={isFillTarget}
                    isFillSource={isFillSource}
                    handleRowClick={handlers.handleRowClick}
                    handleContextMenu={handlers.handleContextMenu}
                    handleRowDragStart={handleRowDragStart}
                    handleRowDrop={handleRowDrop}
                    setDragOverIndex={dragStateSetters.setDragOverIndex}
                    fillDragColumn={fillDragColumn}
                    fillDragRange={fillDragRange}
                    rowHeight={rowHeight}
                    isRowDragging={isRowDragging}
                    scrollContainerRef={scrollContainerRef}
                    setRowIndicatorTop={dragStateSetters.setRowIndicatorTop}
                    isScrollable={isScrollable}
                    handleAddRowUngrouped={handlers.handleAddRowUngrouped}
                    userColumns={userColumns}
                    columnNames={columnNames}
                    setRenameColumnId={setRenameColumnId}
                    setRenameValue={setRenameValue}
                  />
                )}
                {/* Inline Edit Field Panel anchored to header */}
                <InlineEditFieldPanel
                  editFieldOpen={editFieldOpen}
                  editFieldPanelPos={editFieldPanelPos}
                  editFieldPanelRef={editFieldPanelRef}
                  editFieldColumnId={editFieldColumnId}
                  editFieldType={editFieldType}
                  editFieldTypeOpen={editFieldTypeOpen}
                  editFieldOptions={editFieldOptions}
                  newFieldLabel={newFieldLabel}
                  userColumns={userColumns}
                  columnNames={columnNames}
                  setEditFieldOpen={setEditFieldOpen}
                  setEditFieldTypeOpen={setEditFieldTypeOpen}
                  setEditFieldType={setEditFieldType}
                  setEditFieldOptions={setEditFieldOptions}
                  setNewFieldLabel={setNewFieldLabel}
                  setUserColumns={setUserColumns}
                  setColumnNames={setColumnNames}
                  handleAddColumn={handlers.handleAddColumn}
                  handleOptionRemoval={handlers.handleOptionRemoval}
                  mapEditFieldTypeToColumnType={mapEditFieldTypeToColumnType}
                  activeBoardId={activeBoardId}
                  updateBoard={updateBoard}
                  table={table}
                />
              </div>

              {/* Empty state displayed below table when no posts */}
              {table.getRowModel().rows.length === 0 && (
                <div className="flex flex-col items-center justify-center py-40">
                  <div className="relative w-[120px] h-[120px] flex items-center justify-center">
                    <Image
                      src="/images/boards/record-container.svg"
                      alt="No records"
                      width={120}
                      height={120}
                    />
                    <div
                      className="absolute w-4 h-4 bg-white/80"
                      style={{
                        top: 13,
                        right: 13,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 4px rgba(16,24,40,0.08)",
                        border: "1px solid rgb(212, 214, 216)",
                      }}
                    >
                      <PlusIcon size={12} className="text-darkGrey" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xl font-semibold mb-2">
                      No records yet
                    </div>
                    <div className="text-sm font-normal text-darkGrey">
                      No record created yet. Start by creating
                    </div>
                    <div className="text-sm font-normal text-darkGrey">
                      your first record.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed "Add new record" button for ungrouped view - only when scrollable */}
            {grouping.length === 0 && isScrollable && (
              <div className="absolute bottom-2 px-3 py-2.5 left-1 right-0 bg-white border-t border-[#EAE9E9] z-10">
                <div className="flex items-center h-full">
                  <button
                    className="p-0 m-0 font-medium text-sm cursor-pointer flex flex-row leading-[16px] items-center gap-2"
                    onClick={handlers.handleAddRowUngrouped}
                  >
                    <PlusIcon size={16} />
                    Add new record
                  </button>
                </div>
              </div>
            )}
          </div>
        </CellFocusProvider>
        {/* AddColumn Dialog */}
        <AddColumnDialog
          open={addColumnOpen}
          onOpenChange={setAddColumnOpen}
          onAddColumn={handlers.handleAddColumn}
        />

        {editingPost && (
          <CaptionEditor
            open={captionOpen}
            post={editingPost}
            onClose={() => setCaptionOpen(false)}
            onSave={(newCap) => {
              updatePost(editingPost.id, { caption: newCap });
            }}
          />
        )}

        {/* User long text editor */}
        {userTextOpen && editingUserText && (
          <UserTextEditor
            open={userTextOpen}
            title={(() => {
              const uc = userColumns.find(
                (c) => c.id === editingUserText.colId
              );
              return uc?.label || columnNames[editingUserText.colId] || "Edit";
            })()}
            value={(() => {
              const p = tableData.find((p) => p.id === editingUserText.postId);
              const uc = userColumns.find(
                (c) => c.id === editingUserText.colId
              );
              if (!p || !uc) return "";
              return getUserColumnValue(p, uc.id);
            })()}
            onClose={() => setUserTextOpen(false)}
            onChange={(newVal) => {
              const uc = userColumns.find(
                (c) => c.id === editingUserText.colId
              );
              if (!uc) return;
              setTableData((prev) =>
                prev.map((p) => {
                if (p.id !== editingUserText.postId) return p;
                const newArr = buildUpdatedUserColumnsArr(p, uc.id, newVal);
                return { ...p, user_columns: newArr };
                })
              );
              const postId = editingUserText.postId;
              const p = tableData.find((pp) => pp.id === postId);
              const newArr = p
                ? buildUpdatedUserColumnsArr(p, uc.id, newVal)
                : [{ id: uc.id, value: newVal }];
              updatePost(postId, { user_columns: newArr } as any);
            }}
          />
        )}
      </div>

      <BulkActionToolbar
        selectedPosts={selectedPosts}
        showUndoMessage={showUndoMessage}
        showDuplicateUndoMessage={showDuplicateUndoMessage}
        lastTrashedCount={lastTrashedCount}
        lastDuplicatedCount={lastDuplicatedCount}
        updatePost={updatePost}
        handleDuplicatePosts={handlers.handleDuplicatePosts}
        handleDeletePosts={handlers.handleDeletePosts}
        handleUndoTrash={handlers.handleUndoTrash}
        handleUndoDuplicate={handlers.handleUndoDuplicate}
        table={table}
      />

      <GroupFeedbackSidebar
        isOpen={groupFeedbackSidebarOpen}
        onClose={handlers.handleCloseGroupFeedback}
        groupData={selectedGroupData}
        month={selectedGroupData?.month || 0}
        onAddComment={handlers.handleAddGroupComment}
        onAddMessage={handlers.handleAddGroupMessage}
        onResolveComment={handlers.handleResolveGroupComment}
        onDeleteAiSummary={handlers.handleDeleteAiSummary}
      />
    </div>
  );
}
