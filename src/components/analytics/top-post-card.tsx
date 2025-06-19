'use client'

import { useMemo } from 'react'
import { Video, Eye, ThumbsUp, MessageSquare, Share2, MousePointerClick } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TopPost {
  id: string
  caption: string
  imgUrl: string
  video?: boolean
  date: string
  impressions: number
  engagement: number
  plays: number
  reacts: number
  comments: number
  shares: number
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
}

export function TopPostCard({ post, highlightMode }: TopPostCardProps) {
  const laugh = useMemo(() => getRandomInt(60), [])
  const angry = useMemo(() => getRandomInt(20), [])

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col text-sm pb-3">
      <div className="relative aspect-square overflow-hidden rounded">
        {post.video && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
            <Video className="w-8 h-8 text-white" />
          </div>
        )}
        <img
          src={post.imgUrl}
          alt="post"
          className="w-full h-full object-cover"
        />
      </div>

      <p className="line-clamp-1 font-medium my-2 px-3">{post.caption}</p>

      <div className="flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4 text-gray-600" />
            <span>{shortNumber(post.impressions)}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4 text-gray-600" />
            <span>{shortNumber(post.reacts)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <span>{shortNumber(post.comments)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="w-4 h-4 text-gray-600" />
            <span>{shortNumber(post.shares)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1 text-xs px-3">
        <div
          className={cn(
            'px-2 py-1 flex items-center justify-between rounded',
            highlightMode === 'impressions' ? 'bg-blue-50 text-blue-600' : 'bg-transparent'
          )}
        >
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>Impressions</span>
          </div>
          <span className="font-semibold text-sm">{shortNumber(post.impressions)}</span>
        </div>

        <div
          className={cn(
            'px-2 py-1 flex items-center justify-between rounded',
            highlightMode === 'engagement' ? 'bg-blue-50 text-blue-600' : 'bg-transparent'
          )}
        >
          <div className="flex items-center gap-1">
            <MousePointerClick className="w-4 h-4" />
            <span>Engagement</span>
          </div>
          <span className="font-semibold text-sm">{shortNumber(post.engagement)}</span>
        </div>
      </div>
    </div>
  )
} 