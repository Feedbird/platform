"use client";

import * as React from 'react';
import { AttachmentCell, Attachment } from './AttachmentCell';
import { RowHeightType } from "@/lib/utils";

export type MemoAttachmentCellProps = {
  attachments: Attachment[];
  postId: string;
  columnId: string;
  rowHeight: RowHeightType;
};

export const MemoAttachmentCell = React.memo(
  AttachmentCell,
  (prev: MemoAttachmentCellProps, next: MemoAttachmentCellProps) =>
    prev.postId === next.postId &&
    prev.columnId === next.columnId &&
    prev.rowHeight === next.rowHeight &&
    prev.attachments === next.attachments
);

MemoAttachmentCell.displayName = 'MemoAttachmentCell';
