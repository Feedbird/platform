/* components/content/content-modal/channel-selector.tsx */
'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  usePostStore, Post,
} from '@/lib/store';
import { Platform } from '@/lib/social/platforms/platform-types';
import { ChannelIcons } from '@/components/content/shared/content-post-ui';
import { PostStore } from '@/lib/store/post-store';

export default function PlatformSelector({ post }: { post: Post }) {
  const updatePost = usePostStore((s: PostStore) => s.updatePost);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Platform[]>(post.platforms);

  const handleToggle = (platform: Platform) => {
    const newSelected = selected.includes(platform)
      ? selected.filter(p => p !== platform)
      : [...selected, platform];
    setSelected(newSelected);
    updatePost(post.id, { platforms: newSelected });
  };

  const allPlatforms: Platform[] = [
    'facebook',
    'instagram',
    'linkedin',
    'pinterest',
    'youtube',
    'tiktok',
    'google'
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer">
          {post.platforms.map(p => (
            <div key={p} className="opacity-100 hover:opacity-80">
              <ChannelIcons channels={[p]}/>
            </div>
          ))}
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Platforms</DialogTitle>
          <DialogDescription>
            Choose which platforms this post will be published to.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {allPlatforms.map(p => (
            <div
              key={p}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                selected.includes(p) ? 'bg-accent' : ''
              }`}
              onClick={() => handleToggle(p)}
            >
              <ChannelIcons channels={[p]}/>
              <span className="text-sm capitalize">{p}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
