'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
	Smile, 
	AtSign, 
	Image as ImageIcon, 
	Plus, 
	ArrowUp, 
	Hash, 
	X 
} from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import ChannelSelector from './channel-selector'

type ComposerActionsProps = {
	disabled?: boolean
	channelId: string
	selectedChannelForMessage: string | null
	onChannelSelect: (channelId: string) => void
	channelsFromStore: any[]
	onSend: () => void
	hasInput: boolean
	onEmojiToggle: () => void
	onAtButtonClick: () => void
	onEmojiInsert: (emoji: string) => void
	showEmoji: boolean
	showBoardList: boolean
	onShowBoardList: (show: boolean) => void
	onShowPlusDropdown: (show: boolean) => void
	showPlusDropdown: boolean
}

export default function ComposerActions({
	disabled = false,
	channelId,
	selectedChannelForMessage,
	onChannelSelect,
	channelsFromStore,
	onSend,
	hasInput,
	onEmojiToggle,
	onAtButtonClick,
	onEmojiInsert,
	showEmoji,
	showBoardList,
	onShowBoardList,
	onShowPlusDropdown,
	showPlusDropdown
}: ComposerActionsProps) {
	const [plusDropdownPosition, setPlusDropdownPosition] = useState<{ x: number; y: number } | null>(null)

	return (
		<div className="relative flex items-center justify-between p-2">
			<div className="flex items-center pl-1 gap-2">
				{/* Plus button dropdown */}
				<div className="relative plus-dropdown-container">
					<DropdownMenu
						open={showPlusDropdown}
						onOpenChange={(open) => {
							onShowPlusDropdown(open)
							if (open) {
								const button = document.querySelector('.plus-dropdown-container button')
								if (button) {
									const rect = button.getBoundingClientRect()
									setPlusDropdownPosition({ x: rect.left, y: rect.top })
								}
							}
						}}
					>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								disabled={disabled}
								className="size-[24px] p-0 box-border cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<Plus className="size-[14px]" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-32"
							side="top"
							align="start"
							sideOffset={8}
						>
							<DropdownMenuItem
								onClick={() => {
									onShowPlusDropdown(false)
									onShowBoardList(true)
								}}
								className="text-sm text-black font-medium cursor-pointer"
							>
								Board
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									onShowPlusDropdown(false)
									// TODO: Handle Analytics action
								}}
								className="text-sm text-black font-medium cursor-pointer"
							>
								Analytics
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Board button */}
				<Button
					variant="ghost"
					onClick={onEmojiToggle}
					size="icon"
					disabled={disabled}
					className="size-[24px] p-0 box-border cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<ImageIcon className="size-[14px]" />
				</Button>

				{/* Emoji button */}
				<Button
					variant="ghost"
					onClick={onEmojiToggle}
					size="icon"
					className="size-[24px] p-0 box-border cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10"
				>
					<Smile className="size-[14px]" />
				</Button>

				{/* Emoji picker */}
				{showEmoji && (
					<div className="absolute bottom-12 left-0 z-50 composer-emoji-picker-container">
						<EmojiPicker
							onEmojiClick={(e) => {
								onEmojiInsert(e.emoji)
							}}
						/>
					</div>
				)}

				{/* @ button */}
				<Button
					variant="ghost"
					size="icon"
					disabled={disabled}
					className="size-[24px] p-0 box-border cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10 disabled:opacity-50 disabled:cursor-not-allowed"
					onClick={onAtButtonClick}
				>
					<AtSign className="size-[14px]" />
				</Button>

				{/* Channel selector for all messages view */}
				{channelId === 'all' && !selectedChannelForMessage && (
					<ChannelSelector
						onChannelSelect={onChannelSelect}
						selectedChannelId={selectedChannelForMessage}
						onClose={() => onChannelSelect('')}
					/>
				)}

				{/* Channel indicator for all messages view */}
				{channelId === 'all' && selectedChannelForMessage && (
					<div className="flex items-center h-[24px] gap-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded-sm">
						<Hash className="h-3 w-3 text-blue-600" />
						<span className="text-xs text-blue-700 font-medium">
							{channelsFromStore.find((c: any) => c.id === selectedChannelForMessage)?.name || selectedChannelForMessage}
						</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => onChannelSelect('')}
							className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800"
						>
							<X className="h-3 w-3" />
						</Button>
					</div>
				)}
			</div>
			<div className="flex items-center pl-1">
				{/* Send button */}
				<Button
					onClick={onSend}
					disabled={!hasInput || disabled}
					className="size-[24px] p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<ArrowUp className="size-[14px]" />
				</Button>
			</div>
		</div>
	)
}
