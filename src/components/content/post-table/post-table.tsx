"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  GroupingState,
  SortingState,
  SortingFn,
  VisibilityState,
  ExpandedState,
  ColumnResizeMode,
  ColumnSizingState,
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
  CellContext
} from "@tanstack/react-table";

import {
  ChevronUpIcon,
  ChevronDownIcon,
  EditIcon,
  GripVertical,
  PlusIcon,
  CalendarIcon,
  MessageSquare,
  ListPlus,
  Film,
  ImageIcon,
  FolderOpen,
  CheckIcon,
  AlertTriangle,
  MessageCircleMore,
  Trash2Icon,
  CircleChevronDown,
  Type,
  SquareCheckBig,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Lock,
  Unlock,
  X as XIcon,
  Copy,
  ChevronDown,
  MoreHorizontal,
  CircleArrowOutDownRight
} from "lucide-react";

import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state/empty-state";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { format, parse } from "date-fns";
import Papa from "papaparse";
import { Platform } from "@/lib/social/platforms/platform-types";
import { RowHeightType, getRowHeightPixels } from "@/lib/utils";

type FinalGroup = {
  groupValues: Record<string, any>   // e.g. { status: "Pending Approval", channels: "TikTok,LinkedIn" }
  rowCount: number                   // how many leaf rows
  leafRows: Row<Post>[]             // the actual leaf row objects
  groupingColumns: string[]          // the columns that were grouped on
}

function getFinalGroupRows(
  rows: Row<Post>[],
  currentValues: Record<string, any> = {}
): FinalGroup[] {
  const finalGroups: FinalGroup[] = [];

  rows.forEach((row) => {
    if (row.getIsGrouped()) {
      const colId = row.groupingColumnId as string;
      const value = row.groupingValue;

      // Add or override the grouping value in the path:
      const newValues = { ...currentValues, [colId]: value };

      // If row.subRows are STILL grouped further, keep going:
      if (row.subRows.some((r) => r.getIsGrouped())) {
        const deeper = getFinalGroupRows(row.subRows as unknown as Row<Post>[], newValues);
        finalGroups.push(...deeper);
      } else {
        // If subRows are leaves, we have found a "lowest-level" group
        finalGroups.push({
          groupValues: newValues,
          leafRows: row.subRows as unknown as Row<Post>[],
          rowCount: row.subRows.length,
          groupingColumns: Object.keys(newValues), // for convenience
        });
      }
    }
  });

  return finalGroups;
}

/* --- Import newly split-out components --- */
import { FilterPopover, ConditionGroup, ColumnMeta, Condition } from "./FilterPopover";
import { GroupMenu } from "./GroupMenu";
import { SortMenu } from "./SortMenu";
import { RowHeightMenu } from "./RowHeightMenu";
import { ColumnVisibilityMenu } from "./ColumnVisibilityMenu";
import { BlocksPreview } from "./BlocksPreview";
import { MemoBlocksPreview } from "./MemoBlocksPreview";
import { StatusEditCell } from "./StatusEditCell";
import { ChannelsEditCell } from "./ChannelsEditCell";
import { FormatEditCell } from "./FormatEditCell";
import { ApproveCell } from "./ApproveCell";
import { PublishDateCell, UpdateDateCell } from "./DateCell";
import { CellFocusProvider, FocusCell } from "./FocusProvider";
import {
  ContentFormat,
  Post,
  Status,
  useFeedbirdStore,
  UserColumn,
  ColumnType,
  BoardRules,
  BoardGroupData,
  GroupComment,
  GroupMessage,
} from "@/lib/store/use-feedbird-store";
import {
  StatusChip,
  ChannelIcons,
  FormatBadge,
} from "@/components/content/shared/content-post-ui";
import { CaptionEditor } from "./CaptionEditor";
import { AddColumnDialog } from "./AddColumnDialog";
import { PostContextMenu } from "./PostContextMenu";
import { CaptionCell } from "./CaptionCell";
import { SettingsEditCell } from "./SettingsCell";
import { MonthEditCell } from "./MonthEditCell";
import { GroupFeedbackSidebar } from "./GroupFeedbackSidebar";

const MemoizedRow = React.memo(
  ({
    row,
    isSelected,
    isFillTarget,
    isFillSource,
    handleRowClick,
    handleContextMenu,
    handleRowDragStart,
    setDragOverIndex,
    handleRowDrop,
    isSticky,
    stickyStyles,
    table,
    fillDragColumn,
    fillDragRange,
    rowHeight,
    columnOrder,
  }: {
    row: Row<Post>;
    isSelected: boolean;
    isFillTarget: (idx: number) => boolean;
    isFillSource: (idx: number) => boolean;
    handleRowClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, row: Row<Post>) => void;
    handleContextMenu: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, row: Row<Post>) => void;
    handleRowDragStart: (e: React.DragEvent, fromIndex: number) => void;
    setDragOverIndex: React.Dispatch<React.SetStateAction<number | null>>;
    handleRowDrop: (e: React.DragEvent) => void;
    isSticky: (colId: string) => boolean;
    stickyStyles: (colId: string, z?: number) => React.CSSProperties | undefined;
    table: ReactTableType<Post>;
    fillDragColumn: string | null;
    fillDragRange: [number, number] | null;
    rowHeight: RowHeightType;
    columnOrder: string[];
  }) => {
    return (
      <TableRow
        key={row.id}
        data-rowkey={row.index}
        style={{ height: getRowHeightPixels(rowHeight) }}
        className={cn(
          "group",
          "hover:bg-[#F9FAFB]",
          isSelected && "bg-[#EBF5FF]"
        )}
        onMouseDownCapture={(e) => handleRowClick(e, row)}
        onContextMenu={(e) => handleContextMenu(e, row)}
        onDragStart={(e) => handleRowDragStart(e, row.index)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverIndex(row.index);
        }}
        onDrop={handleRowDrop}
      >
        {row.getVisibleCells().map((cell) => {
          const isColSticky = isSticky(cell.column.id);
          return (
            <FocusCell
              rowId={row.id}
              colId={cell.id}
              key={cell.id}
              singleClickEdit={cell.column.id === "platforms" || cell.column.id === "format"}
              className={cn(
                "text-left",
                cell.column.id === "caption" ? "align-top" : "align-middle",
                "px-0 py-0",
                "border-t border-[#EAE9E9] last:border-b-0",
                isColSticky && (isSelected ? "bg-[#EBF5FF]" : "bg-white group-hover:bg-[#F9FAFB]"),
                cell.column.id === "status" && "sticky-status-shadow",
                fillDragRange && fillDragColumn === cell.column.id && row.index >= fillDragRange[0] && row.index <= fillDragRange[1] && "bg-[#EBF5FF]"
              )}
              style={{
                height: "inherit",
                borderRight: "1px solid #EAE9E9",
                width: cell.column.getSize(),
                ...stickyStyles(cell.column.id, 10),
              }}
            >
              {({ isFocused, isEditing, exitEdit, enterEdit }) => {
                return flexRender(cell.column.columnDef.cell, {
                  ...cell.getContext(),
                  isFocused,
                  isEditing,
                  exitEdit,
                  enterEdit,
                });
              }}
            </FocusCell>
          );
        })}
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.rowHeight !== nextProps.rowHeight) return false;
    if (prevProps.isSelected !== nextProps.isSelected) return false;
    if (prevProps.row.original !== nextProps.row.original) return false;
    if (prevProps.fillDragColumn !== nextProps.fillDragColumn) return false;
    if (
      (prevProps.fillDragRange?.[0] !== nextProps.fillDragRange?.[0]) ||
      (prevProps.fillDragRange?.[1] !== nextProps.fillDragRange?.[1])
    ) {
      // Re-render if row enters/leaves a fill range
      const isPrevInRange = prevProps.fillDragRange && prevProps.row.index >= prevProps.fillDragRange[0] && prevProps.row.index <= prevProps.fillDragRange[1];
      const isNextInRange = nextProps.fillDragRange && nextProps.row.index >= nextProps.fillDragRange[0] && nextProps.row.index <= nextProps.fillDragRange[1];
      if(isPrevInRange !== isNextInRange) return false;
    }
    // Re-render when column order changes so the cells re-align
    if (prevProps.columnOrder !== nextProps.columnOrder) return false;
    return true; // Props are equal
  }
);
MemoizedRow.displayName = "MemoizedRow";


type FocusCellContext<T> = CellContext<T, unknown> & {
  isFocused?: boolean;
  isEditing?: boolean;
  enterEdit?: () => void;
  exitEdit?:  () => void;
};

/** ---------- Utility ---------- **/
function getCommentCount(post: Post) {
  return post.comments?.length ?? 0;
}
function userFriendlyDate(d?: Date) {
  if (!d) return "";
  return format(d, "PPpp");
}
function formatYearMonth(dateObj: Date | undefined) {
  if (!dateObj) return "";
  return format(dateObj, "MMM, yyyy");
}

/** Basic CSV export of entire post object as JSON */
function exportToCSV(posts: Post[]) {
  const rows = posts.map((p) => ({
    id: p.id,
    postData: JSON.stringify(p),
  }));
  const csv = Papa.unparse(rows, { quotes: true, header: true });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "all-posts.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function importFromCSV(file: File): Promise<Post[]> {
  const text = await file.text();
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results : any) => {
        if (results.errors?.length) {
          reject(results.errors[0]);
          return;
        }
        const posts: Post[] = [];
        for (const row of results.data) {
          if (!row.postData) continue;
          const parsed = JSON.parse(row.postData) as Post;
          posts.push(parsed);
        }
        resolve(posts);
      },
      error: reject,
    });
  });
}

/** ---------- Filter Fns (as skeletons) ---------- **/
const statusFilterFn: FilterFn<Post> = (row, colId, filterValues: string[]) => {
  if (!filterValues.length) return true;
  const cellVal = row.getValue(colId) as string;
  return filterValues.includes(cellVal);
};

const formatFilterFn: FilterFn<Post> = (row, colId, filterValues: string[]) => {
  if (!filterValues.length) return true;
  const cellVal = row.getValue(colId) as string;
  return filterValues.includes(cellVal);
};

const monthFilterFn: FilterFn<Post> = (row, colId, filterValues: string[]) => {
  if (!filterValues.length) return true;
  const cellVal = String(row.getValue(colId));
  return filterValues.includes(cellVal);
};

const statusSortOrder: Status[] = [
  "Draft",
  "Pending Approval",
  "Needs Revisions",
  "Revised",
  "Approved",
  "Scheduled",
  "Publishing",
  "Published",
  "Failed Publishing",
];

const statusSortingFn: SortingFn<Post> = (rowA, rowB, columnId) => {
  const statusA = rowA.getValue<Status>(columnId);
  const statusB = rowB.getValue<Status>(columnId);

  const indexA = statusSortOrder.indexOf(statusA);
  const indexB = statusSortOrder.indexOf(statusB);

  return indexA - indexB;
};

// Sort formats so empty appears last
const formatSortingFn: SortingFn<Post> = (rowA, rowB, columnId) => {
  const fmtA = String(rowA.getValue(columnId) || "");
  const fmtB = String(rowB.getValue(columnId) || "");
  const emptyA = fmtA === "";
  const emptyB = fmtB === "";
  if (emptyA && !emptyB) return 1;
  if (!emptyA && emptyB) return -1;
  return fmtA.localeCompare(fmtB);
};

/** ---------- The PostTable ---------- **/
export function PostTable({
  posts,
  onOpen,
}: {
  posts: Post[];
  onOpen?: (id: string) => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [tableData, setTableData] = React.useState<Post[]>(posts);
  const [trashedPosts, setTrashedPosts] = React.useState<Post[]>([]);
  const [showUndoMessage, setShowUndoMessage] = React.useState(false);
  const [lastTrashedCount, setLastTrashedCount] = React.useState(0);
  const undoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const [duplicatedPosts, setDuplicatedPosts] = React.useState<Post[]>([]);
  const [showDuplicateUndoMessage, setShowDuplicateUndoMessage] = React.useState(false);
  const [lastDuplicatedCount, setLastDuplicatedCount] = React.useState(0);
  const duplicateUndoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Group feedback sidebar state
  const [groupFeedbackSidebarOpen, setGroupFeedbackSidebarOpen] = React.useState(false);
  const [selectedGroupData, setSelectedGroupData] = React.useState<{ month: number; comments: GroupComment[] } | null>(null);
  
  const store = useFeedbirdStore();
  const updatePost = useFeedbirdStore((s) => s.updatePost);
  const updateBoard = useFeedbirdStore((s) => s.updateBoard);
  const getPageCounts = useFeedbirdStore((s) => s.getPageCounts);
  const addGroupComment = useFeedbirdStore((s) => s.addGroupComment);
  const addGroupMessage = useFeedbirdStore((s) => s.addGroupMessage);
  const resolveGroupComment = useFeedbirdStore((s) => s.resolveGroupComment);
  const deleteGroupCommentAiSummaryItem = useFeedbirdStore((s) => s.deleteGroupCommentAiSummaryItem);
  const requestChanges = useFeedbirdStore((s) => s.requestChanges);
  const approvePost = useFeedbirdStore((s) => s.approvePost);
  
  // Store subscriptions - subscribe to the actual data that changes
  const workspaces = useFeedbirdStore(s => s.workspaces);
  const activeWorkspaceId = useFeedbirdStore(s => s.activeWorkspaceId);
  const activeBoardId = useFeedbirdStore(s => s.activeBoardId);
  
  // Compute activeWorkspace from the actual data that changes
  const activeWorkspace = React.useMemo(() => {
    return workspaces.find(w => w.id === activeWorkspaceId);
  }, [workspaces, activeWorkspaceId]);
  
  const currentBoard = React.useMemo(() => activeWorkspace?.boards.find(b => b.id === activeBoardId), [activeWorkspace, activeBoardId]);
  const boardRules = currentBoard?.rules;
  
  
  /* -----------------------------------------------------------
   *  Determine default content format based on current route
   * -----------------------------------------------------------*/
  const pathname = usePathname();
  const defaultFormat: ContentFormat = React.useMemo(() => {
    if (pathname?.includes("/short-form-videos")) return "video";
    if (pathname?.includes("/email-design"))      return "email";
    return "image"; // static posts or fallback
  }, [pathname]);
  
  /* -----------------------------------------------------------
   *  Auto-creation of draft posts has been disabled
   * -----------------------------------------------------------*/

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Optimized useEffect to only update when posts actually change
  const prevPostsRef = React.useRef<Post[]>(posts);
  React.useEffect(() => {
    // Only update if the posts array reference has actually changed
    if (posts !== prevPostsRef.current) {
      setTableData(posts);
      prevPostsRef.current = posts;
    }
  }, [posts]);

  // CSV import / export
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  function handleExport() {
    exportToCSV(tableData);
  }
  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const imported = await importFromCSV(file);
    const merged = [...tableData, ...imported];
    setTableData(merged);
    store.setActivePosts(merged);
    e.target.value = "";
  }
  function handleImport() {
    fileInputRef.current?.click();
  }

  // Group feedback sidebar handlers
  function handleOpenGroupFeedback(groupData: BoardGroupData, month: number) {
    setSelectedGroupData({
      month: month,
      comments: groupData?.comments || []
    });
    setGroupFeedbackSidebarOpen(true);
  }

  function handleCloseGroupFeedback() {
    setGroupFeedbackSidebarOpen(false);
    setSelectedGroupData(null);
  }

  function handleAddGroupComment(text: string) {
    if (selectedGroupData && activeBoardId) {
      // Update the store first
      addGroupComment(activeBoardId, selectedGroupData.month, text, "Current User");
    }
  }

  function handleAddGroupMessage(commentId: string, text: string, parentMessageId?: string) {
    if (selectedGroupData && activeBoardId) {
      // Update the store first
      addGroupMessage(activeBoardId, selectedGroupData.month, commentId, text, "Current User", parentMessageId);
    }
  }

  function handleResolveGroupComment(commentId: string) {
    if (selectedGroupData && activeBoardId) {
      // Update the store first
      resolveGroupComment(activeBoardId, selectedGroupData.month, commentId, "Current User");
    }
  }

  function handleDeleteAiSummary(commentId: string, summaryIndex: number) {
    if (selectedGroupData && activeBoardId) {
      deleteGroupCommentAiSummaryItem(
        activeBoardId,
        selectedGroupData.month,
        commentId,
        summaryIndex
      );
    }
  }

  // Keep selectedGroupData in sync with store when board data changes
  const prevStoreDataRef = React.useRef<string>('');

  // Update selectedGroupData when store data changes
  React.useEffect(() => {
    if (selectedGroupData && activeBoardId) {
      const updatedBoard = activeWorkspace?.boards.find(b => b.id === activeBoardId);
      const updatedGroupData = updatedBoard?.groupData?.find(gd => gd.month === selectedGroupData.month);
      
      if (updatedGroupData) {
        const currentStoreData = JSON.stringify(updatedGroupData.comments);
        
        // Only update if store data has actually changed
        if (currentStoreData !== prevStoreDataRef.current) {
          prevStoreDataRef.current = currentStoreData;
          
          setSelectedGroupData({
            month: selectedGroupData.month,
            comments: updatedGroupData.comments
          });
        }
      }
    }
  }, [activeWorkspace, activeBoardId]); // React to workspace and board changes

  // user-defined columns
  const [userColumns, setUserColumns] = React.useState<UserColumn[]>([]);
  const [addColumnOpen, setAddColumnOpen] = React.useState(false);
  const STICKY_COLUMNS = ["drag", "rowIndex", "status"] as const;
  const STICKY_OFFSETS: Record<string, number> = {
    "drag":     0,
    "rowIndex": 24,        // 0 + 40 from "drag"
    "status":   24 + 80,   // 120, because rowIndex is 80 wide
  };

  function isSticky(colId: string): colId is (typeof STICKY_COLUMNS)[number] {
    return STICKY_COLUMNS.includes(colId as any);
  }

  function stickyStyles(colId: string, zIndex = 10): React.CSSProperties | undefined {
    if (!isSticky(colId)) return;
  
    const styles: React.CSSProperties = {
      position: "sticky",
      left: STICKY_OFFSETS[colId],
      zIndex,
    };

    // Smooth shadow transition
    if (colId === 'status') {
      // Base transition; actual box-shadow handled by CSS when
      // the scroll container has `.scrolling-horiz` class.
      styles.transition = 'box-shadow 0.2s ease-in-out';
    }
  
    return styles;
  }

  function handleAddColumn(label: string, type: ColumnType, options?: string[]) {
    setUserColumns((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label, type, options },
    ]);
  }

  // context menu
  const [contextMenuOpen, setContextMenuOpen] = React.useState(false);
  const [contextMenuRow, setContextMenuRow] = React.useState<Row<Post> | null>(
    null
  );
  const [contextMenuPosition, setContextMenuPosition] = React.useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  // Table states
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [grouping, setGrouping] = React.useState<GroupingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  // Additional states for resizing
  const [columnSizing, setColumnSizing] = React.useState({});
  const [columnSizingInfo, setColumnSizingInfo] = React.useState<ColumnSizingInfoState>({
    columnSizingStart: [],
    deltaOffset: null,
    deltaPercentage: null,
    isResizingColumn: false,
    startOffset: null,
    startSize: null
  });

  const [rowHeight, setRowHeight] = React.useState<RowHeightType>("Medium");

  // State to track if scrolling is needed
  const [isScrollable, setIsScrollable] = React.useState(false);

  // Track if changes are user-initiated vs board switching
  const userInitiatedChangeRef = React.useRef(false);
  const lastBoardIdRef = React.useRef<string | null>(null);

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
  }, [boardRules]); // Remove other dependencies to ensure it runs when boardRules changes

  /* --- Persist board rule changes on user actions --- */
  React.useEffect(() => {
    if (!currentBoard || !activeBoardId || !userInitiatedChangeRef.current) return;
    
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
  }, [grouping, sorting, rowHeight, currentBoard, activeBoardId, updateBoard]);

  // Mark user-initiated changes
  React.useEffect(() => {
    if (lastBoardIdRef.current === activeBoardId) {
      userInitiatedChangeRef.current = true;
    }
  }, [grouping, sorting, rowHeight]);

  // ─────────────────────────────────────────────────────────────
  //  Instant sticky shadow via CSS class toggling (no React re-render)
  // ─────────────────────────────────────────────────────────────
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollLeftRef = React.useRef(0);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
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
  }

  // Function to check if scrolling is needed
  const checkIfScrollable = React.useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const isScrollableNow = container.scrollHeight > container.clientHeight;
    setIsScrollable(isScrollableNow);
  }, []);

  React.useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Check if scrolling is needed when table data changes
  React.useEffect(() => {
    // Use a small delay to ensure the DOM has updated
    const timer = setTimeout(checkIfScrollable, 100);
    return () => clearTimeout(timer);
  }, [tableData, checkIfScrollable]);

  // Check if scrolling is needed when window resizes
  React.useEffect(() => {
    const handleResize = () => {
      checkIfScrollable();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkIfScrollable]);

  // Filter states
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filterTree, setFilterTree] = React.useState<ConditionGroup>({
    id: "root",
    andOr: "AND",
    children: [],
  });
  const [columnNames, setColumnNames] = React.useState<Record<string, string>>(
    {'platforms': 'Socials', 'publishDate': 'Post Time', 'updatedAt': 'Updated'}
  );
  
  const [renameColumnId, setRenameColumnId] = React.useState<string | null>(
    null
  );
  const [renameValue, setRenameValue] = React.useState("");

  // Build the flatten filter from filterTree
  React.useEffect(() => {
    const flat: ColumnFiltersState = [];
    
    // Convert each condition to the format expected by the respective filter functions
    filterTree.children.forEach((condition) => {
      // Only add filters if there are selected values
      if (condition.selectedValues && condition.selectedValues.length > 0) {
          flat.push({
          id: condition.field,
          value: condition.selectedValues, // Pass the array of selected values directly
          });
        }
      });
    
    setColumnFilters(flat);
  }, [filterTree]);

  const hasActiveFilters = React.useMemo(() => {
    // Check if any condition has selected values
    return filterTree.children.some((condition) => 
      condition.selectedValues && condition.selectedValues.length > 0
    );
  }, [filterTree]);

  // Table instance
  const tableRef = React.useRef<ReactTableType<Post> | null>(null);

  // For grouping expansions
  React.useEffect(() => {
    if (grouping.length) {
      const groups = getFinalGroupRows(table.getGroupedRowModel().rows);
      const newExpandedState: Record<string, boolean> = {};
      groups.forEach(group => {
          const key = JSON.stringify(group.groupValues);
          newExpandedState[key] = true;
      });
      setFlatGroupExpanded(newExpandedState);
    } else {
        setFlatGroupExpanded({});
    }
  }, [grouping, tableData]);

  // For column rename
  function applyRename() {
    if (!renameColumnId) return;
    setColumnNames(prev => ({
      ...prev,
      [renameColumnId]: renameValue.trim()
    }));
    setRenameColumnId(null);
    setRenameValue("");
  }

  // Drag & drop reordering of rows
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  function handleRowDragStart(e: React.DragEvent, fromIndex: number) {
    e.dataTransfer.setData("text/plain", String(fromIndex));
  }
  function handleRowDrop(e: React.DragEvent) {
    const tr = (e.target as HTMLElement).closest("tr");
    if (!tr?.dataset?.rowkey) return;
    const targetIndex = parseInt(tr.dataset.rowkey, 10);
    if (Number.isNaN(targetIndex)) return;

    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (Number.isNaN(fromIndex) || fromIndex === targetIndex) return;

    setTableData((prev) => {
      const newArr = [...prev];
      const [moved] = newArr.splice(fromIndex, 1);
      newArr.splice(targetIndex, 0, moved);
      return newArr;
    });
  }

  /** Column Visibility menu */
  const [colVisOpen, setColVisOpen] = React.useState(false);

  // For "Add Row" logic
  function handleAddRowUngrouped() {
    // Only create 3 posts if there are no posts at all
    if (tableData.length === 0) {
      const newPosts: Post[] = [];
      for (let i = 0; i < 3; i++) {
        const np = store.addPost();
        if (np) {
          // ensure status is Draft but leave format empty
          updatePost(np.id, { status: "Draft" });
          newPosts.push({ ...np, status: "Draft" });
        }
      }
      if (newPosts.length > 0) {
        setTableData(newPosts);
      }
    } else {
      const newPost = store.addPost();
      if (newPost) {
        setTableData((prev) => [...prev, newPost]);
      }
    }
  }

  function handleAddRowForGroup(groupValues: Record<string, any>) {
    const newPost = store.addPost();
    if (!newPost) return;

    // Apply group values to the new post
    Object.entries(groupValues).forEach(([key, value]) => {
      if (key === 'status') newPost.status = value as Status;
      if (key === 'format') newPost.format = value as ContentFormat;
      if (key === 'publishDate') {
        const dt = parse(String(value), "MMM, yyyy", new Date());
        if (!isNaN(dt.getTime())) {
            dt.setDate(15);
            newPost.publishDate = dt;
        }
      }
      // Add other properties as needed based on your grouping columns
    });

    // Ensure store reflects any direct mutations
    updatePost(newPost.id, { status: newPost.status });

    setTableData((prev) => [...prev, newPost]);
  }

  function handleDuplicatePosts(posts: Post[]) {
    // Clear any existing timeout
    if (duplicateUndoTimeoutRef.current) {
      clearTimeout(duplicateUndoTimeoutRef.current);
    }

    const duplicatedPosts: Post[] = [];
    posts.forEach((orig) => {
      const dup = store.duplicatePost(orig);
      if (dup) {
        duplicatedPosts.push(dup);
        setTableData((prev) => [...prev, dup]);
      }
    });

    // Store duplicated posts and show undo message
    setDuplicatedPosts(prev => [...prev, ...duplicatedPosts]);
    setLastDuplicatedCount(duplicatedPosts.length);
    setShowDuplicateUndoMessage(true);
    table.resetRowSelection();

    // Auto-hide duplicate undo message after 5 seconds
    duplicateUndoTimeoutRef.current = setTimeout(() => {
      setShowDuplicateUndoMessage(false);
    }, 5000);
  }

  function handleUndoDuplicate() {
    // Clear the timeout
    if (duplicateUndoTimeoutRef.current) {
      clearTimeout(duplicateUndoTimeoutRef.current);
      duplicateUndoTimeoutRef.current = null;
    }

    // Remove the last duplicated posts
    const postsToRemove = duplicatedPosts.slice(-lastDuplicatedCount);
    setDuplicatedPosts(prev => prev.slice(0, -lastDuplicatedCount));
    setTableData(prev => prev.filter(p => !postsToRemove.map(dp => dp.id).includes(p.id)));
    
    // Update the store to reflect the removed posts - use deletePost for each post
    postsToRemove.forEach(post => store.deletePost(post.id));
    
    setShowDuplicateUndoMessage(false);
  }

  // "Caption Editor" states
  const [captionOpen, setCaptionOpen] = React.useState(false);
  const [editingPost, setEditingPost] = React.useState<Post|null>(null);
  const [selectedPlatform, setSelectedPlatform] = React.useState<Platform | null>(null);
  const [captionLocked, setCaptionLocked] = React.useState<boolean>(true);

  React.useEffect(()=>{
    if(captionLocked){
      setSelectedPlatform(null);
    }
  },[captionLocked]);

  const brand = useFeedbirdStore((s) => s.getActiveBrand());

  const pageIdToPlatformMap = React.useMemo(() => {
    if (!brand?.socialPages) return new Map<string, Platform>();
    return new Map(brand.socialPages.map(p => [p.id, p.platform]));
  }, [brand?.socialPages]);

  // Now we define the functions INSIDE the component, so they have access to the map
  const platformsFilterFn: FilterFn<Post> = React.useCallback((row, colId, filterValues: string[]) => {
    if (!filterValues.length) return true;
    const rowPages = row.getValue(colId) as string[];
    if (!rowPages || !Array.isArray(rowPages)) return false;

    const rowPlatforms = rowPages
      .map(pageId => pageIdToPlatformMap.get(pageId))
      .filter((platform): platform is Platform => platform !== undefined);

    return rowPlatforms.some(platform => filterValues.includes(platform));
  }, [pageIdToPlatformMap]);

  const platformsSortingFn: SortingFn<Post> = React.useCallback((rowA, rowB, columnId) => {
    const a: string[] = rowA.getValue(columnId) as string[];
    const b: string[] = rowB.getValue(columnId) as string[];

    const emptyA = !a || a.length === 0;
    const emptyB = !b || b.length === 0;
    if (emptyA && !emptyB) return 1;
    if (!emptyA && emptyB) return -1;

    const strA = (a ?? []).map(id => pageIdToPlatformMap.get(id) ?? "").join(',');
    const strB = (b ?? []).map(id => pageIdToPlatformMap.get(id) ?? "").join(',');
    return strA.localeCompare(strB);
  }, [pageIdToPlatformMap]);

  const availablePlatforms = React.useMemo(() => {
    if (!brand) return [];
    
    // Gather all page IDs from the table's posts
    const allPageIds = new Set<string>();
    for (const post of tableData) {
      for (const pageId of post.pages) {
        allPageIds.add(pageId);
      }
    }

    // For each page in brand.socialPages, if its ID is in allPageIds,
    // add page.platform to a set
    const platformSet = new Set<Platform>();
    for (const sp of brand.socialPages) {
      if (allPageIds.has(sp.id)) {
        platformSet.add(sp.platform);
      }
    }

    return Array.from(platformSet);
  }, [tableData, brand]);
    
  const togglePlatform = (e : any, platform: Platform) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedPlatform(prev => (prev === platform ? null : platform));
  }

  // At the top level of your PostTable component:
  const [flatGroupExpanded, setFlatGroupExpanded] = React.useState<Record<string, boolean>>({});

  function toggleGroup(groupKey: string) {
    setFlatGroupExpanded(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }

  // Fill-drag range preview state
  const [fillDragRange, setFillDragRange] = React.useState<[number, number] | null>(null);
  // Column currently being fill-dragged (e.g. "month" or "caption")
  const [fillDragColumn, setFillDragColumn] = React.useState<string | null>(null);
  // Internal ref to hold data during an active fill-drag operation
  const fillDragRef = React.useRef<{ value: any; startIndex: number; columnId: string } | null>(null);

  /* ⇢ NEW helper fns — used for styling rows during fill-drag and for MemoizedRow */
  const isFillSource = React.useCallback(
    (idx: number) => !!fillDragRange && idx === fillDragRange[0],
    [fillDragRange],
  );
  const isFillTarget = React.useCallback(
    (idx: number) => !!fillDragRange && idx === fillDragRange[1],
    [fillDragRange],
  );

  const handleFillMouseMove = React.useCallback((e: MouseEvent) => {
    const info = fillDragRef.current;
    if (!info) return;

    const rowEl = (e.target as HTMLElement).closest("tr");
    const idxStr = rowEl?.getAttribute("data-rowkey");
    if (!idxStr) return;
    const hoverIdx = parseInt(idxStr, 10);
    if (isNaN(hoverIdx)) return;

    const { startIndex } = info;
    setFillDragRange([Math.min(startIndex, hoverIdx), Math.max(startIndex, hoverIdx)]);
  }, []);

  const finishFillDrag = React.useCallback((e: MouseEvent) => {
    const info = fillDragRef.current;
    if (!info) return;

    const rowEl = (e.target as HTMLElement).closest("tr");
    const idxStr = rowEl?.getAttribute("data-rowkey");
    if (!idxStr) return;
    const endIndex = parseInt(idxStr, 10);
    if (isNaN(endIndex)) return;

    const { startIndex, value, columnId } = info;
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);

    if (start !== end) {
      // 1) Build new table data without mutating existing state
      const newData = tableData.map((p, i) => {
        if (i < start || i > end) return p;
        if (columnId === 'month') {
          return { ...p, month: value as number };
        }
        if (columnId === 'caption') {
          return { ...p, caption: value as Post['caption'] };
        }
        if (columnId === 'platforms') {
          return { ...p, pages: value as string[] };
        }
        if (columnId === 'format') {
          return { ...p, format: value as string };
        }
        return p;
      });

      // 2) Apply the optimistic UI update
      setTableData(newData);

      // 3) Persist changes to the store AFTER state update so we're not inside render
      for (let i = start; i <= end; i++) {
        const p = newData[i];
        if (!p) continue;
        if (columnId === 'month') {
          updatePost(p.id, { month: value as number });
        } else if (columnId === 'caption') {
          updatePost(p.id, { caption: value as Post['caption'] });
        } else if (columnId === 'platforms') {
          updatePost(p.id, { pages: value as string[] });
        } else if (columnId === 'format') {
          updatePost(p.id, { format: value as string });
        }
      }
    }

    fillDragRef.current = null;
    document.body.style.userSelect = "";
    document.removeEventListener("mouseup", finishFillDrag);
    document.removeEventListener("mousemove", handleFillMouseMove);
    setFillDragRange(null);
    setFillDragColumn(null);
  }, [tableData, updatePost]);

  function handleFillStartMonth(value: number, startIdx: number) {
    fillDragRef.current = { value, startIndex: startIdx, columnId: 'month' };
    setFillDragColumn('month');
    // Disable text selection while dragging
    document.body.style.userSelect = "none";
    document.addEventListener("mouseup", finishFillDrag);
    document.addEventListener("mousemove", handleFillMouseMove);
    setFillDragRange([startIdx, startIdx]);
  }

  function handleFillStartCaption(value: Post['caption'], startIdx: number) {
    fillDragRef.current = { value, startIndex: startIdx, columnId: 'caption' };
    setFillDragColumn('caption');
    document.body.style.userSelect = "none";
    document.addEventListener("mouseup", finishFillDrag);
    document.addEventListener("mousemove", handleFillMouseMove);
    setFillDragRange([startIdx, startIdx]);
  }

  function handleFillStartPages(value: string[], startIdx: number) {
    fillDragRef.current = { value, startIndex: startIdx, columnId: 'platforms' };
    setFillDragColumn('platforms');
    document.body.style.userSelect = 'none';
    document.addEventListener('mouseup', finishFillDrag);
    document.addEventListener('mousemove', handleFillMouseMove);
    setFillDragRange([startIdx, startIdx]);
  }

  function handleFillStartFormat(value: string, startIdx: number) {
    fillDragRef.current = { value, startIndex: startIdx, columnId: 'format' };
    setFillDragColumn('format');
    document.body.style.userSelect = 'none';
    document.addEventListener('mouseup', finishFillDrag);
    document.addEventListener('mousemove', handleFillMouseMove);
    setFillDragRange([startIdx, startIdx]);
  }

  React.useEffect(() => {
    return () => {
      // cleanup if unmounted during drag
      document.body.style.userSelect = "";
      document.removeEventListener("mouseup", finishFillDrag);
      document.removeEventListener("mousemove", handleFillMouseMove);
    };
  }, [finishFillDrag]);

  /** 1) Base columns **/
  const baseColumns: ColumnDef<Post>[] = React.useMemo(() => {
    return [
      // Drag handle
      {
        id: "drag",
        header: () => <div className="w-4" />,
        size: 24,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <div
              className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
              draggable
              onDragStart={(e) => handleRowDragStart(e, row.index)}
            >
              <GripVertical size={18} />
            </div>
          </div>
        ),
      },
      // Row index + checkbox
      {
        id: "rowIndex",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
            className={cn(
              // base
              "h-4 w-4 rounded-none border border-[#D0D5DD] transition-colors duration-150 ease-in-out rounded-[3px]",
              "hover:border-[#2183FF]",                             // Airtable blue on hover
              // when it's checked
              "data-[state=checked]:bg-[#2183FF]",                 // Airtable blue fill
              "data-[state=checked]:border-[#2183FF]",             // Airtable blue stroke
              "data-[state=checked]:text-white"                    // << this makes the ✓ white
            )}
          />
        ),
        size: 80,
        minSize: 60,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        cell: ({ row }) => {
          const post = row.original;
          const isSelected = row.getIsSelected();
          const commentCount = getCommentCount(post);

          const CommentBadge = () => (
            <div 
              className="relative w-[22px] h-[22px] cursor-pointer transition-opacity hover:opacity-80 active:opacity-60"
              onClick={(e) => {
                onOpen?.(post.id);
              }}
            >
              <Image
                src={`/images/platforms/comment.svg`}
                alt={"comments"}
                width={22}
                height={22}
              />
              <span className="absolute inset-0 flex items-center justify-center mt-[-2px] text-[10px] text-[#125AFF] leading-none font-semibold">
                {commentCount}
              </span>
            </div>
          );

          return (
            <div className="relative group h-6 pl-2 pr-1 w-full flex items-center justify-start">
              {/* Default: index + comment badge */}
              <div
                className={cn(
                  "absolute inset-0 flex items-center pl-2 gap-[8px] transition-opacity",
                  isSelected ? "opacity-0" : "group-hover:opacity-0 opacity-100"
                )}
              >
                <span className="text-[12px] text-[#475467] w-4 text-center">
                  {row.index + 1}
                </span>
                <CommentBadge />
              </div>

              {/* Hover/selected: checkbox + comment */}
              <div
                className={cn(
                  "absolute inset-0 flex items-center gap-2 pl-2 transition-opacity",
                  isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(val) => {
                    row.toggleSelected(!!val);
                    anchorRowIdRef.current = row.id;
                  }}
                  onClick={(e) => handleCheckboxClick(e, row)}
                  data-slot="checkbox"
                  className={cn(
                    // base
                    "h-4 w-4 rounded-none border border-[#D0D5DD] transition-colors duration-150 ease-in-out rounded-[3px]",
                    "hover:border-[#2183FF]",                             // Airtable blue on hover
                    // when it's checked
                    "data-[state=checked]:bg-[#2183FF]",                 // Airtable blue fill
                    "data-[state=checked]:border-[#2183FF]",             // Airtable blue stroke
                    "data-[state=checked]:text-white"                    // << this makes the ✓ white
                  )}
                />
                <CommentBadge />
              </div>

              {/* prevent layout jump */}
              <div className="invisible flex items-center gap-2">
                <span className="text-xs font-bold w-4">00</span>
                <div className="w-6 h-6" />
              </div>
            </div>
          );
        },
      },
      // Status
    {
      id: "status",
        accessorKey: "status",
        filterFn: statusFilterFn,
        sortingFn: statusSortingFn,
        header: () => (
          <div className="flex items-center gap-[6px] text-black text-[13px] font-medium leading-[16px]">
            <Image src={`/images/columns/status.svg`} alt="status" width={14} height={14} />
            {columnNames["status"] || "Status"}
          </div>
        ),
        minSize: 80,
        size: 170,
        cell: ({ row, isFocused, isEditing, enterEdit, exitEdit } : FocusCellContext<Post>) => {
          const post = row.original;
          return (
            <StatusEditCell
              value={post.status}
              isFocused={isFocused}
              isEditing={isEditing}
              enterEdit={enterEdit}
              exitEdit={exitEdit}
              onChange={(newStatus) => {
                /* sync table + global store */
                setTableData((prev) =>
                  prev.map((p) =>
                    p.id === post.id ? { ...p, status: newStatus as Status } : p
                  )
                );
                updatePost(post.id, { status: newStatus as Status });
              }}
            />
          );
        },
      },
      // Preview
      {
        id: "preview",
        accessorKey: "blocks",
        header: () => (
          <div className="flex items-center gap-[6px] text-black text-[13px] font-medium leading-[16px]">
            <Image src={`/images/columns/preview.svg`} alt="preview" width={14} height={14} />
            {columnNames["preview"] || "Preview"}
          </div>
        ),
        minSize: 90,
        enableSorting: false,
        cell: ({ row }) => {
          const post = row.original;
          
          const handleFilesSelected = React.useCallback((files: File[]) => {
            // In a real implementation, you'd upload to your API and update the post
            console.log('Files selected for post:', post.id, files);
            
            // TODO: Implement actual file upload
            // 1. Upload files to /api/media/upload
            // 2. Create blocks from uploaded files
            // 3. Update post with new blocks
          }, [post.id]);
          return (
            <div
              className="flex flex-1 px-[4px] py-[4px] h-full"
              onClick={() => post.blocks.length && onOpen?.(post.id)}
            >
              <MemoBlocksPreview
                blocks={post.blocks}
                postId={post.id}
                onFilesSelected={handleFilesSelected}
                rowHeight={rowHeight}
              />
            </div>
          );
        },
      },
      // Caption
      {
        id: "caption",
        accessorKey: "caption",
        header: () => (
          <div className="flex items-center w-full text-black gap-[6px] text-[13px] font-medium leading-[16px]">
            <Image src={`/images/columns/caption.svg`} alt="caption" width={14} height={14} />
            <span className="text-[13px] leading-[16px]">{columnNames["caption"] || "Caption"}</span>

            {/* channel-icon filter buttons – right-aligned */}
            <div className="ml-auto flex">
              <button
                onClick={(e)=>{e.stopPropagation(); setCaptionLocked(l=>!l);}}
                className="ml-1 cursor-pointer"
                title={captionLocked ? "Unlock - customise per social" : "Lock"}
              >
                {captionLocked ? <Lock   className="w-4 h-4"/> : <Unlock className="w-4 h-4"/>}
              </button>
              {!captionLocked && availablePlatforms.map(platform => (
                <button
                  key={platform}
                  onClick={(e) => togglePlatform(e, platform)}
                  className={cn(
                    "p-1 rounded hover:bg-accent transition-opacity duration-200",
                    selectedPlatform === platform ? "opacity-100" : "opacity-40",
                  )}
                >
                  <ChannelIcons channels={[platform]} />
                </button>
              ))}
            </div>
          </div>
        ),
        minSize: 150,
        size: 220,
        cell: ({ row, isFocused, isEditing, exitEdit, enterEdit } : FocusCellContext<Post>) => {
          const post = row.original;
          return (
            <CaptionCell
              captionLocked={captionLocked}
              post={post}
              rowHeight={getRowHeightPixels(rowHeight)}
              rowIndex={row.index}
              onFillStart={handleFillStartCaption}
              isFocused={isFocused}
              isEditing={isEditing}
              exitEdit={exitEdit}
              enterEdit={enterEdit}
              selectedPlatform={selectedPlatform}
              onEdit={(p) => {
                // This function is called on second click.
                // You can store "p" in state => open your big dialog:
                setEditingPost(p);
                setCaptionOpen(true);
              }}
              onCaptionChange={(newCaptionText) => {
                const newCaptionData = { ...post.caption };
                const platform = selectedPlatform ?? post.platforms[0];

                if (captionLocked || post.caption.synced) {
                  newCaptionData.default = newCaptionText;
                } else if(platform) {
                  if (!newCaptionData.perPlatform) newCaptionData.perPlatform = {};
                  newCaptionData.perPlatform[platform] = newCaptionText;
                }
                
                updatePost(post.id, { caption: newCaptionData });
              }}
            />
          );
        },
      },
      // Platforms
      {
        id: "platforms",
        accessorKey: "pages",
        filterFn: platformsFilterFn,
        sortingFn: platformsSortingFn,
        header: () => (
          <div className="flex items-center gap-[6px] text-black text-[13px] font-medium leading-[16px]">
            <Image src={`/images/columns/socials.svg`} alt="socials" width={14} height={14} />
            {columnNames["platforms"] || "Socials"}
          </div>
        ),
        minSize: 80,
        cell: ({ row, isFocused, isEditing, enterEdit, exitEdit } : FocusCellContext<Post>) => {
          const post = row.original;
          return (
            <ChannelsEditCell
              getPageCounts={getPageCounts}
              value={post.pages}
              rowIndex={row.index}
              onFillStart={handleFillStartPages}
              isFocused={isFocused}
              isEditing={isEditing}
              enterEdit={enterEdit}
              exitEdit={exitEdit}
              onChange={(newPageIds) => {
                setTableData((prev) =>
                  prev.map((p) =>
                    p.id === post.id ? { ...p, pages: newPageIds } : p
                  )
                );
                updatePost(post.id, { pages: newPageIds });
              }}
            />
          );
        },
      },
      // Format
      {
        id: "format",
        accessorKey: "format",
        filterFn: formatFilterFn,
        sortingFn: formatSortingFn,
        header: () => (
          <div className="flex items-center gap-[6px] text-black text-[13px] font-medium leading-[16px]">
            <Image src={`/images/columns/format.svg`} alt="format" width={14} height={14} />
            {columnNames["format"] || "Format"}
          </div>
        ),
        minSize: 90,
        cell: ({ row, isFocused, isEditing, enterEdit, exitEdit } : FocusCellContext<Post>) => {
          const post = row.original;
          return (
            <FormatEditCell
              value={post.format}
              rowIndex={row.index}
              onFillStart={handleFillStartFormat}
              isFocused={isFocused}
              isEditing={isEditing}
              enterEdit={enterEdit}
              exitEdit={exitEdit}
              onChange={(fmt) => {
                setTableData((prev) =>
                  prev.map((p) => (p.id === post.id ? { ...p, format: fmt as ContentFormat } : p))
                );
                updatePost(post.id, { format: fmt as ContentFormat });
              }}
            />
          );
        },
      },
      {
        id: "month",
        accessorKey: "month",
        filterFn: monthFilterFn,
        header: () => (
          <div className="flex items-center gap-[6px] text-black text-[13px] font-medium leading-[16px]">
            <Image src={`/images/columns/post-time.svg`} alt="Month" width={14} height={14} />
            {"Month"}
          </div>
        ),
        minSize: 90,
        size: 150,
        enableGrouping: true,
        cell: ({ row, isFocused, isEditing, enterEdit, exitEdit }: FocusCellContext<Post>) => {
          const post = row.original;
          return (
            <MonthEditCell
              value={post.month}
              rowIndex={row.index}
              isFocused={isFocused}
              isEditing={isEditing}
              enterEdit={enterEdit}
              exitEdit={exitEdit}
              onFillStart={handleFillStartMonth}
              onChange={(newMonth) => {
                setTableData((prev) =>
                  prev.map((p) =>
                    p.id === post.id ? { ...p, month: newMonth } : p
                  )
                );
                updatePost(post.id, { month: newMonth });
              }}
            />
          );
        },
      },
      // Revision
      {
        id: "revision",
        header: () => (
          <div className="flex items-center gap-[6px] text-black text-[13px] font-medium leading-[16px]">
            <Image src={`/images/columns/revision.svg`} alt="revision" width={14} height={14} />
            {columnNames["revision"] || "Revision"}
          </div>
        ),
        minSize: 90,
        enableSorting: false,
        cell: ({ row }) => {
          const post = row.original;
          
          // Define which statuses allow revision actions
          const allowedStatusesForRevision = [
            "Pending Approval",
            "Revised", 
            "Needs Revisions",
            "Approved"
          ];
          
          const canPerformRevisionAction = allowedStatusesForRevision.includes(post.status);
          
          return (
            <div className={cn(
              "inline-flex items-center w-full h-full overflow-hidden px-[8px] py-[6px]",
              canPerformRevisionAction ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            )}>
              <div className="flex items-center flex-nowrap min-w-0">
                <div className="flex-shrink-0">
                  <div
                    className="flex items-center rounded-[4px] px-[8px] py-[6px] gap-[4px]"
                    style={{
                      boxShadow: "0px 0px 0px 1px #D3D3D3, 0px 1px 1px 0px rgba(0, 0, 0, 0.05), 0px 4px 6px 0px rgba(34, 42, 53, 0.04)"
                    }}
                    onClick={() => {
                      // Only request changes if the status allows it
                      if (canPerformRevisionAction) {
                        setTableData((prev) =>
                          prev.map((p) =>
                            p.id === post.id ? { ...p, status: "Needs Revisions" } : p
                          )
                        );
                        // Use the store's requestChanges method to add activity
                        requestChanges(post.id);
                        handleEditPost(post);
                      }
                    }}
                  >
                    <Image src={`/images/columns/request.svg`} alt="revision" width={14} height={14} />
                    <span className="text-xs text-black font-semibold leading-[16px]">Request changes</span>
                  </div>
                </div>
              </div>
            </div>
          );
        },
      },
      // Approve
      {
        id: "approve",
        header: () => (
          <div className="flex items-center gap-[6px] text-black text-[13px] font-medium leading-[16px]">
            <Image src={`/images/columns/approve.svg`} alt="approve" width={14} height={14} />
            {columnNames["approve"] || "Approve"}
          </div>
        ),
        minSize: 100,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const post = row.original;
          return <ApproveCell post={post} />;
        },
      },
      {
        id: "settings",
        header: () => (
          <div className="flex items-center gap-[6px] text-black text-[13px] font-medium leading-[16px]">
            <Image src={`/images/columns/settings.svg`} alt="settings" width={14} height={14} />
            {columnNames["settings"] || "Settings"}
          </div>
        ),
        minSize: 90,
        size   : 150,
        enableSorting : false,
        enableGrouping: false,
        cell: ({ row, isFocused, isEditing, enterEdit, exitEdit } : FocusCellContext<Post>) => {
          const post = row.original;
          return (
            <SettingsEditCell
              value={post.settings as any}
              isFocused={isFocused}
              isEditing={isEditing}
              enterEdit={enterEdit}
              exitEdit={exitEdit}
              onChange={(newSettings) => {
                setTableData((prev) =>
                  prev.map((p) => (p.id === post.id ? { ...p, settings: newSettings } : p))
                );
                updatePost(post.id, { settings: newSettings } as any);
              }}
            />
          );
        },
      },
      {
        id: "publishDate",
        accessorKey: "publishDate",
        header: () => (
          <div className="flex items-center gap-[6px] text-black text-[13px] font-medium leading-[16px]">
            <Image src={`/images/columns/post-time.svg`} alt="Publish Date" width={14} height={14} />
            {"Post Time"}
          </div>
        ),
        minSize: 110,
        size: 230,
        enableGrouping: true,
        getGroupingValue: (row) => {
          return formatYearMonth(row.publishDate || undefined);
        },
        cell: ({ row }) => {
          const post = row.original;
          return (
            <PublishDateCell
              post={post}
              allPosts={tableData}
              updatePost={(id, data) => {
                // calls your store's update => auto set updatedAt, etc.
                store.updatePost(id, data);
              }}
            />
          );
        },
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        header: () => (
          <div className="flex items-center gap-[6px] text-black text-[13px] font-medium leading-[16px]">
            <Image src={`/images/columns/updated-time.svg`} alt="Updated At" width={14} height={14} />
            {"Updated"}
          </div>
        ),
        minSize: 90,
        cell: ({ row }) => {
          const post = row.original;
          return (
            <div className="pl-2">
              <UpdateDateCell post={post} />
            </div>
          );
        },
      },
      
    ];
  }, [columnNames, updatePost, rowHeight, selectedPlatform, availablePlatforms, captionLocked, platformsFilterFn, platformsSortingFn]);

  /** 2) user-defined columns **/
  const userColumnDefs: ColumnDef<Post>[] = React.useMemo(() => {
    return userColumns.map((col) => {
      let IconComp = EditIcon;
      if (col.type === "multiSelect") IconComp = ListPlus;
      else if (col.type === "date") IconComp = CalendarIcon;

      return {
        id: col.id,
        header: () => (
          <div
            className="flex items-center gap-2"
            onDoubleClick={() => {
              setRenameColumnId(col.id);
              setRenameValue(col.label);
            }}
          >
            <Type size={18} />
            {col.label}
          </div>
        ),
        minSize: 100,
        maxSize: 300,
        cell: ({ row }) => {
          const post = row.original;
          const existingVal = (post as any)[col.id] ?? "";
          switch (col.type) {
            case "singleLine":
              return (
                <Input
                  value={existingVal}
                  onChange={(e) => {
                    const newVal = e.target.value;
                    setTableData((prev) =>
                      prev.map((p) => {
                        if (p.id === post.id) {
                          return { ...p, [col.id]: newVal };
                        }
                        return p;
                      })
                    );
                  }}
                  className="max-w-xs"
                />
              );
            case "multiSelect":
              return <div>{(existingVal ?? []).join(", ")}</div>;
            default:
              return <div className="text-sm">{String(existingVal)}</div>;
          }
        },
      };
    });
  }, [userColumns, tableData]);

  // Combine base + user
  const columns = React.useMemo(() => {
    return [...baseColumns, ...userColumnDefs];
  }, [baseColumns, userColumnDefs]);

  // columns for filter builder
  const filterableColumns = React.useMemo(() => {
    // Only allow filtering on: Status, Month, Socials (platforms), Format
    const ALLOWED_FILTER_COLUMNS = new Set(["status", "month", "platforms", "format"]);
    
    const iconMap: Record<string, React.JSX.Element> = {
      status: <FolderOpen className="mr-1 h-3 w-3" />,
      month: <CalendarIcon className="mr-1 h-3 w-3" />,
      platforms: <ListPlus className="mr-1 h-3 w-3" />,
      format: <Film className="mr-1 h-3 w-3" />,
    };
    
    return columns
      .filter((c) => ALLOWED_FILTER_COLUMNS.has(c.id as string))
      .map((col) => ({
        id: col.id,
        label: columnNames[col.id as string] ?? col.id,
        icon: iconMap[col.id as string] ?? null,
      }));
  }, [columns, columnNames]);

  // Create table
  const tableConfig = React.useMemo(() => ({
    data: tableData,
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
    onColumnSizingInfoChange: setColumnSizingInfo,

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
  }), [
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
  ]);

  const table = useReactTable<Post>(tableConfig);
  tableRef.current = table;

  // set default col order once
  React.useEffect(() => {
    if (!columnOrder.length) {
      setColumnOrder([
        "drag",
        "rowIndex",
        "status",
        "preview",
        "caption",
        "platforms",
        "format",
        "month",
        "revision",
        "approve",
        "settings",
        "publishDate",
        "updatedAt",
      ]);
    }
  }, [columnOrder]);

  // Grouped rows
  /** Instead of your current `renderGroupedRows` 
   *  you can use a "flat" version like this:
   */
  /** A little helper to decide how to render each group value. */
  function renderGroupValue(colId: string, val: any): React.ReactNode {
    switch (colId) {
      case "status":
        return (
          <StatusChip status={String(val) as Status} widthFull={false} />
        );
      case "platforms": {
        // Grouping value may be page IDs – convert to platform names
        const ids: string[] = Array.isArray(val)
          ? (val as string[])
          : String(val || "").split(",").filter(Boolean);

        const platformsArr: Platform[] = ids
          .map((id) => pageIdToPlatformMap.get(id))
          .filter((p): p is Platform => !!p);

        if (platformsArr.length === 0) {
          // placeholder UI similar to ChannelsEditCell when empty
          return (
            <div
              className="flex flex-row items-center gap-1 rounded-[4px] bg-white"
              style={{ padding: "3px 6px 3px 4px", boxShadow: "0px 0px 0px 1px #D3D3D3" }}
            >
              <div className="flex flex-row items-center p-[1px] rounded-[3px] bg-[#E6E4E2]">
                <PlusIcon className="w-3 h-3 text-[#5C5E63]" />
              </div>
              <span className="text-xs text-[#5C5E63] font-semibold">Select socials</span>
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
              className="flex flex-row items-center gap-1 rounded-[4px] bg-white"
              style={{ padding: "3px 6px 3px 4px", boxShadow: "0px 0px 0px 1px #D3D3D3" }}
            >
              <div className="flex flex-row items-center p-[1px] rounded-[3px] bg-[#E6E4E2]">
                <PlusIcon className="w-3 h-3 text-[#5C5E63]" />
              </div>
              <span className="text-xs text-[#5C5E63] font-semibold">Select format</span>
            </div>
          );
        }
        return <FormatBadge kind={fmt as ContentFormat} widthFull={false} />;
      }
      case "publishDate":
        if(!val) return <span className="text-base text-muted-foreground font-semibold">No time is set yet</span>;
        return <span className="text-base font-semibold">{String(val)}</span>;
      case "month":
        return <span className="text-base font-semibold">Month {val}</span>;
      default:
        return <span>{String(val)}</span>;
    }
  }

  /** -------------------------------------------------------------
   *  1)  Shared header  (phantom columns on both ends)
   *  ------------------------------------------------------------*/
  function RenderHeader({
    table,
    stickyStyles,
  }: {
    table: ReactTableType<Post>;
    stickyStyles: (id: string, z?: number) => React.CSSProperties | undefined;
  }) {
    return (
      <TableHeader className="sticky top-0 z-[13] bg-[#FBFBFB]">
        {table.getHeaderGroups().map((hg) => (
          <TableRow
            key={hg.id}
            className="bg-[#FBFBFB] border-b border-[#E6E4E2]"
          >
            {/* ◀ phantom on the left */}
            <TableHead className="border-b border-[#E6E4E2] bg-[#FBFBFB]" style={{ width: 14, padding: 0}} />

            {hg.headers.map((h, index) =>
              h.isPlaceholder ? null : (
                <TableHead
                  key={h.id}
                  className={cn(
                    "relative text-left border-b border-[#E6E4E2] px-2 py-0",
                    index !== 0 && "border-r",
                    isSticky(h.id) && 'bg-[#FBFBFB]',
                    h.id === 'status' && 'sticky-status-shadow'
                  )}
                  style={{ width: h.getSize(), ...stickyStyles(h.id, 10)}}
                >
                  {(() => {
                    const canDrag = h.id !== "rowIndex" && h.id !== "drag";
                    const sortStatus = h.column.getIsSorted();
                    const headerContent = flexRender(h.column.columnDef.header, h.getContext());

                    return (
                      <>
                        <div
                          className="flex cursor-pointer select-none items-center justify-between gap-2 h-full"
                          onClick={(e) => {
                            if (h.column.getCanSort() && e.detail === 1) {
                              const handler = h.column.getToggleSortingHandler();
                              if (typeof handler === 'function') handler(e);
                            }
                          }}
                          draggable={canDrag}
                          onDragStart={(e) => {
                            if (!canDrag) return;
                            e.dataTransfer.setData('text/plain', h.id);
                          }}
                          onDragOver={(e) => {
                            if (!canDrag) return;
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            if (!canDrag) return;
                            const fromId = e.dataTransfer.getData('text/plain');
                            if (!fromId) return;
                            setColumnOrder((prev) => {
                              const newOrder = [...prev];
                              const fromIndex = newOrder.indexOf(fromId);
                              const toIndex = newOrder.indexOf(h.id);
                              if (fromIndex < 0 || toIndex < 0) return prev;
                              newOrder.splice(toIndex, 0, newOrder.splice(fromIndex, 1)[0]);
                              return newOrder;
                            });
                          }}
                        >
                          <div className="flex items-center gap-1 text-black w-full">
                            {headerContent}
                          </div>
                          {sortStatus === 'asc' && (
                            <ChevronUpIcon size={16} className="text-blue-600" />
                          )}
                          {sortStatus === 'desc' && (
                            <ChevronDownIcon size={16} className="text-blue-600" />
                          )}
                        </div>

                        {/* Resizer Handle */}
                        {h.column.getCanResize() && (
                          <div
                            onDoubleClick={() => h.column.resetSize()}
                            onMouseDown={h.getResizeHandler()}
                            onTouchStart={h.getResizeHandler()}
                            className="absolute top-0 h-full w-2 cursor-col-resize -right-1 z-10"
                          />
                        )}
                      </>
                    );
                  })()}
                </TableHead>
              )
            )}

            {/* ▶ phantom on the right */}
            <TableHead style={{ width: 10, padding: 0, border: "none" }} />
          </TableRow>
        ))}
      </TableHeader>
    );
  }

  /** -------------------------------------------------------------
   *  2)  Group-header (divider) row
   *  ------------------------------------------------------------*/
  function GroupDivider({
    children,
    rowCount,
    groupPosts,
    groupData,
    boardRules,
    isGroupedByMonth,
    onOpenGroupFeedback,
    month,
  }: {
    children: React.ReactNode;
    rowCount?: number;
    groupPosts?: Post[];
    groupData?: BoardGroupData;
    boardRules?: BoardRules;
    isGroupedByMonth?: boolean;
    onOpenGroupFeedback?: (groupData: BoardGroupData, month: number) => void;
    month: number;
  }) {
    const visibleLeafColumns = table.getVisibleLeafColumns();
    const stickyCols = visibleLeafColumns.filter(c => isSticky(c.id));
    const nonStickyCols = visibleLeafColumns.filter(c => !isSticky(c.id));
    const { state } = useSidebar();
    
    // Calculate available width based on sidebar state
    const sidebarWidth = state === "expanded" ? 256 : 56; // 16rem = 256px, 3.5rem = 56px
    const availableWidth = typeof window !== 'undefined' ? window.innerWidth - sidebarWidth : 1200; // fallback width
    
    // Calculate approval status and deadline information
    const approvalInfo = React.useMemo(() => {
      if (!groupPosts || groupPosts.length === 0) return null;
      // Check if all posts are approved
      const allApproved = groupPosts.every(post => post.status === "Approved" || post.status === "Published" || post.status === "Scheduled");
      if (allApproved) {
        // Find the latest approval date (most recent updatedAt among approved posts)
        const latestApprovalDate = groupPosts
          .filter(post => post.status === "Approved" && post.updatedAt)
          .reduce((latest, post) => {
            const postDate = post.updatedAt instanceof Date ? post.updatedAt : new Date(post.updatedAt!);
            return postDate > latest ? postDate : latest;
          }, new Date(0));
        
        return {
          type: 'approved' as const,
          date: latestApprovalDate,
        };
      }
      // Check if approval deadline is enabled in board rules
      if (boardRules?.approvalDeadline && boardRules?.approvalDays) {
        // Find the latest updatedAt time among all posts in the group
        let latestUpdatedAt = groupPosts
          .filter(post => post.updatedAt)
          .reduce((latest, post) => {
            const postDate = post.updatedAt instanceof Date ? post.updatedAt : new Date(post.updatedAt!);
            return postDate > latest ? postDate : latest;
          }, new Date(0));
        if (latestUpdatedAt.getTime() == 0)
          latestUpdatedAt = new Date();
          // Calculate days left
        const now = new Date();
        const deadlineDate = new Date(latestUpdatedAt.getTime() + (boardRules.approvalDays * 24 * 60 * 60 * 1000));
        const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        if (daysLeft > 0) {
          return {
            type: 'deadline' as const,
            daysLeft,
          };
        }
      }
      
      return null;
    }, [groupPosts, boardRules]);
    
    return (
      <tr>
        {/* ◀ left phantom sticky */}
        <td
          style={{
            position: 'sticky',
            left: 0,
            width: 20,
            background: "#F8F8F8",
          }}
        />
        
        <td
          className="bg-white border-t border-l border-b border-[#E6E4E2]"
          colSpan={8}
          style={{
            borderRadius: "4px 0px 0px 0px",
            ...stickyStyles("drag", 0), // Lower than cell zIndex to avoid covering borders
          }}
        >
          <div className="flex items-center gap-2 px-[12px] py-[10px] font-medium text-sm">
            {children}
          {isGroupedByMonth && groupPosts && groupPosts.length > 0 && (
            <div className="flex items-center gap-2">
              <StatusChip 
                status={groupPosts.every(post => post.status === "Approved") ? "Approved" : "Pending Approval"} 
                widthFull={false} 
              />
              {/* Revision Rules Display */}
              {boardRules?.revisionRules && boardRules.firstMonth && (
                <>
                  <span className="text-[#EEEFF2] select-none">|</span>
                  {boardRules.firstMonth === -1 ? (
                    <div className="px-2 py-[5px] bg-White rounded outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-1 overflow-hidde">
                      <img
                        src="/images/boards/unlimited.svg"
                        alt="Unlimited Revisions"
                        className="w-4 h-4"
                      />
                      <span className="text-xs font-medium">Unlimited Revisions</span>
                    </div>
                  ) : boardRules.firstMonth > 0 ? (
                    <div className="px-2 py-[5px] bg-White rounded outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-1 overflow-hidde">
                      <CircleArrowOutDownRight className="w-4 h-4 text-[#2183FF]" />
                      <span className="text-xs font-medium">
                        {boardRules.firstMonth} Revision Round{boardRules.firstMonth > 1 ? "s" : ""}
                      </span>
                    </div>
                  ) : null}
                </>
              )}

              {/* Group Comments/Review Button */}
              {(() => {
                // Use the groupData prop which has the correct type BoardGroupData
                const groupComments: GroupComment[] = groupData?.comments || [];
                let unresolvedCount = 0;
                let totalCount = 0;
                let latestUnresolved: GroupComment | null = null;

                totalCount = groupComments.length;
                unresolvedCount = groupComments.filter((c: GroupComment) => !c.resolved).length;
                if (unresolvedCount > 0) {
                  latestUnresolved = groupComments
                    .filter((c: GroupComment) => !c.resolved)
                    .sort((a: GroupComment, b: GroupComment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                }

                // Helper: format time ago
                function timeAgo(date: Date | string) {
                  const now = new Date();
                  const d = typeof date === "string" ? new Date(date) : date;
                  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
                  if (diff < 60) return `${diff}s ago`;
                  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                  return `${Math.floor(diff / 86400)}d ago`;
                }

                if (unresolvedCount > 0 && latestUnresolved) {
                  return (
                    <div className="flex items-center gap-1 pl-2 pr-1 py-1 bg-white rounded outline outline-1 outline-offset-[-1px] outline-main">
                      <img
                        src="/images/boards/message-chat-square-on.svg"
                        alt="Unresolved Group Comment"
                        className="w-4 h-4"
                      />
                      <span className="text-xs font-medium text-main">
                        {latestUnresolved.author} left group comments {timeAgo(latestUnresolved.createdAt)}
                      </span>
                      <button
                        className="px-1 py-[1px] rounded bg-main text-white text-xs font-semibold"
                        style={{ border: "1px solid #2183FF" }}
                        type="button"
                        onClick={() => onOpenGroupFeedback?.(groupData!, month)}
                      >
                        Review
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex items-center gap-1 pl-2 pr-1 py-1 bg-white rounded outline outline-1 outline-offset-[-1px] outline-main">
                      <img
                        src="/images/boards/message-chat-square.svg"
                        alt="Group Comments"
                        className="w-4 h-4"
                      />
                      <span className="text-xs font-medium">
                        Group Comments:
                      </span>
                      <span className="text-xs font-medium text-grey">
                        {totalCount}
                      </span>
                      <button
                        className="px-1 py-[1px] h-4.5 rounded bg-main text-white text-xs font-semibold flex items-center justify-center"
                        style={{ border: "1px solid #2183FF" }}
                        type="button"
                        onClick={() => onOpenGroupFeedback?.(groupData!, month)}
                      >
                        Comment
                      </button>
                    </div>
                  );
                }
              })()}
            </div>
          )}
          </div>
          
          {/* Row count positioned from the left using availableWidth */}
          {rowCount && (
            <div 
              style={{
                position: 'absolute',
                left: `${availableWidth - 420}px`, // Position from left using availableWidth, with some padding
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1, // Lower than cell zIndex to avoid covering popups
              }}
            className="flex items-center justify-end w-[380px] gap-2"
            >
              {/* Approval status or deadline information - only show when grouped by month */}
              {isGroupedByMonth && approvalInfo && (
                <div className="flex items-center">
                  {approvalInfo.type === 'approved' ? (
                    <div className="px-2 py-[5px] bg-White rounded outline outline-1 outline-offset-[-1px] outline-emerald-100 flex justify-center items-center gap-1 overflow-hidden">
                      <img 
                        src="/images/publish/check-circle.svg" 
                        alt="approved" 
                        className="w-4 h-4"
                      />
                      <span className="text-xs font-semibold leading-none">
                        {approvalInfo.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-xs text-emerald-600 font-medium">
                        APPROVED
                      </span>
                    </div>
                  ) : approvalInfo.type === 'deadline' ? (
                    <div className="px-2 py-[5px] bg-White rounded outline outline-1 outline-offset-[-1px] outline-orange-100 flex justify-center items-center gap-1 overflow-hidden">
                      <img 
                        src="/images/publish/clock-fast-forward.svg" 
                        alt="deadline" 
                        className="w-4 h-4"
                      />
                      <span className="text-xs font-medium">
                        {approvalInfo.daysLeft} DAYS LEFT TO REVIEW
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
              
              <span className="inline-flex items-center text-sm leading-none text-center text-nowrap">
                Count : 
              </span>
              <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-[#F2F4F7] text-[#475467] text-xs leading-none text-center text-nowrap">
                {rowCount}
              </span>
            </div>
          )}
        </td>
  
        <td
          colSpan={visibleLeafColumns.length - 8}
          className="bg-white border-t border-b border-r border-[#E6E4E2]"
          style={{
            borderRadius: "0px 4px 0px 0px",
          }}
        />
  
        {/* ▶ right phantom */}
        <th
          style={{
            width: 16,
            background: "#F8F8F8",
          }}
        />
      </tr>
    );
  }

  /** -------------------------------------------------------------
   *  3)  The grouped table itself
   *  ------------------------------------------------------------*/
  function renderGroupedTable() {
    const groups = getFinalGroupRows(table.getGroupedRowModel().rows);
    const colSpan = table.getVisibleLeafColumns().length;

    // Reorder groups so that the one with empty socials/format appears last
    if (grouping.length) {
      const primary = grouping[0];
      if (primary === "platforms" || primary === "format") {
        groups.sort((a, b) => {
          const valA = a.groupValues[primary];
          const valB = b.groupValues[primary];

          const emptyA =
            primary === "platforms"
              ? !valA || (Array.isArray(valA) && valA.length === 0)
              : String(valA || "") === "";
          const emptyB =
            primary === "platforms"
              ? !valB || (Array.isArray(valB) && valB.length === 0)
              : String(valB || "") === "";

          if (emptyA && !emptyB) return 1; // A empty → after B
          if (!emptyA && emptyB) return -1; // B empty → after A

          // Keep existing order otherwise
          return 0;
        });
      }
    }

    return (
      <div className="bg-background mr-sm">
        <table
          data-grouped="true"
          className="
            w-full caption-bottom text-sm
            border-r border-border-primary
            table-fixed bg-background
          "
          style={{ borderCollapse: "separate", borderSpacing: 0 }}
        >
          {/* ─── Shared header ───────────────────────────────────── */}
          <RenderHeader table={table} stickyStyles={stickyStyles} />

          {/* ─── Gap row between header and first group ─────────── */}
          <tbody>
            <tr>
              <td
                colSpan={colSpan + 2}
                style={{ height: 10, background: "#F8F8F8", border: "none" }}
              />
            </tr>
          </tbody>

          {/* ─── One <tbody> per final group ────────────────────── */}
          {groups.length > 0 && groups.map((group, idx) => {
            const key = JSON.stringify(group.groupValues);
            const isExpanded = !!flatGroupExpanded[key];

            return (
              <tbody key={key}>
                {/* (optional) gap before every group except the first */}
                {idx > 0 && (
                  <tr>
                    <td
                      colSpan={colSpan + 2}
                      className="h-[10px] bg-[#F8F8F8]"
                      style={{ border: "none" }}
                    />
                  </tr>
                )}

                {/* Group-header row */}
                <GroupDivider 
                  rowCount={group.rowCount} 
                  groupPosts={group.leafRows.map(row => row.original)} 
                  groupData={currentBoard?.groupData?.find(gd => gd.month === group.groupValues.month) as BoardGroupData}
                  boardRules={boardRules}
                  isGroupedByMonth={grouping.includes("month")}
                  onOpenGroupFeedback={(groupData) => handleOpenGroupFeedback(groupData, group.groupValues.month)}
                  month={group.groupValues.month}
                >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-1 py-0 w-6 h-6"
                      onClick={() =>
                        setFlatGroupExpanded((prev) => ({ ...prev, [key]: !isExpanded }))}
                    >
                      {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </Button>

                    {/* labels */}
                    <span className="flex items-center gap-2">
                      {group.groupingColumns.map((c, i) => (
                        <React.Fragment key={c}>
                          {renderGroupValue(c, group.groupValues[c])}
                          {i < group.groupingColumns.length - 1 && (
                            <span className="px-1 text-gray-400">|</span>
                          )}
                        </React.Fragment>
                      ))}
                    </span>
                </GroupDivider>

                {/* Leaf rows */}
                {isExpanded &&
                  group.leafRows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-rowkey={row.index}
                      style={{ height: getRowHeightPixels(rowHeight) }}
                      className={cn(
                        "group hover:bg-[#F9FAFB]",
                        row.getIsSelected() && "bg-[#EBF5FF]"
                      )}
                      onMouseDownCapture={(e) => handleRowClick(e, row)}
                    >
                      {/* ◀ left phantom */}
                      <TableCell
                        style={{ width: 20, padding: 0, border: "none", backgroundColor: "#F8F8F8" }}
                      />

                      {row.getVisibleCells().map((cell, index) => (
                        <FocusCell
                          key={cell.id}
                          rowId={row.id}
                          colId={cell.id}
                          singleClickEdit={cell.column.id === "platforms" || cell.column.id === "format"}
                          className={cn(
                            "text-left",
                            isSticky(cell.column.id) && (row.getIsSelected() ? "bg-[#EBF5FF]" : "bg-white group-hover:bg-[#F9FAFB]"),
                            cell.column.id === "caption"
                              ? "align-top"
                              : "align-middle",
                            "px-0 py-0",
                            index === 0 ? "border-l" : "border-l-0",
                            cell.column.id === "status" && "sticky-status-shadow",
                            fillDragRange && fillDragColumn && cell.column.id === fillDragColumn && row.index >= fillDragRange[0] && row.index <= fillDragRange[1] && "bg-[#EBF5FF]"
                          )}
                          style={{
                            height: "inherit",
                            width: cell.column.getSize(),
                            borderRight: "1px solid #EAE9E9",
                            borderBottom: "1px solid #EAE9E9",
                            ...stickyStyles(
                              cell.column.id,
                              10
                            ),
                          }}
                        >
                          {({ isFocused, isEditing, exitEdit, enterEdit }) =>
                            flexRender(cell.column.columnDef.cell, {
                              ...cell.getContext(),
                              isFocused,
                              isEditing,
                              exitEdit,
                              enterEdit,
                            })
                          }
                        </FocusCell>
                      ))}

                      {/* ▶ right phantom */}
                      <TableCell
                        style={{ width: 20, padding: 0, border: "none", backgroundColor: "#F8F8F8" }}
                      />
                    </TableRow>
                  ))}

                {/* "Add new record" row (still inside tbody) */}
                {isExpanded && (
                  <tr>
                    {/* ◀ left phantom sticky */}
                    <TableCell
                        style={{ width: 20, padding: 0, border: "none", backgroundColor: "#F8F8F8" }}
                      />

                    {(() => {
                      const stickyCols = table.getVisibleLeafColumns().filter(c => isSticky(c.id));
                      const nonStickyCols = table.getVisibleLeafColumns().filter(c => !isSticky(c.id));
                      const stickyWidth = stickyCols.reduce((sum, col) => sum + col.getSize(), 0);

                      return (
                        <>
                          <TableCell
                            colSpan={stickyCols.length}
                            className="px-3 py-3 bg-white border-l border-t-0 border-r-0 border-b border-[#E6E4E2] rounded-b-[2px]"
                            style={{
                              ...stickyStyles("drag", 3), // Use first sticky col ID
                              borderRadius: "0px 0px 0px 4px",
                              width: stickyWidth,
                            }}
                          >
                            <button
                              className="p-0 m-0 font-semibold text-sm flex items-center gap-2 leading-[16px] cursor-pointer"
                              onClick={() =>
                                handleAddRowForGroup(
                                  group.groupValues
                                )
                              }
                            >
                              <PlusIcon size={16} />
                              Add new record
                            </button>
                          </TableCell>
                          <TableCell
                            colSpan={nonStickyCols.length}
                            className="bg-white border border-l-0 border-t-0 border-[#E6E4E2] rounded-b-[2px]"
                            style={{
                              borderRadius: "0px 0px 4px 0px",
                            }}
                          />
                        </>
                      );
                    })()}

                    {/* ▶ right phantom */}
                    <td
                      style={{
                          width: 20,
                          background: "#F8F8F8",
                          border: "none",
                      }}
                    />
                  </tr>
                )}
              </tbody>
            );
          })}
        </table>
      </div>
    );
  }


  // Ungrouped
  function renderUngroupedTable() {
    return (
      <div className="bg-background mr-sm">
        <table
          className="w-full caption-bottom text-sm border-r border-b border-border-primary table-fixed bg-background"
          style={{
            borderCollapse: "separate", // Important for rounded corners
            borderSpacing: 0,
            width: table.getCenterTotalSize(),
          }}
        >
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                className="bg-[#FBFBFB]"
              >
                {hg.headers.map((header) => {
                  if (header.isPlaceholder) return null;
                  const canDrag = header.id !== "rowIndex" && header.id !== "drag";
                  const sortStatus = header.column.getIsSorted();

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "relative align-middle text-left border-r border-[#EAE9E9] last:border-r-0 px-2 py-2",
                        isSticky(header.id) && "bg-[#FBFBFB]",
                        header.id === "status" && "sticky-status-shadow"
                      )}
                      style={{
                        width: header.getSize(),
                        ...stickyStyles(header.id, 9)
                      }}
                      colSpan={header.colSpan}
                    >
                      {header.column.getCanSort() ? (
                        <div
                          className="flex cursor-pointer select-none items-center justify-between gap-2 h-full"
                          onClick={(e) => {
                            // Only trigger sort if it's not a double click
                            if (e.detail === 1) {
                              const handler = header.column.getToggleSortingHandler();
                              if (typeof handler === 'function') {
                                handler(e);
                              }
                            }
                          }}
                          onDoubleClick={() => {
                            setRenameColumnId(header.id);
                            setRenameValue(columnNames[header.id] || header.id);
                          }}
                          draggable={canDrag}
                          onDragStart={(e) => {
                            if (!canDrag) return;
                            e.dataTransfer.setData("text/plain", header.id);
                          }}
                          onDragOver={(e) => {
                            if (!canDrag) return;
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            if (!canDrag) return;
                            const fromId = e.dataTransfer.getData("text/plain");
                            if (!fromId) return;
                            setColumnOrder((prev) => {
                              const newOrder = [...prev];
                              const fromIndex = newOrder.indexOf(fromId);
                              const toIndex = newOrder.indexOf(header.id);
                              if (fromIndex < 0 || toIndex < 0) return prev;
                              newOrder.splice(
                                toIndex,
                                0,
                                newOrder.splice(fromIndex, 1)[0]
                              );
                              return newOrder;
                            });
                          }}
                        >
                          <div className="flex items-center gap-1 text-black w-full">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                          {sortStatus === "asc" && (
                            <ChevronUpIcon size={16} className="text-blue-600" />
                          )}
                          {sortStatus === "desc" && (
                            <ChevronDownIcon size={16} className="text-blue-600" />
                          )}
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-1 h-full text-black"
                          onDoubleClick={() => {
                            setRenameColumnId(header.id);
                            setRenameValue(columnNames[header.id] || header.id);
                          }}
                          draggable={canDrag}
                          onDragStart={(e) => {
                            if (!canDrag) return;
                            e.dataTransfer.setData("text/plain", header.id);
                          }}
                          onDragOver={(e) => {
                            if (!canDrag) return;
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            if (!canDrag) return;
                            const fromId = e.dataTransfer.getData("text/plain");
                            if (!fromId) return;
                            setColumnOrder((prev) => {
                              const newOrder = [...prev];
                              const fromIndex = newOrder.indexOf(fromId);
                              const toIndex = newOrder.indexOf(header.id);
                              if (fromIndex < 0 || toIndex < 0) return prev;
                              newOrder.splice(
                                toIndex,
                                0,
                                newOrder.splice(fromIndex, 1)[0]
                              );
                              return newOrder;
                            });
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      )}

                      {/* resize handle */}
                      {header.column.getCanResize() && (
                        <div
                          onDoubleClick={() => header.column.resetSize()}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute top-0 h-full w-2 cursor-col-resize -right-1 z-10"
                        />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 && table.getRowModel().rows.map((row) => (
                <MemoizedRow
                  key={`${row.id}-${columnOrder.join('-')}`}
                  row={row}
                  isSelected={row.getIsSelected()}
                  isFillTarget={isFillTarget}
                  isFillSource={isFillSource}
                  handleRowClick={handleRowClick}
                  handleContextMenu={handleContextMenu}
                  handleRowDragStart={handleRowDragStart}
                  setDragOverIndex={setDragOverIndex}
                  handleRowDrop={handleRowDrop}
                  isSticky={isSticky}
                  stickyStyles={stickyStyles}
                  table={table}
                  fillDragColumn={fillDragColumn}
                  fillDragRange={fillDragRange}
                  rowHeight={rowHeight}
                  columnOrder={columnOrder}
                />
            ))}

            {/* "Add new record" row - only show when not scrollable */}
            {!isScrollable && (
              <TableRow className="group hover:bg-[#F9FAFB]">
                {(() => {
                  const visibleColumns = table.getVisibleLeafColumns();
                  const firstCol = visibleColumns[0];
                  const secondCol = visibleColumns[1];
                  const thirdCol = visibleColumns[2];

                  const stickyWidth = firstCol.getSize() + secondCol.getSize() + thirdCol.getSize();
                  const restOfCols = visibleColumns.slice(3);

                  return (
                    <>
                      <TableCell
                        colSpan={3}
                        className="px-3 py-3 bg-white border-t border-[#EAE9E9]"
                        style={{
                          ...stickyStyles('drag', 10),
                          width: stickyWidth,
                        }}
                      >
                        <button
                          className="p-0 m-0 font-semibold text-sm cursor-pointer flex flex-row leading-[16px] items-center gap-2"
                          onClick={handleAddRowUngrouped}
                        >
                          <PlusIcon size={16} />
                          Add new record
                        </button>
                      </TableCell>
                      {restOfCols.map((col, index) => (
                        <TableCell
                          key={col.id}
                          className={cn(
                            "px-3 py-3 bg-white border-t border-[#EAE9E9]",
                          )}
                          style={{
                            width: col.getSize(),
                          }}
                        />
                      ))}
                    </>
                  );
                })()}
              </TableRow>
            )}

          </TableBody>
        </table>
      </div>
    );
  }


  // handle context menu actions
  const handleContextMenu = React.useCallback((e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, row: Row<Post>) => {
    e.preventDefault();
    if (!row.getIsSelected()) {
      table.resetRowSelection();
      row.toggleSelected(true);
    }
    setContextMenuOpen(false);
    setContextMenuRow(row);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    requestAnimationFrame(() => {
      setContextMenuOpen(true);
    });
  }, [table]);

  function handleEditPost(post: Post) {
    onOpen?.(post.id);
  }
  function handleDeletePosts(selected: Post[]) {
    // Clear any existing timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    // Move posts to trash instead of permanently deleting
    setTrashedPosts(prev => [...prev, ...selected]);
    setTableData((prev) => prev.filter((p) => !selected.map((xx) => xx.id).includes(p.id)));
    setLastTrashedCount(selected.length);
    setShowUndoMessage(true);
    table.resetRowSelection();

    // Auto-hide undo message after 5 seconds
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndoMessage(false);
      // When timeout expires, permanently delete the posts from store
      selected.forEach((p) => store.deletePost(p.id));
    }, 5000);
  }

  function handleUndoTrash() {
    // Clear the timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }

    // Restore the last trashed posts
    const postsToRestore = trashedPosts.slice(-lastTrashedCount);
    setTrashedPosts(prev => prev.slice(0, -lastTrashedCount));
    setTableData(prev => [...prev, ...postsToRestore]);
    
    // The posts are already in the store (they were just moved to trash locally)
    // No need to update the store - just restore them to the table display
    
    setShowUndoMessage(false);
  }

  const selectedRows = table.getSelectedRowModel().flatRows;
  const selectedPosts = React.useMemo(
    () => selectedRows.map((r) => r.original),
    [selectedRows]
  );

  // Add CSS variables for background colors
  React.useEffect(() => {
    document.documentElement.style.setProperty('--background', '#FFFFFF');
    document.documentElement.style.setProperty('--background-selected', '#EBF5FF');
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
  }, []);

  // ─────────────────────────────────────────────────────────────
  //  Shift-click range selection (anchor + batching)
  // ─────────────────────────────────────────────────────────────
  const anchorRowIdRef = React.useRef<string | null>(null);

  const handleRowClick = React.useCallback(
    (
      e: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
      row: Row<Post>
    ) => {
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
          const groups = getFinalGroupRows(table.getGroupedRowModel().rows);
          allRows = groups.flatMap(group => group.leafRows);
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
        const end   = Math.max(anchorIndex, currentIndex);

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
    [table, grouping]
  );

  const handleCheckboxClick = (e: React.MouseEvent, row: Row<Post>) => {
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
      const groups = getFinalGroupRows(table.getGroupedRowModel().rows);
      allRows = groups.flatMap(group => group.leafRows);
    } else {
      // For ungrouped tables, use the regular row model
      allRows = table.getRowModel().rows;
    }

    anchorIndex = allRows.findIndex(
      (r) => r.id === anchorRowIdRef.current
    );
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
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-full relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={onFileChange}
      />
      <div className="bg-background text-black flex flex-col h-full relative rounded-none border-none">
        {/* Context Menu */}
        <DropdownMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen} modal={false}>
          <DropdownMenuTrigger className="hidden" />
          <PostContextMenu
            selectedPosts={selectedPosts}
            onEdit={(post) => handleEditPost(post)}
            onDuplicate={(posts) => handleDuplicatePosts(posts)}
            onDelete={handleDeletePosts}
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
              />
              <RowHeightMenu rowHeight={rowHeight} setRowHeight={setRowHeight} />
              <ColumnVisibilityMenu
                table={table}
                hiddenCount={
                  Object.values(columnVisibility).filter((v) => v === false).length
                }
                colVisOpen={colVisOpen}
                setColVisOpen={setColVisOpen}
                columnNames={columnNames}
              />
            </div>
          </div>
          <div className="pr-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className="flex items-center p-[2px] rounded-full border border-[#D3D3D3] shadow-none cursor-pointer bg-[#FBFBFB]"
                >
                  <MoreHorizontal className="h-4 w-4 text-black" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[180px]">
                <DropdownMenuItem onClick={handleImport} className="cursor-pointer">
                  <ArrowUpFromLine className="mr-2 h-4 w-4" />
                  <span className="text-sm text-black font-medium leading-[16px]">Import</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} className="cursor-pointer">
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  <span className="text-sm text-black font-medium leading-[16px]">Export</span>
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
                scrollbarWidth: 'thin',
                scrollbarColor: '#D0D5DD #F9FAFB',
                paddingBottom: grouping.length === 0 && isScrollable ? '32px' : '0px', // Add padding for fixed button only when scrollable
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleRowDrop}
              onScroll={handleScroll}
            >
              <style jsx global>{`
                /* Webkit scrollbar styling */
                .overflow-auto::-webkit-scrollbar {
                  width: 8px;
                  height: 8px;
                }
                .overflow-auto::-webkit-scrollbar-track {
                  background: #F9FAFB;
                }
                .overflow-auto::-webkit-scrollbar-thumb {
                  background-color: #D0D5DD;
                  border-radius: 4px;
                  border: 2px solid #F9FAFB;
                }
                .overflow-auto::-webkit-scrollbar-thumb:hover {
                  background-color: #98A2B3;
                }

                /* Sticky status shadow handling */
                .sticky-status-shadow {
                  transition: box-shadow 0.2s ease-in-out;
                }

                .scrolling-horiz .sticky-status-shadow {
                  box-shadow: 5px 0px 0px 0px rgba(16, 24, 40, 0.05);
                  transition: none;
                }
              `}</style>
              <div className="min-w-full inline-block">
                {grouping.length > 0 ? (
                  <div className="p-0 m-0">{renderGroupedTable()}</div>
                ) : (
                  renderUngroupedTable()
                )}
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
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(16,24,40,0.08)',
                        border: '1px solid rgb(212, 214, 216)',
                      }}
                    >
                      <PlusIcon size={12} className="text-darkGrey"/>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xl font-semibold mb-2">No records yet</div>
                    <div className="text-sm font-normal text-darkGrey">No record created yet. Start by creating</div>
                    <div className="text-sm font-normal text-darkGrey">your first record.</div>
                  </div>
                </div>
              )}
            </div>

            
            {/* Fixed "Add new record" button for ungrouped view - only when scrollable */}
            {grouping.length === 0 && isScrollable && (
              <div 
                className="absolute bottom-2 px-3 py-3 left-1 right-0 bg-white border-t border-[#EAE9E9] z-20"
              >
                <div className="flex items-center h-full">
                  <button
                    className="p-0 m-0 font-semibold text-sm cursor-pointer flex flex-row leading-[16px] items-center gap-2"
                    onClick={handleAddRowUngrouped}
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
          onAddColumn={handleAddColumn}
        />

        {/* Rename Column Dialog */}
        <Dialog open={!!renameColumnId} onOpenChange={(o) => !o && setRenameColumnId(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Rename Column</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Enter a new name for this column. The change will be reflected immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="column-name" className="text-sm font-medium">Column Name</Label>
                <Input
                  id="column-name"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full"
                  placeholder="Enter column name..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyRename();
                    } else if (e.key === 'Escape') {
                      setRenameColumnId(null);
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setRenameColumnId(null)}
                className="px-4"
              >
                Cancel
              </Button>
              <Button 
                onClick={applyRename}
                className="px-4"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
      </div>
      {/* ────────────────────────────────────────────────────────────────
          Bulk-action toolbar – shows up when rows are selected
      ────────────────────────────────────────────────────────────────── */}
      {selectedPosts.length > 0 && !showUndoMessage && !showDuplicateUndoMessage && (
        <div
          className="
            fixed bottom-4 left-1/2 -translate-x-1/2 z-50
            flex items-center gap-4
            bg-black border rounded-lg shadow-xl
            pl-2 pr-3 py-1.5 text-white gap-3
          "
        >
          {/* how many rows? */}
          <div 
            className="py-2 px-3 rounded-md outline outline-1 outline-offset-[-1px] outline-white/20 inline-flex justify-start items-center gap-1 cursor-pointer" 
            onClick={() => table.resetRowSelection()}
          >
            <span className="text-sm font-medium whitespace-nowrap">
              {selectedPosts.length} Selected
            </span>
            <XIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex justify-start items-center">
            {/* approve */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                // Define which statuses allow approval actions
                const allowedStatusesForApproval = [
                  "Pending Approval",
                  "Revised", 
                  "Needs Revisions",
                  "Approved"
                ];
                
                selectedPosts.forEach(post => {
                  // Only approve if the status allows it
                  if (allowedStatusesForApproval.includes(post.status)) {
                    updatePost(post.id, { status: "Approved" });
                  }
                });
                table.resetRowSelection();
              }}
              className="gap-1.5 text-sm cursor-pointer"
            >
              <Image src="/images/status/approved.svg" alt="approved" width={16} height={16} />
              Approve
            </Button>

            {/* auto-schedule */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                selectedPosts.forEach(post => {
                  // Add your auto-schedule logic here
                  updatePost(post.id, { status: "Scheduled" });
                });
                table.resetRowSelection();
              }}
              className="gap-1 cursor-pointer"
            >
              <Image src="/images/publish/clock-check.svg" alt="approved" width={16} height={16} />
              Auto-Schedule
            </Button>

            {/* unschedule */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                selectedPosts.forEach(post => {
                  // Add your unschedule logic here
                  updatePost(post.id, { status: "Draft" });
                });
                table.resetRowSelection();
              }}
              className="gap-1 cursor-pointer"
            >
              <Image src="/images/publish/clock-plus.svg" alt="approved" width={16} height={16} />
              Unschedule
            </Button>

            {/* duplicate */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDuplicatePosts(selectedPosts)}
              className="gap-1 cursor-pointer"
            >
              <Image src="/images/boards/duplicate.svg" alt="approved" width={16} height={16} />
              Duplicate
            </Button>

            {/* delete */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeletePosts(selectedPosts)}
              className="gap-1 cursor-pointer"
            >
              <Image src="/images/boards/delete-red.svg" alt="approved" width={16} height={16} />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────
          Undo message – shows up when posts are moved to trash
      ────────────────────────────────────────────────────────────────── */}
      {showUndoMessage && (
        <div
          className="
            absolute bottom-4 left-4 z-50
            flex items-center
            bg-black border rounded-lg shadow-xl
            pl-4 pr-1 py-2 text-white gap-1
          "
        >
          <span className="text-sm font-medium whitespace-nowrap mr-3">
            {lastTrashedCount} record{lastTrashedCount > 1 ? 's' : ''} moved to trash
          </span>
          <div className="h-[16px] w-[1px] bg-white/20" />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUndoTrash}
            className="gap-1 cursor-pointer hover:text-black"
          >
            <span className="text-sm">Undo</span>
          </Button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────
          Duplicate undo message – shows up when posts are duplicated
      ────────────────────────────────────────────────────────────────── */}
      {showDuplicateUndoMessage && (
        <div
          className="
            absolute bottom-4 left-4 z-50
            flex items-center
            bg-black border rounded-lg shadow-xl
            pl-4 pr-1 py-2 text-white gap-1
          "
        >
          <span className="text-sm font-medium whitespace-nowrap mr-3">
            {lastDuplicatedCount} record{lastDuplicatedCount > 1 ? 's' : ''} duplicated
          </span>
          <div className="h-[16px] w-[1px] bg-white/20" />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUndoDuplicate}
            className="gap-1 cursor-pointer hover:text-black"
          >
            <span className="text-sm">Undo</span>
          </Button>
        </div>
      )}

      {/* Group Feedback Sidebar */}
      <GroupFeedbackSidebar
        isOpen={groupFeedbackSidebarOpen}
        onClose={handleCloseGroupFeedback}
        groupData={selectedGroupData}
        month={selectedGroupData?.month || 0}
        onAddComment={handleAddGroupComment}
        onAddMessage={handleAddGroupMessage}
        onResolveComment={handleResolveGroupComment}
        onDeleteAiSummary={handleDeleteAiSummary}
      />
    </div>
  );
}
