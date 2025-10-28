'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, ArrowLeft } from 'lucide-react'
import { useMessageStore, useUserStore, useWorkspaceStore } from '@/lib/store'
import { workspaceHelperApi } from '@/lib/api/api-service'
import { useSupabaseClient } from '@/hooks/use-supabase-client'
import { useRealtimeSubscriptions } from '@/hooks/use-realtime-subscriptions'
import { useTypingIndicator } from '@/hooks/use-typing-indicator'
import MessagesSidebar from './messages-sidebar'
import ThreadView from './thread-view'
import GeneralView from './general-view'

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

type MemberItem = {
	email?: string
	name: string
	role: string
	imageUrl?: string
}

type MessagesPaneProps = {
	channelName?: string
	channelDescription?: string
	members?: MemberItem[]
}

export default function MessagesPane({ 
	channelName, 
	channelDescription, 
	members: membersProp 
}: MessagesPaneProps) {
	const searchParams = useSearchParams()
	const channelId = searchParams.get('channel') ?? 'all'
	const fallbackName = channelId === 'all' ? 'All Messages' : channelId
	const name = channelName ?? fallbackName
	const description = channelDescription ?? 'This is the beginning of the channel. Share updates, ask questions, and collaborate here.'
	const channelCreatedAt = useMemo(() => new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), [])

	const [showSidebar, setShowSidebar] = useState(true)
	const [activeSidebarTab, setActiveSidebarTab] = useState<'info' | 'board' | 'media'>('info')
	const [loadingAllMessages, setLoadingAllMessages] = useState(false)
	const [selectedChannelForMessage, setSelectedChannelForMessage] = useState<string | null>(null)
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
	const [openEmojiId, setOpenEmojiId] = useState<string | null>(null)
	const [openEmoticonsEmojiId, setOpenEmoticonsEmojiId] = useState<string | null>(null)
	const [selectedBoards, setSelectedBoards] = useState<string[]>([])

	// Thread view state
	const [isThreadView, setIsThreadView] = useState(false)
	const [selectedThreadMessage, setSelectedThreadMessage] = useState<MessageData | null>(null)

	// Supabase and hooks
	const { supabase, supabaseInitialized } = useSupabaseClient()
	const activeWorkspaceId = useWorkspaceStore(s => s.activeWorkspaceId)
	const user = useUserStore(s => s.user)
	const sendChannelMessage = useMessageStore(s => s.sendChannelMessage)
	const boardNav = useWorkspaceStore(s => s.boardNav)
	const channelMessagesMap = useMessageStore(s => s.channelMessagesByChannelId)

	// Profiles for real-time updates
	const [profilesByEmail, setProfilesByEmail] = useState<Record<string, { firstName?: string; imageUrl?: string }>>({})
	const profilesRef = useRef<Record<string, { firstName?: string; imageUrl?: string }>>({})

	// Get messages from store
	const messages = channelId === 'all'
		? (channelMessagesMap?.['all'] ?? []) as MessageData[]
		: (channelMessagesMap?.[channelId] ?? []) as MessageData[]

	// Get channels from store
	const EMPTY_CHANNELS: any[] = []
	const rawChannels = useWorkspaceStore((s) => {
		const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId)
		return (ws as any)?.channels ?? EMPTY_CHANNELS
	}) as any[]
	const channelsFromStore = useMemo(() => rawChannels, [rawChannels])
	const currentChannel = useMemo(() => {
		if (channelId === 'all') return null
		return channelsFromStore.find((c: any) => c.id === channelId) || null
	}, [channelsFromStore, channelId])

	// Members state
	const [members, setMembers] = useState<MemberItem[]>(membersProp || [])
	useEffect(() => {
		setMembers(membersProp || [])
	}, [membersProp])

	// Load workspace members for profiles
	useEffect(() => {
		if (!activeWorkspaceId) return
		workspaceHelperApi.getWorkspaceMembers(activeWorkspaceId).then(resp => {
			const map: Record<string, { firstName?: string; imageUrl?: string }> = {}
			for (const u of resp.users) {
				map[u.email] = { firstName: u.firstName, imageUrl: u.imageUrl }
			}
			setProfilesByEmail(map)
		}).catch(() => { })
	}, [activeWorkspaceId])

	useEffect(() => {
		profilesRef.current = profilesByEmail
	}, [profilesByEmail])

	// Use real-time subscriptions
	useRealtimeSubscriptions({
		channelId,
		activeWorkspaceId,
		supabase,
		supabaseInitialized,
		profilesRef
	})

	// Use typing indicator
	const { typingUsers } = useTypingIndicator(supabase, channelId, supabaseInitialized)

	// Sort and filter messages
	const sortedMessages = useMemo(() => {
		return [...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
	}, [messages])

	const filteredMessages = useMemo(() => {
		if (channelId === 'all') {
			const currentWorkspaceChannels = channelsFromStore.map((c: any) => c.id)
			const filtered = sortedMessages.filter((message: any) => {
				const messageChannelId = message.channelId
				const isValid = messageChannelId && currentWorkspaceChannels.includes(messageChannelId)
				return isValid
			})
			return filtered
		}
		return sortedMessages
	}, [sortedMessages, channelId, channelsFromStore])

	// Format functions
	const formatTimeOnly = (date: Date) => {
		const options: Intl.DateTimeFormatOptions = { 
			hour: 'numeric', 
			minute: '2-digit',
			hour12: true 
		}
		return new Intl.DateTimeFormat('en-US', options).format(date)
	}

	// Function to add emoji reaction to a message
	const addEmojiReaction = async (messageId: string, emoji: string) => {
		if (!user?.email || !activeWorkspaceId) return

		try {
			const currentMessage = messages.find(m => m.id === messageId)
			if (!currentMessage) return

			const newReaction = {
				emoji,
				userEmail: user.email,
				userName: user.firstName || user.email,
				createdAt: new Date().toISOString()
			}

			const response = await fetch(`/api/messages/${messageId}/emoticons`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					emoticons: [...(currentMessage.emoticons || []), newReaction]
				})
			})

			if (!response.ok) {
				const errorData = await response.json()
				console.error('Error adding emoji reaction:', errorData.error)
			}
		} catch (error) {
			console.error('Error adding emoji reaction:', error)
		}
	}

	// Function to handle board selection
	const handleBoardSelection = (boardId: string) => {
		setSelectedBoards(prev => {
			if (prev.includes(boardId)) {
				return prev.filter(id => id !== boardId);
			} else {
				return [...prev, boardId];
			}
		});
	};

	// Function to handle board quick view navigation
	const handleBoardQuickView = (boardId: string) => {
		const board = boardNav.find((b: any) => b.id === boardId);
		if (board) {
			// Navigate to board content page
			window.location.href = board.href || `/${activeWorkspaceId}/content/${boardId}`;
		}
	};

	// Function to handle channel selection
	const handleChannelSelect = (channelId: string) => {
		setSelectedChannelForMessage(channelId)
	};

	// Function to send message
	const handleSendMessage = async (messageContent: string, addonData?: any) => {
		// If we're in thread view, send as a reply to the selected message
		if (isThreadView && selectedThreadMessage) {
			await sendChannelMessage(channelId === 'all' ? selectedChannelForMessage! : channelId, messageContent, selectedThreadMessage.id, addonData)
			setSelectedBoards([])
			return
		}

		// If we're in all messages view, we need a selected channel
		if (channelId === 'all' && !selectedChannelForMessage) {
			return
		}

		// Determine which channel to send to
		const targetChannelId = channelId === 'all' ? selectedChannelForMessage! : channelId
		await sendChannelMessage(targetChannelId, messageContent, undefined, addonData)
		setSelectedBoards([])
		setSelectedChannelForMessage(null)
	}

	// Reset to all messages view when workspace changes
	useEffect(() => {
		if (activeWorkspaceId) {
			setIsThreadView(false)
			setSelectedThreadMessage(null)
			setSelectedChannelForMessage(null)
			setSelectedBoards([])

			// Navigate to all messages view for the new workspace
			const currentUrl = new URL(window.location.href)
			if (currentUrl.searchParams.get('channel') !== 'all') {
				currentUrl.searchParams.set('channel', 'all')
				window.history.replaceState({}, '', currentUrl.toString())
			}

			// Clear any existing messages from the previous workspace
			useMessageStore.setState((prev: any) => ({
				channelMessagesByChannelId: {
					...prev.channelMessagesByChannelId,
					all: [],
					...Object.keys(prev.channelMessagesByChannelId || {}).reduce((acc: any, key: string) => {
						if (key !== 'all') {
							acc[key] = []
						}
						return acc
					}, {})
				}
			}))

			// Load all messages for the new workspace
			setLoadingAllMessages(true)
			useMessageStore.getState().loadAllWorkspaceMessages()
				.catch(() => { })
				.finally(() => setLoadingAllMessages(false))
		}
	}, [activeWorkspaceId])

	// Ensure selected thread message belongs to current workspace
	useEffect(() => {
		if (selectedThreadMessage && activeWorkspaceId) {
			const currentWorkspaceChannels = channelsFromStore.map((c: any) => c.id)
			const messageChannelId = (selectedThreadMessage as any).channelId

			if (messageChannelId && !currentWorkspaceChannels.includes(messageChannelId)) {
				setIsThreadView(false)
				setSelectedThreadMessage(null)
			}
		}
	}, [selectedThreadMessage, activeWorkspaceId, channelsFromStore])

	// Load messages when channel changes
	useEffect(() => {
		if (channelId === 'all') {
			setLoadingAllMessages(true)
			useMessageStore.getState().loadAllWorkspaceMessages()
				.catch(() => { })
				.finally(() => setLoadingAllMessages(false))
		} else {
			useMessageStore.getState().loadChannelMessages(channelId).catch(() => { })
		}
	}, [channelId])

	// Set current channel ID in store for unread message logic
	const { setCurrentChannelId } = useMessageStore()
	useEffect(() => {
		setCurrentChannelId(channelId)
		return () => {
			setCurrentChannelId(undefined)
		}
	}, [channelId, setCurrentChannelId])

	// Additional safety: set currentChannelId to null when navigating away from messages
	useEffect(() => {
		const handleRouteChange = () => {
			const currentPath = window.location.pathname
			if (!currentPath.startsWith('/messages')) {
				setCurrentChannelId(undefined)
			}
		}

		window.addEventListener('popstate', handleRouteChange)
		handleRouteChange()

		return () => {
			window.removeEventListener('popstate', handleRouteChange)
			setCurrentChannelId(undefined)
		}
	}, [setCurrentChannelId])

	// Show loading state while Supabase is initializing
	if (!supabaseInitialized) {
		return (
			<div className="h-full w-full flex items-center justify-center">
				<div className="text-sm text-gray-500">Initializing messaging system...</div>
			</div>
		)
	}

	return (
		<div className="h-full w-full flex overflow-hidden">
			{/* Main panel */}
			<div className="flex-1 min-w-0 flex flex-col overflow-hidden">
				{/* Top bar */}
				<div className="h-10.5 px-3 border-b bg-white shrink-0 flex items-center justify-between">
					<div className="flex items-center">
						{isThreadView && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									setIsThreadView(false)
									setSelectedThreadMessage(null)
								}}
								className="size-7 p-0 hover:bg-gray-100"
							>
								<ArrowLeft className="size-[16px]" />
							</Button>
						)}
						<span className="text-sm font-medium text-darkgray">
							{isThreadView ? 'Thread' : 'General'}
						</span>
					</div>
					<div className="flex items-center gap-1.5">
						<Button variant="ghost" size="icon" className="size-7">
							<Image
								src="/images/icons/search.svg"
								alt="Filter"
								width={18}
								height={18}
							/>
						</Button>
						<Button variant="ghost" size="icon" className="size-7">
							<MoreHorizontal className="size-[18px] cursor-pointer" />
						</Button>
						<Button variant="ghost" size="icon" className="size-7" onClick={() => setShowSidebar((s) => !s)}>
							<Image src="/images/icons/header-right.svg" alt="Toggle sidebar" width={18} height={18} />
						</Button>
					</div>
				</div>

				{/* Channel view */}
				{isThreadView ? (
					<ThreadView
						selectedThreadMessage={selectedThreadMessage}
						filteredMessages={filteredMessages}
						channelId={channelId}
						channelsFromStore={channelsFromStore}
						onBackToGeneral={() => {
							setIsThreadView(false)
							setSelectedThreadMessage(null)
						}}
						onSendMessage={handleSendMessage}
						onEmojiReaction={addEmojiReaction}
						openDropdownId={openDropdownId}
						setOpenDropdownId={setOpenDropdownId}
						openEmojiId={openEmojiId}
						setOpenEmojiId={setOpenEmojiId}
						openEmoticonsEmojiId={openEmoticonsEmojiId}
						setOpenEmoticonsEmojiId={setOpenEmoticonsEmojiId}
						formatTimeOnly={formatTimeOnly}
						onBoardQuickView={handleBoardQuickView}
						boardNav={boardNav}
						selectedBoards={selectedBoards}
						onBoardSelection={handleBoardSelection}
						activeWorkspaceId={activeWorkspaceId}
						supabase={supabase}
						supabaseInitialized={supabaseInitialized}
					/>
				) : (
					<GeneralView
						filteredMessages={filteredMessages}
						channelId={channelId}
						channelsFromStore={channelsFromStore}
						currentChannel={currentChannel}
						name={name}
						description={description}
						loadingAllMessages={loadingAllMessages}
						onSendMessage={handleSendMessage}
						onEmojiReaction={addEmojiReaction}
						onReplyClick={(message) => {
							setSelectedThreadMessage(message)
							setIsThreadView(true)
						}}
						openDropdownId={openDropdownId}
						setOpenDropdownId={setOpenDropdownId}
						openEmojiId={openEmojiId}
						setOpenEmojiId={setOpenEmojiId}
						openEmoticonsEmojiId={openEmoticonsEmojiId}
						setOpenEmoticonsEmojiId={setOpenEmoticonsEmojiId}
						formatTimeOnly={formatTimeOnly}
						onBoardQuickView={handleBoardQuickView}
						boardNav={boardNav}
						selectedBoards={selectedBoards}
						onBoardSelection={handleBoardSelection}
						selectedChannelForMessage={selectedChannelForMessage}
						onChannelSelect={handleChannelSelect}
						activeWorkspaceId={activeWorkspaceId}
						supabase={supabase}
						supabaseInitialized={supabaseInitialized}
					/>
				)}
			</div>

			{/* Right sidebar */}
			{showSidebar && (
				<MessagesSidebar
					members={members}
					channelCreatedAt={channelCreatedAt}
					activeSidebarTab={activeSidebarTab}
					onTabChange={setActiveSidebarTab}
					activeWorkspaceId={activeWorkspaceId}
					onBoardQuickView={handleBoardQuickView}
				/>
			)}
		</div>
	)
}