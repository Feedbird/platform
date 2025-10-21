'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, formatTimeAgo } from '@/lib/utils'
import { Reply, Copy, Pin, Forward, CheckSquare, Flag, Trash2 } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getFullnameinitial } from '@/lib/utils'
import EmojiPicker from 'emoji-picker-react'
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store'
import { sanitizeHTML } from '@/lib/utils/sanitize'

type MessageItemProps = {
	message: {
		id: string
		author: string
		text: string
		createdAt: Date
		authorImageUrl?: string
		authorEmail?: string
		channelId?: string
		emoticons?: Array<{
			emoji: string
			userEmail: string
			userName: string
			createdAt: string
		}>
	}
	channelId: string
	channelsFromStore: any[]
	showChannelName?: boolean
	showReplyButton?: boolean
	onReplyClick?: () => void
	onEmojiReaction: (messageId: string, emoji: string) => void
	openDropdownId: string | null
	setOpenDropdownId: (id: string | null) => void
	openEmojiId: string | null
	setOpenEmojiId: (id: string | null) => void
	openEmoticonsEmojiId: string | null
	setOpenEmoticonsEmojiId: (id: string | null) => void
	formatTimeOnly: (date: Date) => string
	formatDayLabel?: (date: Date) => string
	showDaySeparator?: boolean
	showDaySeparatorDate?: Date
	showDaySeparatorPreviousDate?: Date
	// New props for reply summary
	replies?: Array<{
		id: string
		author: string
		authorEmail?: string
		authorImageUrl?: string
		createdAt: Date
	}>
	onReplySummaryClick?: () => void
	formatTimeAgo?: (date: Date) => string
	// New prop for board navigation
	onBoardQuickView?: (board_id: string) => void
}

export default function MessageItem({
	message,
	channelId,
	channelsFromStore,
	showChannelName = false,
	showReplyButton = true,
	onReplyClick,
	onEmojiReaction,
	openDropdownId,
	setOpenDropdownId,
	openEmojiId,
	setOpenEmojiId,
	openEmoticonsEmojiId,
	setOpenEmoticonsEmojiId,
	formatTimeOnly,
	formatDayLabel,
	showDaySeparator = false,
	showDaySeparatorDate,
	showDaySeparatorPreviousDate,
	// New props for reply summary
	replies,
	onReplySummaryClick,
	formatTimeAgo,
	// New prop for board navigation
	onBoardQuickView
}: MessageItemProps) {
	const showDay = showDaySeparator && showDaySeparatorDate && showDaySeparatorPreviousDate && 
		!isSameDay(showDaySeparatorPreviousDate, showDaySeparatorDate)

	return (
		<div>
			{showDay && formatDayLabel && (
				<div className="flex items-center gap-2">
					<div className="flex-1 border-t border-elementStroke" />
					<span className="text-xs text-grey whitespace-nowrap">{formatDayLabel(showDaySeparatorDate)}</span>
					<div className="flex-1 border-t border-elementStroke" />
				</div>
			)}
			<div className="flex items-start p-3 gap-2 group relative hover:bg-[#F4F5F6] rounded-md transition-colors duration-100">
				<Avatar className="w-6 h-6">
					<AvatarImage src={message.authorImageUrl} alt={message.author} />
					<AvatarFallback className="text-[10px] font-medium">
						{getFullnameinitial(undefined, undefined, message.author || '?')}
					</AvatarFallback>
				</Avatar>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-black">{message.author}</span>
						{showChannelName && channelId === 'all' && message.channelId && (
							<span className="text-xs text-blue-600 font-medium">
								#{(channelsFromStore.find((c: any) => c.id === message.channelId)?.name || message.channelId)}
							</span>
						)}
						<span className="text-xs font-normal text-grey">{formatTimeOnly(message.createdAt)}</span>
					</div>
					<div className="my-1 overflow-hidden">
						<div 
							className="text-sm whitespace-pre-wrap break-all text-black"
							dangerouslySetInnerHTML={{ __html: sanitizeHTML(message.text) }}
						/>
					</div>
					
					{/* Boards display */}
					{(() => {
						// Get boards data from message addon field
						const boards = (message as any).addon?.boards;
						if (!boards || boards.length === 0) return null;
						
						// Get board data directly from store using board IDs
						const boardNav = useFeedbirdStore(s => s.boardNav);
						const getAllPosts = useFeedbirdStore(s => s.getAllPosts);
						
						const boardData = boards.map((board_id: string) => {
							const board = boardNav.find(b => b.id === board_id);
							
							// Get posts for this board
							const posts = getAllPosts().filter((post: any) => post.board_id === board_id);
							const postCount = posts.length;
							
							// Get last update time from posts
							let lastUpdated = 'No posts';
							if (postCount > 0) {
								const latestPost = posts.reduce((latest: any, post: any) => {
									const postDate = new Date(post.updatedAt || 0);
									const latestDate = new Date(latest.updatedAt || 0);
									return postDate > latestDate ? post : latest;
								});
								
								const lastUpdateDate = new Date(latestPost.updatedAt || 0);
								lastUpdated = format(lastUpdateDate, 'MMM d, yyyy');
							}
							
							return {
								id: board_id,
								name: board?.label || 'Unknown Board',
								color: (board as any)?.color || null,
								image: board?.image || null,
								postCount,
								lastUpdated
							};
						});
						
						return (
							<div className="space-y-2">
								{boardData.map((board: any) => (
									<div
										key={board.id}
										className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
									>
										{/* Left: Board Icon */}
										<div 
											className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
											style={board.color ? { backgroundColor: board.color } : { backgroundColor: '#6B7280' }}
										>
											<img 
												src={board.image || `/images/boards/static-posts.svg`} 
												alt={board.name} 
												className="w-3.5 h-3.5 filter brightness-0 invert" 
												loading="lazy"
											/>
										</div>
										
										{/* Middle: Board Info */}
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium text-black mb-1">
												{board.name}
											</div>
											<div className="text-sm text-grey">
												{/* TODO: Get actual post count and last updated time */}
												{/* For now showing placeholder, can be enhanced with real data */}
												{board.postCount > 0 ? (
													`${board.postCount} Record${board.postCount > 1 ? 's' : ''} | Last updated ${board.lastUpdated || 'just now'}`
												) : (
													`No Records`
												)}
											</div>
										</div>
										
										{/* Right: Quick View Button */}
										<Button
											onClick={() => {
												if (onBoardQuickView) {
													onBoardQuickView(board.id);
												}
											}}
											className="px-2 py-1.5 bg-main hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors cursor-pointer"
										>
											Quick View
										</Button>
									</div>
								))}
							</div>
						);
					})()}
					
					{/* Emoticons display */}
					{message.emoticons && message.emoticons.length > 0 && (
						<div className="flex items-center gap-2">
							<div className="flex items-center gap-1 flex-wrap">
								{/* Show existing emoticons if any */}
								{(() => {
									// Group emoticons by emoji and count them
									const emojiCounts = message.emoticons.reduce((acc: Record<string, number>, reaction) => {
										acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1
										return acc
									}, {})
									
									return Object.entries(emojiCounts).map(([emoji, count]) => (
										<div
											key={emoji}
											className="inline-flex items-center gap-[3px] px-[5px] py-[2px] bg-gray-100 rounded-full text-xs hover:bg-gray-200 cursor-pointer"
											onClick={() => onEmojiReaction(message.id, emoji)}
											title="Click to add more reactions"
										>
											<span>{emoji}</span>
											<span className="text-gray-600 text-xs font-medium">{count}</span>
										</div>
									))
								})()}
								{/* Always show the add reaction button */}
								<Button
									variant="ghost"
									size="icon"
									className="size-[20px] p-0 bg-white border border-elementStroke hover:bg-gray-200 rounded-full"
									onClick={() => setOpenEmoticonsEmojiId(openEmoticonsEmojiId === message.id ? null : message.id)}
									title="Add reaction"
								>
									<Image 
										src="/images/messages/emoji.svg" 
										alt="Add reaction" 
										width={14} 
										height={14} 
									/>
								</Button>
							</div>
						</div>
					)}
					
					{/* Reply summary */}
					{replies && replies.length > 0 && onReplySummaryClick && (
						<div 
							className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded my-[9px] transition-colors"
							onClick={onReplySummaryClick}
						>
							{/* Reply avatars */}
							<div className="flex items-center">
								{(() => {
									// Get unique reply authors
									const uniqueReplyAuthors = replies.reduce((acc: string[], reply) => {
										const authorId = reply.authorEmail || reply.author
										if (!acc.includes(authorId)) {
											acc.push(authorId)
										}
										return acc
									}, [])
									
									return uniqueReplyAuthors.slice(0, 3).map((authorId, idx) => {
										const reply = replies.find(r => (r.authorEmail || r.author) === authorId)
										return (
											<div
												key={authorId}
												className={cn(
													"w-5 h-5 rounded-full border-2 border-white",
													idx > 0 && "-ml-2"
												)}
											>
												<Avatar className="w-5 h-5">
													<AvatarImage src={reply?.authorImageUrl} alt={reply?.author} />
													<AvatarFallback className="text-[8px] font-medium">
														{getFullnameinitial(undefined, undefined, reply?.author || '?')}
													</AvatarFallback>
												</Avatar>
											</div>
										)
									})
								})()}
							</div>
							
							{/* Reply count and time */}
							<div className="flex items-center gap-2 text-xs">
								<span className="text-blue-600 font-medium">
									{replies.length} {replies.length === 1 ? 'reply' : 'replies'}
								</span>
								<span className="text-grey">
									Last reply {(() => {
										const lastReplyTime = Math.max(...replies.map(reply => reply.createdAt.getTime()))
										const lastReplyDate = new Date(lastReplyTime)
										
										if (formatTimeAgo) {
											return formatTimeAgo(lastReplyDate)
										}
										
										// Fallback formatting
										const now = new Date()
										const diffInHours = (now.getTime() - lastReplyDate.getTime()) / (1000 * 60 * 60)
										
										if (diffInHours < 1) {
											return 'just now'
										} else if (diffInHours < 24) {
											return `${Math.floor(diffInHours)}h ago`
										} else {
											return `${Math.floor(diffInHours / 24)}d ago`
										}
									})()}
								</span>
							</div>
						</div>
					)}
				</div>
				
				{/* Action buttons - visible on hover or when dropdown is open */}
				<div className={cn(
					"absolute top-[-10px] right-2 px-[6px] py-[3px] bg-white transition-opacity duration-100 rounded-sm flex items-center gap-2 border border-Grey",
					openDropdownId === message.id || openEmojiId === message.id || openEmoticonsEmojiId === message.id || "opacity-0 group-hover:opacity-100"
				)}>
					<Button
						variant="ghost"
						size="icon"
						className="size-[14px] p-0 hover:bg-white/80 rounded-sm cursor-pointer"
						title="Add reaction"
						onClick={() => setOpenEmojiId(openEmojiId === message.id ? null : message.id)}
					>
						<Image 
							src="/images/messages/emoji.svg" 
							alt="Add reaction" 
							width={14} 
							height={14} 
						/>
					</Button>
					{showReplyButton && onReplyClick && (
						<Button
							variant="ghost"
							size="icon"
							className="size-[14px] p-0 hover:bg-white/80 rounded-sm cursor-pointer"
							title="Reply"
							onClick={onReplyClick}
						>
							<Reply className="size-[14px]" />
						</Button>
					)}
					<DropdownMenu onOpenChange={(open) => setOpenDropdownId(open ? message.id : null)}>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="size-[14px] p-0 hover:bg-white/80 rounded-sm cursor-pointer"
								title="More options"
							>
								<Image 
									src="/images/messages/dots.svg" 
									alt="More options" 
									width={14} 
									height={14} 
								/>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" sideOffset={8} className="w-28 text-sm font-medium text-black">
							{showReplyButton && onReplyClick && (
								<DropdownMenuItem onClick={onReplyClick}>
									<Image 
										src="/images/messages/arrow-uturn-left.svg" 
										alt="Reply" 
										width={14} 
										height={14} 
									/>
									Reply
								</DropdownMenuItem>
							)}
							<DropdownMenuItem>
								<Image 
									src="/images/messages/copy.svg" 
									alt="Copy" 
									width={14} 
									height={14} 
								/>
								Copy Text
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Image 
									src="/images/messages/pin.svg" 
									alt="Pin" 
									width={14} 
									height={14} 
								/>
								Pin
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Image 
									src="/images/messages/arrow-uturn-right.svg" 
									alt="Forward" 
									width={14} 
									height={14} 
								/>
								Forward
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Image 
									src="/images/messages/check-square-broken.svg" 
									alt="Select" 
									width={14} 
									height={14} 
								/>
								Select
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Image 
									src="/images/messages/flag.svg" 
									alt="Report" 
									width={14} 
									height={14} 
								/>
								Report
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Image 
									src="/images/messages/delete-icon.svg" 
									alt="Delete" 
									width={14} 
									height={14} 
								/>
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				
				{/* Emoji picker panel for action buttons */}
				{openEmojiId === message.id && (
					<div className="absolute top-4 right-2 z-50 emoji-picker-container">
						<EmojiPicker 
							onEmojiClick={(e) => {
								onEmojiReaction(message.id, e.emoji)
								setOpenEmojiId(null)
							}} 
							width={300}
							height={400}
						/>
					</div>
				)}
				
				{/* Emoji picker panel for emoticons display */}
				{openEmoticonsEmojiId === message.id && (
					<div className="absolute bottom-8 left-0 z-50 emoticon-picker-container">
						<EmojiPicker 
							onEmojiClick={(e) => {
								onEmojiReaction(message.id, e.emoji)
								setOpenEmoticonsEmojiId(null)
							}} 
							width={300}
							height={400}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

// Helper function to check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
	return date1.getFullYear() === date2.getFullYear() &&
		   date1.getMonth() === date2.getMonth() &&
		   date1.getDate() === date2.getDate()
}
