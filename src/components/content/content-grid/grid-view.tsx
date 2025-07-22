"use client";

import React from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Post, Status } from "@/lib/store/use-feedbird-store";
import { Platform } from "@/lib/social/platforms/platform-types";
import { ChannelIcons, statusConfig, StatusChip, FormatBadge } from "@/components/content/shared/content-post-ui";
import { cn } from "@/lib/utils";

interface GridViewProps {
  posts: Post[];
  onOpen?: (postId: string) => void;
}

// Month color helpers (same as MonthEditCell)
function getMonthColor(month: number): string {
  const hue = (month * 7) % 360;
  return `hsl(${hue}, 70%, 90%)`;
}

function getBulletColor(month: number): string {
  const hue = (month * 7) % 360;
  return `hsl(${hue}, 70%, 40%)`;
}

export default function GridView({ posts, onOpen }: GridViewProps) {
  const getMonthName = (month: number): string => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return months[month - 1] || "Jan";
  };

  /* Format icon handled via <FormatBadge> */

  const getPostThumbnail = (post: Post): string => {
    // Get the first block with media
    const mediaBlock = post.blocks?.find(block => {
      const currentVer = block.versions.find(v => v.id === block.currentVersionId);
      return currentVer && (currentVer.file.kind === "image" || currentVer.file.kind === "video");
    });
    
    if (mediaBlock) {
      const currentVer = mediaBlock.versions.find(v => v.id === mediaBlock.currentVersionId);
      if (currentVer) {
        // Append version id for video files to ensure proper cache busting (aligns with calendar view)
        return currentVer.file.kind === "video"
          ? `${currentVer.file.url}?v=${currentVer.id}`
          : currentVer.file.url;
      }
    }
    
    // Fallback to a placeholder
    return "/images/format/image.svg";
  };

  const isVideo = (post: Post): boolean => {
    return post.blocks?.some(block => {
      const currentVer = block.versions.find(v => v.id === block.currentVersionId);
      return currentVer && currentVer.file.kind === "video";
    }) || false;
  };

  return (
    <div className="w-full flex justify-center items-start h-full overflow-y-auto">
      <div className="grid grid-cols-3 gap-0">
        {posts.map((post) => (
          <div
            key={post.id}
            className="relative w-54 h-71.5 bg-white border border-gray-200 overflow-hidden cursor-pointer group"
            onClick={() => onOpen?.(post.id)}
          >
            {/* Main Image/Video Container */}
            <div className="relative w-full h-full">
              {isVideo(post) ? (
                <>
                  <video
                    src={getPostThumbnail(post)}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                  />
                  {/* Play icon overlay (same style as calendar view) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden drop-shadow-md">
                      <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-white" />
                    </div>
                  </div>
                </>
              ) : (
                <Image
                  src={getPostThumbnail(post)}
                  alt={post.caption?.default || "Post content"}
                  width={218}
                  height={288}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0">
              {/* Top-right Format badge (hover) */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <FormatBadge kind={post.format} widthFull={false} />
              </div>

              {/* Month pill (hover) */}
              <div
                className="absolute top-2 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ pointerEvents: 'none' }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    padding: '2px 8px',
                    alignItems: 'center',
                    borderRadius: '100px',
                    border: '1px solid rgba(28, 29, 31, 0.05)',
                    background: getMonthColor(post.month),
                  }}
                  className="text-xs font-semibold text-black gap-1"
                >
                  <span
                    className="w-[6px] h-[6px] rounded-full"
                    style={{ background: getBulletColor(post.month) }}
                  />
                  <span>{`Month ${post.month}`}</span>
                </div>
              </div>

              {/* Bottom Section - Blurred area with details */}
              <div className="absolute bottom-0 left-0 right-0 h-29 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-[4px] flex flex-col">
                <div className="flex flex-col h-full absolute bottom-0 left-0 right-0 p-3 text-white">
                  {/* Status chip at the top */}
                  <div className="mb-2 flex-shrink-0">
                    <StatusChip status={post.status as Status} widthFull={false} />
                  </div>

                  {/* Caption fills the available space */}
                  <div className="flex-1 flex items-center">
                    <p
                      className="text-xs leading-tight overflow-hidden"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        width: '100%',
                      }}
                    >
                      {post.caption?.default || "No caption"}
                    </p>
                  </div>

                  {/* Bottom row - Post time and platforms */}
                  <div className="flex justify-between items-center mt-2 flex-shrink-0">
                    {/* Post time */}
                    <div className="flex items-center gap-1">
                      <Image
                        src="/images/columns/post-time.svg"
                        alt="Time"
                        width={12}
                        height={12}
                        style={{ filter: "invert(1) brightness(2)" }}
                      />
                      <span className="text-xs">
                        {post.publishDate ? format(new Date(post.publishDate), "p") : "Not scheduled"}
                      </span>
                    </div>

                    {/* Platform icons */}
                    <div className="flex items-center">
                      {(() => {
                        const plats = post.platforms || [];
                        const showAll = plats.length <= 5;
                        const displayed = showAll ? plats : plats.slice(0,4);
                        return displayed.map((platform, idx) => (
                          <div
                            key={platform}
                            className={cn(
                              idx === 0 ? '' : '-ml-1',
                              'w-4.5 h-4.5'
                            )}
                          >
                            <ChannelIcons
                              channels={[platform]}
                              size={18}
                              whiteBorder={true}
                            />
                          </div>
                        ));
                      })()}
                      {post.platforms && post.platforms.length > 5 && (
                        <span
                          className={cn(
                            '-ml-1 w-4.5 h-4.5 flex items-center justify-center rounded-full bg-gray-300 text-[10px] font-semibold text-gray-700 relative z-10'
                          )}
                          style={{ lineHeight: '18px' }}
                        >
                          {post.platforms.length - 4}+
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 