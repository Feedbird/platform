'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Maximize2 } from 'lucide-react';
import { Block } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function ContentViewer({
  block,
  onExpand,
}: {
  block: Block;
  onExpand(): void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState<number>();

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(([e]) => setMaxH(e.contentRect.height));
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  const version = block.versions.find(v => v.id === block.currentVersionId)!;

  const commentsForVer = version.comments.length;

  const idx =
    block.versions.length - block.versions.findIndex(v => v.id === block.currentVersionId);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full flex items-center justify-center cursor-pointer
                 rounded-xl border border-muted bg-background/50 shadow relative"
      onClick={onExpand}
    >
      {block.kind === 'video' ? (
        <video
          src={version.file.url}
          controls
          style={{ maxHeight: maxH }}
          className="rounded-lg"
        />
      ) : (
        <img
          src={version.file.url}
          style={{ maxHeight: maxH }}
          className="rounded-lg"
        />
      )}

      <div
        className={cn(
          'absolute bottom-2 left-2 flex items-center gap-2 text-[11px] font-medium',
          'bg-black/70 text-white rounded px-2 py-0.5 backdrop-blur',
        )}
      >
        v{idx}
        <span className="mx-1">•</span>
        <MessageCircle size={10} className="inline-block" /> {commentsForVer}
      </div>
    </div>
  );
}
