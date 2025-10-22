'use client'

import React from 'react'
import Image from 'next/image'
import { Play, Eye, Zap, Clock, Heart, MessageSquare, Repeat2, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusChip } from '@/components/content/shared/content-post-ui'
import { format } from 'date-fns'
import { Post } from '@/lib/store'

interface AnalyticsPanelProps {
    post: Post
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

export function AnalyticsPanel({ post }: AnalyticsPanelProps) {
    // Mock data - in real implementation, this would come from actual analytics
    const mockData = React.useMemo(() => ({
        plays: 15240,
        playsRate: 12,
        impressions: 16390, // Updated to match the requirement
        impressionsRate: 8,
        engagements: 886,
        engagementsRate: 15,
        playMetrics: {
            threeSecondViews: 12450,
            oneMinuteViews: 8920,
            avgMinutesViewed: 2.8
        },
        interactions: {
            likes: 118,
            replies: 45,
            reposts: 23
        }
    }), [])

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* HEADER (white background, fixed height) */}
            <div className="items-center bg-white">
                {/* STATUS */}
                <div className="flex flex-col py-3 px-4 border-b border-elementStroke">
                    <div className="flex items-center gap-1 text-sm font-medium">
                        <Image src={`/images/columns/status.svg`} alt="status" width={16} height={16} />
                        <span className="text-sm font-medium text-black">Status</span>
                    </div>
                    <div className="pt-2">
                        <StatusChip status={post.status} widthFull={false} />
                    </div>
                </div>

                {/* Posting Time */}
                <div className="flex flex-col py-3 px-4 border-b border-elementStroke">
                    <div className="flex items-center gap-1 text-sm font-medium">
                        <Image src={`/images/columns/post-time.svg`} alt="posting time" width={16} height={16} />
                        <span className="text-sm font-medium text-black">Posting Time</span>
                    </div>
                    <div className="pt-2">
                        <span className="text-sm text-muted-foreground">
                            {post.publish_date ? format(new Date(post.publish_date), "MMM d, p") : "Not scheduled"}
                        </span>
                    </div>
                </div>
            </div>

            {/* MAIN PANEL (gray background) */}
            <div
                className="flex-1 flex flex-col relative overflow-hidden"
                style={{ backgroundColor: "#F7F7F7" }}
            >
                <div className="flex-1 overflow-y-auto p-4 pb-20">
                    {/* Metric Cards */}
                    <div className="mb-6">
                        <div className="flex gap-2">
                            {/* Plays Card */}
                            <div className="rounded-sm p-3 flex-1 border border-elementStroke bg-white">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-start">
                                        <Play className="w-4 h-4 text-main" />
                                    </div>
                                    <div className="flex justify-start">
                                        <p className="text-xs font-normal text-darkGrey">Plays</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-black">{shortNumber(mockData.plays)}</p>
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
                            <div className="rounded-sm p-3 flex-1 border border-elementStroke bg-white">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-start">
                                        <Eye className="w-4 h-4 text-main" />
                                    </div>
                                    <div className="flex justify-start">
                                        <p className="text-xs font-normal text-darkGrey">Impressions</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-black">{shortNumber(mockData.impressions)}</p>
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
                            <div className="rounded-sm p-3 flex-1 border border-elementStroke bg-white">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-start">
                                        <Zap className="w-4 h-4 text-main" />
                                    </div>
                                    <div className="flex justify-start">
                                        <p className="text-xs font-normal text-darkGrey">Engagements</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-black">{shortNumber(mockData.engagements)}</p>
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
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-black mb-3">Plays</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2.5 rounded-sm border border-buttonStroke bg-white">
                                <div className="flex items-center gap-2">
                                    <img
                                        src="/images/analytics/clock-1.svg"
                                        alt="clock"
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-normal text-darkGrey">3-second video view</span>
                                </div>
                                <span className="text-sm font-medium text-black">{shortNumber(mockData.playMetrics.threeSecondViews)}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-sm border border-buttonStroke bg-white">
                                <div className="flex items-center gap-2">
                                    <img
                                        src="/images/analytics/clock-1.svg"
                                        alt="clock"
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-normal text-darkGrey">1-minute video views</span>
                                </div>
                                <span className="text-sm font-medium text-black">{shortNumber(mockData.playMetrics.oneMinuteViews)}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-sm border border-buttonStroke bg-white">
                                <div className="flex items-center gap-2">
                                    <img
                                        src="/images/analytics/clock-2.svg"
                                        alt="clock"
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-normal text-darkGrey">Avg. minutes viewed</span>
                                </div>
                                <span className="text-sm font-medium text-black">{formatAvgMinutes(mockData.playMetrics.avgMinutesViewed)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Interactions List */}
                    <div>
                        <h3 className="text-sm font-medium text-black mb-3">Interactions</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2.5 rounded-sm border border-buttonStroke bg-white">
                                <div className="flex items-center gap-2">
                                    <img
                                        src="/images/analytics/heart-red.svg"
                                        alt="likes"
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-normal text-darkGrey">Likes</span>
                                </div>
                                <span className="text-sm font-medium text-black">{shortNumber(mockData.interactions.likes)}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-sm border border-buttonStroke bg-white">
                                <div className="flex items-center gap-2">
                                    <img
                                        src="/images/analytics/comment-2.svg"
                                        alt="replies"
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-normal text-darkGrey">Replies</span>
                                </div>
                                <span className="text-sm font-medium text-black">{shortNumber(mockData.interactions.replies)}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-sm border border-buttonStroke bg-white">
                                <div className="flex items-center gap-2">
                                    <img
                                        src="/images/analytics/repost.svg"
                                        alt="reposts"
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-normal text-darkGrey">Reposts</span>
                                </div>
                                <span className="text-sm font-medium text-black">{shortNumber(mockData.interactions.reposts)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 bg-white border-t border-elementStroke">
                <div
                    className="w-full border border-buttonStroke rounded-sm py-2 pl-3 pr-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1">
                                <Image
                                    src="/images/boards/analytics-black.svg"
                                    alt="Analytics"
                                    width={16}
                                    height={16}
                                />
                                <p className='text-sm font-medium text-black'>
                                    View all analytics
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {shortNumber(mockData.impressions)} post impressions over the past week
                            </p>
                        </div>
                    </div>
                    <div
                        className='flex items-center justify-center p-1 rounded-[4px] border border-buttonStroke'
                    >
                        <img src="/images/analytics/arrow-right.svg" alt="arrow right" className='w-4 h-4' />
                    </div>
                </div>
            </div>
        </div>
    )
}
