import * as React from "react";
import { Post, Platform, BoardRules, Board, UserColumn, Workspace, ConditionGroup } from "@/lib/store";
import { createPlatformsFilterFn } from "./filters";
import { ColumnDef, useReactTable, Table, Row, SortingState, FilterFn, SortingFn } from "@tanstack/react-table";
import { createPlatformsSortingFn } from "./sort";
import { createBaseColumns } from "./columns/base-columns";
import { createUserColumns } from "./columns/user-columns";
import { getUserColumnValue, buildUpdatedUserColumnsArr, normalizeOrder, buildColumnsPayloadForOrder } from "./utils";
import { RowHeightType } from "@/lib/utils";

export interface PostTableMemoizedValuesParams {
  // State
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeBoardId: string | null;
  tableData: Post[];
  userColumns: UserColumn[];
  columnOrder: string[];
  columnNames: Record<string, string>;
  rowHeight: RowHeightType;
  selectedPlatform: Platform | null;
  availablePlatforms: Platform[];
  captionLocked: boolean;
  platformsFilterFn: FilterFn<Post>;
  platformsSortingFn: SortingFn<Post>;
  statusFilterFn: FilterFn<Post>;
  statusSortingFn: SortingFn<Post>;
  formatFilterFn: FilterFn<Post>;
  formatSortingFn: SortingFn<Post>;
  monthFilterFn: FilterFn<Post>;
  previewFilterFn: FilterFn<Post>;
  publishDateFilterFn: FilterFn<Post>;
  approveFilterFn: FilterFn<Post>;
  boardRules: BoardRules | undefined;
  sorting: SortingState;
  filterTree: ConditionGroup | null;
  ws: Workspace | null;
  selectedRows: Array<Row<Post>>;
  
  // Setters
  setTableData: React.Dispatch<React.SetStateAction<Post[]>>;
  setCaptionLocked: React.Dispatch<React.SetStateAction<boolean>>;
  updateBoard: (id: string, data: Partial<Board>) => Promise<void>;
  updatePost: (postId: string, data: Partial<Post>) => void;
  setUserColumns: React.Dispatch<React.SetStateAction<UserColumn[]>>;
  
  // External functions
  onOpen?: (id: string) => void;
  getPageCounts: () => Record<Platform, number>;
  handleFillStartCaption: (value: Post["caption"], startIdx: number) => void;
  handleFillStartPages: (value: string[], startIdx: number) => void;
  handleFillStartFormat: (value: string, startIdx: number) => void;
  handleFillStartMonth: (value: number, startIdx: number) => void;
  previewCellFn: ({ row, isFocused }: { row: Row<Post>; isFocused?: boolean }) => React.ReactNode;
  
  // Handlers
  handleRowDragStart: (e: React.DragEvent, fromIndex: number) => void;
  handleCheckboxClick: (e: React.MouseEvent, row: Row<Post>) => void;
  handleEditPost: (post: Post) => void;
  
  // Refs
  anchorRowIdRef: React.MutableRefObject<string | null>;
  tableRef: React.MutableRefObject<Table<Post> | null>;
  
  // Table
  table: ReturnType<typeof useReactTable<Post>> | null;
}

export function usePostTableMemoizedValues(params: PostTableMemoizedValuesParams) {
  const {
    // State
    workspaces,
    activeWorkspaceId,
    activeBoardId,
    tableData,
    userColumns,
    columnOrder,
    columnNames,
    rowHeight,
    selectedPlatform,
    availablePlatforms,
    captionLocked,
    platformsFilterFn,
    platformsSortingFn,
    statusFilterFn,
    statusSortingFn,
    formatFilterFn,
    formatSortingFn,
    monthFilterFn,
    previewFilterFn,
    publishDateFilterFn,
    approveFilterFn,
    boardRules,
    sorting,
    filterTree,
    ws,
    selectedRows,
    
    // Setters
    setTableData,
    setCaptionLocked,
    updateBoard,
    updatePost,
    setUserColumns,
    
    // External functions
    onOpen,
    getPageCounts,
    handleFillStartCaption,
    handleFillStartPages,
    handleFillStartFormat,
    handleFillStartMonth,
    previewCellFn,
    
    // Handlers
    handleRowDragStart,
    handleCheckboxClick,
    handleEditPost,
    
    // Refs
    anchorRowIdRef,
    tableRef,
    
    // Table
    table,
  } = params;

  // Compute activeWorkspace from the actual data that changes
  const activeWorkspace = React.useMemo(() => {
    const ws = workspaces.find((w) => w.id === activeWorkspaceId);
    return ws ?? null;
  }, [workspaces, activeWorkspaceId]);

  const currentBoard = React.useMemo(
    () => (activeWorkspace?.boards.find((b) => b.id === activeBoardId) ?? null),
    [activeWorkspace, activeBoardId]
  );

  // Build the flattened column filters from a nested filter tree
  const hasActiveFilters = React.useMemo(() => {
    if (!filterTree) return false;
    
    let active = false;
    const check = (node: { type?: string; selectedValues?: unknown[]; children?: any[] } | null | undefined) => {
      if (!node) return;
      
      if (node.type === "condition") {
        if (node.selectedValues && node.selectedValues.length > 0) active = true;
      } else if (node.children) {
        node.children.forEach(check);
      }
    };
    check(filterTree);
    return active;
  }, [filterTree]);

  const pageIdToPlatformMap = React.useMemo(() => {
    const pages: Array<{ id: string; platform: Platform }> = (ws?.socialPages || []) ?? [];
    return new Map(pages.map((p) => [p.id, p.platform] as const));
  }, [ws?.socialPages]);

  // Now we define the functions INSIDE the component, so they have access to the map
  const platformsFilterFnMemo = React.useMemo(
    () => createPlatformsFilterFn(pageIdToPlatformMap),
    [pageIdToPlatformMap]
  );

  const platformsSortingFnMemo = React.useMemo(
    () => createPlatformsSortingFn(pageIdToPlatformMap),
    [pageIdToPlatformMap]
  );

  const availablePlatformsMemo = React.useMemo(() => {
    const pages: Array<{ id: string; platform: Platform }> = (ws?.socialPages || []) ?? [];

    // Gather all page IDs from the table's posts
    const allPageIds = new Set<string>();
    for (const post of tableData) {
      for (const pageId of post.pages) {
        allPageIds.add(pageId);
      }
    }

    // For each page in workspace/brand pages, if its ID is in allPageIds,
    // add page.platform to a set
    const platformSet = new Set<Platform>();
    for (const sp of pages) {
      if (allPageIds.has(sp.id)) {
        platformSet.add(sp.platform);
      }
    }

    return Array.from(platformSet);
  }, [tableData, ws?.socialPages]);

  /** 1) Base columns **/
  const baseColumns: ColumnDef<Post>[] = React.useMemo(() => {
    return createBaseColumns({
      columnNames,
      updatePost,
      setTableData,
      rowHeight,
      selectedPlatform,
      availablePlatforms,
      captionLocked,
      setCaptionLocked,
      platformsFilterFn,
      platformsSortingFn,
      statusFilterFn,
      statusSortingFn,
      formatFilterFn,
      formatSortingFn,
      monthFilterFn,
      previewFilterFn,
      publishDateFilterFn,
      approveFilterFn,
      boardRules,
      activeBoardId,
      updateBoard,
      sorting,
      onOpen,
      onRowDragStart: handleRowDragStart,
      onRowIndexCheckedChange: (rowId: string, row: Row<Post>, val: boolean) => {
        row.toggleSelected(!!val);
        anchorRowIdRef.current = row.id;
      },
      onRowIndexCheckboxClick: handleCheckboxClick,
      onRequestChanges: (post: Post) => {
        setTableData((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: "Needs Revisions" } : p)));
        handleEditPost(post);
      },
      onToggleAutoSchedule: (checked: boolean) => {
        if (!activeBoardId) return;
        const prevRules: BoardRules | undefined = boardRules;
        const mergedRules: BoardRules = {
          autoSchedule: checked,
          revisionRules: prevRules?.revisionRules ?? false,
          approvalDeadline: prevRules?.approvalDeadline ?? false,
          firstMonth: prevRules?.firstMonth,
          ongoingMonth: prevRules?.ongoingMonth,
          approvalDays: prevRules?.approvalDays,
          groupBy: prevRules?.groupBy ?? null,
          sortBy: prevRules?.sortBy ?? null,
          rowHeight: prevRules?.rowHeight ?? rowHeight,
        };
        // optimistic update in store
        require("@/lib/store").useWorkspaceStore.setState((s: { workspaces: Array<{ id: string; boards: Board[] }> }) => ({
          workspaces: (s.workspaces || []).map((w) => ({
            ...w,
            boards: (w.boards || []).map((b: Board) => (b.id === activeBoardId ? { ...b, rules: mergedRules } : b)),
          })),
        }));
        updateBoard(activeBoardId, { rules: mergedRules }).catch(() => {
          require("@/lib/store").useWorkspaceStore.setState((s: { workspaces: Array<{ id: string; boards: Board[] }> }) => ({
            workspaces: (s.workspaces || []).map((w) => ({
              ...w,
              boards: (w.boards || []).map((b: Board) => (b.id === activeBoardId ? { ...b, rules: prevRules } : b)),
            })),
          }));
        });
      },
      getPageCounts,
      handleFillStartCaption,
      handleFillStartPages,
      handleFillStartFormat,
      handleFillStartMonth,
      previewCellFn,
      // Accept a minimal shape; component only reads id and platform
      socialPages: (ws?.socialPages || []) as any,
      allPosts: tableData,
    });
  }, [
    columnNames,
    updatePost,
    rowHeight,
    selectedPlatform,
    availablePlatforms,
    captionLocked,
    setCaptionLocked,
    platformsFilterFn,
    platformsSortingFn,
    statusFilterFn,
    statusSortingFn,
    formatFilterFn,
    formatSortingFn,
    monthFilterFn,
    previewFilterFn,
    publishDateFilterFn,
    approveFilterFn,
    boardRules,
    activeBoardId,
    updateBoard,
    sorting,
    onOpen,
    handleRowDragStart,
    getPageCounts,
    handleFillStartCaption,
    handleFillStartPages,
    handleFillStartFormat,
    handleFillStartMonth,
    previewCellFn,
    ws?.socialPages,
    tableData,
    setTableData,
    handleCheckboxClick,
    handleEditPost,
    anchorRowIdRef,
  ]);

  /** 2) user-defined columns **/
  const userColumnDefs: ColumnDef<Post>[] = React.useMemo(() => {
    return createUserColumns({
      userColumns,
      rowHeight,
      getUserColumnValue,
      buildUpdatedUserColumnsArr,
      setTableData,
      updatePost,
      setUserColumns,
      activeBoardId,
      getCurrentOrder: () => (tableRef.current ? tableRef.current.getAllLeafColumns().map((c) => c.id) : []),
      normalizeOrder,
      buildColumnsPayloadForOrder,
      updateBoard,
      columnNames,
    });
  }, [
    userColumns,
    rowHeight,
    getUserColumnValue,
    buildUpdatedUserColumnsArr,
    setTableData,
    updatePost,
    setUserColumns,
    activeBoardId,
    normalizeOrder,
    buildColumnsPayloadForOrder,
    updateBoard,
    columnNames,
    tableRef.current,
  ]);

  // Combine base + user columns
  const columns = React.useMemo(() => {
    return [...baseColumns, ...userColumnDefs];
  }, [baseColumns, userColumnDefs]);

  // columns for filter builder
  const filterableColumns = React.useMemo(() => {
    // Allow filtering on: Status, Month, Socials (platforms), Format, Approve, Preview, Post Time
    const ALLOWED_FILTER_COLUMNS = new Set(["status", "month", "platforms", "format", "approve", "preview", "publish_date"]);

    const iconMap: Record<string, React.JSX.Element> = {
      status: React.createElement(require("next/image"), { src: "/images/columns/status.svg", alt: "Status", width: 13, height: 13 }),
      month: React.createElement(require("next/image"), { src: "/images/columns/post-time.svg", alt: "Month", width: 13, height: 13 }),
      platforms: React.createElement(require("next/image"), { src: "/images/columns/socials.svg", alt: "Platforms", width: 13, height: 13 }),
      format: React.createElement(require("next/image"), { src: "/images/columns/format.svg", alt: "Format", width: 13, height: 13 }),
      approve: React.createElement(require("next/image"), { src: "/images/columns/approve.svg", alt: "Approve", width: 13, height: 13 }),
      preview: React.createElement(require("next/image"), { src: "/images/columns/preview.svg", alt: "Preview", width: 13, height: 13 }),
      publish_date: React.createElement(require("next/image"), { src: "/images/columns/post-time.svg", alt: "Post Time", width: 13, height: 13 }),
    };

    return columns
      .filter((c) => ALLOWED_FILTER_COLUMNS.has(c.id as string))
      .map((col) => ({
        id: col.id,
        label: columnNames[col.id as string] ?? col.id,
        icon: iconMap[col.id as string] ?? null,
      }));
  }, [columns, columnNames]);

  const selectedPosts = React.useMemo(
    () => selectedRows.map((r) => r.original),
    [selectedRows]
  );

  return {
    activeWorkspace,
    currentBoard,
    boardRules: currentBoard?.rules,
    hasActiveFilters,
    pageIdToPlatformMap,
    platformsFilterFn: platformsFilterFnMemo,
    platformsSortingFn: platformsSortingFnMemo,
    availablePlatforms: availablePlatformsMemo,
    baseColumns,
    userColumnDefs,
    columns,
    filterableColumns,
    selectedPosts,
  };
}
