"use client";

import React from "react";
import { Post, BoardGroupData, BoardRules } from "@/lib/store";
import { GroupDivider } from "./group-divider";
import { MemoizedRow } from "./memoized-row";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableCell, TableRow, TableBody } from "@/components/ui/table";
import { FocusCell } from "./focus-provider";
import { Cell, Column, flexRender, Row } from "@tanstack/react-table";
import { RenderGroupedTableHeaderProps } from "./render-grouped-table-header";

interface RenderGroupedTableProps {
  table: any; // Table instance from react-table
  grouping: string[];
  userColumns: any[];
  columnOrder: string[];
  getFinalGroupRows: (rows: any[], expanded: any, rowComparator?: any) => any[];
  rowComparator?: (a: any, b: any) => number;
  isSticky: (columnId: string) => boolean;
  stickyStyles: (colId: string, zIndex?: number) => React.CSSProperties | undefined;
  flatGroupExpanded: Record<string, boolean>;
  setFlatGroupExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  currentBoard: any;
  boardRules: BoardRules;
  handleOpenGroupFeedback: (groupData: BoardGroupData, month: number) => void;
  renderGroupValue: (columnId: string, value: any) => React.ReactNode;
  getRowHeightPixels: (rowHeight: "Small" | "Medium" | "Large" | "X-Large" | "XX-Large") => number;
  rowHeight: string;
  handleRowClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, row: any) => void;
  handleContextMenu: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, row: any) => void;
  handleRowDragStart: (e: React.DragEvent, index: number) => void;
  handleRowDrop: (e: React.DragEvent) => void;
  setDragOverIndex: React.Dispatch<React.SetStateAction<number | null>>;
  draggingColumnId: string | null;
  fillDragRange: [number, number] | null;
  fillDragColumn: string | null;
  handleAddRowForGroup: (groupValues: any) => void;
  PlusIcon: React.ComponentType<{ size?: number }>;
  ChevronUpIcon: React.ComponentType;
  ChevronDownIcon: React.ComponentType;
  // Props for RenderGroupedTableHeader
  headerMenuOpenFor: string | null;
  setHeaderMenuOpenFor: (value: string | null) => void;
  headerMenuAlign: "start" | "end";
  setHeaderMenuAlign: (value: "start" | "end") => void;
  headerMenuAlignOffset: number;
  setHeaderMenuAlignOffset: (value: number) => void;
  headerMenuSideOffset: number;
  setHeaderMenuSideOffset: (value: number) => void;
  resizingColumnId: string | null;
  headerRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  plusHeaderRef: React.RefObject<HTMLTableCellElement | null>;
  handleHeaderMenuAction: (action: string, columnId: string) => void;
  handleOpenAddFieldFromPlus: () => void;
  startColumnMouseDrag: (e: React.MouseEvent, colId: string) => void;
  isDefaultColumn: (columnId: string) => boolean;
  RenderGroupedTableHeader: React.ComponentType<RenderGroupedTableHeaderProps>;
}

export function RenderGroupedTable({
  table,
  grouping,
  userColumns,
  columnOrder,
  getFinalGroupRows,
  rowComparator,
  isSticky,
  stickyStyles,
  flatGroupExpanded,
  setFlatGroupExpanded,
  currentBoard,
  boardRules,
  handleOpenGroupFeedback,
  renderGroupValue,
  getRowHeightPixels,
  rowHeight,
  handleRowClick,
  handleContextMenu,
  handleRowDragStart,
  handleRowDrop,
  setDragOverIndex,
  draggingColumnId,
  fillDragRange,
  fillDragColumn,
  handleAddRowForGroup,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  // Props for RenderGroupedTableHeader
  headerMenuOpenFor,
  setHeaderMenuOpenFor,
  headerMenuAlign,
  setHeaderMenuAlign,
  headerMenuAlignOffset,
  setHeaderMenuAlignOffset,
  headerMenuSideOffset,
  setHeaderMenuSideOffset,
  resizingColumnId,
  headerRefs,
  plusHeaderRef,
  handleHeaderMenuAction,
  handleOpenAddFieldFromPlus,
  startColumnMouseDrag,
  isDefaultColumn,
  RenderGroupedTableHeader,
}: RenderGroupedTableProps) {
  const groups = getFinalGroupRows(
    table.getGroupedRowModel().rows,
    {},
    rowComparator
  );
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
        key={`table-${userColumns.length}-${userColumns
          .map((c) => c.id)
          .join("-")}-${columnOrder.join("-")}`}
        data-grouped="true"
        className="
          w-full caption-bottom text-sm
          border-r border-border-primary
          table-fixed bg-background
        "
        style={{ borderCollapse: "separate", borderSpacing: 0 }}
      >
        {/* ─── Shared header ───────────────────────────────────── */}
        <RenderGroupedTableHeader
          key={`header-${userColumns.length}-${userColumns
            .map((c) => c.id)
            .join("-")}-${columnOrder.join("-")}`}
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
          handleOpenAddFieldFromPlus={handleOpenAddFieldFromPlus}
          startColumnMouseDrag={startColumnMouseDrag}
          isDefaultColumn={isDefaultColumn}
        />

        {groups.length > 0 && (
          <>
            {/* ─── Gap row between header and first group ─────────── */}
            <tbody>
              <tr>
                <td
                  colSpan={colSpan + 2}
                  style={{
                    height: 10,
                    background: "#F8F8F8",
                    border: "none",
                  }}
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
                  <GroupDivider
                    rowCount={group.rowCount}
                    groupPosts={group.leafRows.map((row: Row<Post>) => row.original)}
                    groupData={
                      currentBoard?.groupData?.find(
                        (gd: BoardGroupData) => gd.month === group.groupValues.month
                      ) as BoardGroupData
                    }
                    boardRules={boardRules}
                    isGroupedByMonth={grouping.includes("month")}
                    onOpenGroupFeedback={(groupData) =>
                      handleOpenGroupFeedback(
                        groupData,
                        group.groupValues.month as number
                      )
                    }
                    month={group.groupValues.month}
                    isExpanded={isExpanded}
                    groupKey={key}
                    table={table}
                    isSticky={isSticky}
                    stickyStyles={stickyStyles as (colId: string, zIndex?: number) => React.CSSProperties | undefined}
                    grouping={grouping}
                    getFinalGroupRows={getFinalGroupRows}
                    rowComparator={rowComparator}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-1 py-0 w-6 h-6"
                      onClick={() =>
                        setFlatGroupExpanded((prev) => ({
                          ...prev,
                          [key]: !isExpanded,
                        }))
                      }
                    >
                      {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </Button>

                    {/* labels */}
                    <span className="flex items-center gap-2">
                      {group.groupingColumns.map((c: string, i: number) => (
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
                    group.leafRows.map((row: Row<Post>) => (
                      <TableRow
                        key={row.id}
                        data-rowkey={row.index}
                        style={{ height: `${getRowHeightPixels(rowHeight as "Small" | "Medium" | "Large" | "X-Large" | "XX-Large")}px` }}
                        className={cn(
                          "group hover:bg-[#F9FAFB]",
                          row.getIsSelected() && "bg-[#EBF5FF]"
                        )}
                        onMouseDownCapture={(e) => handleRowClick(e, row)}
                        onContextMenu={(e) => handleContextMenu(e, row)}
                        onDragStart={(e) => handleRowDragStart(e, row.index)}
                        onDragOver={(e) => {
                          e.preventDefault();

                          if (grouping.length > 0) {
                            const groups = getFinalGroupRows(
                              table.getGroupedRowModel().rows,
                              {},
                              rowComparator
                            );
                            const allLeafRows = groups.flatMap(
                              (group) => group.leafRows
                            );

                            // Get the source row from drag data
                            const fromIndex = parseInt(
                              e.dataTransfer.getData("text/plain"),
                              10
                            );
                            if (
                              !Number.isNaN(fromIndex) &&
                              fromIndex !== row.index
                            ) {
                              const sourceRow = allLeafRows[fromIndex];
                              const targetRow = row;

                              if (sourceRow && targetRow) {
                                // Find source and target groups
                                const sourceGroup = groups.find((group) =>
                                  group.leafRows.some(
                                    (r: Row<Post>) => r.id === sourceRow.id
                                  )
                                );
                                const targetGroup = groups.find((group) =>
                                  group.leafRows.some(
                                    (r: Row<Post>) => r.id === targetRow.id
                                  )
                                );

                                // Check if groups are different
                                if (
                                  sourceGroup &&
                                  targetGroup &&
                                  sourceGroup !== targetGroup
                                ) {
                                  // Different groups - prevent dropping
                                  e.dataTransfer.dropEffect = "none";
                                  return;
                                }

                                // Check if target group is collapsed
                                if (targetGroup) {
                                  const groupKey = JSON.stringify(
                                    targetGroup.groupValues
                                  );
                                  const isGroupExpanded =
                                    !!flatGroupExpanded[groupKey];
                                  if (!isGroupExpanded) {
                                    e.dataTransfer.dropEffect = "none";
                                    return; // Don't allow dropping in collapsed groups
                                  }
                                }
                              }
                            }
                          }

                          setDragOverIndex(row.index);
                        }}
                        onDrop={(e) => {
                          handleRowDrop(e);
                        }}
                      >
                        {/* ◀ left phantom */}
                        <TableCell
                          style={{
                            width: 20,
                            padding: 0,
                            border: "none",
                            backgroundColor: "#F8F8F8",
                          }}
                        />

                        {row.getVisibleCells().map((cell: Cell<Post, unknown>, index: number) => (
                          <FocusCell
                            key={cell.id}
                            rowId={row.id}
                            colId={cell.id}
                            singleClickEdit={
                              cell.column.id === "platforms" ||
                              cell.column.id === "format"
                            }
                            className={cn(
                              "text-left",
                              // Grey while dragging this column
                              draggingColumnId === cell.column.id
                                ? "bg-[#F3F4F6]"
                                : isSticky(cell.column.id) &&
                                    (row.getIsSelected()
                                      ? "bg-[#EBF5FF]"
                                      : "bg-white group-hover:bg-[#F9FAFB]"),
                              cell.column.id === "caption"
                                ? "align-top"
                                : "align-middle",
                              "px-0 py-0",
                              index === 0 ? "border-l" : "border-l-0",
                              cell.column.id === "status" &&
                                "sticky-status-shadow",
                              fillDragRange &&
                                fillDragColumn &&
                                cell.column.id === fillDragColumn &&
                                row.index >= fillDragRange[0] &&
                                row.index <= fillDragRange[1] &&
                                "bg-[#EBF5FF]"
                            )}
                            style={{
                              height: "inherit",
                              width: cell.column.getSize(),
                              borderRight: "1px solid #EAE9E9",
                              borderBottom: "1px solid #EAE9E9",
                              ...stickyStyles(cell.column.id, 10),
                            }}
                          >
                            {({
                              isFocused,
                              isEditing,
                              exitEdit,
                              enterEdit,
                            }) =>
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
                          style={{
                            width: 20,
                            padding: 0,
                            border: "none",
                            backgroundColor: "#F8F8F8",
                          }}
                        />
                      </TableRow>
                    ))}

                  {/* "Add new record" row (still inside tbody) */}
                  {isExpanded && (
                    <tr>
                      {/* ◀ left phantom sticky */}
                      <TableCell
                        style={{
                          width: 20,
                          padding: 0,
                          border: "none",
                          backgroundColor: "#F8F8F8",
                        }}
                      />

                      {(() => {
                        const stickyCols = table
                          .getVisibleLeafColumns()
                          .filter((c: Column<Post>) => isSticky(c.id));
                        const nonStickyCols = table
                          .getVisibleLeafColumns()
                          .filter((c: Column<Post>) => !isSticky(c.id));
                        const stickyWidth = stickyCols.reduce(
                          (sum: number, col: Column<Post>) => sum + col.getSize(),
                          0
                        );

                        return (
                          <>
                            <TableCell
                              colSpan={stickyCols.length}
                              className="px-3 py-2.5 bg-white border-l border-t-0 border-r-0 border-b border-[#E6E4E2] rounded-b-[2px]"
                              style={{
                                ...stickyStyles("drag", 3), // Use first sticky col ID
                                borderRadius: "0px 0px 0px 4px",
                                width: stickyWidth,
                              }}
                            >
                              <button
                                className="p-0 m-0 font-medium text-sm flex items-center gap-2 leading-[16px] cursor-pointer"
                                onClick={() =>
                                  handleAddRowForGroup(group.groupValues)
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
          </>
        )}
        {groups.length == 0 && (
            <TableBody>
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
                        className="px-3 py-2.5 bg-white border-l border-t-0 border-r-0 border-b border-[#E6E4E2] rounded-b-[2px]"
                        style={{
                          ...stickyStyles("drag", 3),
                          borderRadius: "0px 0px 0px 4px",
                          width: stickyWidth,
                        }}
                      >
                        <button
                          className="p-0 m-0 font-medium text-sm flex items-center gap-2 leading-[16px] cursor-pointer"
                          onClick={() => handleAddRowForGroup({})}
                        >
                          <PlusIcon size={16} />
                          Add new record
                        </button>
                      </TableCell>
                      <TableCell
                        colSpan={restOfCols.length}
                        className="bg-white border border-l-0 border-t-0 border-[#E6E4E2] rounded-b-[2px]"
                        style={{
                          borderRadius: "0px 0px 4px 0px",
                        }}
                      />
                    </>
                  );
                })()}
              </TableRow>
            </TableBody>
        )}
      </table>
    </div>
  );
}
