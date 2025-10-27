"use client";

import * as React from "react";
import { Row, Table as ReactTableType, CellContext, flexRender } from "@tanstack/react-table";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { RowHeightType, getRowHeightPixels } from "@/lib/utils";
import { Post } from "@/lib/store";
import { FocusCell } from "./focus-provider";
import { useDragHandlers } from "./use-drag-handlers";

type FocusCellContext<T> = CellContext<T, unknown> & {
  isFocused?: boolean;
  isEditing?: boolean;
  enterEdit?: () => void;
  exitEdit?: () => void;
};

export type MemoizedRowProps = {
  row: Row<Post>;
  isSelected: boolean;
  isFillTarget: (idx: number) => boolean;
  isFillSource: (idx: number) => boolean;
  handleRowClick: (
    e: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
    row: Row<Post>
  ) => void;
  handleContextMenu: (
    e: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
    row: Row<Post>
  ) => void;
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
  draggingColumnId: string | null;
  isRowDragging: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  setRowIndicatorTop: React.Dispatch<React.SetStateAction<number | null>>;
};

export const MemoizedRow = React.memo(

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
    draggingColumnId,
    isRowDragging,
    scrollContainerRef,
    setRowIndicatorTop,
  }: MemoizedRowProps) => {
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
        onDrop={(e) => {
          handleRowDrop(e);
        }}
      >
        {row.getVisibleCells().map((cell) => {
          const isColSticky = isSticky(cell.column.id);
          return (
            <FocusCell
              rowId={row.id}
              colId={cell.id}
              key={cell.id}
              singleClickEdit={
                cell.column.id === "platforms" || cell.column.id === "format"
              }
              className={cn(
                "text-left",
                cell.column.id === "caption" ? "align-top" : "align-middle",
                "px-0 py-0",
                "border-t border-elementStroke last:border-b-0",
                draggingColumnId && draggingColumnId === cell.column.id
                  ? "bg-[#F3F4F6]"
                  : isColSticky &&
                      (isSelected
                        ? "bg-[#EBF5FF]"
                        : "bg-white group-hover:bg-[#F9FAFB]"),
                cell.column.id === "status" && "sticky-status-shadow",
                fillDragRange &&
                  fillDragColumn === cell.column.id &&
                  row.index >= (fillDragRange as any)[0] &&
                  row.index <= (fillDragRange as any)[1] &&
                  "bg-[#EBF5FF]"
              )}
              style={{
                height: "inherit",
                borderRight: "1px solid #EAE9E9",
                width: cell.column.getSize(),
                ...stickyStyles(cell.column.id, 10),
              }}
            >
              {({ isFocused, isEditing, exitEdit, enterEdit }) =>
                flexRender(cell.column.columnDef.cell, {
                  ...(cell.getContext() as any),
                  isFocused,
                  isEditing,
                  exitEdit,
                  enterEdit,
                })
              }
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
      prevProps.fillDragRange?.[0] !== nextProps.fillDragRange?.[0] ||
      prevProps.fillDragRange?.[1] !== nextProps.fillDragRange?.[1]
    ) {
      const isPrevInRange =
        prevProps.fillDragRange &&
        prevProps.row.index >= (prevProps.fillDragRange as any)[0] &&
        prevProps.row.index <= (prevProps.fillDragRange as any)[1];
      const isNextInRange =
        nextProps.fillDragRange &&
        nextProps.row.index >= (nextProps.fillDragRange as any)[0] &&
        nextProps.row.index <= (nextProps.fillDragRange as any)[1];
      if (isPrevInRange !== isNextInRange) return false;
    }
    if (prevProps.columnOrder !== nextProps.columnOrder) return false;
    if (prevProps.draggingColumnId !== nextProps.draggingColumnId) return false;
    return true;
  }
);

MemoizedRow.displayName = "MemoizedRow";


