"use client";

import Image from "next/image";
import React from "react";
import { ColumnDef, FilterFn, Row, SortingFn, SortingState } from "@tanstack/react-table";
import { GripVertical, Maximize2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ContentFormat, Post, Status, BoardRules } from "@/lib/store";
import { SocialPage } from "@/lib/social/platforms/platform-types";
import { Platform } from "@/lib/social/platforms/platform-types";
import { RowHeightType, getRowHeightPixels } from "@/lib/utils";

import { StatusEditCell } from "../status-edit-cell";
import { ChannelsEditCell } from "../channels-edit-cell";
import { FormatEditCell } from "../format-edit-cell";
import { MonthEditCell } from "../month-edit-cell";
import { ApproveCell } from "../approve-cell";
import { PublishDateCell, UpdateDateCell } from "../date-cell";
import { SettingsEditCell } from "../settings-cell";
import { CaptionCell } from "../caption-cell";
import { CellContext } from "@tanstack/react-table";
import { format } from "date-fns";

type FocusCellContext<T> = CellContext<T, unknown> & {
    isFocused?: boolean;
    isEditing?: boolean;
    enterEdit?: () => void;
    exitEdit?: () => void;
  };

function getCommentCount(post: Post) {
  return post.comments?.length ?? 0;
}

function formatYearMonth(dateObj: Date | undefined) {
    if (!dateObj) return "";
    return format(dateObj, "MMM, yyyy");
  }

function renderPlatformsForHeader(platforms: Platform[], size: "lg" | "sm" = "sm") {
  const total = platforms.length;
  const maxIcons = 5;
  const displayed = total > maxIcons ? platforms.slice(0, 4) : platforms;

  return (
    <div className="flex platform-stack-header">
      {displayed.map((platform) => (
        <img
          key={platform}
          src={`/images/platforms/${platform}.svg`}
          alt={platform}
          className={size === "lg" ? "w-5 h-5" : "w-4 h-4"}
        />
      ))}
      {total > maxIcons && (
        <span className="platform-more-badge-header">{total - 4}+</span>
      )}
    </div>
  );
}

export function createBaseColumns(params: {
  columnNames: Record<string, string>;
  updatePost: (id: string, data: Partial<Post>) => any | Promise<any>;
  setTableData: React.Dispatch<React.SetStateAction<Post[]>>;
  rowHeight: RowHeightType;
  selectedPlatform: Platform | null;
  availablePlatforms: Platform[];
  captionLocked: boolean;
  setCaptionLocked: (locked: boolean) => void;
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
  boardRules?: BoardRules;
  activeBoardId?: string | null;
  updateBoard: (boardId: string, data: Partial<{ rules: BoardRules; columns: any[] }>) => any | Promise<any>;
  sorting: SortingState;
  onOpen?: (id: string) => void;
  onRowDragStart: (e: React.DragEvent, fromIndex: number) => void;
  onRowIndexCheckedChange: (rowId: string, row: any, val: boolean) => void;
  onRowIndexCheckboxClick: (e: React.MouseEvent, row: any) => void;
  onRequestChanges: (post: Post) => void;
  onToggleAutoSchedule: (checked: boolean) => void;
  getPageCounts: any;
  handleFillStartCaption: (value: Post["caption"], startIdx: number) => void;
  handleFillStartPages: (value: string[], startIdx: number) => void;
  handleFillStartFormat: (value: string, startIdx: number) => void;
  handleFillStartMonth: (value: number, startIdx: number) => void;
  previewCellFn: ({ row, isFocused }: { row: Row<Post>; isFocused?: boolean }) => React.ReactNode;
  socialPages: SocialPage[];
  allPosts: Post[];
}) {
  const {
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
    onOpen,
    onRowDragStart,
    onRowIndexCheckedChange,
    onRowIndexCheckboxClick,
    onRequestChanges,
    onToggleAutoSchedule,
    getPageCounts,
    handleFillStartCaption,
    handleFillStartPages,
    handleFillStartFormat,
    handleFillStartMonth,
    previewCellFn,
    socialPages,
    allPosts,
  } = params;

  const baseColumns: ColumnDef<Post>[] = [
    {
      id: "drag",
      header: () => <div className="w-4" />,
      size: 24,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      cell: ({ row, table }) => {
        const isSorted = (table.getState().sorting ?? []).length > 0;
        return (
          <div className="flex items-center justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "transition-opacity",
                    !isSorted
                      ? "cursor-grab opacity-0 group-hover:opacity-100"
                      : "cursor-not-allowed opacity-0 group-hover:opacity-40"
                  )}
                  draggable={!isSorted}
                  data-row-drag-handle="true"
                  onDragStart={(e) => {
                    if (isSorted) {
                      (e as any).preventDefault?.();
                      return;
                    }
                    onRowDragStart(e as any, row.index);
                  }}
                >
                  <GripVertical size={14} />
                </div>
              </TooltipTrigger>
              {isSorted && (
                <TooltipContent className="bg-[#151515] text-white border-none text-xs">
                  <p>Row reordering is disabled when sorting is active</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        );
      },
    },
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
            "h-4 w-4 rounded-none border border-[#D0D5DD] transition-colors duration-150 ease-in-out rounded-[3px]",
            "hover:border-[#2183FF]",
            "data-[state=checked]:bg-[#2183FF]",
            "data-[state=checked]:border-[#2183FF]",
            "data-[state=checked]:text-white"
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

        return (
          <div className="relative group h-6 pl-2 pr-1 w-full flex items-center justify-start">
            <div className={cn("absolute inset-0 flex items-center pl-2 gap-[8px] transition-opacity")}>
              <span
                className={cn(
                  "text-[12px] text-[#475467] w-4 text-center",
                  isSelected ? "opacity-0" : "group-hover:opacity-0 opacity-100"
                )}
              >
                {row.index + 1}
              </span>
              {commentCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="relative w-[22px] h-[22px] cursor-pointer transition-opacity hover:opacity-80 active:opacity-60"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen?.(post.id);
                      }}
                    >
                      <Image src={`/images/platforms/comment.svg`} alt={"comments"} width={22} height={22} />
                      <span className="absolute inset-0 flex items-center justify-center mt-[-2px] text-[10px] text-[#125AFF] leading-none font-semibold">
                        {commentCount}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={4} className="bg-[#151515] text-white border-none text-xs">
                    {commentCount === 1 ? "Expand to see 1 comment" : `Expand to see ${commentCount} comments`}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className={cn("absolute inset-0 flex items-center gap-2 pl-2 transition-opacity")}> 
              <Checkbox
                checked={isSelected}
                onCheckedChange={(val) => onRowIndexCheckedChange(row.id, row, !!val)}
                data-slot="checkbox"
                className={cn(
                  "h-4 w-4 rounded-none border border-[#D0D5DD] transition-colors duration-150 ease-in-out rounded-[3px]",
                  "hover:border-[#2183FF]",
                  "data-[state=checked]:bg-[#2183FF]",
                  "data-[state=checked]:border-[#2183FF]",
                  "data-[state=checked]:text-white",
                  isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                onClick={(e) => onRowIndexCheckboxClick(e as any, row)}
              />
              {commentCount > 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="relative w-[22px] h-[22px] cursor-pointer transition-opacity hover:opacity-80 active:opacity-60"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen?.(post.id);
                      }}
                    >
                      <Image src={`/images/platforms/comment.svg`} alt={"comments"} width={22} height={22} />
                      <span className="absolute inset-0 flex items-center justify-center mt-[-2px] text-[10px] text-[#125AFF] leading-none font-semibold">
                        {commentCount}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={4} className="bg-[#151515] text-white border-none text-xs">
                    {commentCount === 1 ? "Expand to see 1 comment" : `Expand to see ${commentCount} comments`}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="w-6 h-6 bg-white rounded-[4px] border border-elementStroke cursor-pointer transition-opacity hover:opacity-80 active:opacity-60 flex items-center justify-center group-hover:opacity-100 opacity-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen?.(post.id);
                      }}
                    >
                      <Maximize2 className="text-black" style={{ width: "14px", height: "14px" }} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={4} className="bg-[#151515] text-white border-none text-xs">
                    {"Expand"}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="invisible flex items-center gap-2">
              <span className="text-xs font-bold w-4">00</span>
              <div className="w-6 h-6" />
            </div>
          </div>
        );
      },
    },
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
      cell: ({ row, isFocused, isEditing, enterEdit, exitEdit }: FocusCellContext<Post>) => {
        const post = row.original;
        return (
          <StatusEditCell
            value={post.status}
            isFocused={isFocused}
            isEditing={isEditing}
            enterEdit={enterEdit}
            exitEdit={exitEdit}
            onChange={(newStatus) => {
              setTableData((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: newStatus as Status } : p)));
              updatePost(post.id, { status: newStatus as Status });
            }}
          />
        );
      },
    },
    {
      id: "preview",
      accessorKey: "blocks",
      filterFn: previewFilterFn,
      header: () => (
        <div className="flex items-center gap-[6px] text-black text-[13px] font-medium leading-[16px]">
          <Image src={`/images/columns/preview.svg`} alt="preview" width={14} height={14} />
          {columnNames["preview"] || "Preview"}
        </div>
      ),
      minSize: 90,
      enableSorting: false,
      cell: ({ row, getValue, table, column }: any) => {
        return previewCellFn({ row });
      },
    },
    {
      id: "caption",
      accessorKey: "caption",
      header: () => (
        <div className="flex items-center w-full text-black gap-[6px] text-[13px] font-medium leading-[16px]">
          <Image src={`/images/columns/caption.svg`} alt="caption" width={14} height={14} />
          <span className="text-[13px] leading-[16px]">{columnNames["caption"] || "Caption"}</span>
          <div className="ml-auto flex items-center gap-2">
            {renderPlatformsForHeader(availablePlatforms, "sm")}
            <div data-col-interactive>
              <Switch
                checked={!captionLocked}
                onCheckedChange={(checked) => setCaptionLocked(!checked)}
                className="h-3.5 w-6 data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3"
                title={captionLocked ? "Unlock - customise per social" : "Lock"}
              />
            </div>
          </div>
        </div>
      ),
      minSize: 200,
      size: 220,
      cell: ({ row, isFocused, isEditing, exitEdit, enterEdit }: FocusCellContext<Post>) => {
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
              // Handled by parent via onOpen in table row index header
            }}
            onCaptionChange={(newCaptionText) => {
              const newCaptionData = { ...post.caption };
              const platform = selectedPlatform ?? post.platforms[0];
              if (captionLocked || post.caption.synced) {
                newCaptionData.default = newCaptionText;
              } else if (platform) {
                if (!newCaptionData.perPlatform) newCaptionData.perPlatform = {} as any;
                (newCaptionData.perPlatform as any)[platform] = newCaptionText;
              }

              const updates: Partial<Post> = { caption: newCaptionData };
              const hasNonEmptyCaption = newCaptionText && newCaptionText.trim() !== "";
              const hasBlocks = post.blocks.length > 0;
              const isDraftStatus = post.status === "Draft";
              if (hasNonEmptyCaption && hasBlocks && isDraftStatus) {
                updates.status = "Pending Approval";
              }
              updatePost(post.id, updates);
            }}
          />
        );
      },
    },
    {
      id: "platforms",
      accessorKey: "pages",
      header: () => (
        <div className="flex items-center gap-[6px] text-black text-[13px] font-medium leading-[16px]">
          <Image src={`/images/columns/socials.svg`} alt="socials" width={14} height={14} />
          {columnNames["platforms"] || "Socials"}
        </div>
      ),
      minSize: 112,
      filterFn: platformsFilterFn,
      sortingFn: platformsSortingFn,
      cell: ({ row, isFocused, isEditing, enterEdit, exitEdit }: FocusCellContext<Post>) => {
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
              setTableData((prev) => prev.map((p) => (p.id === post.id ? { ...p, pages: newPageIds } : p)));
              updatePost(post.id, { pages: newPageIds });
            }}
          />
        );
      },
    },
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
      minSize: 124,
      cell: ({ row, isFocused, isEditing, enterEdit, exitEdit }: FocusCellContext<Post>) => {
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
              setTableData((prev) => prev.map((p) => (p.id === post.id ? { ...p, format: fmt as ContentFormat } : p)));
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
              setTableData((prev) => prev.map((p) => (p.id === post.id ? { ...p, month: newMonth } : p)));
              updatePost(post.id, { month: newMonth });
            }}
          />
        );
      },
    },
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
        const allowed = ["Pending Approval", "Revised", "Needs Revisions", "Approved"].includes(post.status);
        const content = (
          <div
            className={cn(
              "inline-flex items-center w-full h-full overflow-hidden px-[8px] py-[6px]",
              allowed ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            )}
          >
            <div className="flex items-center flex-nowrap min-w-0">
              <div className="flex-shrink-0">
                <div
                  className="flex items-center rounded-[4px] px-[8px] py-[6px] gap-[4px]"
                  style={{ boxShadow: "0px 0px 0px 1px #D3D3D3, 0px 1px 1px 0px rgba(0, 0, 0, 0.05), 0px 4px 6px 0px rgba(34, 42, 53, 0.04)" }}
                  onClick={() => allowed && onRequestChanges(post)}
                >
                  <Image src={`/images/columns/request.svg`} alt="revision" width={14} height={14} />
                  <span className="text-xs text-black font-medium leading-[14px]">Request changes</span>
                </div>
              </div>
            </div>
          </div>
        );
        return content;
      },
    },
    {
      id: "approve",
      filterFn: approveFilterFn,
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
      size: 150,
      enableSorting: false,
      enableGrouping: false,
      cell: ({ row, isFocused, isEditing, enterEdit, exitEdit }: FocusCellContext<Post>) => {
        const post = row.original;
        const selectedPages: SocialPage[] = (socialPages || []).filter((page: SocialPage) => post.pages.includes(page.id));
        const derivedPlatforms: Platform[] = selectedPages.map((page) => page.platform);
        return (
          <SettingsEditCell
            value={post.settings as any}
            platforms={derivedPlatforms}
            isFocused={isFocused}
            isEditing={isEditing}
            enterEdit={enterEdit}
            exitEdit={exitEdit}
            onChange={(newSettings) => {
              setTableData((prev) => prev.map((p) => (p.id === post.id ? { ...p, settings: newSettings } : p)));
              updatePost(post.id, { settings: newSettings } as any);
            }}
          />
        );
      },
    },
    {
      id: "publishDate",
      accessorKey: "publishDate",
      filterFn: publishDateFilterFn,
      header: () => (
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-[6px] text-black text-[13px] font-medium leading-[16px]">
            <Image src={`/images/columns/post-time.svg`} alt="Publish Date" width={14} height={14} />
            {"Post Time"}
          </div>
          <div data-col-interactive>
            <Switch
              checked={!!boardRules?.autoSchedule}
              onCheckedChange={(checked) => onToggleAutoSchedule(!!checked)}
              className="h-3.5 w-6 data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3"
              icon={
                <span className="flex items-center justify-center w-full h-full">
                  <img
                    src="/images/boards/stars-01.svg"
                    alt="star"
                    className="w-2.5 h-2.5"
                    style={{ filter: boardRules?.autoSchedule ? undefined : "grayscale(2) brightness(0.85)" }}
                  />
                </span>
              }
            />
          </div>
        </div>
      ),
      minSize: 184,
      size: 230,
      enableSorting: false,
      enableGrouping: true,
      getGroupingValue: (row) => {
        return formatYearMonth(row.publishDate || undefined);
      },
      cell: ({ row }) => {
        const post = row.original;
        return (
          <PublishDateCell
            post={post}
            allPosts={allPosts}
            updatePost={(id, data) => updatePost(id, data)}
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

  return baseColumns;
}


