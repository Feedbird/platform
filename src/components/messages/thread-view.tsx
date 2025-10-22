'use client'

import { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
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

type ThreadViewProps = {
	selectedThreadMessage: MessageData | null
	filteredMessages: MessageData[]
	channelId: string
	channelsFromStore: any[]
	onBackToGeneral: () => void
	onSendMessage: (messageContent: string, addonData?: any) => Promise<void>
	onEmojiReaction: (messageId: string, emoji: string) => Promise<void>
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
	activeWorkspaceId: string | null
	supabase: any
	supabaseInitialized: boolean
}

export default function ThreadView({
	selectedThreadMessage,
	filteredMessages,
	channelId,
	channelsFromStore,
	onBackToGeneral,
	onSendMessage,
	onEmojiReaction,
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
	activeWorkspaceId,
	supabase,
	supabaseInitialized
}: ThreadViewProps) {
	const endRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [filteredMessages.length])

	const handleSend = async (messageContent: string, addonData?: any) => {
		if (!selectedThreadMessage) return
		await onSendMessage(messageContent, addonData)
	}

	return (
		<div className="flex-1 min-h-0 overflow-hidden bg-white relative flex flex-col">
			{/* Original message */}
			{selectedThreadMessage && (
				<div className="px-4 pt-4 pb-[150px] overflow-auto">
					<MessageItem
						message={selectedThreadMessage}
						channelId={channelId}
						channelsFromStore={channelsFromStore}
						showChannelName={true}
						showReplyButton={false}
						onEmojiReaction={onEmojiReaction}
						openDropdownId={openDropdownId}
						setOpenDropdownId={setOpenDropdownId}
						openEmojiId={openEmojiId}
						setOpenEmojiId={setOpenEmojiId}
						openEmoticonsEmojiId={openEmoticonsEmojiId}
						setOpenEmoticonsEmojiId={setOpenEmoticonsEmojiId}
						formatTimeOnly={formatTimeOnly}
						onBoardQuickView={onBoardQuickView}
					/>

					{/* Thread replies */}
					{(() => {
						const threadReplies = filteredMessages
							.filter(m => (m as any).parentId === selectedThreadMessage?.id)
							.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) // Sort replies by time

						if (threadReplies.length === 0) {
							return (
								<div className="flex items-center justify-center py-8">
									<div className="text-sm text-grey">No replies yet. Start the conversation!</div>
								</div>
							)
						}

						return threadReplies.map((m, idx) => (
							<div key={m.id}>
								<MessageItem
									message={m}
									channelId={channelId}
									channelsFromStore={channelsFromStore}
									showChannelName={true}
									showReplyButton={false}
									onEmojiReaction={onEmojiReaction}
									openDropdownId={openDropdownId}
									setOpenDropdownId={setOpenDropdownId}
									openEmojiId={openEmojiId}
									setOpenEmojiId={setOpenEmojiId}
									openEmoticonsEmojiId={openEmoticonsEmojiId}
									setOpenEmoticonsEmojiId={setOpenEmoticonsEmojiId}
									formatTimeOnly={formatTimeOnly}
									onBoardQuickView={onBoardQuickView}
								/>
							</div>
						))
					})()}
					<div ref={endRef} />
				</div>
			)}

			{/* Thread composer pinned to bottom */}
			<div className="absolute bottom-4 left-4 right-4 flex justify-center">
				<MessageComposer
					channelId={channelId}
					selectedChannelForMessage={channelId === 'all' ? channelId : null}
					onChannelSelect={() => {}}
					onSend={handleSend}
					placeholder="Reply to thread..."
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
