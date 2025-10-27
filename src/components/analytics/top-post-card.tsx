'use client'

import { useMemo } from 'react'
import { Eye, Zap, ThumbsUp, MessageSquare, Share2, MousePointerClick, ImageIcon, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormatBadge } from '@/components/content/shared/content-post-ui'
import type { FileKind } from '@/lib/store/types'

export interface TopPostVersion {
  id: string
  createdAt: string
  by: string
  caption: string
  file: {
    kind: FileKind
    url: string
    thumbnailUrl?: string
  }
  media?: {
    kind: FileKind
    name: string
    src: string
  }[]
  comments: Array<Record<string, unknown>>
}

export interface TopPostBlock {
  id: string
  kind: FileKind
  currentVersionId: string
  versions: TopPostVersion[]
  comments: Array<Record<string, unknown>>
}

export interface TopPost {
  id: string
  workspace_id: string
  board_id: string
  caption: string | { text?: string } | Array<{ text?: string }>
  status: string
  format: string
  publish_date?: string
  platforms: string[]
  pages: string[]
  billing_month?: string
  month: number
  settings?: Record<string, unknown> | string[]
  hashtags?: string[] | Record<string, unknown>
  blocks: TopPostBlock[]
  comments: Array<Record<string, unknown>>
  activities: Array<Record<string, unknown>>
  user_columns: Array<Record<string, unknown>>
  created_at: string
  updated_at: string
  platform_post_ids?: Record<string, string>
  // Analytics fields (not in posts table but needed for UI)
  analytics_impressions?: number
  analytics_engagement?: number
  analytics_comments?: number
  analytics_reacts?: number
  analytics_shares?: number
}

function shortNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(2) + 'K'
  return n.toString()
}

function getRandomInt(max = 50) {
  return Math.floor(Math.random() * max)
}

interface TopPostCardProps {
  post: TopPost
  highlightMode: 'impressions' | 'engagement'
  onClick?: (post: TopPost) => void
}

export function TopPostCard({ post, highlightMode, onClick }: TopPostCardProps) {
  const laugh = useMemo(() => getRandomInt(60), [])
  const angry = useMemo(() => getRandomInt(20), [])

  // Safe access with defaults for analytics fields
  const impressions = post.analytics_impressions || 0
  const engagement = post.analytics_engagement || 0
  const reacts = post.analytics_reacts || 0
  const commentsCount = post.analytics_comments || 0
  const shares = post.analytics_shares || 0

  // Extract text from caption (handle JSONB structure)
  const captionText = typeof post.caption === 'string'
    ? post.caption
    : Array.isArray(post.caption)
      ? post.caption.map(block => block.text || '').join(' ')
      : post.caption?.text || 'No caption'

  // Get first block for preview
  const firstBlock = Array.isArray(post.blocks) && post.blocks.length > 0 ? post.blocks[0] : null
  const hasBlocks = Array.isArray(post.blocks) && post.blocks.length > 0

  // Get current version from first block (following calendar-view pattern)
  const currentVer = firstBlock ? firstBlock.versions?.find((v) => v.id === firstBlock.currentVersionId) : null
  const isVideo = currentVer?.file?.kind === 'video'

  return (
    <div
      className="bg-white rounded-lg border border-elementStroke flex flex-col text-sm p-2 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick?.(post)}
    >
      {/* Blocks Preview */}
      <div className="relative aspect-square overflow-hidden rounded-sm">
        {hasBlocks && firstBlock && currentVer ? (
          <>
            {isVideo ? (
              <>
                <video
                  src={`${currentVer.file.url}?v=${currentVer.id}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                </div>
              </>
            ) : (
              <img
                src={currentVer.file.url}
                alt="preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Format Badge - Top Left */}
            <div className="absolute top-2 left-2 z-10">
              <FormatBadge kind={post.format} widthFull={false} />
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <div className="text-xs text-gray-500">No preview</div>
              </div>
            </div>
            {/* Format Badge - Top Left (even when no preview) */}
            <div className="absolute top-2 left-2 z-10">
              <FormatBadge kind={post.format} widthFull={false} />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-evenly">
        <div className="flex flex-col items-center justify-center gap-0.5">
          <img src="/images/analytics/heart.svg" alt="impressions" className="w-4 h-4" />
          <span>{shortNumber(reacts)}</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-0.5">
          <img src="/images/analytics/comment.svg" alt="engagement" className="w-4 h-4 " />
          <span>{shortNumber(commentsCount)}</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-0.5">
          <img src="/images/analytics/share.svg" alt="engagement" className="w-4 h-4" />
          <span>{shortNumber(shares)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm font-normal">
        <div
          className={cn(
            'px-2 py-1 flex items-center justify-between rounded-[5px] border border-storkeElement',
          )}
        >
          <div className="flex items-center text-darkGrey gap-1">
            <Eye style={{ width: '14px', height: '14px' }} />
            <span>Impressions</span>
          </div>
          <span className="text-black">{shortNumber(impressions)}</span>
        </div>

        <div
          className={cn(
            'px-2 py-1 flex items-center justify-between rounded-[5px] border border-elementStroke',
          )}
        >
          <div className="flex items-center text-darkGrey gap-1">
            <Zap style={{ width: '14px', height: '14px' }} />
            <span>Engagement</span>
          </div>
          <span className="text-black">{shortNumber(engagement)}</span>
        </div>
      </div>
    </div>
  )
} 