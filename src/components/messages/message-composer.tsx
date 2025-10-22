'use client'

import { useRef } from 'react'
import { useComposerState } from '@/hooks/use-composer-state'
import MessageInput from './message-input'
import MentionDropdown from './mention-dropdown'
import BoardSelector, { SelectedBoardsDisplay } from './board-selector'
import ComposerActions from './composer-actions'

type MessageComposerProps = {
	channelId: string
	selectedChannelForMessage: string | null
	onChannelSelect: (channelId: string) => void
	onSend: (messageContent: string, addonData?: any) => Promise<void>
	disabled?: boolean
	placeholder?: string
	channelsFromStore: any[]
	boardNav: any[]
	selectedBoards: string[]
	onBoardSelection: (boardId: string) => void
	onBoardQuickView: (boardId: string) => void
	activeWorkspaceId: string | null
	supabase: any
	supabaseInitialized: boolean
}

export default function MessageComposer({
	channelId,
	selectedChannelForMessage,
	onChannelSelect,
	onSend,
	disabled = false,
	placeholder = "Type a message...",
	channelsFromStore,
	boardNav,
	selectedBoards,
	onBoardSelection,
	onBoardQuickView,
	activeWorkspaceId,
	supabase,
	supabaseInitialized
}: MessageComposerProps) {
	const messageInputRef = useRef<any>(null)

	const {
		input,
		setInput,
		emoji,
		setEmoji,
		showPlusDropdown,
		setShowPlusDropdown,
		showBoardList,
		setShowBoardList,
		showMentions,
		mentionQuery,
		filteredMembers,
		selectedMentionIndex,
		mentionDropdownPosition,
		workspaceMembers,
		typingDisplay,
		notifyTyping,
		stopTyping,
		handleMentionDetected,
		handleMentionHidden,
		handleKeyDown
	} = useComposerState(activeWorkspaceId, supabase, channelId, supabaseInitialized)

	const handleInput = (value: string, html: string) => {
		setInput(value)
		// Notify typing for real-time
		if (channelId !== 'all' || selectedChannelForMessage) {
			notifyTyping()
		}
	}

	const handleKeyDownWithActions = (e: React.KeyboardEvent<HTMLDivElement>) => {
		const result = handleKeyDown(e)
		
		if (result?.type === 'mention-select') {
			if (messageInputRef.current?.handleMentionSelect) {
				messageInputRef.current.handleMentionSelect(result.member, mentionQuery)
			}
		} else if (result?.type === 'send') {
			handleSend()
		}
	}

	const handleSend = async () => {
		let messageContent = ''
		
		if (messageInputRef.current?.getCurrentContent) {
			messageContent = messageInputRef.current.getCurrentContent()
		} else {
			messageContent = input.trim()
		}

		if (!messageContent) return

		// Prepare addon data for selected boards
		let addonData = undefined;
		if (selectedBoards.length > 0) {
			addonData = {
				boards: selectedBoards,
				analytics: []
			};
		}

		try {
			await onSend(messageContent, addonData)
			setInput('')
			setEmoji(false)
			stopTyping()
			
			if (messageInputRef.current?.clearInput) {
				messageInputRef.current.clearInput()
			}
		} catch (e) {
			console.error('Failed to send message', e)
		}
	}

	const handleEmojiToggle = () => {
		if (messageInputRef.current?.setStoredCaretPosition) {
			messageInputRef.current.setStoredCaretPosition(0)
		}
		setEmoji(x => !x)
	}

	const handleEmojiInsert = (emoji: string) => {
		if (messageInputRef.current?.handleEmojiInsert) {
			messageInputRef.current.handleEmojiInsert(emoji)
		}
		setEmoji(false)
	}

	const handleAtButtonClick = () => {
		if (messageInputRef.current?.handleAtButtonClick) {
			messageInputRef.current.handleAtButtonClick()
		}
	}

	const handleMentionSelect = (member: any) => {
		if (messageInputRef.current?.handleMentionSelect) {
			messageInputRef.current.handleMentionSelect(member, mentionQuery)
		}
	}

	return (
		<div className="w-full border border-grey/20 border-solid border-2 rounded-sm bg-white">
			{/* Message Input */}
			<MessageInput
				ref={messageInputRef}
				placeholder={placeholder}
				onInput={handleInput}
				onKeyDown={handleKeyDownWithActions}
				onMentionDetected={handleMentionDetected}
				onMentionHidden={handleMentionHidden}
				disabled={disabled}
			/>

			{/* Selected Boards Display */}
			<SelectedBoardsDisplay
				selectedBoards={selectedBoards}
				boardNav={boardNav}
				onBoardSelection={onBoardSelection}
			/>

			{/* Typing indicator */}
			{typingDisplay && (channelId !== 'all' || selectedChannelForMessage) && (
				<div className="px-3 pb-1 text-[12px] text-grey">{typingDisplay}</div>
			)}

			{/* Composer Actions */}
			<ComposerActions
				disabled={disabled}
				channelId={channelId}
				selectedChannelForMessage={selectedChannelForMessage}
				onChannelSelect={onChannelSelect}
				channelsFromStore={channelsFromStore}
				onSend={handleSend}
				hasInput={!!input.trim()}
				onEmojiToggle={handleEmojiToggle}
				onAtButtonClick={handleAtButtonClick}
				onEmojiInsert={handleEmojiInsert}
				showEmoji={emoji}
				showBoardList={showBoardList}
				onShowBoardList={setShowBoardList}
				onShowPlusDropdown={setShowPlusDropdown}
				showPlusDropdown={showPlusDropdown}
			/>

			{/* Mention Dropdown */}
			<MentionDropdown
				showMentions={showMentions}
				filteredMembers={filteredMembers}
				selectedMentionIndex={selectedMentionIndex}
				mentionDropdownPosition={mentionDropdownPosition}
				onMentionSelect={handleMentionSelect}
				mentionQuery={mentionQuery}
			/>

			{/* Board Selector */}
			<BoardSelector
				boardNav={boardNav}
				selectedBoards={selectedBoards}
				onBoardSelection={onBoardSelection}
				showBoardList={showBoardList}
				onClose={() => setShowBoardList(false)}
			/>
		</div>
	)
}