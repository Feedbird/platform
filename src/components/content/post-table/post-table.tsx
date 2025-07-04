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
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Lock,
  Unlock,
  X as XIcon,
  Copy,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";

import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

/** ---------- Filter Fns ---------- **/
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
  const cellVal = String(row.getValue(colId)); // Convert number to string for comparison
  return filterValues.includes(cellVal);
};

// Updated to handle platforms instead of pages - filter by the platform of the pages
const platformsFilterFn: FilterFn<Post> = (row, colId, filterValues: string[]) => {
  if (!filterValues.length) return true;
  const rowPages = row.getValue(colId) as string[];
  if (!rowPages || !Array.isArray(rowPages)) return false;
  
  // Get the brand to map page IDs to platforms
  const brand = useFeedbirdStore.getState().getActiveBrand();
  if (!brand) return false;
  
  // Get the platforms of the pages in this row
  const rowPlatforms = rowPages
    .map(pageId => brand.socialPages.find(page => page.id === pageId)?.platform)
    .filter((platform): platform is Platform => platform !== undefined);
  
  // Check if any of the row's platforms match any of the filter values
  return rowPlatforms.some(platform => filterValues.includes(platform));
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
  const store = useFeedbirdStore();
  const updatePost = useFeedbirdStore((s) => s.updatePost);
  const getPageCounts = useFeedbirdStore((s) => s.getPageCounts);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setTableData(posts);
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

    if (colId === 'status') {
      styles.boxShadow = '6px 0px 0px -4px rgba(16, 24, 40, 0.05)';
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

  const [rowHeight, setRowHeight] = React.useState<number>(60);

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
    const newPost = store.addPost();
    if (newPost) {
      newPost.format = "static-image";
      setTableData((prev) => [...prev, newPost]);
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

    setTableData((prev) => [...prev, newPost]);
  }

  function handleDuplicatePosts(posts: Post[]) {
    posts.forEach((orig) => {
      const dup = store.duplicatePost(orig);
      if (dup) {
        setTableData((prev) => [...prev, dup]);
      }
    });
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
                  onCheckedChange={(val) => row.toggleSelected(!!val)}
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
          <div className="flex items-center gap-[6px] text-black text-sm font-medium leading-[16px]">
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
          <div className="flex items-center gap-[6px] text-black text-sm font-medium leading-[16px]">
            <Image src={`/images/columns/preview.svg`} alt="preview" width={14} height={14} />
            {columnNames["preview"] || "Preview"}
          </div>
        ),
        minSize: 90,
        enableSorting: false,
        cell: ({ row }) => {
          const post = row.original;
          
          const handleFilesSelected = async (files: File[]) => {
            // Handle file upload logic here
            // For now, we'll just log the files
            // In a real implementation, you'd upload to your API and update the post
            console.log('Files selected for post:', post.id, files);
            
            // TODO: Implement actual file upload
            // 1. Upload files to /api/media/upload
            // 2. Create blocks from uploaded files
            // 3. Update post with new blocks
          };

          return (
            <div
              className="flex flex-1 px-[4px] py-[4px] h-full"
              onClick={(e) => {
                // Only open modal if there are blocks to view
                if (post.blocks.length > 0) {
                  onOpen?.(post.id);
                }
              }}
            >
              <BlocksPreview 
                blocks={post.blocks} 
                onFilesSelected={handleFilesSelected}
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
          <div className="flex items-center w-full text-black gap-[6px] font-medium leading-[16px]">
            <Image src={`/images/columns/caption.svg`} alt="caption" width={14} height={14} />
            <span className="text-sm leading-[16px]">{columnNames["caption"] || "Caption"}</span>

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
              rowHeight={rowHeight}
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
        header: () => (
          <div className="flex items-center gap-[6px] text-black text-sm font-medium leading-[16px]">
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
        header: () => (
          <div className="flex items-center gap-[6px] text-black text-sm font-medium leading-[16px]">
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
          <div className="flex items-center gap-[6px] text-black text-sm font-medium leading-[16px]">
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
              isFocused={isFocused}
              isEditing={isEditing}
              enterEdit={enterEdit}
              exitEdit={exitEdit}
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
          <div className="flex items-center gap-[6px] text-black text-sm font-medium leading-[16px]">
            <Image src={`/images/columns/revision.svg`} alt="revision" width={14} height={14} />
            {columnNames["revision"] || "Revision"}
          </div>
        ),
        minSize: 90,
        enableSorting: false,
        cell: ({ row }) => {
          const post = row.original;
          return (
            <div className="cursor-pointer inline-flex items-center w-full h-full overflow-hidden px-[8px] py-[6px]">
              <div className="flex items-center flex-nowrap min-w-0">
                <div className="flex-shrink-0">
                  <div
                    className="flex items-center border border-border-button rounded-[4px] px-[8px] py-[6px] gap-[4px] cursor-pointer"
                    style={{
                      boxShadow: "0px 0px 0px 1px #D3D3D3, 0px 1px 1px 0px rgba(0, 0, 0, 0.05), 0px 4px 6px 0px rgba(34, 42, 53, 0.04)"
                    }}
                    onClick={() => {
                      setTableData((prev) =>
                        prev.map((p) =>
                          p.id === post.id ? { ...p, status: "Needs Revisions" } : p
                        )
                      );
                      updatePost(post.id, { status: "Needs Revisions" });
                      handleEditPost(post);
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
          <div className="flex items-center gap-[6px] text-black text-sm font-medium leading-[16px]">
            <Image src={`/images/columns/approve.svg`} alt="approve" width={14} height={14} />
            {columnNames["approve"] || "Approve"}
          </div>
        ),
        minSize: 100,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const post = row.original;
          return <ApproveCell post={post} updatePost={updatePost} />;
        },
      },
      {
        id: "settings",
        header: () => (
          <div className="flex items-center gap-[6px] text-black text-sm font-medium leading-[16px]">
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
          <div className="flex items-center gap-[6px] text-black text-sm font-medium leading-[16px]">
            <Image src={`/images/columns/post-time.svg`} alt="Publish Date" width={14} height={14} />
            {"Post Time"}
          </div>
        ),
        minSize: 110,
        size: 230,
        enableGrouping: true,
        getGroupingValue: (row) => {
          return formatYearMonth(row.publishDate);
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
          <div className="flex items-center gap-[6px] text-sm font-medium text-black leading-[16px]">
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
  }, [columnNames, updatePost, rowHeight, selectedPlatform, availablePlatforms, captionLocked]);

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
  const table = useReactTable<Post>({
    data: tableData,
    columns,
    groupedColumnMode: false,
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
  });
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
        // val could be an array or a comma-separated string
        const platforms = Array.isArray(val) ? val : String(val).split(",");
        return <ChannelIcons channels={platforms as Platform[]} />;
      }
      case "format":
        return <FormatBadge kind={val as ContentFormat} widthFull={false} />;
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
                    "relative text-left border-b border-[#E6E4E2] px-2 py-2",
                    index !== 0 && "border-r",
                    isSticky(h.id) && 'bg-[#FBFBFB]'
                  )}
                  style={{ width: h.getSize(), ...stickyStyles(h.id, 10) }}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
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
  }: {
    children: React.ReactNode;
  }) {
    const visibleLeafColumns = table.getVisibleLeafColumns();
    const stickyCols = visibleLeafColumns.filter(c => isSticky(c.id));
    const nonStickyCols = visibleLeafColumns.filter(c => !isSticky(c.id));
  
    return (
      <tr>
        {/* ◀ left phantom sticky */}
        <td
          style={{
            position: 'sticky',
            left: 0,
            width: 20,
            background: "#F8F8F8",
            zIndex: 4, // Higher than cell zIndex
          }}
        />
        
        <td
          className="bg-white border-t border-l border-b border-[#E6E4E2]"
          colSpan={stickyCols.length}
          style={{
            borderRadius: "4px 0px 0px 0px",
            ...stickyStyles("drag", 10), // Higher than row zIndex
          }}
        >
          <div className="flex items-center gap-2 px-[12px] py-[10px] font-medium text-sm">
            {children}
          </div>
        </td>
  
        <td
          colSpan={nonStickyCols.length}
          className="bg-white border-t border-b border-r border-[#E6E4E2]"
          style={{
            borderRadius: "0px 4px 0px 0px",
          }}
        >
          &nbsp;
        </td>
  
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
          {groups.map((group, idx) => {
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
                <GroupDivider>
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

                  {/* row-count badge – make it inline-flex so it
                      can sit on the same line without wrapping */}
                  <span className="ml-2 inline-flex items-center justify-center
                                  w-[22px] h-[22px] rounded-full bg-[#F2F4F7]
                                  text-[#475467] text-xs leading-none">
                    {group.rowCount}
                  </span>
                </GroupDivider>

                {/* Leaf rows */}
                {isExpanded &&
                  group.leafRows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-rowkey={row.index}
                      style={{ height: rowHeight }}
                      className={cn(
                        "group hover:bg-[#F9FAFB]",
                        row.getIsSelected() && "bg-[#EBF5FF]"
                      )}
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
                          className={cn(
                            "text-left",
                            isSticky(cell.column.id) && (row.getIsSelected() ? "bg-[#EBF5FF]" : "bg-white group-hover:bg-[#F9FAFB]"),
                            cell.column.id === "caption"
                              ? "align-top"
                              : "align-middle",
                            "px-0 py-0",
                            index === 0 ? "border-l" : "border-l-0"
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
                        isSticky(header.id) && "bg-[#FBFBFB]"
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-rowkey={row.index}
                  style={{ height: rowHeight }}
                  className={cn(
                    "group",
                    "hover:bg-[#F9FAFB]",
                    row.getIsSelected() ? "bg-[#EBF5FF]" : ""
                  )}
                  onContextMenu={(e) => {
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
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isColSticky = isSticky(cell.column.id);
                    return (
                      <FocusCell
                        rowId={row.id}
                        colId={cell.id}
                        key={cell.id}
                        className={cn(
                          "text-left",
                          cell.column.id === "caption" ? "align-top" : "align-middle",
                          "px-0 py-0",
                          "border-t border-[#EAE9E9] last:border-b-0",
                          isColSticky && (row.getIsSelected() ? "bg-[#EBF5FF]" : "bg-white group-hover:bg-[#F9FAFB]")
                        )}
                        style={{
                          height: "inherit",
                          borderRight: "1px solid #EAE9E9",
                          width: cell.column.getSize(),
                          ...stickyStyles(cell.column.id, 10)
                        }}
                      >
                        {({isFocused, isEditing, exitEdit, enterEdit}) => {
                          return flexRender(cell.column.columnDef.cell, {
                            ...cell.getContext(),
                            isFocused,
                            isEditing,
                            exitEdit,
                            enterEdit
                          });
                        }}
                      </FocusCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-20 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
            <TableRow 
              className="group hover:bg-[#F9FAFB]"
            >
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
          </TableBody>
        </table>
      </div>
    );
  }


  // handle context menu actions
  function handleEditPost(post: Post) {
    onOpen?.(post.id);
  }
  function handleDeletePosts(selected: Post[]) {
    selected.forEach((p) => store.deletePost(p.id));
    setTableData((prev) => prev.filter((p) => !selected.map((xx) => xx.id).includes(p.id)));
    table.resetRowSelection();
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
        <div className="flex flex-wrap items-center justify-between py-[10px] border-b border-border-primary">
          <div className="flex gap-[6px] relative pl-[14px]">
            <FilterPopover
              open={filterOpen}
              onOpenChange={setFilterOpen}
              columns={filterableColumns as ColumnMeta[]}
              rootGroup={filterTree}
              setRootGroup={setFilterTree}
              hasFilters={hasActiveFilters}
            />
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
            
          <div className="pr-[10px]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className="flex items-center p-[3px] rounded-[6px] border border-[#D3D3D3] shadow-none cursor-pointer bg-[#FBFBFB]"
                >
                  <MoreHorizontal className="h-[16px] w-[16px] text-black" />
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
              className="absolute inset-0 overflow-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#D0D5DD #F9FAFB',
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleRowDrop}
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
              `}</style>
              <div className="min-w-full inline-block">
                {grouping.length > 0 ? (
                  <div className="p-0 m-0">{renderGroupedTable()}</div>
                ) : (
                  renderUngroupedTable()
                )}
              </div>
            </div>
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
      {selectedPosts.length > 0 && (
        <div
          className="
            fixed bottom-4 left-1/2 -translate-x-1/2 z-50
            flex items-center gap-4
            bg-black border rounded-lg shadow-xl
            px-5 py-3 text-white
          "
        >
          {/* how many rows? */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium whitespace-nowrap">
              {selectedPosts.length} selected
            </span>
            <div className="h-4 w-[1px] bg-white/20" />
          </div>

          {/* approve */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              selectedPosts.forEach(post => {
                updatePost(post.id, { status: "Approved" });
              });
              table.resetRowSelection();
            }}
            className="gap-1"
          >
            <CheckIcon className="w-4 h-4" />
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
            className="gap-1"
          >
            <CalendarIcon className="w-4 h-4" />
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
            className="gap-1"
          >
            <Clock className="w-4 h-4" />
            Unschedule
          </Button>

          {/* duplicate */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDuplicatePosts(selectedPosts)}
            className="gap-1"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </Button>

          {/* delete */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeletePosts(selectedPosts)}
            className="gap-1"
          >
            <Trash2Icon className="w-4 h-4" />
            Delete
          </Button>

          {/* clear selection */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => table.resetRowSelection()}
            title="Clear selection"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}