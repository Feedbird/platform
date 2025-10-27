import * as React from "react";
import { Post } from "@/lib/store";
import { Row } from "@tanstack/react-table";

export interface PostTableCallbacksParams {
  // State
  scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  tableData: Post[];
  rowHeight: any;
  onOpen?: (id: string) => void;
  
  // Setters
  setIsScrollable: React.Dispatch<React.SetStateAction<boolean>>;
  setFilterTree: (conditions: any) => void;
  
  // External functions
  checkIfScrollable: () => void;
}

export function usePostTableCallbacks(params: PostTableCallbacksParams) {
  const {
    // State
    scrollContainerRef,
    tableData,
    rowHeight,
    onOpen,
    
    // Setters
    setIsScrollable,
    setFilterTree,
    
    // External functions
    checkIfScrollable,
  } = params;

  // Function to check if scrolling is needed
  const checkIfScrollableCallback = React.useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const isScrollableNow = container.scrollHeight > container.clientHeight;
    setIsScrollable(isScrollableNow);
  }, [scrollContainerRef, setIsScrollable]);

  // Set filter conditions in store for current board
  const setFilterTreeCallback = React.useCallback((conditions: any) => {
    setFilterTree(conditions);
  }, [setFilterTree]);

  /** Preview cell function - separate from baseColumns to avoid refresh **/
  const previewCellFn = React.useCallback(
    ({ row, isFocused }: { row: Row<Post>; isFocused?: boolean }) => {
      const post = row.original;

      const handleFilesSelected = React.useCallback(
        (files: File[]) => {
          // In a real implementation, you'd upload to your API and update the post
          console.log("Files selected for post:", post.id, files);

          // TODO: Implement actual file upload
          // 1. Upload files to /api/media/upload
          // 2. Create blocks from uploaded files
          // 3. Update post with new blocks
        },
        [post.id]
      );

      return React.createElement(
        "div",
        {
          className: "flex flex-1 h-full cursor-pointer",
          onClick: (e: React.MouseEvent) => {
            if ((e.target as HTMLElement).closest("[data-preview-exempt]"))
              return;

            // Focus handling is managed by FocusCell at the <td> level.
            // First click focuses the cell; second click (when focused) opens the record.
            if (isFocused) {
              onOpen?.(post.id);
            }
          },
        },
        React.createElement(require("./MemoBlocksPreview").MemoBlocksPreview, {
          blocks: post.blocks,
          postId: post.id,
          onFilesSelected: handleFilesSelected,
          rowHeight: rowHeight,
          isSelected: !!isFocused,
        })
      );
    },
    [onOpen, rowHeight]
  );

  // Check if a column is a default/system column
  const isDefaultColumn = React.useCallback((columnId: string): boolean => {
    const defaultColumnIds = [
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
      "publish_date",
      "updated_at",
    ];
    return defaultColumnIds.includes(columnId);
  }, []);

  return {
    checkIfScrollableCallback,
    setFilterTreeCallback,
    previewCellFn,
    isDefaultColumn,
  };
}
