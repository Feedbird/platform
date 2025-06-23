/* app/social/[pageId]/page.tsx */
'use client';

import { useParams }  from 'next/navigation';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Image          from 'next/image';
import { Trash2 }     from 'lucide-react';
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store';
import type { PostHistory } from '@/lib/social/platforms/platform-types';
import { Button } from '@/components/ui/button';
import { useAsyncLoading } from '@/hooks/use-async-loading';
import { usePostHistoryLoading } from '@/hooks/use-post-history-loading';
import { handleError } from '@/lib/utils/error-handler';
import { toast } from 'sonner';

export default function SocialPagePosts() {
  const { pageId } = useParams() as { pageId: string };
  const { executeWithLoading } = useAsyncLoading();

  const brandId          = useFeedbirdStore(s => s.activeBrandId);
  const postHistory      = useFeedbirdStore(s => s.postHistory);
  const syncPostHistory  = useFeedbirdStore(s => s.syncPostHistory);
  const deletePagePost   = useFeedbirdStore(s => s.deletePagePost);
  const brand            = useFeedbirdStore(s => s.getActiveBrand());
  
  // Check if the store is currently syncing this page
  const isStoreSyncing   = usePostHistoryLoading(pageId);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Memoize the page to avoid unnecessary re-renders
  const page = useMemo(() => {
    return brand?.socialPages.find(p => p.id === pageId);
  }, [brand?.socialPages, pageId]);

  // Memoize the history to avoid unnecessary re-renders
  const history = useMemo(() => {
    return postHistory[pageId] || [];
  }, [postHistory, pageId]);

  /* sync history on mount / page change */
  useEffect(() => {
    if (brandId && pageId && !isStoreSyncing) {
      executeWithLoading(async () => {
        try {
          if (history.length === 0) {
            setIsFirstLoad(true);
          }
          await syncPostHistory(brandId, pageId);
        } catch (error) {
          handleError(error, `Failed to load post history for ${page?.name}`);
        } finally {
          setIsFirstLoad(false);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, pageId]);

  // Early returns with proper loading states
  if (!brandId) {
    return <div className="p-4 text-gray-500">No active brand selected.</div>;
  }

  if (!brand) {
    return <div className="p-4 text-gray-500">Loading brand...</div>;
  }

  if (!page) {
    return <div className="p-4 text-gray-500">Page not found: {pageId}</div>;
  }

  /* handler -------------------------------------------------------- */
  const handleDelete = useCallback(async (ph: PostHistory) => {
    const ok = confirm('Delete this post permanently?');
    if (!ok) return;

    await executeWithLoading(async () => {
      try {
        await deletePagePost(brandId, pageId, ph.postId);
        toast.success("Post deleted successfully");
      } catch (e: any) {
        handleError(e, `Failed to delete post from ${page?.name}`);
        throw e; // Re-throw to stop loading
      }
    });
  }, [brandId, pageId, deletePagePost, executeWithLoading, page?.name]);

  const handleRefresh = useCallback(() => {
    if (brandId && pageId && !isStoreSyncing) {
      executeWithLoading(async () => {
        try {
          await syncPostHistory(brandId, pageId);
          toast.success(`Post history refreshed for ${page?.name}`);
        } catch (error) {
          handleError(error, `Failed to refresh post history for ${page?.name}`);
        }
      });
    }
  }, [brandId, pageId, isStoreSyncing, syncPostHistory, executeWithLoading, page?.name]);

  // Determine if we're really loading
  const isReallyLoading = (isStoreSyncing || isFirstLoad) && history.length === 0;

  return (
    <div className="p-4 flex flex-col items-center overflow-y-auto w-full">
      <div className="flex items-center justify-between w-full max-w-[600px] mb-4">
        <h2 className="text-xl font-semibold">
          Posts for {page.name} ({page.platform})
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isStoreSyncing}
        >
          {isStoreSyncing ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-[600px] items-center">
        {isReallyLoading ? (
          <div className="text-gray-500 text-center py-8">
            Loading posts...
          </div>
        ) : history.length > 0 ? (
          history.map(ph => (
            <PostCard
              key={ph.id}
              post={ph}
              onDelete={() => handleDelete(ph)}
            />
          ))
        ) : (
          <div className="text-gray-500 text-center py-8">
            No posts found for this page
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Individual Post card – now handles images *and* videos             */
/* ------------------------------------------------------------------ */
function PostCard({
  post,
  onDelete,
}: {
  post: PostHistory;
  onDelete: () => void;
}) {
  /** crude helper – look at the URL to decide how to render             */
  const isVideoUrl = useCallback((u: string) =>
    /\.(mp4|m4v|mov|webm|ogg)$/i.test(u) ||
    /youtube\.com|youtu\.be|vimeo\.com/.test(u), []);

  // Memoize the media rendering to avoid unnecessary re-renders
  const renderMedia = useMemo(() => {
    if (!post.mediaUrls?.length) return null;

    return (
      <div className="flex flex-col gap-3 mb-3 mt-2">
        {post.mediaUrls.map((url, idx) => {
          const isVideo = isVideoUrl(url);

          /* ——— YOUTUBE / VIMEO ——— */
          if (/youtube\.com|youtu\.be/.test(url)) {
            const videoId =
              url.match(/[?&]v=([^&]+)/)?.[1] // regular YT link
              || url.match(/youtu\.be\/([^/?]+)/)?.[1]; // youtu.be/xxxx
            
            if (!videoId) {
              return <div key={idx} className="text-red-500 text-sm">Invalid YouTube URL</div>;
            }

            const embed = `https://www.youtube.com/embed/${videoId}`;
            return (
              <iframe
                key={idx}
                src={embed}
                className="w-full aspect-video rounded-md"
                allowFullScreen
                loading="lazy"
              />
            );
          }

          /* ——— DIRECT VIDEO FILE ——— */
          if (isVideo) {
            return (
              <video
                key={idx}
                src={url}
                controls
                className="w-full rounded-md"
                style={{ maxHeight: 400 }}
                preload="metadata"
              />
            );
          }

          /* ——— FALLBACK = IMAGE ——— */
          return (
            <div key={idx} className="relative w-full h-auto">
              <Image
                src={url}
                alt={`post-${post.id}-${idx}`}
                width={600}
                height={400}
                className="object-cover rounded-md"
                style={{ maxHeight: 400, width: "100%", height: "auto" }}
                loading="lazy"
                onError={(e) => {
                  console.error('Failed to load image:', url);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }, [post.mediaUrls, isVideoUrl, post.id]);

  return (
    <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm w-full relative">
      {/* media -------------------------------------------------------- */}
      {renderMedia}

      {/* text --------------------------------------------------------- */}
      <p className="text-sm text-gray-800 mb-3 whitespace-pre-wrap">
        {post.content || "(no text)"}
      </p>

      {/* meta --------------------------------------------------------- */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>
          <span className="font-medium">Status:</span> {post.status}
        </p>
        <p>
          <span className="font-medium">Published:</span>{" "}
          {post.publishedAt?.toLocaleString() ?? "—"}
        </p>
        <Button
          onClick={onDelete}
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
