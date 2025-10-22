'use client'

import { useRef, useEffect, useMemo } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import MessageItem from './message-item'
import MessageComposer from './message-composer'
import { formatTimeAgo } from '@/lib/utils'

type MessageData = {
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
	addon?: any
}

type GeneralViewProps = {
	filteredMessages: MessageData[]
	channelId: string
	channelsFromStore: any[]
	currentChannel: any
	name: string
	description: string
	loadingAllMessages: boolean
	onSendMessage: (messageContent: string, addonData?: any) => Promise<void>
	onEmojiReaction: (messageId: string, emoji: string) => Promise<void>
	onReplyClick: (message: MessageData) => void
	openDropdownId: string | null
	setOpenDropdownId: (id: string | null) => void
	openEmojiId: string | null
	setOpenEmojiId: (id: string | null) => void
	openEmoticonsEmojiId: string | null
	setOpenEmoticonsEmojiId: (id: string | null) => void
	formatTimeOnly: (date: Date) => string
	onBoardQuickView: (boardId: string) => void
	boardNav: any[]
	selectedBoards: string[]
	onBoardSelection: (boardId: string) => void
	selectedChannelForMessage: string | null
	onChannelSelect: (channelId: string) => void
	activeWorkspaceId: string | null
	supabase: any
	supabaseInitialized: boolean
}

export default function GeneralView({
	filteredMessages,
	channelId,
	channelsFromStore,
	currentChannel,
	name,
	description,
	loadingAllMessages,
	onSendMessage,
	onEmojiReaction,
	onReplyClick,
	openDropdownId,
	setOpenDropdownId,
	openEmojiId,
	setOpenEmojiId,
	openEmoticonsEmojiId,
	setOpenEmoticonsEmojiId,
	formatTimeOnly,
	onBoardQuickView,
	boardNav,
	selectedBoards,
	onBoardSelection,
	selectedChannelForMessage,
	onChannelSelect,
	activeWorkspaceId,
	supabase,
	supabaseInitialized
}: GeneralViewProps) {
	const endRef = useRef<HTMLDivElement>(null)

	const formatDayLabel = (date: Date) => {
		if (isToday(date)) return 'Today'
		if (isYesterday(date)) return 'Yesterday'
		return format(date, 'EEEE, MMMM do')
	}

	// Get parent messages for display
	const parentMessages = useMemo(() => {
		return filteredMessages.filter(m => !(m as any).parentId)
	}, [filteredMessages])

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [filteredMessages.length])

	const handleSend = async (messageContent: string, addonData?: any) => {
		// If we're in all messages view, we need a selected channel
		if (channelId === 'all' && !selectedChannelForMessage) {
			return
		}

		// Determine which channel to send to
		const targetChannelId = channelId === 'all' ? selectedChannelForMessage! : channelId
		await onSendMessage(messageContent, addonData)
	}

	return (
		<div className="flex-1 min-h-0 overflow-hidden bg-white relative flex flex-col">
			{/* Channel info */}
			<div className="px-4 pt-5 pb-3 gap-3 flex flex-col items-center">
				<div className="text-xl text-black font-semibold text-center">
					{channelId === 'all' ? 'All Workspace Messages' : `Welcome to ${currentChannel?.name ?? name}`}
				</div>
				<div className="text-xs font-normal text-grey break-words">
					{channelId === 'all'
						? selectedChannelForMessage
							? `Viewing all messages • Sending to #${channelsFromStore.find((c: any) => c.id === selectedChannelForMessage)?.name || selectedChannelForMessage}`
							: 'View all messages from all channels in this workspace'
						: (currentChannel?.description ?? description)
					}
				</div>
			</div>

			{/* Messages list (scrollable) */}
			<div className="flex-1 min-h-0 px-4 py-3 pb-[150px] overflow-auto">
				<div className="w-full">
					{channelId === 'all' && loadingAllMessages && (
						<div className="flex items-center justify-center py-8">
							<div className="text-sm text-grey">Loading all workspace messages...</div>
						</div>
					)}
					{!loadingAllMessages && channelId === 'all' && filteredMessages.length === 0 && (
						<div className="flex items-center justify-center py-8">
							<div className="text-sm text-grey">No messages found in this workspace</div>
						</div>
					)}
					{!loadingAllMessages && parentMessages.map((m, idx) => {
						const showDay = idx === 0 || (idx > 0 && !isSameDay(parentMessages[idx - 1].createdAt, m.createdAt))
						
						// Get replies for this message
						const replies = filteredMessages.filter(reply => (reply as any).parentId === m.id)

						return (
							<div key={m.id}>
								{showDay && (
									<div className="flex items-center gap-2">
										<div className="flex-1 border-t border-elementStroke" />
										<span className="text-xs text-grey whitespace-nowrap">{formatDayLabel(m.createdAt)}</span>
										<div className="flex-1 border-t border-elementStroke" />
									</div>
								)}

								{/* Message content with MessageItem component */}
								<MessageItem
									message={m}
									channelId={channelId}
									channelsFromStore={channelsFromStore}
									showChannelName={channelId === 'all'}
									showReplyButton={true}
									onReplyClick={() => onReplyClick(m)}
									onEmojiReaction={onEmojiReaction}
									openDropdownId={openDropdownId}
									setOpenDropdownId={setOpenDropdownId}
									openEmojiId={openEmojiId}
									setOpenEmojiId={setOpenEmojiId}
									openEmoticonsEmojiId={openEmoticonsEmojiId}
									setOpenEmoticonsEmojiId={setOpenEmoticonsEmojiId}
									formatTimeOnly={formatTimeOnly}
									showDaySeparator={false}
									replies={replies}
									onReplySummaryClick={() => onReplyClick(m)}
									formatTimeAgo={formatTimeAgo}
									onBoardQuickView={onBoardQuickView}
								/>
							</div>
						)
					})}
					<div ref={endRef} />
				</div>
			</div>

			{/* Composer pinned to bottom */}
			<div className="absolute bottom-4 left-4 right-4 flex justify-center">
				<MessageComposer
					channelId={channelId}
					selectedChannelForMessage={selectedChannelForMessage}
					onChannelSelect={onChannelSelect}
					onSend={handleSend}
					disabled={channelId === 'all' && !selectedChannelForMessage}
					channelsFromStore={channelsFromStore}
					boardNav={boardNav}
					selectedBoards={selectedBoards}
					onBoardSelection={onBoardSelection}
					onBoardQuickView={onBoardQuickView}
					activeWorkspaceId={activeWorkspaceId}
					supabase={supabase}
					supabaseInitialized={supabaseInitialized}
				/>
			</div>
		</div>
	)
}
