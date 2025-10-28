import * as React from "react";
import { GroupComment, Post, UserColumn, UserColumnOption } from "@/lib/store";
import { 
  SortingState, 
  ColumnFiltersState, 
  GroupingState, 
  VisibilityState, 
  ExpandedState, 
  ColumnSizingInfoState,
  Row 
} from "@tanstack/react-table";
import { RowHeightType } from "@/lib/utils";
import { ConditionGroup } from "./filter-popover";
import { Platform } from "@/lib/social/platforms/platform-types";
import { Table } from "@tanstack/react-table";

/**
 * Interface for all post table state
 */
export interface PostTableState {
  // Basic state
  mounted: boolean;
  tableData: Post[];
  trashedPosts: Post[];
  showUndoMessage: boolean;
  lastTrashedCount: number;
  duplicatedPosts: Post[];
  showDuplicateUndoMessage: boolean;
  lastDuplicatedCount: number;
  
  // Group feedback state
  groupFeedbackSidebarOpen: boolean;
  selectedGroupData: {
    month: number;
    comments: GroupComment[];
  } | null;
  
  // Preview state
  selectedPreviewCell: string | null;
  
  // User columns state
  userColumns: UserColumn[];
  addColumnOpen: boolean;
  
  // Header menu state
  headerMenuOpenFor: string | null;
  headerMenuAlign: "start" | "end";
  headerMenuAlignOffset: number;
  headerMenuSideOffset: number;
  
  // Context menu state
  contextMenuOpen: boolean;
  contextMenuRow: Row<Post> | null;
  contextMenuPosition: { x: number; y: number };
  
  // Table state
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  grouping: GroupingState;
  columnVisibility: VisibilityState;
  columnOrder: string[];
  expanded: ExpandedState;
  columnSizing: Record<string, number>;
  columnSizingInfo: ColumnSizingInfoState;
  resizingColumnId: string | null;
  rowHeight: RowHeightType;
  
  // Scroll state
  isScrollable: boolean;
  
  // Filter state
  filterOpen: boolean;
  
  // Column names state
  columnNames: Record<string, string>;
  renameColumnId: string | null;
  renameValue: string;
  
  // Edit field state
  editFieldOpen: boolean;
  editFieldColumnId: string | null;
  editFieldType: string;
  editFieldPanelPos: { top: number; left: number; align: "left" | "right" } | null;
  editFieldTypeOpen: boolean;
  newFieldLabel: string;
  editFieldOptions: Array<UserColumnOption>;
  
  // Caption editor state
  captionOpen: boolean;
  editingPost: Post | null;
  selectedPlatform: Platform | null;
  captionLocked: boolean;
  
  // User text editor state
  userTextOpen: boolean;
  editingUserText: {
    postId: string;
    colId: string;
  } | null;
  
  // Group expansion state
  flatGroupExpanded: Record<string, boolean>;
  
  // Pending insert state
  pendingInsertRef: { targetId: string; side: "left" | "right" } | null;
}

/**
 * Interface for all post table state setters
 */
export interface PostTableStateSetters {
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  setTableData: React.Dispatch<React.SetStateAction<Post[]>>;
  setTrashedPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setShowUndoMessage: React.Dispatch<React.SetStateAction<boolean>>;
  setLastTrashedCount: React.Dispatch<React.SetStateAction<number>>;
  setDuplicatedPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setShowDuplicateUndoMessage: React.Dispatch<React.SetStateAction<boolean>>;
  setLastDuplicatedCount: React.Dispatch<React.SetStateAction<number>>;
  setGroupFeedbackSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedGroupData: React.Dispatch<React.SetStateAction<{
    month: number;
    comments: GroupComment[];
  } | null>>;
  setSelectedPreviewCell: React.Dispatch<React.SetStateAction<string | null>>;
  setUserColumns: React.Dispatch<React.SetStateAction<UserColumn[]>>;
  setAddColumnOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setHeaderMenuOpenFor: React.Dispatch<React.SetStateAction<string | null>>;
  setHeaderMenuAlign: React.Dispatch<React.SetStateAction<"start" | "end">>;
  setHeaderMenuAlignOffset: React.Dispatch<React.SetStateAction<number>>;
  setHeaderMenuSideOffset: React.Dispatch<React.SetStateAction<number>>;
  setContextMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setContextMenuRow: React.Dispatch<React.SetStateAction<Row<Post> | null>>;
  setContextMenuPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  setGrouping: React.Dispatch<React.SetStateAction<GroupingState>>;
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>;
  setColumnSizing: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setColumnSizingInfo: React.Dispatch<React.SetStateAction<ColumnSizingInfoState>>;
  setResizingColumnId: React.Dispatch<React.SetStateAction<string | null>>;
  setRowHeight: React.Dispatch<React.SetStateAction<RowHeightType>>;
  setIsScrollable: React.Dispatch<React.SetStateAction<boolean>>;
  setFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setColumnNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setRenameColumnId: React.Dispatch<React.SetStateAction<string | null>>;
  setRenameValue: React.Dispatch<React.SetStateAction<string>>;
  setEditFieldOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditFieldColumnId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditFieldType: React.Dispatch<React.SetStateAction<string>>;
  setEditFieldPanelPos: React.Dispatch<React.SetStateAction<{ top: number; left: number; align: "left" | "right" } | null>>;
  setEditFieldTypeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setNewFieldLabel: React.Dispatch<React.SetStateAction<string>>;
  setEditFieldOptions: React.Dispatch<React.SetStateAction<Array<UserColumnOption>>>;
  setCaptionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingPost: React.Dispatch<React.SetStateAction<Post | null>>;
  setSelectedPlatform: React.Dispatch<React.SetStateAction<Platform | null>>;
  setCaptionLocked: React.Dispatch<React.SetStateAction<boolean>>;
  setUserTextOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingUserText: React.Dispatch<React.SetStateAction<{
    postId: string;
    colId: string;
  } | null>>;
  setFlatGroupExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setPendingInsertRef: React.Dispatch<React.SetStateAction<{ targetId: string; side: "left" | "right" } | null>>;
}

/**
 * Interface for all post table refs
 */
export interface PostTableRefs {
  undoTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  duplicateUndoTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  selectedPreviewCellRef: React.MutableRefObject<string | null>;
  groupRevisionRef: React.MutableRefObject<Map<string, number>>;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  prevStoreDataRef: React.MutableRefObject<string>;
  userInitiatedChangeRef: React.MutableRefObject<boolean>;
  lastBoardIdRef: React.MutableRefObject<string | null>;
  scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  scrollTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  lastScrollLeftRef: React.MutableRefObject<number>;
  emptyFilterRef: React.MutableRefObject<ConditionGroup>;
  editFieldPanelRef: React.MutableRefObject<HTMLDivElement | null>;
  plusHeaderRef: React.MutableRefObject<HTMLTableCellElement | null>;
  tableRef: React.MutableRefObject<Table<Post> | null>;
  headerRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  anchorRowIdRef: React.MutableRefObject<string | null>;
}

/**
 * Custom hook for managing all post table state
 */
export function usePostTableState(initialPosts: Post[]) {
  // Basic state
  const [mounted, setMounted] = React.useState(false);
  const [tableData, setTableData] = React.useState<Post[]>(initialPosts);
  const [trashedPosts, setTrashedPosts] = React.useState<Post[]>([]);
  const [showUndoMessage, setShowUndoMessage] = React.useState(false);
  const [lastTrashedCount, setLastTrashedCount] = React.useState(0);
  const [duplicatedPosts, setDuplicatedPosts] = React.useState<Post[]>([]);
  const [showDuplicateUndoMessage, setShowDuplicateUndoMessage] = React.useState(false);
  const [lastDuplicatedCount, setLastDuplicatedCount] = React.useState(0);
  
  // Group feedback state
  const [groupFeedbackSidebarOpen, setGroupFeedbackSidebarOpen] = React.useState(false);
  const [selectedGroupData, setSelectedGroupData] = React.useState<{
    month: number;
    comments: GroupComment[];
  } | null>(null);
  
  // Preview state
  const [selectedPreviewCell, setSelectedPreviewCell] = React.useState<string | null>(null);
  
  // User columns state
  const [userColumns, setUserColumns] = React.useState<UserColumn[]>([]);
  const [addColumnOpen, setAddColumnOpen] = React.useState(false);
  
  // Header menu state
  const [headerMenuOpenFor, setHeaderMenuOpenFor] = React.useState<string | null>(null);
  const [headerMenuAlign, setHeaderMenuAlign] = React.useState<"start" | "end">("start");
  const [headerMenuAlignOffset, setHeaderMenuAlignOffset] = React.useState<number>(0);
  const [headerMenuSideOffset, setHeaderMenuSideOffset] = React.useState<number>(0);
  
  // Context menu state
  const [contextMenuOpen, setContextMenuOpen] = React.useState(false);
  const [contextMenuRow, setContextMenuRow] = React.useState<Row<Post> | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = React.useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  
  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [grouping, setGrouping] = React.useState<GroupingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [columnSizing, setColumnSizing] = React.useState<Record<string, number>>({});
  const [columnSizingInfo, setColumnSizingInfo] = React.useState<ColumnSizingInfoState>({
    startOffset: null,
    startSize: null,
    deltaOffset: null,
    deltaPercentage: null,
    isResizingColumn: false,
    columnSizingStart: [],
  });
  const [resizingColumnId, setResizingColumnId] = React.useState<string | null>(null);
  const [rowHeight, setRowHeight] = React.useState<RowHeightType>("Medium");
  
  // Scroll state
  const [isScrollable, setIsScrollable] = React.useState(false);
  
  // Filter state
  const [filterOpen, setFilterOpen] = React.useState(false);
  
  // Column names state
  const [columnNames, setColumnNames] = React.useState<Record<string, string>>({
    drag: "",
    rowIndex: "",
    status: "Status",
    preview: "Preview",
    caption: "Caption",
    platforms: "Socials",
    format: "Format",
    month: "Month",
    revision: "Revision",
    approve: "Approve",
    settings: "Settings",
    publish_date: "Post time",
    updated_at: "Updated",
  });
  const [renameColumnId, setRenameColumnId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  
  // Edit field state
  const [editFieldOpen, setEditFieldOpen] = React.useState(false);
  const [editFieldColumnId, setEditFieldColumnId] = React.useState<string | null>(null);
  const [editFieldType, setEditFieldType] = React.useState<string>("single line text");
  const [editFieldPanelPos, setEditFieldPanelPos] = React.useState<{
    top: number;
    left: number;
    align: "left" | "right";
  } | null>(null);
  const [editFieldTypeOpen, setEditFieldTypeOpen] = React.useState(false);
  const [newFieldLabel, setNewFieldLabel] = React.useState<string>("");
  const [editFieldOptions, setEditFieldOptions] = React.useState<
    Array<UserColumnOption>
  >([
    { id: "opt_1", value: "Option A", color: "#3B82F6" },
    { id: "opt_2", value: "Option B", color: "#10B981" },
    { id: "opt_3", value: "Option C", color: "#F59E0B" },
  ]);
  
  // Caption editor state
  const [captionOpen, setCaptionOpen] = React.useState(false);
  const [editingPost, setEditingPost] = React.useState<Post | null>(null);
  const [selectedPlatform, setSelectedPlatform] = React.useState<Platform | null>(null);
  const [captionLocked, setCaptionLocked] = React.useState<boolean>(true);
  
  // User text editor state
  const [userTextOpen, setUserTextOpen] = React.useState(false);
  const [editingUserText, setEditingUserText] = React.useState<{
    postId: string;
    colId: string;
  } | null>(null);
  
  // Group expansion state
  const [flatGroupExpanded, setFlatGroupExpanded] = React.useState<Record<string, boolean>>({});
  
  // Pending insert state
  const [pendingInsertRef, setPendingInsertRef] = React.useState<{
    targetId: string;
    side: "left" | "right";
  } | null>(null);

  // Refs
  const undoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const duplicateUndoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const selectedPreviewCellRef = React.useRef<string | null>(null);
  const groupRevisionRef = React.useRef<Map<string, number>>(new Map());
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const prevStoreDataRef = React.useRef<string>("");
  const userInitiatedChangeRef = React.useRef(false);
  const lastBoardIdRef = React.useRef<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollLeftRef = React.useRef(0);
  const emptyFilterRef = React.useRef<ConditionGroup>({ id: "root", type: "group", children: [] });
  const editFieldPanelRef = React.useRef<HTMLDivElement | null>(null);
  const plusHeaderRef = React.useRef<HTMLTableCellElement | null>(null);
  const tableRef = React.useRef<Table<Post> | null>(null);
  const headerRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const anchorRowIdRef = React.useRef<string | null>(null);

  const state: PostTableState = {
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
  };

  const setters: PostTableStateSetters = {
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
  };

  const refs: PostTableRefs = {
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
  };

  return {
    state,
    setters,
    refs,
  };
}
