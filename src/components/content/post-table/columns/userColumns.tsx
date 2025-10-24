"use client";

import React from "react";
import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import { Post, UserColumn } from "@/lib/store";
import { RowHeightType, getRowHeightPixels } from "@/lib/utils";

import UserTextCell from "../UserTextCell";
import { SingleSelectCell } from "../SingleSelectCell";
import { MultiSelectCell } from "../MultiSelectCell";
import { CheckboxCell } from "../CheckboxCell";
import { UserDateCell } from "../UserDateCell";
import { CreatedByCell, LastModifiedByCell } from "../UserCell";
import { MemoAttachmentCell } from "../MemoAttachmentCell";
import { CellContext } from "@tanstack/react-table";

type FocusCellContext<T> = CellContext<T, unknown> & {
    isFocused?: boolean;
    isEditing?: boolean;
    enterEdit?: () => void;
    exitEdit?: () => void;
  };

export function createUserColumns(params: {
  userColumns: UserColumn[];
  rowHeight: RowHeightType;
  getUserColumnValue: (post: Post, columnId: string) => string;
  buildUpdatedUserColumnsArr: (post: Post, columnId: string, value: string) => Array<{ id: string; value: string }>;
  setTableData: React.Dispatch<React.SetStateAction<Post[]>>;
  updatePost: (id: string, data: Partial<Post>) => any | Promise<any>;
  setUserColumns: React.Dispatch<React.SetStateAction<UserColumn[]>>;
  activeBoardId?: string | null;
  getCurrentOrder: () => string[];
  normalizeOrder: (order: string[]) => string[];
  buildColumnsPayloadForOrder: (order: string[], cols: UserColumn[]) => any[];
  updateBoard: (boardId: string, data: Partial<{ rules: any; columns: any[] }>) => any | Promise<any>;
  columnNames: Record<string, string>;
}) {
  const {
    userColumns,
    rowHeight,
    getUserColumnValue,
    buildUpdatedUserColumnsArr,
    setTableData,
    updatePost,
    setUserColumns,
    activeBoardId,
    getCurrentOrder,
    normalizeOrder,
    buildColumnsPayloadForOrder,
    updateBoard,
    columnNames,
  } = params;

  const iconSrcByType: Record<UserColumn["type"], string> = {
    singleLine: "/images/columns/single-line-text.svg",
    longText: "/images/columns/long-text.svg",
    attachment: "/images/columns/preview.svg",
    checkbox: "/images/columns/approve.svg",
    feedback: "/images/columns/message-notification-active.svg",
    singleSelect: "/images/columns/format.svg",
    multiSelect: "/images/columns/status.svg",
    date: "/images/columns/post-time.svg",
    lastUpdatedTime: "/images/columns/updated-time.svg",
    createdBy: "/images/columns/created-by.svg",
    lastUpdatedBy: "/images/columns/updated-time.svg",
  } as const;

  const cols: ColumnDef<Post>[] = userColumns.map((col) => {
    const headerIconSrc = iconSrcByType[col.type] ?? "/images/columns/single-line-text.svg";
    return {
      id: col.id,
      accessorFn: (row) => {
        if (col.type === "createdBy") return row.created_by;
        if (col.id === "lastUpdatedBy") return row.last_updated_by;
        const value = getUserColumnValue(row, col.id);
        if (col.type === "singleSelect" && col.options) {
          const options = Array.isArray(col.options) ? col.options : [];
          const option = (options as any[]).find((opt: any) =>
            typeof opt === "string" ? opt === value : opt.id === value
          );
          return typeof option === "string" ? option : option?.value || value;
        }
        return value;
      },
      header: () => (
        <div className="flex items-center gap-[6px] text-black text-[13px] font-medium leading-[16px]">
          <Image src={headerIconSrc} alt={col.type} width={14} height={14} />
          {col.label}
        </div>
      ),
      minSize: 100,
      maxSize: 300,
      enableSorting: true,
      cell: (ctx) => {
        const { row } = ctx;
        const { isFocused, isEditing, enterEdit, exitEdit } = ctx as FocusCellContext<Post>;
        const post = row.original;
        const existingVal = getUserColumnValue(post, col.id);

        switch (col.type) {
          case "singleLine":
            return (
              <UserTextCell
                value={existingVal}
                isFocused={isFocused}
                rowHeight={getRowHeightPixels(rowHeight)}
                singleLine
                onValueCommit={(newVal) => {
                  const newArr = buildUpdatedUserColumnsArr(post, col.id, newVal);
                  setTableData((prev) => prev.map((p) => (p.id === post.id ? { ...p, user_columns: newArr } : p)));
                  updatePost(post.id, { user_columns: newArr } as any);
                }}
              />
            );
          case "longText":
            return (
              <UserTextCell
                value={existingVal}
                isFocused={isFocused}
                rowHeight={getRowHeightPixels(rowHeight)}
                onValueCommit={(newVal) => {
                  const newArr = buildUpdatedUserColumnsArr(post, col.id, newVal);
                  setTableData((prev) => prev.map((p) => (p.id === post.id ? { ...p, user_columns: newArr } : p)));
                  updatePost(post.id, { user_columns: newArr } as any);
                }}
              />
            );
          case "singleSelect": {
            const colRef = col;
            const opts = (Array.isArray(colRef.options) ? (colRef.options as any[]) : []) as any[];
            const normalized = opts.map((o: any) => (typeof o === "string" ? { id: o, value: o, color: "" } : o));
            const optionId = String(existingVal || "");
            return (
              <SingleSelectCell
                value={optionId}
                options={normalized}
                isFocused={isFocused}
                isEditing={isEditing}
                enterEdit={enterEdit}
                exitEdit={exitEdit}
                onChange={(newVal) => {
                  const newArr = buildUpdatedUserColumnsArr(post, colRef.id, newVal);
                  setTableData((prev) => prev.map((p) => (p.id === post.id ? { ...p, user_columns: newArr } : p)));
                  updatePost(post.id, { user_columns: newArr } as any);
                }}
                onAddOption={(opt) => {
                  const nextCols = userColumns.map((uc) => {
                    if (uc.id !== colRef.id) return uc;
                    const existing = Array.isArray(uc.options) ? (uc.options as any[]) : [];
                    const exists = existing.some((o: any) => (typeof o === "string" ? o === opt.value : o.value === opt.value));
                    if (exists) return uc;
                    const nextOptions = [
                      ...existing.map((o: any) => (typeof o === "string" ? { id: o, value: o, color: "" } : o)),
                      opt,
                    ];
                    return { ...uc, options: nextOptions } as any;
                  });
                  setUserColumns(nextCols);
                  if (activeBoardId) {
                    const order = normalizeOrder(getCurrentOrder());
                    const payload = buildColumnsPayloadForOrder(order, nextCols);
                    updateBoard(activeBoardId, { columns: payload as any });
                  }
                }}
              />
            );
          }
          case "checkbox":
            return (
              <CheckboxCell
                value={existingVal}
                isFocused={isFocused}
                onChange={(newVal) => {
                  const newArr = buildUpdatedUserColumnsArr(post, col.id, String(newVal));
                  setTableData((prev) => prev.map((p) => (p.id === post.id ? { ...p, user_columns: newArr } : p)));
                  updatePost(post.id, { user_columns: newArr } as any);
                }}
              />
            );
          case "multiSelect": {
            const colRef = col;
            const opts = (Array.isArray(colRef.options) ? (colRef.options as any[]) : []) as any[];
            const normalized = opts.map((o: any) => (typeof o === "string" ? { id: o, value: o, color: "" } : o));
            const selectedIds = Array.isArray(existingVal)
              ? (existingVal as any)
              : String(existingVal || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
            return (
              <MultiSelectCell
                value={selectedIds as string[]}
                options={normalized}
                isFocused={isFocused}
                isEditing={isEditing}
                enterEdit={enterEdit}
                exitEdit={exitEdit}
                onChange={(newVal) => {
                  const serialized = Array.isArray(newVal) ? newVal.join(",") : String(newVal || "");
                  const newArr = buildUpdatedUserColumnsArr(post, colRef.id, serialized);
                  setTableData((prev) => prev.map((p) => (p.id === post.id ? { ...p, user_columns: newArr } : p)));
                  updatePost(post.id, { user_columns: newArr } as any);
                }}
                onAddOption={(opt) => {
                  const nextCols = userColumns.map((uc) => {
                    if (uc.id !== colRef.id) return uc;
                    const existing = Array.isArray(uc.options) ? (uc.options as any[]) : [];
                    const exists = existing.some((o: any) => (typeof o === "string" ? o === opt.value : o.value === opt.value));
                    if (exists) return uc;
                    const nextOptions = [
                      ...existing.map((o: any) => (typeof o === "string" ? { id: o, value: o, color: "" } : o)),
                      opt,
                    ];
                    return { ...uc, options: nextOptions } as any;
                  });
                  setUserColumns(nextCols);
                  if (activeBoardId) {
                    const order = normalizeOrder(getCurrentOrder());
                    const payload = buildColumnsPayloadForOrder(order, nextCols);
                    updateBoard(activeBoardId, { columns: payload as any });
                  }
                }}
              />
            );
          }
          case "attachment": {
            let attachments: any[] = [];
            try {
              if (typeof existingVal === "string" && existingVal.trim()) {
                attachments = JSON.parse(existingVal);
              } else if (Array.isArray(existingVal)) {
                attachments = existingVal as any[];
              }
            } catch {
              attachments = [];
            }
            return (
              <MemoAttachmentCell
                attachments={attachments}
                postId={post.id}
                columnId={col.id}
                rowHeight={rowHeight}
                isSelected={!!isFocused}
              />
            );
          }
          case "createdBy":
            return (
              <div className="flex items-center h-full px-2 py-[6px]">
                <CreatedByCell post={post} />
              </div>
            );
          case "lastUpdatedBy":
            return (
              <div className="flex items-center h-full px-2 py-[6px]">
                <LastModifiedByCell post={post} />
              </div>
            );
          case "date":
            return (
              <UserDateCell
                value={existingVal}
                isFocused={isFocused}
                isEditing={isEditing}
                enterEdit={enterEdit}
                exitEdit={exitEdit}
                onChange={(newVal) => {
                  const newArr = buildUpdatedUserColumnsArr(post, col.id, newVal);
                  setTableData((prev) => prev.map((p) => (p.id === post.id ? { ...p, user_columns: newArr } : p)));
                  updatePost(post.id, { user_columns: newArr } as any);
                }}
              />
            );
          default:
            return <div className="text-sm">{String(existingVal)}</div>;
        }
      },
    };
  });

  return cols;
}


