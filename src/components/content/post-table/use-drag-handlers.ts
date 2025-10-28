import * as React from "react";
import { Post } from "@/lib/store";
import { Table } from "@tanstack/react-table";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { Column } from "@tanstack/react-table";
import { buildColumnsPayloadForOrder, normalizeOrder } from "./utils";

/**
 * Interface for drag-related state
 */
export interface DragState {
  // Row drag state
  dragOverIndex: number | null;
  isRowDragging: boolean;
  rowDragIndex: number | null;
  rowDragPos: { x: number; y: number } | null;
  rowDragAngle: number;
  rowDragScale: number;
  rowIndicatorTop: number | null;
  
  // Column drag state
  draggingColumnId: string | null;
  dragOverColumnId: string | null;
  dragInsertAfter: boolean;
  dragOverlayLeft: number | null;
  dragOverlayWidth: number | null;
  dragStartOffsetX: number;
}

/**
 * Interface for drag-related state setters
 */
export interface DragStateSetters {
  setDragOverIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setIsRowDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setRowDragIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setRowDragPos: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  setRowDragAngle: React.Dispatch<React.SetStateAction<number>>;
  setRowDragScale: React.Dispatch<React.SetStateAction<number>>;
  setRowIndicatorTop: React.Dispatch<React.SetStateAction<number | null>>;
  setDraggingColumnId: React.Dispatch<React.SetStateAction<string | null>>;
  setDragOverColumnId: React.Dispatch<React.SetStateAction<string | null>>;
  setDragInsertAfter: React.Dispatch<React.SetStateAction<boolean>>;
  setDragOverlayLeft: React.Dispatch<React.SetStateAction<number | null>>;
  setDragOverlayWidth: React.Dispatch<React.SetStateAction<number | null>>;
  setDragStartOffsetX: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Interface for drag-related refs
 */
export interface DragRefs {
  nativeDragBindingsRef: React.MutableRefObject<{
    attached: boolean;
    containerOver?: (ev: DragEvent) => void;
    containerDrop?: (ev: DragEvent) => void;
    perHeader: Array<{
      el: HTMLElement;
      over: (ev: DragEvent) => void;
      drop: (ev: DragEvent) => void;
    }>;
  } | null>;
  dragEndHandlerRef: React.MutableRefObject<((ev: DragEvent) => void) | null>;
  draggingColumnIdRef: React.MutableRefObject<string | null>;
  dragOverColumnIdRef: React.MutableRefObject<string | null>;
  dragInsertAfterRef: React.MutableRefObject<boolean>;
  dragMouseMoveHandlerRef: React.MutableRefObject<((ev: MouseEvent) => void) | null>;
  dragMouseUpHandlerRef: React.MutableRefObject<((ev: MouseEvent) => void) | null>;
  draggingHeaderElRef: React.MutableRefObject<HTMLElement | null>;
}

/**
 * Interface for drag handlers
 */
export interface DragHandlers {
  // Row drag handlers
  handleRowDragStart: (e: React.DragEvent, fromIndex: number) => void;
  handleRowDrop: (e: React.DragEvent) => void;
  endRowDragOverlay: () => void;
  
  // Column drag handlers
  beginColumnDrag: (colId: string, clientX: number) => void;
  endColumnDrag: () => void;
  finalizeColumnDrag: (ev?: DragEvent) => void;
  startColumnMouseDrag: (e: React.MouseEvent, colId: string) => void;
  updateOverlayForMouseX: (mouseClientX: number) => void;
}

/**
 * Props for the drag handlers hook
 */
export interface UseDragHandlersProps {
  tableData: Post[];
  setTableData: React.Dispatch<React.SetStateAction<Post[]>>;
  grouping: string[];
  scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  headerRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  table: Table<Post>; // TanStack table instance
}

/**
 * Custom hook for managing drag and drop functionality
 */
export function useDragHandlers({
  tableData,
  setTableData,
  grouping,
  scrollContainerRef,
  headerRefs,
  table,
}: UseDragHandlersProps) {
  // Row drag state
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [isRowDragging, setIsRowDragging] = React.useState(false);
  const [rowDragIndex, setRowDragIndex] = React.useState<number | null>(null);
  const [rowDragPos, setRowDragPos] = React.useState<{ x: number; y: number } | null>(null);
  const [rowDragAngle, setRowDragAngle] = React.useState<number>(0);
  const [rowDragScale, setRowDragScale] = React.useState<number>(1);
  const [rowIndicatorTop, setRowIndicatorTop] = React.useState<number | null>(null);
  
  // Column drag state
  const [draggingColumnId, setDraggingColumnId] = React.useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = React.useState<string | null>(null);
  const [dragInsertAfter, setDragInsertAfter] = React.useState<boolean>(false);
  const [dragOverlayLeft, setDragOverlayLeft] = React.useState<number | null>(null);
  const [dragOverlayWidth, setDragOverlayWidth] = React.useState<number | null>(null);
  const [dragStartOffsetX, setDragStartOffsetX] = React.useState<number>(0);

  // Drag refs
  const nativeDragBindingsRef = React.useRef<{
    attached: boolean;
    containerOver?: (ev: DragEvent) => void;
    containerDrop?: (ev: DragEvent) => void;
    perHeader: Array<{
      el: HTMLElement;
      over: (ev: DragEvent) => void;
      drop: (ev: DragEvent) => void;
    }>;
  }>({ attached: false, perHeader: [] });
  const dragEndHandlerRef = React.useRef<((ev: DragEvent) => void) | null>(null);
  const draggingColumnIdRef = React.useRef<string | null>(null);
  const dragOverColumnIdRef = React.useRef<string | null>(null);
  const dragInsertAfterRef = React.useRef<boolean>(false);
  const dragMouseMoveHandlerRef = React.useRef<((ev: MouseEvent) => void) | null>(null);
  const dragMouseUpHandlerRef = React.useRef<((ev: MouseEvent) => void) | null>(null);
  const draggingHeaderElRef = React.useRef<HTMLElement | null>(null);

  const activeBoardId = useWorkspaceStore((s) => s.activeBoardId);
  const updateBoard = useWorkspaceStore((s) => s.updateBoard);

  // Row drag handlers
  function handleRowDragStart(e: React.DragEvent, fromIndex: number) {
    e.dataTransfer.setData("text/plain", String(fromIndex));
    // Only show overlay when initiated from the row drag handle
    const startedFromHandle = (e.target as HTMLElement)?.closest(
      '[data-row-drag-handle="true"]'
    );
    if (startedFromHandle) {
      // Hide native drag image to avoid duplicate ghost
      try {
        const shim = document.createElement("div");
        shim.style.width = "1px";
        shim.style.height = "1px";
        shim.style.position = "absolute";
        shim.style.top = "0";
        shim.style.left = "0";
        document.body.appendChild(shim);
        e.dataTransfer.setDragImage(shim, 0, 0);
        setTimeout(() => {
          try {
            shim.remove();
          } catch {}
        }, 0);
      } catch {}
      try {
        document.body.style.userSelect = "none";
        document.body.classList.add("fbp-dragging-cursor");
        document.documentElement.classList.add("fbp-dragging-cursor");
        document.body.style.cursor = "grabbing";
        (document.documentElement as HTMLElement).style.cursor = "grabbing";
      } catch {}
      try {
        e.dataTransfer.effectAllowed = "move";
      } catch {}
      setIsRowDragging(true);
      setRowDragIndex(fromIndex);
      setRowDragPos({ x: e.clientX ?? 0, y: e.clientY ?? 0 });
      const angle = Math.random() * 6 - 3; // -3deg to +3deg
      setRowDragAngle(Math.abs(angle) < 1 ? (angle < 0 ? -2 : 2) : angle);
      setRowDragScale(1.04);
      // animate back to 1 on next frame
      requestAnimationFrame(() => setRowDragScale(1));
    }
  }

  function handleRowDrop(e: React.DragEvent) {
    const tr = (e.target as HTMLElement).closest("tr");
    if (!tr?.dataset?.rowkey) return;
    const targetIndex = parseInt(tr.dataset.rowkey, 10);
    if (Number.isNaN(targetIndex)) return;

    const fromIndexStr = e.dataTransfer.getData("text/plain");
    const fromIndex = parseInt(fromIndexStr, 10);
    if (Number.isNaN(fromIndex) || fromIndex === targetIndex) {
      endRowDragOverlay();
      return;
    }

    if (grouping.length > 0) {
      // For grouped tables, we need to check if the drag is within the same group
      const fromRow = table.getRowModel().rows[fromIndex];
      const toRow = table.getRowModel().rows[targetIndex];
      
      if (fromRow && toRow) {
        const fromGroupId = fromRow.getGroupingValue(grouping[0]);
        const toGroupId = toRow.getGroupingValue(grouping[0]);
        
        if (fromGroupId === toGroupId) {
          // Moving within the same group is allowed
          const newData = [...tableData];
          const [movedItem] = newData.splice(fromIndex, 1);
          newData.splice(targetIndex, 0, movedItem);
          setTableData(newData);
        } else {
          // Moving between different groups is not allowed
          // Just end the drag overlay without making any changes
          console.log("Drag and drop between different groups is not allowed");
        }
      }
    } else {
      // For ungrouped tables, use the existing logic
      const newData = [...tableData];
      const [movedItem] = newData.splice(fromIndex, 1);
      newData.splice(targetIndex, 0, movedItem);
      setTableData(newData);
    }

    // end overlay on successful drop
    endRowDragOverlay();
  }

  function endRowDragOverlay() {
    setIsRowDragging(false);
    setRowDragIndex(null);
    setRowDragPos(null);
    setRowDragScale(1);
    setRowIndicatorTop(null);
    try {
      document.body.style.userSelect = "";
      document.body.classList.remove("fbp-dragging-cursor");
      document.documentElement.classList.remove("fbp-dragging-cursor");
      document.body.style.cursor = "";
      (document.documentElement as HTMLElement).style.cursor = "";
    } catch {}
  }

  // Column drag handlers
  function updateOverlayForMouseX(mouseClientX: number) {
    const container = scrollContainerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    // Keep constant offset from cursor captured at dragStart
    const left =
      mouseClientX - cRect.left - dragStartOffsetX + container.scrollLeft;
    setDragOverlayLeft(left);
    // Only compute target column and side for the blue gap indicator
    let targetId: string | null = null;
    let insertAfterLocal = false;
    const visible = table
      .getAllLeafColumns()
      .map((c: Column<Post>) => c.id)
      .filter((id: string) => id !== "drag" && id !== "rowIndex");
    
    for (let i = 0; i < visible.length; i++) {
      const colId = visible[i];
      const el = headerRefs.current[colId];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      if (mouseClientX < midX) {
        targetId = colId;
        insertAfterLocal = false;
        break;
      } else if (i === visible.length - 1) {
        targetId = colId;
        insertAfterLocal = true;
        break;
      }
    }
    if (targetId) {
      setDragOverColumnId(targetId);
      setDragInsertAfter(insertAfterLocal);
      dragOverColumnIdRef.current = targetId;
      dragInsertAfterRef.current = insertAfterLocal;
    }
  }

  function beginColumnDrag(colId: string, clientX: number) {
    setDraggingColumnId(colId);
    draggingColumnIdRef.current = colId;
    const headerEl = headerRefs.current[colId];
    if (headerEl) {
      draggingHeaderElRef.current = headerEl;
      try {
        headerEl.classList.add("drag-handle");
      } catch {}
      const rect = headerEl.getBoundingClientRect();
      setDragStartOffsetX(clientX - rect.left);
      setDragOverlayWidth(rect.width);
      const container = scrollContainerRef.current;
      if (container) {
        const cRect = container.getBoundingClientRect();
        setDragOverlayLeft(rect.left - cRect.left);
      }
    }
    // Initialize overlay target immediately
    updateOverlayForMouseX(clientX);
    // Mousemove fallback (attach once per drag)
    if (!dragMouseMoveHandlerRef.current) {
      const onMove = (mv: MouseEvent) => {
        updateOverlayForMouseX(mv.clientX);
      };
      dragMouseMoveHandlerRef.current = onMove;
      document.addEventListener("mousemove", onMove, true);
    }
    // End on mouseup as a safety net
    if (!dragMouseUpHandlerRef.current) {
      const onUp = (_: MouseEvent) => {
        finalizeColumnDrag();
      };
      dragMouseUpHandlerRef.current = onUp;
      document.addEventListener("mouseup", onUp, true);
    }
    try {
      document.body.style.userSelect = "none";
      document.body.classList.add("fbp-dragging-cursor");
    } catch {}

    // Attach native dragover/drop listeners to ensure events are captured
    const container = scrollContainerRef.current;
    if (container && !nativeDragBindingsRef.current?.attached) {
      const containerOver = (ev: DragEvent) => {
        ev.preventDefault();
        try {
          if (ev.dataTransfer) ev.dataTransfer.dropEffect = "move";
        } catch {}
        if (typeof ev.clientX === "number") updateOverlayForMouseX(ev.clientX);
      };
      const containerDrop = (ev: DragEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        // choose current target header or nearest by mouse X
        let toId = dragOverColumnId;
        if (!toId) {
          const mouseX = ev.clientX;
          let bestId: string | null = null;
          let bestDist = Infinity;
          const visible = table
            .getAllLeafColumns()
            .map((c: Column<Post>) => c.id)
            .filter((id: string) => id !== "drag" && id !== "rowIndex");
          for (const colId of visible) {
            const el = headerRefs.current[colId];
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            const dist = Math.abs(mouseX - (rect.left + rect.width / 2));
            if (dist < bestDist) {
              bestDist = dist;
              bestId = colId;
            }
          }
          toId = bestId;
        }
        if (toId) {
          finalizeColumnDrag(ev);
        }
      };
      nativeDragBindingsRef.current = {
        attached: true,
        containerOver,
        containerDrop,
        perHeader: [],
      };
      container.addEventListener("dragover", containerOver, true);
      container.addEventListener("drop", containerDrop, true);

      // Per-header listeners for better drop detection
      const perHeader: Array<{
        el: HTMLElement;
        over: (ev: DragEvent) => void;
        drop: (ev: DragEvent) => void;
      }> = [];
      for (const [id, el] of Object.entries(headerRefs.current)) {
        if (!el) continue;
        const over = (ev: DragEvent) => {
          ev.preventDefault();
          try {
            if (ev.dataTransfer) ev.dataTransfer.dropEffect = "move";
          } catch {}
        };
        const drop = (ev: DragEvent) => {
          ev.preventDefault();
          ev.stopPropagation();
        };
        el.addEventListener("dragover", over, true);
        el.addEventListener("drop", drop, true);
        perHeader.push({ el, over, drop });
      }
      nativeDragBindingsRef.current.perHeader = perHeader;
    }

    // Attach a global dragend/drop finalizer in case drop doesn't fire on our elements
    if (!dragEndHandlerRef.current) {
      const onEnd = (ev: DragEvent) => {
        finalizeColumnDrag(ev);
      };
      dragEndHandlerRef.current = onEnd;
      window.addEventListener("dragend", onEnd, true);
      window.addEventListener("drop", onEnd, true);
    }
  }

  function startColumnMouseDrag(e: React.MouseEvent, colId: string) {
    e.preventDefault();
    beginColumnDrag(colId, e.clientX);
  }

  function endColumnDrag() {
    setDraggingColumnId(null);
    setDragOverColumnId(null);
    setDragInsertAfter(false);
    draggingColumnIdRef.current = null;
    try {
      if (draggingHeaderElRef.current)
        draggingHeaderElRef.current.classList.remove("drag-handle");
    } catch {}
    draggingHeaderElRef.current = null;
    dragOverColumnIdRef.current = null;
    dragInsertAfterRef.current = false;
    setDragOverlayLeft(null);
    setDragOverlayWidth(null);
    // Clean up mousemove/mouseup listeners
    if (dragMouseMoveHandlerRef.current) {
        try {
            document.removeEventListener(
              "mousemove",
              dragMouseMoveHandlerRef.current,
              true
            );
          } catch {}
          dragMouseMoveHandlerRef.current = null;
    }
    if (dragMouseUpHandlerRef.current) {
        try {
            document.removeEventListener(
              "mouseup",
              dragMouseUpHandlerRef.current,
              true
            );
          } catch {}
          dragMouseUpHandlerRef.current = null;
    }
    // detach native listeners
    const container = scrollContainerRef.current;
    if (nativeDragBindingsRef.current.attached) {
      try {
        if (container && nativeDragBindingsRef.current.containerOver)
          container.removeEventListener(
            "dragover",
            nativeDragBindingsRef.current.containerOver,
            true
          );
        if (container && nativeDragBindingsRef.current.containerDrop)
          container.removeEventListener(
            "drop",
            nativeDragBindingsRef.current.containerDrop,
            true
          );
        for (const b of nativeDragBindingsRef.current.perHeader) {
          b.el.removeEventListener("dragover", b.over, true);
          b.el.removeEventListener("drop", b.drop, true);
        }
      } catch {}
      nativeDragBindingsRef.current = { attached: false, perHeader: [] };
    }
    // Clean up global dragend handler
    if (dragEndHandlerRef.current) {
      try {
        window.removeEventListener("dragend", dragEndHandlerRef.current, true);
        window.removeEventListener("drop", dragEndHandlerRef.current, true);
      } catch {}
      dragEndHandlerRef.current = null;
    }
    try {
        document.body.style.userSelect = "";
        document.body.classList.remove("fbp-dragging-cursor");
        document.documentElement.classList.remove("fbp-dragging-cursor");
        document.documentElement.classList.remove("is-grabbing");
        document.body.style.cursor = "";
        (document.documentElement as HTMLElement).style.cursor = "";
      } catch {}
  }

  // Finalize column reorder on drag end or global drop if needed
  function finalizeColumnDrag(ev?: DragEvent) {
    const fromId = draggingColumnIdRef.current;
    if (!fromId) {
      endColumnDrag();
      return;
    }
    // Determine target header: prefer tracked, else nearest to cursor
    let toId = dragOverColumnIdRef.current;
    if (!toId && ev && typeof ev.clientX === "number") {
      const mouseX = ev.clientX;
      let bestId: string | null = null;
      let bestDist = Infinity;
      const visible = table
        .getAllLeafColumns()
        .map((c: Column<Post>) => c.id)
        .filter((id: string) => id !== "drag" && id !== "rowIndex");
      for (const colId of visible) {
        const el = headerRefs.current[colId];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(mouseX - (rect.left + rect.width / 2));
        if (dist < bestDist) {
          bestDist = dist;
          bestId = colId;
        }
      }
      toId = bestId || null;
    }
    if (!toId || toId === fromId) {
      endColumnDrag();
      return;
    }
    // Compute insert side at end time
    let insertAfterAtEnd = dragInsertAfterRef.current;
    if (ev && toId) {
      const overEl = headerRefs.current[toId];
      if (overEl) {
        const rect = overEl.getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        insertAfterAtEnd = ev.clientX > midX;
      }
    }
    // Apply the reorder
    const visible = table
      .getAllLeafColumns()
      .map((c: Column<Post>) => c.id)
      .filter((id: string) => id !== "drag" && id !== "rowIndex");
    const fromIdx = visible.indexOf(fromId);
    const toIdx = visible.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1) {
      endColumnDrag();
      return;
    }
    const newOrder = [...visible];
    newOrder.splice(fromIdx, 1);
    const insertIdx = insertAfterAtEnd ? toIdx + 1 : toIdx;
    newOrder.splice(insertIdx, 0, fromId);
    // Update board columns
    try {
        if (activeBoardId) {
            const payload = buildColumnsPayloadForOrder(normalizeOrder(newOrder));
            updateBoard(activeBoardId, { columns: payload });
          }
    } catch {}
    endColumnDrag();
  }

  // Row drag effect
  React.useEffect(() => {
    if (!isRowDragging) return;
    const onAnyDrag = (ev: DragEvent) => {
      try {
        // Force move cursor icon and prevent default browser cursor overrides
        ev.preventDefault();
        if (ev.dataTransfer) ev.dataTransfer.dropEffect = "move";
      } catch {}
      // Force grabbing cursor throughout drag (same as column drag)
      try {
        document.body.style.cursor = "grabbing";
        (document.documentElement as HTMLElement).style.cursor = "grabbing";
      } catch {}
      // Follow mouse cursor; position will be converted relative to container in render
      setRowDragPos({ x: ev.clientX, y: ev.clientY });
      // Update row gap indicator to nearest row edge for better feedback when not over a row
      const container = scrollContainerRef.current;
      if (container) {
        const cRect = container.getBoundingClientRect();
        const mouseY = ev.clientY - cRect.top + container.scrollTop;
        const rows = container.querySelectorAll("tr[data-rowkey]");
        let nearestTop: number | null = null;
        let nearestDist = Infinity;
        for (const row of rows) {
          const rect = row.getBoundingClientRect();
          const rowTop = rect.top - cRect.top + container.scrollTop;
          const dist = Math.abs(mouseY - rowTop);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestTop = rowTop;
          }
        }
        setRowIndicatorTop(nearestTop);
      }
    };
    const onEnd = () => {
      endRowDragOverlay();
    };
    window.addEventListener("dragover", onAnyDrag, true);
    window.addEventListener("drag", onAnyDrag, true);
    document.addEventListener("dragover", onAnyDrag, true);
    document.addEventListener("dragenter", onAnyDrag, true);
    window.addEventListener("dragend", onEnd, true);
    return () => {
      try {
        window.removeEventListener("dragover", onAnyDrag, true);
      } catch {}
      try {
        window.removeEventListener("drag", onAnyDrag, true);
      } catch {}
      try {
        document.removeEventListener("dragover", onAnyDrag, true);
      } catch {}
      try {
        document.removeEventListener("dragenter", onAnyDrag, true);
      } catch {}
      try {
        window.removeEventListener("dragend", onEnd, true);
      } catch {}
    };
  }, [isRowDragging]);

  // Column drag effect
  React.useEffect(() => {
    if (!draggingColumnId) return;
    const onAnyDrag = (ev: DragEvent) => {
      ev.preventDefault();
      const x =
        typeof ev.clientX === "number" && ev.clientX
          ? ev.clientX
          : ev.pageX;
      if (typeof x === "number") updateOverlayForMouseX(x);
    };
    // Capture to ensure we receive events even if inner elements stop propagation
    window.addEventListener("dragover", onAnyDrag, { capture: true });
    window.addEventListener("drag", onAnyDrag, { capture: true });
    document.addEventListener("dragover", onAnyDrag, { capture: true });
    document.addEventListener("dragenter", onAnyDrag, { capture: true });
    // Note: per-drag global end listeners are attached in handleColumnDragStart
    return () => {
      try {
        window.removeEventListener("dragover", onAnyDrag, {
          capture: true,
        });
      } catch {}
      try {
        window.removeEventListener("drag", onAnyDrag, {
          capture: true,
        });
      } catch {}
      try {
        document.removeEventListener("dragover", onAnyDrag, {
          capture: true,
        });
      } catch {}
      try {
        document.removeEventListener("dragenter", onAnyDrag, {
          capture: true,
        });
      } catch {}
    };
  }, [draggingColumnId]);

  const dragState: DragState = {
    dragOverIndex,
    isRowDragging,
    rowDragIndex,
    rowDragPos,
    rowDragAngle,
    rowDragScale,
    rowIndicatorTop,
    draggingColumnId,
    dragOverColumnId,
    dragInsertAfter,
    dragOverlayLeft,
    dragOverlayWidth,
    dragStartOffsetX,
  };

  const dragStateSetters: DragStateSetters = {
    setDragOverIndex,
    setIsRowDragging,
    setRowDragIndex,
    setRowDragPos,
    setRowDragAngle,
    setRowDragScale,
    setRowIndicatorTop,
    setDraggingColumnId,
    setDragOverColumnId,
    setDragInsertAfter,
    setDragOverlayLeft,
    setDragOverlayWidth,
    setDragStartOffsetX,
  };

  const dragRefs: DragRefs = {
    nativeDragBindingsRef,
    dragEndHandlerRef,
    draggingColumnIdRef,
    dragOverColumnIdRef,
    dragInsertAfterRef,
    dragMouseMoveHandlerRef,
    dragMouseUpHandlerRef,
    draggingHeaderElRef,
  };

  const dragHandlers: DragHandlers = {
    handleRowDragStart,
    handleRowDrop,
    endRowDragOverlay,
    beginColumnDrag,
    endColumnDrag,
    finalizeColumnDrag,
    startColumnMouseDrag,
    updateOverlayForMouseX,
  };

  return {
    dragState,
    dragStateSetters,
    dragRefs,
    dragHandlers,
  };
}
