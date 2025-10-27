import * as React from "react";
import { UserColumn, ColumnType, Post } from "@/lib/store";
import { Table as ReactTableType } from "@tanstack/react-table";
import { mapColumnTypeToEditFieldType, normalizeOrder, buildColumnsPayloadForOrder } from "./utils";

/**
 * Interface for header menu action parameters
 */
export interface HeaderMenuActionParams {
  action: string;
  columnId: string;
  // State setters
  setEditFieldColumnId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditFieldType: React.Dispatch<React.SetStateAction<string>>;
  setEditFieldOptions: React.Dispatch<React.SetStateAction<Array<{ id: string; value: string; color: string }>>>;
  setEditFieldPanelPos: React.Dispatch<React.SetStateAction<{ top: number; left: number; align: "left" | "right" } | null>>;
  setHeaderMenuOpenFor: React.Dispatch<React.SetStateAction<string | null>>;
  setEditFieldOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPendingInsertRef: React.Dispatch<React.SetStateAction<{ targetId: string; side: "left" | "right" } | null>>;
  setNewFieldLabel: React.Dispatch<React.SetStateAction<string>>;
  setUserColumns: React.Dispatch<React.SetStateAction<UserColumn[]>>;
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
  setTableData: React.Dispatch<React.SetStateAction<Post[]>>;
  // Data
  userColumns: UserColumn[];
  columnOrder: string[];
  tableData: Post[];
  activeBoardId: string | null;
  headerRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  // Functions
  table: ReactTableType<Post>;
  updatePost: (pid: string, data: Partial<Post>) => Promise<void>;
  updateBoard: (boardId: string, data: any) => void;
  isDefaultColumn: (columnId: string) => boolean;
  openEditPanelAtElement: (el: HTMLElement | null) => void;
}

/**
 * Handles header menu actions for table columns
 */
export function handleHeaderMenuAction(params: HeaderMenuActionParams): void {
  const {
    action,
    columnId,
    setEditFieldColumnId,
    setEditFieldType,
    setEditFieldOptions,
    setEditFieldPanelPos,
    setHeaderMenuOpenFor,
    setEditFieldOpen,
    setPendingInsertRef,
    setNewFieldLabel,
    setUserColumns,
    setColumnOrder,
    setTableData,
    userColumns,
    columnOrder,
    tableData,
    activeBoardId,
    headerRefs,
    scrollContainerRef,
    table,
    updatePost,
    updateBoard,
    isDefaultColumn,
    openEditPanelAtElement,
  } = params;

  switch (action) {
    case "edit": {
      // Only allow editing user-defined columns
      if (isDefaultColumn(columnId)) {
        break;
      }

      setEditFieldColumnId(columnId);

      // Set the field type based on the existing column type
      const existingColumn = userColumns.find((col) => col.id === columnId);
      if (existingColumn) {
        setEditFieldType(mapColumnTypeToEditFieldType(existingColumn.type));

        // Load existing options for select types
        if (
          existingColumn.type === "singleSelect" ||
          existingColumn.type === "multiSelect"
        ) {
          if (
            existingColumn.options &&
            Array.isArray(existingColumn.options)
          ) {
            // Handle both old string[] format and new {id, value, color} format
            if (
              existingColumn.options.length > 0 &&
              typeof existingColumn.options[0] === "string"
            ) {
              // Convert old format to new format with default colors and IDs
              const defaultColors = [
                "#3B82F6",
                "#10B981",
                "#F59E0B",
                "#EF4444",
                "#8B5CF6",
                "#F97316",
              ];
              setEditFieldOptions(
                (existingColumn.options as string[]).map(
                  (value, index) => ({
                    id: `opt_${index + 1}`,
                    value,
                    color: defaultColors[index % defaultColors.length],
                  })
                )
              );
            } else if (
              existingColumn.options.length > 0 &&
              typeof existingColumn.options[0] === "object" &&
              existingColumn.options[0] &&
              "id" in existingColumn.options[0]
            ) {
              // Already in new format with IDs
              setEditFieldOptions(
                existingColumn.options as Array<{
                  id: string;
                  value: string;
                  color: string;
                }>
              );
            } else {
              // Convert old {value, color} format to new format with IDs
              setEditFieldOptions(
                (existingColumn.options as any[]).map((opt, index) => ({
                  id: `opt_${index + 1}`,
                  value: opt.value,
                  color: opt.color,
                }))
              );
            }
          } else {
            // No options, set defaults
            setEditFieldOptions([
              { id: "opt_1", value: "Option A", color: "#3B82F6" },
              { id: "opt_2", value: "Option B", color: "#10B981" },
              { id: "opt_3", value: "Option C", color: "#F59E0B" },
            ]);
          }
        }
      }

      // Compute anchored position relative to header
      const headerEl = headerRefs.current[columnId];
      const container = scrollContainerRef.current;
      if (headerEl && container) {
        const hRect = headerEl.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();
        const columnWidth = hRect.width;
        const panelWidth = 280;
        const top = hRect.bottom - cRect.top + container.scrollTop; // align panel top to header bottom
        // Align rules
        let left: number;
        let align: "left" | "right";
        if (panelWidth <= columnWidth) {
          // right edges match
          left =
            hRect.right - cRect.left - panelWidth + container.scrollLeft;
          align = "right";
        } else {
          // left edges match
          left = hRect.left - cRect.left + container.scrollLeft;
          align = "left";
        }
        setEditFieldPanelPos({ top, left, align });
      } else {
        setEditFieldPanelPos(null);
      }
      setHeaderMenuOpenFor(null);
      setEditFieldOpen(true);
      break;
    }
    case "duplicate": {
      // Duplicate user-defined column definition if applicable
      setUserColumns((prev) => {
        const isUserCol = prev.some((c) => c.id === columnId);
        if (!isUserCol) return prev; // Only duplicate user-defined for now
        const orig = prev.find((c) => c.id === columnId)!;

        // Generate a unique ID for the duplicated column
        const generateUniqueId = (baseLabel: string) => {
          let counter = 1;
          let newId = `${baseLabel}_copy`;
          while (prev.some((c) => c.id === newId)) {
            newId = `${baseLabel}_copy_${counter}`;
            counter++;
          }
          return newId;
        };

        const newId = generateUniqueId(orig.label);
        const copy = { ...orig, id: newId, label: `${orig.label} copy` };

        // insert right after
        setColumnOrder((orderPrev) => {
          const order = orderPrev.length
            ? orderPrev
            : table.getAllLeafColumns().map((c) => c.id);
          const idx = order.indexOf(columnId);
          if (idx === -1) return orderPrev;
          const newOrder = normalizeOrder([...order]);
          newOrder.splice(idx + 1, 0, newId);
          try {
            table.setColumnOrder(normalizeOrder(newOrder));
          } catch {}
          // Persist after duplicate - pass the updated userColumns that includes the new column
          try {
            if (activeBoardId) {
              const nextUserColumns = [...prev, copy];
              const payload = buildColumnsPayloadForOrder(
                normalizeOrder(newOrder),
                nextUserColumns
              );
              updateBoard(activeBoardId, { columns: payload as any });
            }
          } catch {}
          return normalizeOrder(newOrder);
        });
        return [...prev, copy];
      });
      break;
    }
    case "insert-left":
    case "insert-right": {
      // Open the same inline panel as the plus button and remember where to insert
      setPendingInsertRef({
        targetId: columnId,
        side: action === "insert-left" ? "left" : "right",
      });
      setEditFieldColumnId(null);
      setNewFieldLabel("");
      setEditFieldType("single line text"); // Reset to default type for new columns
      // Reset options to defaults for new columns
      setEditFieldOptions([
        { id: "opt_1", value: "Option A", color: "#3B82F6" },
        { id: "opt_2", value: "Option B", color: "#10B981" },
        { id: "opt_3", value: "Option C", color: "#F59E0B" },
      ]);
      // Find the header element to anchor the panel to
      const headerElement = headerRefs.current[columnId];
      if (headerElement) {
        openEditPanelAtElement(headerElement);
      }
      setEditFieldOpen(true);
      break;
    }
    case "sort-asc": {
      table.setSorting([{ id: columnId, desc: false }]);
      break;
    }
    case "sort-desc": {
      table.setSorting([{ id: columnId, desc: true }]);
      break;
    }
    case "hide": {
      table.getColumn(columnId)?.toggleVisibility(false);
      break;
    }
    case "delete": {
      // Remove user-defined column if present
      const nextUserColumns: UserColumn[] = userColumns.filter(
        (c) => c.id !== columnId
      );
      setUserColumns((prev) => prev.filter((c) => c.id !== columnId));
      setColumnOrder((prev) =>
        normalizeOrder(prev.filter((id) => id !== columnId))
      );
      try {
        table.getColumn(columnId)?.toggleVisibility(false);
      } catch {}

      // Handle column deletion from posts
      const deletedColumn = userColumns.find((c) => c.id === columnId);
      if (deletedColumn) {
        // Find all posts that have values for this column and remove them
        const postsToUpdate = tableData.filter((post) => {
          if (!post.user_columns) return false;
          return post.user_columns.some((uc) => uc.id === deletedColumn.id);
        });

        if (postsToUpdate.length > 0) {
          // Update each post to remove the column value
          postsToUpdate.forEach((post) => {
            const updatedUserColumns =
              post.user_columns?.filter(
                (uc) => uc.id !== deletedColumn.id
              ) || [];

            // Update local state immediately for better UX
            setTableData((prev) =>
              prev.map((p) =>
                p.id === post.id
                  ? { ...p, user_columns: updatedUserColumns }
                  : p
              )
            );

            // Update in database
            updatePost(post.id, {
              user_columns: updatedUserColumns,
            } as any).catch((error) => {
              console.error(
                `Failed to update post ${post.id} after column deletion:`,
                error
              );
              // Revert local state on error
              setTableData((prev) =>
                prev.map((p) => (p.id === post.id ? post : p))
              );
            });
          });
        }
      }

      // Persist after delete
      try {
        if (activeBoardId) {
          const order = normalizeOrder(
            table
              .getAllLeafColumns()
              .map((c) => c.id)
              .filter((id) => id !== columnId)
          );
          const payload = buildColumnsPayloadForOrder(
            order,
            nextUserColumns
          );
          updateBoard(activeBoardId, { columns: payload as any });
        }
      } catch {}
      break;
    }
  }
  setHeaderMenuOpenFor(null);
}

/**
 * React hook for header menu actions
 */
export function useHeaderMenuAction(
  userColumns: UserColumn[],
  columnOrder: string[],
  tableData: Post[],
  activeBoardId: string | null,
  headerRefs: React.MutableRefObject<Record<string, HTMLElement | null>>,
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  table: ReactTableType<Post>,
  updatePost: (pid: string, data: Partial<Post>) => Promise<void>,
  updateBoard: (boardId: string, data: any) => void,
  isDefaultColumn: (columnId: string) => boolean,
  openEditPanelAtElement: (el: HTMLElement | null) => void,
  setEditFieldColumnId: React.Dispatch<React.SetStateAction<string | null>>,
  setEditFieldType: React.Dispatch<React.SetStateAction<string>>,
  setEditFieldOptions: React.Dispatch<React.SetStateAction<Array<{ id: string; value: string; color: string }>>>,
  setEditFieldPanelPos: React.Dispatch<React.SetStateAction<{ top: number; left: number; align: "left" | "right" } | null>>,
  setHeaderMenuOpenFor: React.Dispatch<React.SetStateAction<string | null>>,
  setEditFieldOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setPendingInsertRef: React.Dispatch<React.SetStateAction<{ targetId: string; side: "left" | "right" } | null>>,
  setNewFieldLabel: React.Dispatch<React.SetStateAction<string>>,
  setUserColumns: React.Dispatch<React.SetStateAction<UserColumn[]>>,
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>,
  setTableData: React.Dispatch<React.SetStateAction<Post[]>>
) {
  return React.useCallback(
    (action: string, columnId: string) => {
      handleHeaderMenuAction({
        action,
        columnId,
        setEditFieldColumnId,
        setEditFieldType,
        setEditFieldOptions,
        setEditFieldPanelPos,
        setHeaderMenuOpenFor,
        setEditFieldOpen,
        setPendingInsertRef,
        setNewFieldLabel,
        setUserColumns,
        setColumnOrder,
        setTableData,
        userColumns,
        columnOrder,
        tableData,
        activeBoardId,
        headerRefs,
        scrollContainerRef,
        table,
        updatePost,
        updateBoard,
        isDefaultColumn,
        openEditPanelAtElement,
      });
    },
    [
      userColumns,
      columnOrder,
      tableData,
      activeBoardId,
      headerRefs,
      scrollContainerRef,
      table,
      updatePost,
      updateBoard,
      isDefaultColumn,
      openEditPanelAtElement,
      setEditFieldColumnId,
      setEditFieldType,
      setEditFieldOptions,
      setEditFieldPanelPos,
      setHeaderMenuOpenFor,
      setEditFieldOpen,
      setPendingInsertRef,
      setNewFieldLabel,
      setUserColumns,
      setColumnOrder,
      setTableData,
    ]
  );
}
