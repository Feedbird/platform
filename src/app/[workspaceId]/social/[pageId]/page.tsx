/* app/social/[pageId]/page.tsx */
'use client';

import { useParams }  from 'next/navigation';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Image          from 'next/image';
import { Trash2, Eye, Heart } from 'lucide-react';
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
  const nextPage         = useFeedbirdStore(s => s.nextPage[pageId]);
  const deletePagePost   = useFeedbirdStore(s => s.deletePagePost);
  const workspace        = useFeedbirdStore(s => s.getActiveWorkspace());
  
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
    return workspace?.socialPages?.find((p: any) => p.id === pageId);
  }, [workspace?.socialPages, pageId]);

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

  if (!workspace) {
    return <div className="p-4 text-gray-500">Loading workspace...</div>;
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
        await deletePagePost(brandId, pageId, ph.postId || ph.id);
        // remove the post from the store's post history
        await syncPostHistory(brandId, pageId);
     
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

  const handleLoadMore = useCallback(async () => {
    if (!brandId || !pageId) return;
    
    await executeWithLoading(async () => {
      await syncPostHistory(
        brandId,
        pageId,
        nextPage
      );
    }, "Loading more posts...");
  }, [brandId, pageId, nextPage, syncPostHistory, executeWithLoading]);

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

        {/* Load More Button */}
        {history.length > 0 && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isStoreSyncing}
            >
              {isStoreSyncing ? 'Loading...' : 'Load More Posts'}
            </Button>
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
    /fbcdn\.net.*\.mp4/i.test(u) ||
    /youtube\.com|youtu\.be|vimeo\.com|tiktok\.com/.test(u), []);

  // Memoize the media rendering to avoid unnecessary re-renders
  const renderMedia = useMemo(() => {
    if (!post.mediaUrls?.length) return null;

    return (
      <div className="flex flex-col gap-3 mb-3 mt-2">
        {post.mediaUrls.map((url, idx) => {
          const isVideo  = post?.analytics?.metadata?.platform === 'instagram' && post?.analytics?.metadata?.mediaType?.toLowerCase() === 'video' ? true : isVideoUrl(url);
          
          /* ——— PINTEREST MEDIA ——— */
          if (post.analytics?.metadata?.platform === 'pinterest') {
            const isCarousel = post.analytics?.metadata?.mediaType === 'multiple_images';
            const isVideo = post.analytics?.metadata?.mediaType === 'video';
            
            if (isVideo) {
              return (
                <div key={idx} className="relative w-full h-auto">
                  <img
                    src={url}
                    alt={`Pinterest video thumbnail ${idx + 1}`}
                    width={600}
                    height={400}
                    className="object-cover rounded-md"
                    style={{ maxHeight: 400, width: "100%", height: "auto" }}
                    loading="lazy"
                    onError={(e) => {
                      console.error('Failed to load Pinterest video thumbnail:', url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {/* Video indicator */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-full p-3">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              );
            }
            
            return (
              <div key={idx} className="relative w-full h-auto">
                <img
                  src={url}
                  alt={`Pinterest ${isCarousel ? 'carousel' : 'pin'} ${idx + 1}`}
                  width={600}
                  height={400}
                  className="object-cover rounded-md"
                  style={{ maxHeight: 400, width: "100%", height: "auto" }}
                  loading="lazy"
                  onError={(e) => {
                    console.error('Failed to load Pinterest image:', url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Carousel indicator */}
                {isCarousel && post.mediaUrls.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs">
                    {idx + 1}/{post.mediaUrls.length}
                  </div>
                )}
              </div>
            );
          }

          /* ——— LINKEDIN MEDIA (using metadata) ——— */
          if (post.analytics?.metadata?.platform === 'linkedin' || post.analytics?.metadata?.platform === 'google') {
            const mediaType = post.analytics?.metadata?.mediaTypes?.[idx];

            if (mediaType === 'image') {
              return (
                <div key={idx} className="relative w-full h-auto">
                  <img
                    src={url}
                    alt={`LinkedIn post image ${idx + 1}`}
                    width={600}
                    height={400}
                    className="object-cover rounded-md"
                    style={{ maxHeight: 400, width: "100%", height: "auto" }}
                    loading="lazy"
                    onError={(e) => {
                      console.error('Failed to load LinkedIn image:', url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              );
            } else if (mediaType === 'video') {
              return (
                <video
                  key={idx}
                  src={url}
                  controls
                  className="w-full rounded-md"
                  style={{ maxHeight: 400 }}
                  preload="metadata"
                  crossOrigin="anonymous"
                />
              );
            }
          }

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

          /* ——— TIKTOK ——— */
          if (/tiktok\.com/.test(url)) {
            // Extract video ID from TikTok URL
            const videoId = url.match(/\/video\/(\d+)/)?.[1];
            
            if (!videoId) {
              return <div key={idx} className="text-red-500 text-sm">Invalid TikTok URL</div>;
            }

            // Use TikTok embed URL
            const embed = `https://www.tiktok.com/embed/${videoId}`;
            return (
              <iframe
                key={idx}
                src={embed}
                className="w-full aspect-video rounded-md"
                allowFullScreen
                loading="lazy"
                style={{ minHeight: '400px' }}
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

        // if platfform is instagram then return an image
        if (post.analytics?.metadata?.platform === 'instagram' || post.analytics?.metadata?.platform === 'google') {
            return (
              <img
                src={url}
                alt={`Instagram post image ${idx + 1}`}
                width={600}
                height={400}
                className="object-cover rounded-md"
                style={{ maxHeight: 400, width: "100%", height: "auto" }}
                loading="lazy"
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
      {post.analytics?.metadata?.platform === 'pinterest' ? (
        <div className="mb-3">
          {/* Pinterest Title */}
          {post.title && (
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              {post.title}
            </h3>
          )}
          {/* Pinterest Description */}
          {post.description && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {post.description}
            </p>
          )}
          {/* Fallback if no title or description */}
          {!post.title && !post.description && (
            <p className="text-sm text-gray-500 italic">
              (no content)
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-800 mb-3 whitespace-pre-wrap">
          {post.content || "(no text)"}
        </p>
      )}

      {/* analytics ----------------------------------------------------- */}
      {post.analytics && (post.analytics.metadata?.platform === 'facebook' || post.analytics.metadata?.platform === 'instagram' || post.analytics.metadata?.platform === 'youtube' || post.analytics.metadata?.platform === 'pinterest') && (
        <div className="mb-3 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Analytics</h4>
            <span className="text-xs text-gray-500">
              {post.analytics.metadata?.lastUpdated && 
                `Updated ${new Date(post.analytics.metadata.lastUpdated).toLocaleString()}`
              }
            </span>
          </div>
          <div className={`grid gap-3 text-xs ${post.analytics.metadata?.platform === 'instagram' || post.analytics.metadata?.platform === 'youtube' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {/* Facebook analytics */}
            {post.analytics.metadata?.platform === 'facebook' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">Views</span>
                  </div>
                  <span className="font-medium">{post.analytics.views?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span className="text-gray-600">Likes</span>
                  </div>
                  <span className="font-medium">{post.analytics.likes?.toLocaleString() || 0}</span>
                </div>
              </>
            )}
            
            {/* Instagram analytics */}
            {post.analytics.metadata?.platform === 'instagram' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">Reach</span>
                  </div>
                  <span className="font-medium">{post.analytics.reach?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span className="text-gray-600">Likes</span>
                  </div>
                  <span className="font-medium">{post.analytics.likes?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <svg className="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-gray-600">Comments</span>
                  </div>
                  <span className="font-medium">{post.analytics.comments?.toLocaleString() || 0}</span>
                </div>
              </>
            )}

            {/* YouTube analytics */}
            {post.analytics.metadata?.platform === 'youtube' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">Views</span>
                  </div>
                  <span className="font-medium">{post.analytics.views?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span className="text-gray-600">Likes</span>
                  </div>
                  <span className="font-medium">{post.analytics.likes?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <svg className="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-gray-600">Comments</span>
                  </div>
                  <span className="font-medium">{post.analytics.comments?.toLocaleString() || 0}</span>
                </div>
              </>
            )}

            {/* Pinterest analytics */}
            {post.analytics.metadata?.platform === 'pinterest' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">Views</span>
                  </div>
                  <span className="font-medium">{post.analytics.views?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <svg className="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    <span className="text-gray-600">Clicks</span>
                  </div>
                  <span className="font-medium">{post.analytics.clicks?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span className="text-gray-600">Engagement</span>
                  </div>
                  <span className="font-medium">{post.analytics.engagement?.toLocaleString() || 0}</span>
                </div>
              </>
            )}
          </div>
      
        </div>
      )}

      {/* YouTube description display */}
      {post.analytics?.metadata?.platform === 'youtube' && post.analytics.metadata?.description && (
        <div className="mb-3 p-3 bg-blue-50 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <h4 className="text-sm font-medium text-blue-700">Video Description</h4>
          </div>
          <p className="text-xs text-blue-600 whitespace-pre-wrap">
            {post.analytics.metadata.description}
          </p>
        </div>
      )}

      {/* Pinterest board information display */}
      {post.analytics?.metadata?.platform === 'pinterest' && post.analytics.metadata?.board && (
        <div className="mb-3 p-3 bg-red-50 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 19c-3.859 0-7-3.141-7-7s3.141-7 7-7 7 3.141 7 7-3.141 7-7 7zm0-12c-2.757 0-5 2.243-5 5s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z"/>
            </svg>
            <h4 className="text-sm font-medium text-red-700">Pinterest Board</h4>
            {post.analytics.metadata.board.isSecret && (
              <svg className="h-3 w-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-red-800">{post.analytics.metadata.board.name}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              post.analytics.metadata.board.isSecret 
                ? 'bg-yellow-100 text-yellow-800' 
                : post.analytics.metadata.board.isPrivate 
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-green-100 text-green-800'
            }`}>
              {post.analytics.metadata.board.privacy?.toLowerCase() || 'public'}
            </span>
          </div>
        </div>
      )}

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
