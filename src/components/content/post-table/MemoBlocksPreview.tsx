"use client";

import * as React from 'react';
import { BlocksPreview } from './BlocksPreview';
import { Block } from '@/lib/store';
import { RowHeightType } from "@/lib/utils";

export type BlocksPreviewProps = {
  blocks: Block[];
  postId: string;
  onFilesSelected?: (files: File[]) => void;
  rowHeight: RowHeightType;
  isSelected?: boolean;
};

export const MemoBlocksPreview = React.memo(
  BlocksPreview,
  (prev: BlocksPreviewProps, next: BlocksPreviewProps) =>
    prev.postId    === next.postId &&
    prev.rowHeight === next.rowHeight &&
    prev.onFilesSelected === next.onFilesSelected &&
    prev.isSelected === next.isSelected
    // Note: We don't compare blocks anymore since BlocksPreview now subscribes to the store directly
);

MemoBlocksPreview.displayName = 'MemoBlocksPreview'; 