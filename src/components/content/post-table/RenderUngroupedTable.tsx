import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Table as ReactTableType,
  flexRender,
  Row,
} from "@tanstack/react-table";
import {
  ChevronDown,
  PlusIcon,
} from "lucide-react";
import { cn, RowHeightType } from "@/lib/utils";
import { Post } from "@/lib/store";
import { MemoizedRow } from "./MemoizedRow";

export interface RenderUngroupedTableProps {
  table: ReactTableType<Post>;
  stickyStyles: (id: string, z?: number) => React.CSSProperties | undefined;
  // State and handlers from parent component
  headerMenuOpenFor: string | null;
  setHeaderMenuOpenFor: (value: string | null) => void;
  headerMenuAlign: "start" | "end";
  setHeaderMenuAlign: (value: "start" | "end") => void;
  headerMenuAlignOffset: number;
  setHeaderMenuAlignOffset: (value: number) => void;
  headerMenuSideOffset: number;
  setHeaderMenuSideOffset: (value: number) => void;
  draggingColumnId: string | null;
  resizingColumnId: string | null;
  headerRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  plusHeaderRef: React.RefObject<HTMLTableCellElement | null>;
  isSticky: (colId: string) => boolean;
  handleHeaderMenuAction: (action: string, columnId: string) => void;
  handleOpenAddFieldFromPlus: () => void;
  startColumnMouseDrag: (e: React.MouseEvent, colId: string) => void;
  isDefaultColumn: (columnId: string) => boolean;
  // Row-related props
  columnOrder: string[];
  isFillTarget: (idx: number) => boolean;
  isFillSource: (idx: number) => boolean;
  handleRowClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, row: Row<Post>) => void;
  handleContextMenu: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, row: Row<Post>) => void;
  handleRowDragStart: (e: React.DragEvent, index: number) => void;
  handleRowDrop: (e: React.DragEvent) => void;
  setDragOverIndex: React.Dispatch<React.SetStateAction<number | null>>;
  fillDragColumn: string | null;
  fillDragRange: [number, number] | null;
  rowHeight: RowHeightType;
  isRowDragging: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  setRowIndicatorTop: React.Dispatch<React.SetStateAction<number | null>>;
  // Add row functionality
  isScrollable: boolean;
  handleAddRowUngrouped: () => void;
  // Column management
  userColumns: any[];
  columnNames: Record<string, string>;
  setRenameColumnId: React.Dispatch<React.SetStateAction<string | null>>;
  setRenameValue: React.Dispatch<React.SetStateAction<string>>;
}

const HEADER_MENU_WIDTH_PX = 160;

export function RenderUngroupedTable({
  table,
  stickyStyles,
  headerMenuOpenFor,
  setHeaderMenuOpenFor,
  headerMenuAlign,
  setHeaderMenuAlign,
  headerMenuAlignOffset,
  setHeaderMenuAlignOffset,
  headerMenuSideOffset,
  setHeaderMenuSideOffset,
  draggingColumnId,
  resizingColumnId,
  headerRefs,
  plusHeaderRef,
  isSticky,
  handleHeaderMenuAction,
  handleOpenAddFieldFromPlus,
  startColumnMouseDrag,
  isDefaultColumn,
  columnOrder,
  isFillTarget,
  isFillSource,
  handleRowClick,
  handleContextMenu,
  handleRowDragStart,
  handleRowDrop,
  setDragOverIndex,
  fillDragColumn,
  fillDragRange,
  rowHeight,
  isRowDragging,
  scrollContainerRef,
  setRowIndicatorTop,
  isScrollable,
  handleAddRowUngrouped,
  userColumns,
  columnNames,
  setRenameColumnId,
  setRenameValue,
}: RenderUngroupedTableProps) {
  return (
    <div className="bg-background mr-sm">
      <table
        className="w-full caption-bottom text-sm border-r border-b border-border-primary table-fixed bg-background"
        style={{
          borderCollapse: "separate", // Important for rounded corners
          borderSpacing: 0,
          width: table.getCenterTotalSize() + 100,
        }}
      >
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="bg-[#FBFBFB]">
              {hg.headers.map((header) => {
                if (header.isPlaceholder) return null;
                const canDrag =
                  header.column.id !== "rowIndex" &&
                  header.column.id !== "drag";
                const sortStatus = header.column.getIsSorted();

                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "group relative align-middle text-left border-r last:border-r-0 px-2",
                      isSticky(header.id) && "bg-[#FBFBFB]",
                      draggingColumnId === header.id && "bg-[#F3F4F6]",
                      header.id === "status" && "sticky-status-shadow"
                    )}
                    style={{
                      width: header.getSize(),
                      ...stickyStyles(header.id, 9),
                    }}
                    ref={(el) => {
                      headerRefs.current[header.id] = el as HTMLElement;
                    }}
                    colSpan={header.colSpan}
                  >
                    <div
                      className="flex cursor-pointer items-center justify-between gap-2 h-full w-full"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        // Use the same trigger element as the chevron down for consistent positioning
                        const triggerEl =
                          (e.currentTarget.querySelector(
                            "[data-col-menu-trigger]"
                          ) as HTMLElement) ||
                          (e.currentTarget as HTMLElement);
                        const th = (triggerEl.closest("th") ||
                          triggerEl.closest(
                            'div[role="columnheader"]'
                          )) as HTMLElement | null;
                        if (!th) return;
                        const colRect = th.getBoundingClientRect();
                        const trigRect = triggerEl.getBoundingClientRect();
                        const desiredLeft =
                          colRect.width <= HEADER_MENU_WIDTH_PX
                            ? colRect.left
                            : colRect.right - HEADER_MENU_WIDTH_PX;
                        setHeaderMenuAlign("start");
                        setHeaderMenuAlignOffset(
                          Math.round(desiredLeft - trigRect.left)
                        );
                        setHeaderMenuSideOffset(
                          Math.round(colRect.bottom - trigRect.bottom)
                        );
                        setHeaderMenuOpenFor(header.id);
                      }}
                      onDoubleClick={() => {
                        setRenameColumnId(header.id);
                        // For user columns, use the label; for default columns, use columnNames
                        const userColumn = userColumns.find(
                          (col) => col.id === header.id
                        );
                        if (userColumn) {
                          setRenameValue(userColumn.label);
                        } else {
                          setRenameValue(columnNames[header.id] || header.id);
                        }
                      }}
                      draggable={canDrag}
                      onMouseDown={(e) => {
                        if (!canDrag) return;
                        if (e.button !== 0) return; // left click only
                        if ((e as any).detail >= 2) return; // ignore double-clicks
                        const target = e.target as HTMLElement;
                        if (target.closest("[data-col-menu-trigger]")) return; // avoid drag when clicking chevron
                        if (target.closest("[data-col-interactive]")) return; // avoid drag when clicking interactive controls
                        startColumnMouseDrag(e, header.column.id);
                      }}
                    >
                      <div className="flex items-center gap-1 text-black w-full">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                      <DropdownMenu
                        open={headerMenuOpenFor === header.id}
                        onOpenChange={(o) =>
                          setHeaderMenuOpenFor(o ? header.id : null)
                        }
                      >
                        <DropdownMenuTrigger asChild>
                          <div
                            data-col-menu-trigger
                            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            aria-label="Column options"
                            onPointerDown={(e) => {
                              const triggerEl =
                                e.currentTarget as HTMLElement;
                              const th = (triggerEl.closest("th") ||
                                triggerEl.closest(
                                  'div[role="columnheader"]'
                                )) as HTMLElement | null;
                              if (!th) return;
                              const colRect = th.getBoundingClientRect();
                              const trigRect =
                                triggerEl.getBoundingClientRect();
                              const desiredLeft =
                                colRect.width <= HEADER_MENU_WIDTH_PX
                                  ? colRect.left
                                  : colRect.right - HEADER_MENU_WIDTH_PX;
                              setHeaderMenuAlign("start");
                              setHeaderMenuAlignOffset(
                                Math.round(desiredLeft - trigRect.left)
                              );
                              setHeaderMenuSideOffset(
                                Math.round(colRect.bottom - trigRect.bottom)
                              );
                            }}
                          >
                            <ChevronDown className="h-4 w-4 text-[#475467]" />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          side="bottom"
                          align={headerMenuAlign}
                          sideOffset={headerMenuSideOffset}
                          alignOffset={headerMenuAlignOffset}
                          className="w-40 text-sm"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              !isDefaultColumn(header.id) &&
                              handleHeaderMenuAction("edit", header.id)
                            }
                            className={`text-sm font-medium ${
                              isDefaultColumn(header.id)
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-black cursor-pointer"
                            }`}
                            disabled={isDefaultColumn(header.id)}
                          >
                            <img
                              src="/images/boards/rename.svg"
                              alt="Edit field"
                              className="h-4 w-4"
                            />
                            Edit field
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              !isDefaultColumn(header.id) &&
                              handleHeaderMenuAction("duplicate", header.id)
                            }
                            className={`text-sm font-medium ${
                              isDefaultColumn(header.id)
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-black cursor-pointer"
                            }`}
                            disabled={isDefaultColumn(header.id)}
                          >
                            <img
                              src="/images/boards/duplicate.svg"
                              alt="Duplicate field"
                              className="h-4 w-4"
                            />
                            Duplicate field
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleHeaderMenuAction("insert-left", header.id)
                            }
                            className="text-black text-sm font-medium cursor-pointer"
                          >
                            <img
                              src="/images/boards/arrow-left.svg"
                              alt="Insert left"
                              className="h-4 w-4"
                            />
                            Insert left
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleHeaderMenuAction(
                                "insert-right",
                                header.id
                              )
                            }
                            className="text-black text-sm font-medium cursor-pointer"
                          >
                            <img
                              src="/images/boards/arrow-right.svg"
                              alt="Insert right"
                              className="h-4 w-4"
                            />
                            Insert right
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleHeaderMenuAction("sort-asc", header.id)
                            }
                            className="text-black text-sm font-medium cursor-pointer"
                          >
                            <img
                              src="/images/boards/sort-down.svg"
                              alt="Sort A - Z"
                              className="h-4 w-4"
                            />
                            Sort A - Z
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleHeaderMenuAction("sort-desc", header.id)
                            }
                            className="text-black text-sm font-medium cursor-pointer"
                          >
                            <img
                              src="/images/boards/sort-up.svg"
                              alt="Sort Z - A"
                              className="h-4 w-4"
                            />
                            Sort Z - A
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-elementStroke mx-2" />
                          <DropdownMenuItem
                            onClick={() =>
                              handleHeaderMenuAction("hide", header.id)
                            }
                            className="text-black text-sm font-medium cursor-pointer"
                          >
                            <img
                              src="/images/boards/hide.svg"
                              alt="Hide field"
                              className="h-4 w-4"
                            />
                            Hide field
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              !isDefaultColumn(header.id) &&
                              handleHeaderMenuAction("delete", header.id)
                            }
                            className={`text-sm font-medium ${
                              isDefaultColumn(header.id)
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-black cursor-pointer"
                            }`}
                            disabled={isDefaultColumn(header.id)}
                          >
                            <img
                              src="/images/boards/delete.svg"
                              alt="Delete field"
                              className="h-4 w-4"
                            />
                            Delete field
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* resize handle */}
                    {header.column.getCanResize() && (
                      <div
                        onDoubleClick={() => header.column.resetSize()}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute top-0 h-full w-[3px] cursor-col-resize -right-[3px] z-10 transition-colors duration-150 ${
                          resizingColumnId === header.column.id
                            ? "bg-main resize-handle-active"
                            : "hover:bg-main"
                        }`}
                      />
                    )}
                  </TableHead>
                );
              })}
              {/* ▶ plus column on the right (ungrouped) */}
              <TableHead
                ref={plusHeaderRef as any}
                className="border-b border-elementStroke"
                style={{ width: 100, padding: 0 }}
              >
                <div className="flex items-center justify-center h-full">
                  <button
                    aria-label="Add field"
                    className="p-0.5 rounded hover:bg-[#F4F5F6] cursor-pointer"
                    onClick={handleOpenAddFieldFromPlus}
                  >
                    <PlusIcon className="w-4 h-4 text-[#5C5E63]" />
                  </button>
                </div>
              </TableHead>
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 &&
            table
              .getRowModel()
              .rows.map((row) => (
            <MemoizedRow
                  key={`${row.id}-${columnOrder.join("-")}`}
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
              draggingColumnId={draggingColumnId}
              isRowDragging={isRowDragging}
              scrollContainerRef={scrollContainerRef}
              setRowIndicatorTop={setRowIndicatorTop}
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

                const stickyWidth =
                  firstCol.getSize() +
                  secondCol.getSize() +
                  thirdCol.getSize();
                const restOfCols = visibleColumns.slice(3);

                return (
                  <>
                    <TableCell
                      colSpan={3}
                      className="px-3 py-2.5 bg-white border-t border-[#EAE9E9]"
                      style={{
                        ...stickyStyles("drag", 10),
                        width: stickyWidth,
                      }}
                    >
                      <button
                        className="p-0 m-0 font-medium text-sm cursor-pointer flex flex-row leading-[16px] items-center gap-2"
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
                          "px-3 py-2.5 bg-white border-t border-[#EAE9E9]"
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
