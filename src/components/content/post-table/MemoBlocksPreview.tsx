"use client";

import * as React from 'react';
import { BlocksPreview } from './BlocksPreview';
import { Block } from '@/lib/store/use-feedbird-store';
import { RowHeightType } from "@/lib/utils";

export type BlocksPreviewProps = {
  blocks: Block[];
  postId: string;
  onFilesSelected?: (files: File[]) => void;
  rowHeight: RowHeightType;
};

export const MemoBlocksPreview = React.memo(
  BlocksPreview,
  (prev: BlocksPreviewProps, next: BlocksPreviewProps) =>
    prev.postId    === next.postId &&
    prev.rowHeight === next.rowHeight &&
    prev.onFilesSelected === next.onFilesSelected
    // Note: We don't compare blocks anymore since BlocksPreview now subscribes to the store directly
);

MemoBlocksPreview.displayName = 'MemoBlocksPreview'; 