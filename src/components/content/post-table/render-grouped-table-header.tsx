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
  TableRow,
  TableHead,
} from "@/components/ui/table";
import {
  Table as ReactTableType,
  flexRender,
} from "@tanstack/react-table";
import {
  ChevronDown,
  PlusIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Post } from "@/lib/store";

export interface RenderGroupedTableHeaderProps {
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
}

const HEADER_MENU_WIDTH_PX = 160;

export function RenderGroupedTableHeader({
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
}: RenderGroupedTableHeaderProps) {
  return (
    <TableHeader className="sticky top-0 z-[13] bg-[#FBFBFB]">
      {table.getHeaderGroups().map((hg) => (
        <TableRow key={hg.id} className="bg-[#FBFBFB]">
          {/* ◀ phantom on the left */}
          <TableHead
            className="border-b border-[#E6E4E2] bg-[#FBFBFB]"
            style={{ width: 14, padding: 0 }}
          />

          {hg.headers.map((h, index) =>
            h.isPlaceholder ? null : (
              <TableHead
                key={h.id}
                className={cn(
                  "group relative text-left border-b border-[#E6E4E2] px-2 py-0",
                  index !== 0 && "border-r",
                  isSticky(h.column.id) && "bg-[#FBFBFB]",
                  draggingColumnId === h.column.id && "bg-[#F3F4F6]",
                  h.id === "status" && "sticky-status-shadow"
                )}
                ref={(el) => {
                  headerRefs.current[h.column.id] = el as HTMLElement;
                }}
                style={{
                  width: h.getSize(),
                  ...stickyStyles(h.column.id, 10),
                }}
              >
                {(() => {
                  const canDrag =
                    h.column.id !== "rowIndex" && h.column.id !== "drag";
                  const sortStatus = h.column.getIsSorted();
                  const headerContent = flexRender(
                    h.column.columnDef.header,
                    h.getContext()
                  );

                  return (
                    <>
                      <div
                        className="flex select-none items-center justify-between gap-2 h-full"
                        draggable={canDrag}
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
                          setHeaderMenuOpenFor(h.id);
                        }}
                        onMouseDown={(e) => {
                          if (!canDrag) return;
                          if (e.button !== 0) return; // left click only
                          if ((e as any).detail >= 2) return; // ignore double-clicks
                          const target = e.target as HTMLElement;
                          if (target.closest("[data-col-menu-trigger]"))
                            return; // don't start drag when clicking menu trigger
                          if (target.closest("[data-col-interactive]"))
                            return; // don't start drag when clicking interactive controls
                          startColumnMouseDrag(e, h.column.id);
                        }}
                      >
                        <div className="flex items-center gap-1 text-black w-full">
                          {headerContent}
                        </div>
                        <DropdownMenu
                          open={headerMenuOpenFor === h.id}
                          onOpenChange={(o) =>
                            setHeaderMenuOpenFor(o ? h.id : null)
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
                                !isDefaultColumn(h.id) &&
                                handleHeaderMenuAction("edit", h.id)
                              }
                              className={`text-sm font-medium ${
                                isDefaultColumn(h.id)
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-black cursor-pointer"
                              }`}
                              disabled={isDefaultColumn(h.id)}
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
                                !isDefaultColumn(h.id) &&
                                handleHeaderMenuAction("duplicate", h.id)
                              }
                              className={`text-sm font-medium ${
                                isDefaultColumn(h.id)
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-black cursor-pointer"
                              }`}
                              disabled={isDefaultColumn(h.id)}
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
                                handleHeaderMenuAction("insert-left", h.id)
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
                                handleHeaderMenuAction("insert-right", h.id)
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
                                handleHeaderMenuAction("sort-asc", h.id)
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
                                handleHeaderMenuAction("sort-desc", h.id)
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
                                handleHeaderMenuAction("hide", h.id)
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
                                !isDefaultColumn(h.id) &&
                                handleHeaderMenuAction("delete", h.id)
                              }
                              className={`text-sm font-medium ${
                                isDefaultColumn(h.id)
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-black cursor-pointer"
                              }`}
                              disabled={isDefaultColumn(h.id)}
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

                      {/* Resizer Handle */}
                      {h.column.getCanResize() && (
                        <div
                          onDoubleClick={() => h.column.resetSize()}
                          onMouseDown={h.getResizeHandler()}
                          onTouchStart={h.getResizeHandler()}
                          className={`absolute top-0 h-full w-[3px] cursor-col-resize -right-[3px] z-10 transition-colors duration-150 ${
                            resizingColumnId === h.column.id
                              ? "bg-main resize-handle-active"
                              : "hover:bg-main"
                          }`}
                        />
                      )}
                    </>
                  );
                })()}
              </TableHead>
            )
          )}

          {/* ▶ plus column on the right */}
          <TableHead
            ref={plusHeaderRef as any}
            className="border-b border-[#E6E4E2]"
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
  );
}
