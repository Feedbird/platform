'use client'

import { useMemo } from 'react'
import { X, Play, Eye, Zap, Clock, Heart, MessageSquare, Repeat2, ExternalLink, ImageIcon, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TopPost } from './top-post-card'
import { FormatBadge } from '@/components/content/shared/content-post-ui'

interface PostDetailSidebarProps {
  post: TopPost | null
  isOpen: boolean
  onClose: () => void
}

function shortNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(2) + 'K'
  return n.toString()
}

function formatRate(value: number): string {
  return `+${value}%`
}

function formatAvgMinutes(minutes: number): string {
  const totalSeconds = Math.round(minutes * 60)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function PostDetailSidebar({ post, isOpen, onClose }: PostDetailSidebarProps) {
  const mockData = useMemo(() => ({
    plays: 15240,
    playsRate: 12,
    impressions: post?.analyticsImpressions || 9770,
    impressionsRate: 8,
    engagements: post?.analyticsEngagement || 886,
    engagementsRate: 15,
    playMetrics: {
      threeSecondViews: 12450,
      oneMinuteViews: 8920,
      avgMinutesViewed: 2.8
    },
    interactions: {
      likes: post?.analyticsReacts || 118,
      replies: post?.analyticsComments || 45,
      reposts: post?.analyticsShares || 23
    }
  }), [post])

  if (!post || !isOpen) return null

  // Get first block for preview
  const firstBlock = Array.isArray(post.blocks) && post.blocks.length > 0 ? post.blocks[0] : null
  const hasBlocks = Array.isArray(post.blocks) && post.blocks.length > 0
  const currentVer = firstBlock ? firstBlock.versions?.find((v) => v.id === firstBlock.currentVersionId) : null
  const isVideo = currentVer?.file?.kind === 'video'

  return (
    <div className="fixed right-0 top-0 h-full w-100 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col overflow-x-hidden">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Blocks Preview */}
          <div className="relative w-full h-[160px] overflow-hidden">
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
                      <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-white" />
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
                <div className="absolute top-3 left-3 z-10">
                  <FormatBadge kind={post.format} widthFull={false} />
                </div>
                {/* X Icon - Top Right */}
                <div
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 p-0 text-black hover:text-gray-700 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
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
                <div className="absolute top-3 left-3 z-10">
                  <FormatBadge kind={post.format} widthFull={false} />
                </div>
                {/* X Icon - Top Right (even when no preview) */}
                  <div
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 p-0 text-black hover:text-gray-700 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </div>
              </>
            )}
          </div>

        {/* Metric Cards */}
        <div className="p-4">
          <div className="flex gap-2">
          {/* Plays Card */}
          <div className="rounded-sm p-3 flex-1 border border-elementStroke">
            <div className="flex flex-col gap-2">
              <div className="flex justify-start">
                <Play className="w-4 h-4 text-main" />
              </div>
              <div className="flex justify-start">
                <p className="text-xs font-normal text-darkGrey">Plays</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-base font-medium text-black">{shortNumber(mockData.plays)}</p>
                <div
                  className={cn(
                    'flex items-center text-xs font-medium rounded-[4px] px-1 transition-colors duration-200',
                    mockData.playsRate >= 0 ? 'bg-[#E7F8E1] text-[#247E00]' : 'bg-red-500/10 text-red-500'
                  )}
                >
                  {formatRate(mockData.playsRate)}
                </div>
              </div>
            </div>
          </div>

          {/* Impressions Card */}
          <div className="rounded-sm p-3 flex-1 border border-elementStroke">
            <div className="flex flex-col gap-2">
              <div className="flex justify-start">
                <Eye className="w-4 h-4 text-main" />
              </div>
              <div className="flex justify-start">
                <p className="text-xs font-normal text-darkGrey">Impressions</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-base font-medium text-black">{shortNumber(mockData.impressions)}</p>
                <div
                  className={cn(
                    'flex items-center text-xs font-medium rounded-[4px] px-1 transition-colors duration-200',
                    mockData.impressionsRate >= 0 ? 'bg-[#E7F8E1] text-[#247E00]' : 'bg-red-500/10 text-red-500'
                  )}
                >
                  {formatRate(mockData.impressionsRate)}
                </div>
              </div>
            </div>
          </div>

          {/* Engagements Card */}
          <div className="rounded-sm p-3 flex-1 border border-elementStroke">
            <div className="flex flex-col gap-2">
              <div className="flex justify-start">
                <Zap className="w-4 h-4 text-main" />
              </div>
              <div className="flex justify-start">
                <p className="text-xs font-normal text-darkGrey">Engagements</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-base font-medium text-black">{shortNumber(mockData.engagements)}</p>
                <div
                  className={cn(
                    'flex items-center text-xs font-medium rounded-[4px] px-1 transition-colors duration-200',
                    mockData.engagementsRate >= 0 ? 'bg-[#E7F8E1] text-[#247E00]' : 'bg-red-500/10 text-red-500'
                  )}
                >
                  {formatRate(mockData.engagementsRate)}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Plays List */}
        <div className="px-4 mt-2">
          <h3 className="text-sm font-medium text-black mb-3">Plays</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-sm border border-buttonStroke">
              <div className="flex items-center gap-2">
                <img
                  src="/images/analytics/clock-1.svg"
                  alt="clock"
                />
                <span className="text-sm font-normal text-darkGrey">3-second video view</span>
              </div>
              <span className="text-sm font-medium text-black">{shortNumber(mockData.playMetrics.threeSecondViews)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-sm border border-buttonStroke">
              <div className="flex items-center gap-2">
                <img
                  src="/images/analytics/clock-1.svg"
                  alt="clock"
                />
                <span className="text-sm font-normal text-darkGrey">1-minute video views</span>
              </div>
              <span className="text-sm font-medium text-black">{shortNumber(mockData.playMetrics.oneMinuteViews)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-sm border border-buttonStroke">
              <div className="flex items-center gap-2">
                <img
                  src="/images/analytics/clock-2.svg"
                  alt="clock"
                />
                <span className="text-sm font-normal text-darkGrey">Avg. minutes viewed</span>
              </div>
              <span className="text-sm font-medium text-black">{formatAvgMinutes(mockData.playMetrics.avgMinutesViewed)}</span>
            </div>
          </div>
        </div>

        {/* Interactions List */}
        <div className="px-4 mt-6">
          <h3 className="text-sm font-medium text-black mb-3">Interactions</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-sm border border-buttonStroke">
              <div className="flex items-center gap-2">
                <img
                  src="/images/analytics/heart-red.svg"
                  alt="likes"
                />
                <span className="text-sm font-normal text-darkGrey">Likes</span>
              </div>
              <span className="text-sm font-medium text-black">{shortNumber(mockData.interactions.likes)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-sm border border-buttonStroke">
              <div className="flex items-center gap-2">
                <img
                  src="/images/analytics/comment-2.svg"
                  alt="replies"
                />
                <span className="text-sm font-normal text-darkGrey">Replies</span>
              </div>
              <span className="text-sm font-medium text-black">{shortNumber(mockData.interactions.replies)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-sm border border-buttonStroke">
              <div className="flex items-center gap-2">
                <img
                  src="/images/analytics/repost.svg"
                  alt="reposts"
                />
                <span className="text-sm font-normal text-darkGrey">Reposts</span>
              </div>
              <span className="text-sm font-medium text-black">{shortNumber(mockData.interactions.reposts)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4">
        <div
          className="w-full border border-buttonStroke rounded-sm py-1.5 pl-2.5 pr-1.5 flex items-center justify-between"
        >
          <p className='text-sm font-medium text-black'>
            See record details
          </p>
          <div 
            className='flex items-center justify-center p-1 rounded-[4px] border border-buttonStroke'
            onClick={() => {
              // Handle see record details action
              console.log('See record details clicked')
            }}
          >
            <img src="/images/analytics/arrow-right.svg" alt="arrow right" className='w-4 h-4' />
          </div>
        </div>
      </div>
    </div>
  )
}
