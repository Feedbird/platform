"use client";

import * as React from 'react';
import { AttachmentCell, Attachment } from './attachment-cell';
import { RowHeightType } from "@/lib/utils";

export type MemoAttachmentCellProps = {
  attachments: Attachment[];
  postId: string;
  columnId: string;
  rowHeight: RowHeightType;
  isSelected?: boolean;
};

export const MemoAttachmentCell = React.memo(
  AttachmentCell,
  (prev: MemoAttachmentCellProps, next: MemoAttachmentCellProps) =>
    prev.postId === next.postId &&
    prev.columnId === next.columnId &&
    prev.rowHeight === next.rowHeight &&
    prev.attachments === next.attachments &&
    prev.isSelected === next.isSelected
);

MemoAttachmentCell.displayName = 'MemoAttachmentCell';
