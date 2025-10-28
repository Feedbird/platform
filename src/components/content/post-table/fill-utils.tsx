import * as React from "react";
import { Post } from "@/lib/store";

/**
 * Type definition for fill drag operation data
 */
export interface FillDragData {
  value: string | string[] | Post["caption"] | number;
  startIndex: number;
  columnId: string;
}

/**
 * Fill utility functions for handling drag-to-fill operations
 */
export class FillUtils {
  /**
   * Checks if a row index is the fill source (start of drag)
   */
  static isFillSource(fillDragRange: [number, number] | null, idx: number): boolean {
    return !!fillDragRange && idx === fillDragRange[0];
  }

  /**
   * Checks if a row index is the fill target (end of drag)
   */
  static isFillTarget(fillDragRange: [number, number] | null, idx: number): boolean {
    return !!fillDragRange && idx === fillDragRange[1];
  }

  /**
   * Handles mouse move during fill drag operation
   */
  static handleFillMouseMove(
    e: MouseEvent,
    fillDragRef: React.MutableRefObject<FillDragData | null>,
    setFillDragRange: React.Dispatch<React.SetStateAction<[number, number] | null>>
  ): void {
    const info = fillDragRef.current;
    if (!info) return;

    const rowEl = (e.target as HTMLElement).closest("tr");
    const idxStr = rowEl?.getAttribute("data-rowkey");
    if (!idxStr) return;
    const hoverIdx = parseInt(idxStr, 10);
    if (isNaN(hoverIdx)) return;

    const { startIndex } = info;
    setFillDragRange([
      Math.min(startIndex, hoverIdx),
      Math.max(startIndex, hoverIdx),
    ]);
  }

  /**
   * Finishes the fill drag operation and applies changes
   */
  static finishFillDrag(
    e: MouseEvent,
    fillDragRef: React.MutableRefObject<FillDragData | null>,
    tableData: Post[],
    setTableData: React.Dispatch<React.SetStateAction<Post[]>>,
    updatePost: (postId: string, data: Partial<Post>) => void,
    setFillDragRange: React.Dispatch<React.SetStateAction<[number, number] | null>>,
    setFillDragColumn: React.Dispatch<React.SetStateAction<string | null>>,
    finishFillDrag: (e: MouseEvent) => void,
    handleFillMouseMove: (e: MouseEvent) => void
  ): void {
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
        if (columnId === "month") {
          return { ...p, month: value as number };
        }
        if (columnId === "caption") {
          return { ...p, caption: value as Post["caption"] };
        }
        if (columnId === "platforms") {
          return { ...p, pages: value as string[] };
        }
        if (columnId === "format") {
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
        if (columnId === "month") {
          updatePost(p.id, { month: value as number });
        } else if (columnId === "caption") {
          updatePost(p.id, { caption: value as Post["caption"] });
        } else if (columnId === "platforms") {
          updatePost(p.id, { pages: value as string[] });
        } else if (columnId === "format") {
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
  }

  /**
   * Starts fill drag operation for month column
   */
  static handleFillStartMonth(
    value: number,
    startIdx: number,
    fillDragRef: React.MutableRefObject<FillDragData | null>,
    setFillDragColumn: React.Dispatch<React.SetStateAction<string | null>>,
    setFillDragRange: React.Dispatch<React.SetStateAction<[number, number] | null>>,
    finishFillDrag: (e: MouseEvent) => void,
    handleFillMouseMove: (e: MouseEvent) => void
  ): void {
    fillDragRef.current = { value, startIndex: startIdx, columnId: "month" };
    setFillDragColumn("month");
    // Disable text selection while dragging
    document.body.style.userSelect = "none";
    document.addEventListener("mouseup", finishFillDrag);
    document.addEventListener("mousemove", handleFillMouseMove);
    setFillDragRange([startIdx, startIdx]);
  }

  /**
   * Starts fill drag operation for caption column
   */
  static handleFillStartCaption(
    value: Post["caption"],
    startIdx: number,
    fillDragRef: React.MutableRefObject<FillDragData | null>,
    setFillDragColumn: React.Dispatch<React.SetStateAction<string | null>>,
    setFillDragRange: React.Dispatch<React.SetStateAction<[number, number] | null>>,
    finishFillDrag: (e: MouseEvent) => void,
    handleFillMouseMove: (e: MouseEvent) => void
  ): void {
    fillDragRef.current = { value, startIndex: startIdx, columnId: "caption" };
    setFillDragColumn("caption");
    document.body.style.userSelect = "none";
    document.addEventListener("mouseup", finishFillDrag);
    document.addEventListener("mousemove", handleFillMouseMove);
    setFillDragRange([startIdx, startIdx]);
  }

  /**
   * Starts fill drag operation for pages/platforms column
   */
  static handleFillStartPages(
    value: string[],
    startIdx: number,
    fillDragRef: React.MutableRefObject<FillDragData | null>,
    setFillDragColumn: React.Dispatch<React.SetStateAction<string | null>>,
    setFillDragRange: React.Dispatch<React.SetStateAction<[number, number] | null>>,
    finishFillDrag: (e: MouseEvent) => void,
    handleFillMouseMove: (e: MouseEvent) => void
  ): void {
    fillDragRef.current = {
      value,
      startIndex: startIdx,
      columnId: "platforms",
    };
    setFillDragColumn("platforms");
    document.body.style.userSelect = "none";
    document.addEventListener("mouseup", finishFillDrag);
    document.addEventListener("mousemove", handleFillMouseMove);
    setFillDragRange([startIdx, startIdx]);
  }

  /**
   * Starts fill drag operation for format column
   */
  static handleFillStartFormat(
    value: string,
    startIdx: number,
    fillDragRef: React.MutableRefObject<FillDragData | null>,
    setFillDragColumn: React.Dispatch<React.SetStateAction<string | null>>,
    setFillDragRange: React.Dispatch<React.SetStateAction<[number, number] | null>>,
    finishFillDrag: (e: MouseEvent) => void,
    handleFillMouseMove: (e: MouseEvent) => void
  ): void {
    fillDragRef.current = { value, startIndex: startIdx, columnId: "format" };
    setFillDragColumn("format");
    document.body.style.userSelect = "none";
    document.addEventListener("mouseup", finishFillDrag);
    document.addEventListener("mousemove", handleFillMouseMove);
    setFillDragRange([startIdx, startIdx]);
  }

  /**
   * Cleanup function for fill drag operations
   */
  static cleanupFillDrag(
    finishFillDrag: (e: MouseEvent) => void,
    handleFillMouseMove: (e: MouseEvent) => void
  ): void {
    document.body.style.userSelect = "";
    document.removeEventListener("mouseup", finishFillDrag);
    document.removeEventListener("mousemove", handleFillMouseMove);
  }
}

/**
 * React hooks for fill drag operations
 */
export function useFillDrag(
  tableData: Post[],
  setTableData: React.Dispatch<React.SetStateAction<Post[]>>,
  updatePost: (postId: string, data: Partial<Post>) => void
) {
  const [fillDragRange, setFillDragRange] = React.useState<[number, number] | null>(null);
  const [fillDragColumn, setFillDragColumn] = React.useState<string | null>(null);
  const fillDragRef = React.useRef<FillDragData | null>(null);

  const handleFillMouseMove = React.useCallback((e: MouseEvent) => {
    FillUtils.handleFillMouseMove(e, fillDragRef, setFillDragRange);
  }, []);

  const finishFillDrag = React.useCallback((e: MouseEvent) => {
    FillUtils.finishFillDrag(
      e,
      fillDragRef,
      tableData,
      setTableData,
      updatePost,
      setFillDragRange,
      setFillDragColumn,
      finishFillDrag,
      handleFillMouseMove
    );
  }, [tableData, setTableData, updatePost]);

  const handleFillStartMonth = React.useCallback((value: number, startIdx: number) => {
    FillUtils.handleFillStartMonth(
      value,
      startIdx,
      fillDragRef,
      setFillDragColumn,
      setFillDragRange,
      finishFillDrag,
      handleFillMouseMove
    );
  }, [finishFillDrag, handleFillMouseMove]);

  const handleFillStartCaption = React.useCallback((value: Post["caption"], startIdx: number) => {
    FillUtils.handleFillStartCaption(
      value,
      startIdx,
      fillDragRef,
      setFillDragColumn,
      setFillDragRange,
      finishFillDrag,
      handleFillMouseMove
    );
  }, [finishFillDrag, handleFillMouseMove]);

  const handleFillStartPages = React.useCallback((value: string[], startIdx: number) => {
    FillUtils.handleFillStartPages(
      value,
      startIdx,
      fillDragRef,
      setFillDragColumn,
      setFillDragRange,
      finishFillDrag,
      handleFillMouseMove
    );
  }, [finishFillDrag, handleFillMouseMove]);

  const handleFillStartFormat = React.useCallback((value: string, startIdx: number) => {
    FillUtils.handleFillStartFormat(
      value,
      startIdx,
      fillDragRef,
      setFillDragColumn,
      setFillDragRange,
      finishFillDrag,
      handleFillMouseMove
    );
  }, [finishFillDrag, handleFillMouseMove]);

  const isFillSource = React.useCallback(
    (idx: number) => FillUtils.isFillSource(fillDragRange, idx),
    [fillDragRange]
  );

  const isFillTarget = React.useCallback(
    (idx: number) => FillUtils.isFillTarget(fillDragRange, idx),
    [fillDragRange]
  );

  // Cleanup effect
  React.useEffect(() => {
    return () => {
      FillUtils.cleanupFillDrag(finishFillDrag, handleFillMouseMove);
    };
  }, [finishFillDrag, handleFillMouseMove]);

  return {
    fillDragRange,
    fillDragColumn,
    isFillSource,
    isFillTarget,
    handleFillStartMonth,
    handleFillStartCaption,
    handleFillStartPages,
    handleFillStartFormat,
  };
}
