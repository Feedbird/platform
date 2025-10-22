'use client';

import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Block } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function VersionRail({
  block,
  onSelect,
}: {
  block: Block;
  onSelect(id: string): void;
}) {
  return (
    <ScrollArea className="flex flex-col gap-3 p-2 w-20 border-r bg-muted/40">
      {block.versions.map(v => {
        const current = block.currentVersionId === v.id;

        return (
          <motion.button
            key={v.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(v.id)}
            className={cn(
              'relative shrink-0 w-16 aspect-video rounded-md overflow-hidden ring-2 transition-opacity',
              current
                ? 'opacity-100 ring-primary'
                : 'opacity-60 hover:opacity-80 ring-transparent',
            )}
          >
            {block.kind === 'video' ? (
              <video src={v.file.url} muted className="w-full h-full object-cover" />
            ) : (
              <img src={v.file.url} className="w-full h-full object-cover" />
            )}
            <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white rounded px-1">
              v{block.versions.length - block.versions.findIndex(x => x.id === v.id)}
            </span>
          </motion.button>
        );
      })}
    </ScrollArea>
  );
}
