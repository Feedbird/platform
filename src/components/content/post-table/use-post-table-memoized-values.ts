import * as React from "react";
import { Post, Platform, BoardRules, Board } from "@/lib/store";
import { createPlatformsFilterFn } from "./filters";
import { ColumnDef, useReactTable } from "@tanstack/react-table";
import { createPlatformsSortingFn } from "./sort";
import { createBaseColumns } from "./columns/base-columns";
import { createUserColumns } from "./columns/user-columns";
import { getUserColumnValue, buildUpdatedUserColumnsArr, normalizeOrder, buildColumnsPayloadForOrder, getFinalGroupRows } from "./utils";

export interface PostTableMemoizedValuesParams {
  // State
  workspaces: any[];
  activeWorkspaceId: string | null;
  activeBoardId: string | null;
  tableData: Post[];
  userColumns: any[];
  columnOrder: string[];
  columnNames: Record<string, string>;
  rowHeight: any;
  selectedPlatform: any;
  availablePlatforms: Platform[];
  captionLocked: boolean;
  platformsFilterFn: any;
  platformsSortingFn: any;
  statusFilterFn: any;
  statusSortingFn: any;
  formatFilterFn: any;
  formatSortingFn: any;
  monthFilterFn: any;
  previewFilterFn: any;
  publishDateFilterFn: any;
  approveFilterFn: any;
  boardRules: BoardRules | undefined;
  sorting: any[];
  filterTree: any;
  ws: any;
  selectedRows: any[];
  
  // Setters
  setTableData: React.Dispatch<React.SetStateAction<Post[]>>;
  setCaptionLocked: React.Dispatch<React.SetStateAction<boolean>>;
  updateBoard: (id: string, data: Partial<Board>) => Promise<void>;
  updatePost: (postId: string, data: any) => void;
  setUserColumns: React.Dispatch<React.SetStateAction<any[]>>;
  
  // External functions
  onOpen?: (id: string) => void;
  getPageCounts: any;
  handleFillStartCaption: any;
  handleFillStartPages: any;
  handleFillStartFormat: any;
  handleFillStartMonth: any;
  previewCellFn: any;
  
  // Handlers
  handleRowDragStart: any;
  handleCheckboxClick: any;
  handleEditPost: any;
  
  // Refs
  anchorRowIdRef: React.MutableRefObject<string | null>;
  tableRef: React.MutableRefObject<any>;
  
  // Table
  table: ReturnType<typeof useReactTable<Post>>;
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
    return workspaces.find((w) => w.id === activeWorkspaceId);
  }, [workspaces, activeWorkspaceId]);

  const currentBoard = React.useMemo(
    () => activeWorkspace?.boards.find((b: any) => b.id === activeBoardId),
    [activeWorkspace, activeBoardId]
  );

  // Build the flattened column filters from a nested filter tree
  const hasActiveFilters = React.useMemo(() => {
    if (!filterTree) return false;
    
    let active = false;
    const check = (node: any) => {
      if (!node) return;
      
      if ((node as any).type === "condition") {
        const c = node as any;
        if (c.selectedValues && c.selectedValues.length > 0) active = true;
      } else if ((node as any).children) {
        (node as any).children.forEach(check);
      }
    };
    check(filterTree);
    return active;
  }, [filterTree]);

  const pageIdToPlatformMap = React.useMemo(() => {
    const pages: any[] = (ws?.socialPages || []) ?? [];
    return new Map(pages.map((p: any) => [p.id, p.platform] as const));
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
    const pages: any[] = (ws?.socialPages || []) ?? [];

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
      onRowIndexCheckedChange: (rowId: string, row: any, val: boolean) => {
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
        require("@/lib/store").useWorkspaceStore.setState((s: any) => ({
          workspaces: (s.workspaces || []).map((w: any) => ({
            ...w,
            boards: (w.boards || []).map((b: any) => (b.id === activeBoardId ? { ...b, rules: mergedRules } : b)),
          })),
        }));
        updateBoard(activeBoardId, { rules: mergedRules }).catch(() => {
          require("@/lib/store").useWorkspaceStore.setState((s: any) => ({
            workspaces: (s.workspaces || []).map((w: any) => ({
              ...w,
              boards: (w.boards || []).map((b: any) => (b.id === activeBoardId ? { ...b, rules: prevRules } : b)),
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
      getCurrentOrder: () => (tableRef.current ? tableRef.current.getAllLeafColumns().map((c: any) => c.id) : []),
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
    () => selectedRows.map((r: any) => r.original),
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
