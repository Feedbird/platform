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
import { DynamicTitle } from '@/components/layout/dynamic-title';

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

  /** optimistic error state (just for demo UI feedback) */
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Use refs to track loading states and prevent multiple calls
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Memoize the page to avoid unnecessary re-renders
  const page = useMemo(() => {
    return brand?.socialPages.find(p => p.id === pageId);
  }, [brand?.socialPages, pageId]);

  // Memoize the history to avoid unnecessary re-renders
  const history = useMemo(() => {
    return postHistory[pageId] || [];
  }, [postHistory, pageId]);

  // Memoized error clear function
  const clearError = useCallback(() => {
    setErrMsg(null);
  }, []);

  // Stable sync function - removed syncPostHistory from dependencies to prevent infinite loop
  const syncHistory = useCallback(async () => {
    if (!brandId || !pageId) return;
    
    // Prevent multiple simultaneous calls (local check)
    if (isLoadingRef.current) {
      console.log('Already loading locally, skipping sync');
      return;
    }
    
    // Also check store loading state
    if (isStoreSyncing) {
      console.log('Store is already syncing, skipping sync');
      return;
    }
    
    isLoadingRef.current = true;
    
    try {
      await syncPostHistory(brandId, pageId);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('Failed to sync post history:', error);
      setErrMsg(error instanceof Error ? error.message : 'Failed to load post history');
    } finally {
      setIsInitialLoading(false);
      isLoadingRef.current = false;
    }
  }, [brandId, pageId, isStoreSyncing]); // Added isStoreSyncing to dependencies

  /* sync history on mount / changes - only if not already loaded */
  useEffect(() => {
    if (brandId && pageId && !hasLoadedRef.current && !isLoadingRef.current && !isStoreSyncing) {
      executeWithLoading(
        syncHistory,
        "Loading post history..."
      );
    }
  }, [brandId, pageId, executeWithLoading, syncHistory, isStoreSyncing]);

  // Reset loading state when pageId changes
  useEffect(() => {
    hasLoadedRef.current = false;
    isLoadingRef.current = false;
    setIsInitialLoading(true);
  }, [pageId]);

  // Clear error message automatically after 5 seconds
  useEffect(() => {
    if (errMsg) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [errMsg, clearError]);

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
      } catch (e: any) {
        const errorMsg = e.message ?? 'Failed deleting post';
        setErrMsg(errorMsg);
        throw e; // Re-throw to stop loading
      }
    }, "Deleting post...");
  }, [brandId, pageId, deletePagePost, executeWithLoading]);

  const handleRefresh = useCallback(() => {
    // Reset the loaded flag to allow refresh
    hasLoadedRef.current = false;
    setIsInitialLoading(true);
    
    executeWithLoading(
      syncHistory,
      "Refreshing post history..."
    );
  }, [executeWithLoading, syncHistory]);

  // Determine if we're really loading (either local state or store state)
  const isReallyLoading = isInitialLoading || isStoreSyncing;

  return (
    <>
      <DynamicTitle />
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

      {errMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md w-full max-w-[600px]">
          <div className="flex justify-between items-center">
            <p className="text-red-600 text-sm">{errMsg}</p>
            <button 
              onClick={clearError}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
    </>
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
