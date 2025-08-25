'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, formatTimeAgo } from '@/lib/utils'
import { MoreHorizontal, Send, Smile, AtSign, Image as ImageIcon, Plus, Mic, ArrowUp, Hash, X, Reply, Copy, Pin, Forward, CheckSquare, Flag, Trash2, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import EmojiPicker from 'emoji-picker-react'
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store'
import { workspaceHelperApi, postApi, userApi } from '@/lib/api/api-service'
import { supabase, ChannelMessage as DbChannelMessage } from '@/lib/supabase/client'
import ChannelSelector from './channel-selector'
import MessageItem from './message-item'

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

type WorkspaceMember = {
	email: string
	first_name?: string
	image_url?: string
}

export default function MessagesPane({ channelName, channelDescription, members: membersProp }: { channelName?: string; channelDescription?: string; members?: MemberItem[] }) {
	const searchParams = useSearchParams()
	const router = useRouter()
	const channelId = searchParams.get('channel') ?? 'all'
	const fallbackName = channelId === 'all' ? 'All Messages' : channelId
	const name = channelName ?? fallbackName
	const description = channelDescription ?? 'This is the beginning of the channel. Share updates, ask questions, and collaborate here.'
	const channelCreatedAt = useMemo(() => new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), [])

	const [showSidebar, setShowSidebar] = useState(true)
	const [activeSidebarTab, setActiveSidebarTab] = useState<'info' | 'board' | 'media'>('info')

	const endRef = useRef<HTMLDivElement>(null)
	const textareaRef = useRef<HTMLDivElement | HTMLTextAreaElement>(null)
	const [input, setInput] = useState('')
	const [emoji, setEmoji] = useState(false)
	const [storedCaretPosition, setStoredCaretPosition] = useState(0)
	const [loadingAllMessages, setLoadingAllMessages] = useState(false)
	const [selectedChannelForMessage, setSelectedChannelForMessage] = useState<string | null>(null)
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
	const [openEmojiId, setOpenEmojiId] = useState<string | null>(null)
	const [openEmoticonsEmojiId, setOpenEmoticonsEmojiId] = useState<string | null>(null)

	// @mention functionality
	const [showMentions, setShowMentions] = useState(false)
	const [mentionQuery, setMentionQuery] = useState('')
	const [mentionPosition, setMentionPosition] = useState<{ start: number; end: number } | null>(null)
	const [filteredMembers, setFilteredMembers] = useState<WorkspaceMember[]>([])
	const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
	const [mentionDropdownPosition, setMentionDropdownPosition] = useState<{ x: number; y: number } | null>(null)
	const [previousHTML, setPreviousHTML] = useState('')
	const [showPlusDropdown, setShowPlusDropdown] = useState(false)
	const [showBoardList, setShowBoardList] = useState(false)
	const [plusDropdownPosition, setPlusDropdownPosition] = useState<{ x: number; y: number } | null>(null)
	const [selectedBoards, setSelectedBoards] = useState<string[]>([])

	// Thread view state
	const [isThreadView, setIsThreadView] = useState(false)
	const [selectedThreadMessage, setSelectedThreadMessage] = useState<MessageData | null>(null)

	// Board list state
	const [boardData, setBoardData] = useState<Array<{
		id: string
		label: string
		image?: string
		color?: string
		totalPosts: number
		statusCounts: Record<string, number>
		postsByStatus: Record<string, any[]>
		expanded: boolean
	}>>([])
	const [loadingBoardData, setLoadingBoardData] = useState(false)

	// Close emoji pickers when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Element

			// Close plus dropdown
			if (showPlusDropdown && !target.closest('.plus-dropdown-container')) {
				setShowPlusDropdown(false)
			}

			// Close board list
			if (showBoardList && !target.closest('.board-list-container')) {
				setShowBoardList(false)
			}

			// Close emoticons display emoji picker
			if (openEmoticonsEmojiId && !target.closest('.emoticon-picker-container')) {
				setOpenEmoticonsEmojiId(null)
			}

			// Close action buttons emoji picker
			if (openEmojiId && !target.closest('.emoji-picker-container')) {
				setOpenEmojiId(null)
			}

			// Close composer emoji picker
			if (emoji && !target.closest('.composer-emoji-picker-container')) {
				setEmoji(false)
			}

			// Close mentions dropdown
			if (showMentions && !target.closest('.mentions-dropdown')) {
				setShowMentions(false)
				setMentionQuery('')
				setMentionPosition(null)
				setMentionDropdownPosition(null)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [openEmoticonsEmojiId, openEmojiId, emoji, showMentions, showPlusDropdown, showBoardList])
	const channelMessagesMap = useFeedbirdStore(s => s.channelMessagesByChannelId)

	// Function to add emoji reaction to a message
	const addEmojiReaction = async (messageId: string, emoji: string) => {
		if (!user?.email || !activeWorkspaceId) return

		try {
			// Get current message
			const currentMessage = messages.find(m => m.id === messageId)
			if (!currentMessage) return

			// Prepare new emoji reaction
			const newReaction = {
				emoji,
				userEmail: user.email,
				userName: user.firstName || user.email,
				createdAt: new Date().toISOString()
			}

			// Real-time subscription will handle UI updates for all users

			// Update database
			const { error } = await supabase
				.from('channel_messages')
				.update({
					emoticons: [...(currentMessage.emoticons || []), newReaction]
				})
				.eq('id', messageId)

			if (error) {
				console.error('Error adding emoji reaction:', error)
				// Revert local state on error
				if (channelId === 'all') {
					useFeedbirdStore.setState(state => ({
						channelMessagesByChannelId: {
							...state.channelMessagesByChannelId,
							'all': messages
						}
					}))
				} else {
					useFeedbirdStore.setState(state => ({
						channelMessagesByChannelId: {
							...state.channelMessagesByChannelId,
							[channelId]: messages
						}
					}))
				}
			}
		} catch (error) {
			console.error('Error adding emoji reaction:', error)
		}
	}
	const messages = channelId === 'all'
		? (channelMessagesMap?.['all'] ?? []) as MessageData[]
		: (channelMessagesMap?.[channelId] ?? []) as MessageData[]
	const activeWorkspaceId = useFeedbirdStore(s => s.activeWorkspaceId)
	const user = useFeedbirdStore(s => s.user)
	// Removed store subscriptions for loadChannelMessages and loadAllWorkspaceMessages to prevent re-renders
	const sendChannelMessage = useFeedbirdStore(s => s.sendChannelMessage)
	const boardNav = useFeedbirdStore(s => s.boardNav)
	const getAllPosts = useFeedbirdStore(s => s.getAllPosts)

	// Fetch board data when workspace changes
	useEffect(() => {
		if (activeWorkspaceId && boardNav.length > 0) {
			fetchBoardData()
		}
	}, [activeWorkspaceId, boardNav.length])

	// Function to get board count (similar to sidebar)
	const getBoardCount = (board_id: string): number => {
		const posts = getAllPosts();
		return posts.filter((p: any) => p.board_id === board_id).length;
	};

	// Function to handle board selection
	const handleBoardSelection = (board_id: string) => {
		setSelectedBoards(prev => {
			if (prev.includes(board_id)) {
				return prev.filter(id => id !== board_id);
			} else {
				return [...prev, board_id];
			}
		});
	};



	// Function to handle board quick view navigation
	const handleBoardQuickView = (board_id: string) => {
		// Find the board in boardNav
		const board = boardNav.find(b => b.id === board_id);
		if (board) {
			// Use the same navigation method as app-sidebar
			// This will navigate to the board content page and show the post table
			router.push(board.href || `/${activeWorkspaceId}/content/${board_id}`);
		}
	};

	// Function to fetch board data with post counts and actual posts
	const fetchBoardData = async () => {
		if (!activeWorkspaceId || boardNav.length === 0) return

		setLoadingBoardData(true)
		try {
			const boardDataWithCounts = await Promise.all(
				boardNav.map(async (board) => {
					try {
						// Fetch posts for this board
						const posts = await postApi.getPost({ board_id: board.id })
						const postsArray = Array.isArray(posts) ? posts : [posts]

						// Calculate status counts and store actual posts
						const statusCounts: Record<string, number> = {}
						const postsByStatus: Record<string, any[]> = {}

						postsArray.forEach((post: any) => {
							const status = post.status || 'Draft'
							statusCounts[status] = (statusCounts[status] || 0) + 1

							if (!postsByStatus[status]) {
								postsByStatus[status] = []
							}
							postsByStatus[status].push(post)
						})

						return {
							id: board.id,
							label: board.label,
							image: board.image,
							color: board.color,
							totalPosts: postsArray.length,
							statusCounts,
							postsByStatus,
							expanded: false
						}
					} catch (error) {
						console.error(`Error fetching posts for board ${board.id}:`, error)
						return {
							id: board.id,
							label: board.label,
							image: board.image,
							color: board.color,
							totalPosts: 0,
							statusCounts: {},
							postsByStatus: {},
							expanded: false
						}
					}
				})
			)

			setBoardData(boardDataWithCounts)
		} catch (error) {
			console.error('Error fetching board data:', error)
		} finally {
			setLoadingBoardData(false)
		}
	}

	// Function to toggle board card expansion
	const toggleBoardExpansion = (board_id: string) => {
		setBoardData(prev => prev.map(board =>
			board.id === board_id
				? { ...board, expanded: !board.expanded }
				: board
		))
	}

	// Function to generate post preview (using same logic as grid-view)
	const getPostThumbnail = (post: any): string => {
		// Get the first block with media
		const mediaBlock = post.blocks?.find((block: any) => {
			const currentVer = block.versions?.find((v: any) => v.id === block.currentVersionId);
			return currentVer && (currentVer.file?.kind === "image" || currentVer.file?.kind === "video");
		});

		if (mediaBlock) {
			const currentVer = mediaBlock.versions?.find((v: any) => v.id === mediaBlock.currentVersionId);
			if (currentVer) {
				// Append version id for video files to ensure proper cache busting (aligns with calendar view)
				return currentVer.file.kind === "video"
					? `${currentVer.file.url}?v=${currentVer.id}`
					: currentVer.file.url;
			}
		}

		// Fallback to a placeholder
		return "/images/format/image.svg";
	};

	// Function to check if post is video
	const isVideo = (post: any): boolean => {
		// Match the same "first media block" selection logic as getPostThumbnail
		const mediaBlock = post.blocks?.find((block: any) => {
			const currentVer = block.versions?.find((v: any) => v.id === block.currentVersionId);
			return currentVer && (currentVer.file?.kind === "image" || currentVer.file?.kind === "video");
		});

		if (!mediaBlock) return false;

		const currentVer = mediaBlock.versions?.find((v: any) => v.id === mediaBlock.currentVersionId);
		return currentVer?.file?.kind === "video";
	};



	// Thread view real-time subscription for parent message updates
	useEffect(() => {
		if (!isThreadView || !selectedThreadMessage || !activeWorkspaceId) return

		// Subscribe to updates on the specific parent message
		const threadMessageChannel = supabase
			.channel(`thread_message:${selectedThreadMessage.id}`)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'channel_messages',
					filter: `id=eq.${selectedThreadMessage.id}`
				},
				(payload: any) => {
					const updatedMessage = payload.new as DbChannelMessage

					// Update the selected thread message with new emoticons and addon
					if (updatedMessage.emoticons || updatedMessage.addon) {
						setSelectedThreadMessage(prev => prev ? {
							...prev,
							emoticons: (updatedMessage as any).emoticons || prev.emoticons,
							addon: (updatedMessage as any).addon || prev.addon
						} : null)
					}

					// Also update in the store to keep everything in sync
					useFeedbirdStore.setState((prev: any) => {
						const byId = prev.channelMessagesByChannelId || {}
						const channelMessages = byId[channelId] || []
						const allMessages = byId['all'] || []

						// Update in channel messages
						const updatedChannelMessages = channelMessages.map((msg: any) =>
							msg.id === updatedMessage.id ? { ...msg, emoticons: (updatedMessage as any).emoticons, addon: (updatedMessage as any).addon } : msg
						)

						// Update in all messages
						const updatedAllMessages = allMessages.map((msg: any) =>
							msg.id === updatedMessage.id ? { ...msg, emoticons: (updatedMessage as any).emoticons, addon: (updatedMessage as any).addon } : msg
						)

						return {
							channelMessagesByChannelId: {
								...byId,
								[channelId]: updatedChannelMessages,
								all: updatedAllMessages,
							},
						}
					})
				}
			)

		threadMessageChannel.subscribe()

		return () => {
			supabase.removeChannel(threadMessageChannel)
		}
	}, [isThreadView, selectedThreadMessage?.id, channelId, activeWorkspaceId])

	const EMPTY_CHANNELS: any[] = []



	const rawChannels = useFeedbirdStore((s) => {
		const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId)
		return (ws as any)?.channels ?? EMPTY_CHANNELS
	}) as any[]
	const channelsFromStore = useMemo(() => rawChannels, [rawChannels])
	const currentChannel = useMemo(() => {
		if (channelId === 'all') return null
		return channelsFromStore.find((c: any) => c.id === channelId) || null
	}, [channelsFromStore, channelId])

	const [members, setMembers] = useState<MemberItem[]>(membersProp || [])
	useEffect(() => {
		setMembers(membersProp || [])
	}, [membersProp])

	const MAX_TEXTAREA_HEIGHT = 324

	const adjustTextareaHeight = () => {
		const el = textareaRef.current
		if (!el) return

		if ('style' in el) {
			el.style.height = 'auto'
			const newHeight = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)
			el.style.height = `${newHeight}px`
			el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden'
		}
	}

	const ROLE_STYLES: Record<string, { title: string; bg: string; color: string }> = {
		designer: { title: 'Designer', bg: '#EDF6FF', color: '#0070DC' },
		member: { title: 'Member', bg: '#FFEBFD', color: '#C329BD' },
		client: { title: 'Client', bg: '#E7F8E1', color: '#247E00' },
		accountmanager: { title: 'Account Manager', bg: '#E1F6FF', color: '#00789F' },
		admin: { title: 'Admin', bg: '#FFF2E3', color: '#9E5E00' },
	}

	const getRoleStyle = (role: string) => {
		const key = role.replace(/\s+/g, '').toLowerCase()
		return ROLE_STYLES[key] ?? { title: role, bg: '#F4F5F6', color: '#5C5E63' }
	}

	// members loaded via API above

	const sortedMessages = useMemo(() => {
		return [...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
	}, [messages])

	// Filter messages to only show those from channels in the current workspace
	const filteredMessages = useMemo(() => {
		if (channelId === 'all') {
			// Get channels that belong to the current workspace
			const currentWorkspaceChannels = channelsFromStore.map((c: any) => c.id)

			// Filter messages to only include those from channels in the current workspace
			const filtered = sortedMessages.filter((message: any) => {
				const messageChannelId = message.channelId
				const isValid = messageChannelId && currentWorkspaceChannels.includes(messageChannelId)

				// Debug logging to see what's being filtered
				if (!isValid && messageChannelId) {
					console.log('Filtering out message from channel:', messageChannelId, 'Current workspace channels:', currentWorkspaceChannels)
				}

				return isValid
			})

			console.log('Filtered messages:', {
				total: sortedMessages.length,
				filtered: filtered.length,
				currentWorkspaceChannels,
				sampleFiltered: filtered.slice(0, 3).map(m => ({ id: m.id, channelId: (m as any).channelId }))
			})

			return filtered
		}
		return sortedMessages
	}, [sortedMessages, channelId, channelsFromStore])

	const formatDayLabel = (date: Date) => {
		if (isToday(date)) return 'Today'
		if (isYesterday(date)) return 'Yesterday'
		return format(date, 'EEEE, MMMM do')
	}

	// Get parent messages for display
	const parentMessages = useMemo(() => {
		return filteredMessages.filter(m => !(m as any).parentId)
	}, [filteredMessages])

	const formatTimeOnly = (date: Date) => format(date, 'p')
	const formatDateFull = (date: Date) => format(date, 'MMMM d, yyyy')

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages.length])

	useEffect(() => {
		adjustTextareaHeight()
	}, [input])



	// Typing indicator state and helpers
	const typingChannelRef = useRef<any>(null)
	const dbChannelRef = useRef<any>(null)
	const allDbChannelRef = useRef<any>(null)
	const typingTimeoutRef = useRef<any>(null)
	const reconnectTimeoutRef = useRef<any>(null)
	const reconnectAttemptRef = useRef<number>(0)
	const [typingUsers, setTypingUsers] = useState<Record<string, number>>({})
	const [profilesByEmail, setProfilesByEmail] = useState<Record<string, { first_name?: string; image_url?: string }>>({})
	const profilesRef = useRef<Record<string, { first_name?: string; image_url?: string }>>({})

	// Workspace members for @mentions
	const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([])

	useEffect(() => {
		if (!activeWorkspaceId) return
		workspaceHelperApi.getWorkspaceMembers(activeWorkspaceId).then(resp => {
			const map: Record<string, { first_name?: string; image_url?: string }> = {}
			for (const u of resp.users) {
				map[u.email] = { first_name: u.first_name, image_url: u.image_url }
			}
			setProfilesByEmail(map)
			setWorkspaceMembers(resp.users)
		}).catch(() => { })
	}, [activeWorkspaceId])

	useEffect(() => {
		profilesRef.current = profilesByEmail
	}, [profilesByEmail])

	function getCaretCharacterOffsetWithin(element: HTMLElement): number {
		const sel = window.getSelection()
		if (!sel || sel.rangeCount === 0) return 0
		const range = sel.getRangeAt(0)

		let preCaretRange = range.cloneRange()
		preCaretRange.selectNodeContents(element)
		preCaretRange.setEnd(range.endContainer, range.endOffset)

		return preCaretRange.toString().length
	}

	// @mention handling functions
	const handleContentEditableInput = (e: React.FormEvent<HTMLDivElement>) => {
		// Notify typing for real-time
		if (channelId !== 'all' || selectedChannelForMessage) {
			notifyTyping()
		}
		console.log('handleContentEditableInput:', e.currentTarget.textContent);
		const editor = e.currentTarget
		const value = editor.textContent || ''

		// Update previous HTML before changing the input
		const currentHTML = editor.innerHTML
		setPreviousHTML(currentHTML)

		setInput(value)

		const sel = window.getSelection()
		if (!sel || sel.rangeCount === 0) return
		const range = sel.getRangeAt(0)

		// --- 1. Insert invisible marker to measure caret position ---
		const marker = document.createElement('span')
		marker.textContent = '\u200b' // zero-width space
		range.insertNode(marker)
		range.setStartAfter(marker)
		range.collapse(true)

		const rect = marker.getBoundingClientRect()
		const caretPos = getCaretCharacterOffsetWithin(editor) // absolute index
		marker.remove()

		// --- 2. Detect last '@' before caret ---
		const beforeCaret = value.slice(0, caretPos)
		const atIdx = beforeCaret.lastIndexOf('@')
		if (atIdx === -1) { setShowMentions(false); return }

		// must be start or after whitespace
		const prevChar = atIdx > 0 ? beforeCaret[atIdx - 1] : ' '
		if (!/\s/.test(prevChar)) { setShowMentions(false); return }

		// Check if this @ symbol is inside a mention span
		// We need to count how many @ symbols are before the caret and check if the nth @ is in a span
		const htmlContent = editor.innerHTML

		// Count @ symbols before the caret position
		let atCount = 0
		for (let i = 0; i < atIdx + 1; i++) {
			if (beforeCaret[i] === '@') {
				atCount++
			}
		}
		// Now find the nth @ symbol in the HTML and check if it's inside a span
		let currentAtCount = 0
		let isInsideSpan = false
		for (let i = 0; i < htmlContent.length; i++) {
			if (htmlContent[i] === '@') {
				currentAtCount++
				if (currentAtCount === atCount) {
					// This is the nth @ symbol, check if it's inside a span
					// Look backwards to find if we're inside a tag
					let tagStart = -1
					for (let j = i; j >= 0; j--) {
						if (htmlContent[j] === '<') {
							tagStart = j
							break
						}
					}

					// If we found a tag start, check if it's a span
					if (tagStart !== -1) {
						const tagContent = htmlContent.slice(tagStart, i + 10) // Get some content after @
						if (tagContent.includes('<span') && tagContent.includes('data-mention-type="mention"')) {
							isInsideSpan = true
						}
					}
					break
				}
			}
		}

		// If the nth @ is inside a span, don't show mentions
		if (isInsideSpan) {
			setShowMentions(false)
			return
		}

		// extract query and trim whitespace
		const query = beforeCaret.slice(atIdx + 1).trim();
		if (query.includes(' ')) { setShowMentions(false); return }

		// --- 3. Filter members ---
		const filtered = workspaceMembers.filter(m =>
			(m.first_name || m.email).toLowerCase().startsWith(query.toLowerCase())
		)
		setFilteredMembers(filtered)
		setMentionQuery(query)
		setShowMentions(true)
		setSelectedMentionIndex(0)

		// --- 4. Position dropdown: bottom 8px above caret ---
		setMentionDropdownPosition({ x: rect.left, y: rect.top - 8 })
	}


	const handleContentEditableKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		console.log('handleContentEditableKeyDown:', e.key);

		// Handle backspace deletion of mention spans
		if (e.key === 'Backspace') {
			const sel = window.getSelection()
			if (sel && sel.rangeCount > 0) {
				const range = sel.getRangeAt(0)
				const container = textareaRef.current as HTMLDivElement
				if (container) {
					// Check if cursor is at the beginning of a mention span
					const startContainer = range.startContainer
					const startOffset = range.startOffset

					// If cursor is at the very beginning of a text node, check if previous sibling is a mention span
					if (startContainer.nodeType === Node.TEXT_NODE && startOffset === 0) {
						const textNode = startContainer as Text
						const previousSibling = textNode.previousSibling

						// Check if the previous sibling is a mention span
						if (previousSibling &&
							previousSibling.nodeType === Node.ELEMENT_NODE &&
							(previousSibling as Element).getAttribute('data-mention-type') === 'mention') {

							e.preventDefault();

							// Delete the entire mention span
							(previousSibling as Element).remove()

							// Update input state
							setInput(container.textContent || '')

							// Trigger input event
							container.dispatchEvent(new Event('input', { bubbles: true }))
							return
						}
					}

					// If cursor is inside a mention span, delete the entire span
					let currentNode: Node | null = startContainer
					while (currentNode && currentNode !== container) {
						if (currentNode.nodeType === Node.ELEMENT_NODE &&
							(currentNode as Element).getAttribute('data-mention-type') === 'mention') {

							e.preventDefault();

							// Delete the entire mention span
							(currentNode as Element).remove()

							// Update input state
							setInput(container.textContent || '')

							// Trigger input event
							container.dispatchEvent(new Event('input', { bubbles: true }))
							return
						}
						currentNode = currentNode.parentNode
					}

					// Allow normal backspace for spaces and other text
					// Don't prevent default here - let the browser handle normal text deletion
				}
			}
		}

		if (showMentions && filteredMembers.length > 0) {
			if (e.key === 'ArrowDown') {
				e.preventDefault()
				setSelectedMentionIndex(prev =>
					prev < filteredMembers.length - 1 ? prev + 1 : 0
				)
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				setSelectedMentionIndex(prev =>
					prev > 0 ? prev - 1 : filteredMembers.length - 1
				)
			} else if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault()
				const selectedMember = filteredMembers[selectedMentionIndex]
				if (selectedMember) {
					handleMentionSelect(selectedMember)
				}
			} else if (e.key === 'Escape') {
				e.preventDefault()
				setShowMentions(false)
				setMentionQuery('')
				setMentionPosition(null)
				setMentionDropdownPosition(null)
			}
		} else if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	const handleAtButtonClick = () => {
		// Insert @ symbol at cursor position
		const contentEditableDiv = textareaRef.current
		if (contentEditableDiv && 'contentEditable' in contentEditableDiv) {
			const selection = window.getSelection()
			if (selection && selection.rangeCount > 0) {
				const range = selection.getRangeAt(0)
				const atNode = document.createTextNode('@')
				range.insertNode(atNode)
				range.setStartAfter(atNode)
				range.collapse(true)
				selection.removeAllRanges()
				selection.addRange(range)

				// Trigger input event to show mentions
				contentEditableDiv.dispatchEvent(new Event('input', { bubbles: true }))
			}
		}
	}

	// Get character offset of the current selection within a contentEditable element
	function getCaretOffset(el: HTMLElement): number {
		const sel = window.getSelection();
		if (!sel || sel.rangeCount === 0) return 0;
		const range = sel.getRangeAt(0);
		if (!el.contains(range.startContainer)) return 0;

		const pre = range.cloneRange();
		pre.selectNodeContents(el);
		pre.setEnd(range.startContainer, range.startOffset);
		return pre.toString().length; // counts code units, works fine with emoji if used consistently
	}

	// Is this node (or its ancestors) inside a non-editable element (eg. a mention span)?
	function closestNonEditable(node: Node, root: HTMLElement): HTMLElement | null {
		let el: HTMLElement | null =
			node.nodeType === Node.TEXT_NODE ? (node.parentElement as HTMLElement | null) : (node as HTMLElement | null);
		while (el && el !== root) {
			if (
				el.getAttribute?.("contenteditable") === "false" ||
				(el as any).dataset?.mentionType === "mention"
			) {
				return el;
			}
			el = el.parentElement;
		}
		return null;
	}

	// TreeWalker that ignores text inside non-editable nodes (mention spans)
	function createEditableTextWalker(root: HTMLElement) {
		const filter = {
			acceptNode(node: Node) {
				return closestNonEditable(node, root) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
			},
		} as unknown as NodeFilter;
		return document.createTreeWalker(root, NodeFilter.SHOW_TEXT, filter);
	}

	// Updated: place caret by character index, skipping non-editable text
	function setCaretOffset(el: HTMLElement, index: number) {
		const walker = createEditableTextWalker(el);
		let remaining = index;
		let node: Node | null = walker.nextNode();
		while (node) {
			const text = node.textContent || "";
			if (remaining <= text.length) {
				const range = document.createRange();
				const sel = window.getSelection();
				range.setStart(node, remaining);
				range.collapse(true);
				sel?.removeAllRanges();
				sel?.addRange(range);
				return;
			}
			remaining -= text.length;
			node = walker.nextNode();
		}
		const range = document.createRange();
		const sel = window.getSelection();
		range.selectNodeContents(el);
		range.collapse(false);
		sel?.removeAllRanges();
		sel?.addRange(range);
	}

	// Insert plain text at the caret without destroying HTML
	function insertTextAtCaret(el: HTMLElement, text: string, fallbackVisualIndex?: number) {
		const sel = window.getSelection();
		let range: Range | null = null;

		if (sel && sel.rangeCount && el.contains(sel.anchorNode)) {
			range = sel.getRangeAt(0);
			const ne = closestNonEditable(range.startContainer, el);
			if (ne) {
				range = document.createRange();
				range.setStartAfter(ne);
				range.collapse(true);
			}
		} else {
			// Convert the VISUAL fallback to an EDITABLE offset exactly once
			const mapped = visualToEditableOffset(el, Math.max(0, fallbackVisualIndex ?? 0));
			setCaretOffset(el, mapped);
			const sel2 = window.getSelection();
			range = sel2 && sel2.rangeCount ? sel2.getRangeAt(0) : null;
		}

		if (!range) return;

		range.deleteContents();
		const node = document.createTextNode(text);
		range.insertNode(node);
		el.normalize();

		const newRange = document.createRange();
		newRange.setStart(node, node.nodeValue!.length);
		newRange.collapse(true);
		const sel3 = window.getSelection();
		sel3?.removeAllRanges();
		sel3?.addRange(newRange);
	}

	// Map a visual offset (includes mention text) to an editable offset (skips contenteditable="false")
	function visualToEditableOffset(el: HTMLElement, visualIndex: number): number {
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);

		let visualSoFar = 0;
		let editableSoFar = 0;
		let node: Node | null = walker.nextNode();

		// Finds nearest ancestor that's non-editable (mention chip)
		const isInNonEditable = (n: Node) => {
			let cur: HTMLElement | null =
				n.nodeType === Node.TEXT_NODE ? (n.parentElement as HTMLElement | null) : (n as HTMLElement | null);
			while (cur && cur !== el) {
				if (cur.getAttribute?.('contenteditable') === 'false' || (cur as any).dataset?.mentionType === 'mention') {
					return true;
				}
				cur = cur.parentElement;
			}
			return false;
		};

		while (node) {
			const len = node.textContent?.length ?? 0;
			const insideNE = isInNonEditable(node);

			// Does this chunk contain the visualIndex?
			if (visualSoFar + len >= visualIndex) {
				if (insideNE) {
					// Can't place inside the chip - position right after all previous editable text
					return editableSoFar;
				}
				return editableSoFar + (visualIndex - visualSoFar);
			}

			visualSoFar += len;
			if (!insideNE) editableSoFar += len;
			node = walker.nextNode();
		}

		// If index is beyond end, snap to end of editable text
		return editableSoFar;
	}

	const handleMentionSelect = (member: WorkspaceMember) => {
		// console.log('handleMentionSelect called with member:', member)
		// console.log('Current mentionQuery:', mentionQuery)

		const sel = window.getSelection()
		if (!sel || sel.rangeCount === 0) return

		const container = textareaRef.current as HTMLDivElement
		if (!container) return

		// Get the current HTML content
		const currentHTML = container.innerHTML

		// We need to find where the @mentionQuery is being typed
		// We can compare the previous HTML with current HTML to find the difference
		// This will tell us exactly where the new @mentionQuery was added

		// First, let's add a state to track the previous HTML
		// For now, we'll use a simple approach: find the most recent @mentionQuery
		// This assumes the user is typing at the end or near the end
		const searchPattern = '@' + mentionQuery

		// If we have previous HTML, compare it with current HTML to find the difference
		let atIdx = -1
		if (previousHTML && previousHTML !== currentHTML) {
			// Find where the new content was added by comparing the two HTMLs
			atIdx = currentHTML.indexOf(searchPattern)

			// If found, check if this pattern exists in the previous HTML
			if (atIdx !== -1) {
				const patternInPrevious = previousHTML.indexOf(searchPattern)

				// If the pattern doesn't exist in previous HTML, this is the new one
				if (patternInPrevious === -1) {
					// This is the new @mentionQuery that was just added
				} else {
					// Pattern exists in both, need to find which one is new
					// Look for the pattern after the last common point
					const commonLength = Math.min(previousHTML.length, currentHTML.length)
					let lastCommonIndex = 0

					for (let i = 0; i < commonLength; i++) {
						if (previousHTML[i] !== currentHTML[i]) {
							lastCommonIndex = i
							break
						}
					}

					// Find the search pattern after the last common point
					atIdx = currentHTML.indexOf(searchPattern, lastCommonIndex)
				}
			}
		} else {
			// No previous HTML or same HTML, use simple search
			atIdx = currentHTML.lastIndexOf(searchPattern)
		}

		if (atIdx === -1) return

		// Split the HTML around the search pattern
		const before = currentHTML.slice(0, atIdx)
		const after = currentHTML.slice(atIdx + searchPattern.length)

		// Create the new HTML content with the mention span
		// Add a unique timestamp to ensure we can identify this specific span
		const timestamp = Date.now()
		const mentionSpanHTML = `<span style="background: #FE4C281A; border-radius: 4px; padding-left: 3px; padding-right: 3px; color: #FE4C28; display: inline-block;" data-mention-type="mention" data-timestamp="${timestamp}" contenteditable="false">@${member.first_name || member.email}</span>`

		// Check if caret is at the end of the text (after the search pattern)
		const isCaretAtEnd = after.trim() === ''

		// Build the new HTML by replacing the search pattern
		// Only add space if caret is at the end
		const newHTML = before + mentionSpanHTML + after + (isCaretAtEnd ? '&nbsp;' : '')

		// Update the container with the new HTML
		container.innerHTML = newHTML

		// Update the previous HTML state for future comparisons
		setPreviousHTML(newHTML)

		// Update the input state and clear all mention-related state
		const newText = container.textContent || ''
		console.log('New text after replacement:', newText)
		setInput(newText)
		setShowMentions(false)
		setMentionQuery('')
		setFilteredMembers([])
		setSelectedMentionIndex(0)
		setMentionDropdownPosition(null)

		// Position cursor after the mention span
		const newRange = document.createRange()

		// Find the mention span that was just created using the unique timestamp
		const mentionSpanElement = container.querySelector(`[data-timestamp="${timestamp}"]`) as HTMLElement

		if (mentionSpanElement) {
			if (isCaretAtEnd) {
				// If space was added, position cursor after the space
				const nextSibling = mentionSpanElement.nextSibling
				if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
					newRange.setStartAfter(nextSibling)
					newRange.collapse(true)
				} else {
					// Fallback: position cursor after the mention span
					newRange.setStartAfter(mentionSpanElement)
					newRange.collapse(true)
				}
			} else {
				// If no space was added, position cursor after the mention span
				newRange.setStartAfter(mentionSpanElement)
				newRange.collapse(true)
			}

			sel.removeAllRanges()
			sel.addRange(newRange)
		}

		// Focus the container and trigger input event
		container.focus()
		container.dispatchEvent(new Event('input', { bubbles: true }))
	}


	const notifyTyping = () => {
		if (!typingChannelRef.current || !user?.email) return
		typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { email: user.email } })
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
		typingTimeoutRef.current = setTimeout(() => {
			if (!typingChannelRef.current || !user?.email) return
			typingChannelRef.current.send({ type: 'broadcast', event: 'stop_typing', payload: { email: user.email } })
		}, 1500)
	}

	const handleChannelSelect = (channelId: string) => {
		setSelectedChannelForMessage(channelId)
		// Focus back to textarea after channel selection
		setTimeout(() => {
			textareaRef.current?.focus()
		}, 100)
	}

	const handleSend = async () => {
		// Get the HTML content with mention spans, or fall back to plain text
		let messageContent = ''
		const container = textareaRef.current as HTMLDivElement

		if (container && 'innerHTML' in container) {
			// Get HTML content to preserve mention spans
			// Note: This will send HTML to the database. The MessageItem component
			// needs to be updated to safely render this HTML content.
			messageContent = container.innerHTML.trim()
		} else {
			// Fallback to plain text
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

		// If we're in thread view, send as a reply to the selected message
		if (isThreadView && selectedThreadMessage) {
			try {
				// Send message as a reply to the thread
				await sendChannelMessage(channelId === 'all' ? selectedChannelForMessage! : channelId, messageContent, selectedThreadMessage.id, addonData)
				setInput('')
				setEmoji(false)
				setSelectedBoards([]) // Clear selected boards after sending
				if (typingChannelRef.current && user?.email) {
					typingChannelRef.current.send({ type: 'broadcast', event: 'stop_typing', payload: { email: user.email } })
				}
				setTimeout(() => {
					endRef.current?.scrollIntoView({ behavior: 'smooth' })
					// Clear contenteditable div
					if (textareaRef.current && 'contentEditable' in textareaRef.current) {
						textareaRef.current.innerHTML = ''
					}
					textareaRef.current?.focus()
					if (textareaRef.current && 'style' in textareaRef.current) {
						textareaRef.current.style.height = '56px'
						textareaRef.current.style.overflowY = 'hidden'
					}
				}, 0)
			} catch (e) {
				console.error('Failed to send thread reply', e)
				// If it's an API error with validation details, log them
				if (e && typeof e === 'object' && 'message' in e) {
					const apiError = e as any;
					if (apiError.message === 'Validation error' && apiError.details) {
						console.error('Validation error details:', apiError.details);
					}
				}
			}
			return
		}

		// If we're in all messages view, we need a selected channel
		if (channelId === 'all' && !selectedChannelForMessage) {
			return
		}

		// Determine which channel to send to
		const targetChannelId = channelId === 'all' ? selectedChannelForMessage! : channelId

		try {
			await sendChannelMessage(targetChannelId, messageContent, undefined, addonData)
			setInput('')
			setEmoji(false)
			setSelectedBoards([]) // Clear selected boards after sending
			setSelectedChannelForMessage(null) // Reset selected channel after sending
			if (typingChannelRef.current && user?.email) {
				typingChannelRef.current.send({ type: 'broadcast', event: 'stop_typing', payload: { email: user.email } })
			}
			setTimeout(() => {
				endRef.current?.scrollIntoView({ behavior: 'smooth' })
				// Clear contenteditable div
				if (textareaRef.current && 'contentEditable' in textareaRef.current) {
					textareaRef.current.innerHTML = ''
				}
				textareaRef.current?.focus()
				if (textareaRef.current && 'style' in textareaRef.current) {
					textareaRef.current.style.height = '56px'
					textareaRef.current.style.overflowY = 'hidden'
				}
			}, 0)
		} catch (e) {
			console.error('Failed to send message', e)
			// If it's an API error with validation details, log them
			if (e && typeof e === 'object' && 'message' in e) {
				const apiError = e as any;
				if (apiError.message === 'Validation error' && apiError.details) {
					console.error('Validation error details:', apiError.details);
				}
			}
		}
	}

	// Reset to all messages view when workspace changes
	useEffect(() => {
		// When workspace changes, reset to all messages view
		if (activeWorkspaceId) {
			// Reset thread view
			setIsThreadView(false)
			setSelectedThreadMessage(null)
			// Reset selected channel for message
			setSelectedChannelForMessage(null)
			// Reset selected boards
			setSelectedBoards([])
			// Reset plus dropdown and board list
			setShowPlusDropdown(false)
			setShowBoardList(false)
			// Clear input
			setInput('')
			if (textareaRef.current && 'contentEditable' in textareaRef.current) {
				textareaRef.current.innerHTML = ''
			}

			// Navigate to all messages view for the new workspace
			// This ensures the URL reflects the current state
			const currentUrl = new URL(window.location.href)
			if (currentUrl.searchParams.get('channel') !== 'all') {
				currentUrl.searchParams.set('channel', 'all')
				window.history.replaceState({}, '', currentUrl.toString())
			}

			// Clear any existing messages from the previous workspace
			// This ensures we don't show stale data
			useFeedbirdStore.setState((prev: any) => ({
				channelMessagesByChannelId: {
					...prev.channelMessagesByChannelId,
					all: [],
					// Clear all channel-specific messages as well
					...Object.keys(prev.channelMessagesByChannelId || {}).reduce((acc: any, key: string) => {
						if (key !== 'all') {
							acc[key] = []
						}
						return acc
					}, {})
				}
			}))

			// Load all messages for the new workspace
			// This ensures we show the current workspace's messages
			setLoadingAllMessages(true)
			// Get function directly from store to avoid ref issues
			useFeedbirdStore.getState().loadAllWorkspaceMessages()
				.catch(() => { })
				.finally(() => setLoadingAllMessages(false))
		}
	}, [activeWorkspaceId]) // Removed loadAllWorkspaceMessages from dependencies

	// Ensure selected thread message belongs to current workspace
	useEffect(() => {
		if (selectedThreadMessage && activeWorkspaceId) {
			// Check if the selected thread message belongs to a channel in the current workspace
			const currentWorkspaceChannels = channelsFromStore.map((c: any) => c.id)
			const messageChannelId = (selectedThreadMessage as any).channelId

			if (messageChannelId && !currentWorkspaceChannels.includes(messageChannelId)) {
				// If the message doesn't belong to current workspace, reset thread view
				setIsThreadView(false)
				setSelectedThreadMessage(null)
			}
		}
	}, [selectedThreadMessage, activeWorkspaceId, channelsFromStore])

	// Load messages when channel changes
	useEffect(() => {
		if (channelId === 'all') {
			setLoadingAllMessages(true)
			useFeedbirdStore.getState().loadAllWorkspaceMessages()
				.catch(() => { })
				.finally(() => setLoadingAllMessages(false))
		} else {
			useFeedbirdStore.getState().loadChannelMessages(channelId).catch(() => { })
		}
	}, [channelId]) // Removed loadChannelMessages and loadAllWorkspaceMessages from dependencies

	// Realtime subscriptions: DB inserts and typing broadcasts with auto-reconnect
	useEffect(() => {
		if (channelId === 'all') {
			// For all messages view, we need to subscribe to all channels in the workspace
			// This is more complex, so for now we'll just load messages on demand
			return
		}

		const subscribeRealtime = () => {
			// Clean old channels
			if (dbChannelRef.current) supabase.removeChannel(dbChannelRef.current)
			if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current)

			// DB changes (INSERT)
			const dbChannel = supabase
				.channel(`channel_messages:${channelId}`)
				.on(
					'postgres_changes',
					{ event: 'INSERT', schema: 'public', table: 'channel_messages', filter: `channel_id=eq.${channelId}` },
					(payload: any) => {
						const m = payload.new as DbChannelMessage
						// Ignore our own messages to avoid echo
						if (m.author_email && user?.email && m.author_email === user.email) return
						// Avoid duplicates if already in store
						const current = (useFeedbirdStore.getState() as any).channelMessagesByChannelId?.[channelId] || []
						if (current.some((x: any) => x.id === m.id)) return

						// Handle unread message logic
						const store = useFeedbirdStore.getState()
						// const currentUserEmail = store.user?.email
						// const activeWorkspaceId = store.activeWorkspaceId

						// if (currentUserEmail && activeWorkspaceId) {
						// 	// Case 1: User is viewing this specific channel - mark as read immediately
						// 	console.log('User is viewing this channel, marking message as read:', m.id)
						// 	userApi.removeUnreadMessage(currentUserEmail, m.id)

						// }

						const profile = profilesRef.current?.[m.author_email]
						const authorName = profile?.first_name || m.author_email
						const authorImg = profile?.image_url || undefined
						const message = {
							id: m.id,
							author: authorName,
							authorEmail: m.author_email,
							authorImageUrl: authorImg,
							text: m.content,
							createdAt: m.created_at ? new Date(m.created_at) : new Date(),
							parentId: (m as any).parent_id || null,
							addon: (m as any).addon,
							readby: (m as any).readby,
							emoticons: (m as any).emoticons,
							channelId: channelId,
						}
						useFeedbirdStore.setState((prev: any) => {
							const byId = prev.channelMessagesByChannelId || {}
							return {
								channelMessagesByChannelId: {
									...byId,
									[channelId]: [...(byId[channelId] || []), message],
									all: [...(byId['all'] || []), message],
								},
							}
						})
					}
				)
				.on(
					'postgres_changes',
					{ event: 'UPDATE', schema: 'public', table: 'channel_messages', filter: `channel_id=eq.${channelId}` },
					(payload: any) => {
						const m = payload.new as DbChannelMessage
						// Update emoticons in existing message - show to all users including sender
						useFeedbirdStore.setState((prev: any) => {
							const byId = prev.channelMessagesByChannelId || {}
							const channelMessages = byId[channelId] || []
							const allMessages = byId['all'] || []

							// Update in channel messages
							const updatedChannelMessages = channelMessages.map((msg: any) =>
								msg.id === m.id ? { ...msg, emoticons: (m as any).emoticons, addon: (m as any).addon } : msg
							)

							// Update in all messages
							const updatedAllMessages = allMessages.map((msg: any) =>
								msg.id === m.id ? { ...msg, emoticons: (m as any).emoticons, addon: (m as any).addon } : msg
							)

							return {
								channelMessagesByChannelId: {
									...byId,
									[channelId]: updatedChannelMessages,
									all: updatedAllMessages,
								},
							}
						})
					}
				)
			dbChannelRef.current = dbChannel

			// Typing broadcast
			const typingChannel = supabase
				.channel(`typing:${channelId}`, { config: { broadcast: { self: false } } })
				.on('broadcast', { event: 'typing' }, ({ payload }) => {
					const email = payload?.email as string | undefined
					if (!email) return
					setTypingUsers((prev) => ({ ...prev, [email]: Date.now() }))
				})
				.on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
					const email = payload?.email as string | undefined
					if (!email) return
					setTypingUsers((prev) => {
						const next = { ...prev }
						delete next[email]
						return next
					})
				})
			typingChannelRef.current = typingChannel

			// Subscribe with status callbacks and auto-reconnect
			dbChannel.subscribe((status: string) => {
				if (status === 'SUBSCRIBED') {
					reconnectAttemptRef.current = 0
				}
				if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
					const attempt = Math.min(reconnectAttemptRef.current + 1, 6)
					reconnectAttemptRef.current = attempt
					const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 30000)
					if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
					reconnectTimeoutRef.current = setTimeout(() => {
						subscribeRealtime()
					}, delayMs)
				}
			})

			typingChannel.subscribe(() => { /* paired with db channel */ })
		}

		subscribeRealtime()

		const onOnline = () => subscribeRealtime()
		const onVisible = () => {
			if (document.visibilityState === 'visible') subscribeRealtime()
		}
		window.addEventListener('online', onOnline)
		document.addEventListener('visibilitychange', onVisible)

		return () => {
			window.removeEventListener('online', onOnline)
			document.removeEventListener('visibilitychange', onVisible)
			if (dbChannelRef.current) supabase.removeChannel(dbChannelRef.current)
			if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current)
			if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
			reconnectAttemptRef.current = 0
		}
	}, [channelId, user?.email])

	// Realtime for 'all' view: subscribe to all messages in active workspace
	useEffect(() => {
		if (channelId !== 'all' || !activeWorkspaceId) return

		// Clean previous
		if (allDbChannelRef.current) supabase.removeChannel(allDbChannelRef.current)

		const allDb = supabase
			.channel(`channel_messages:all:${activeWorkspaceId}`)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'channel_messages', filter: `workspace_id=eq.${activeWorkspaceId}` },
				(payload: any) => {
					const m = payload.new as DbChannelMessage
					// Ignore our own messages to avoid echo
					if (m.author_email && user?.email && m.author_email === user.email) return
					// Avoid duplicates in 'all'
					const currentAll = (useFeedbirdStore.getState() as any).channelMessagesByChannelId?.['all'] || []
					if (currentAll.some((x: any) => x.id === m.id)) return
					const profile = profilesRef.current?.[m.author_email]
					const authorName = profile?.first_name || m.author_email
					const authorImg = profile?.image_url || undefined
					const message = {
						id: m.id,
						author: authorName,
						authorEmail: m.author_email,
						authorImageUrl: authorImg,
						text: m.content,
						createdAt: m.created_at ? new Date(m.created_at) : new Date(),
						parentId: (m as any).parent_id || null,
						addon: (m as any).addon,
						readby: (m as any).readby,
						emoticons: (m as any).emoticons,
						channelId: (m as any).channel_id,
					}
					useFeedbirdStore.setState((prev: any) => ({
						channelMessagesByChannelId: {
							...(prev.channelMessagesByChannelId || {}),
							all: [...(prev.channelMessagesByChannelId?.['all'] || []), message],
						},
					}))
				}
			)
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'channel_messages', filter: `workspace_id=eq.${activeWorkspaceId}` },
				(payload: any) => {
					const m = payload.new as DbChannelMessage
					// Update emoticons in existing message - show to all users including sender
					useFeedbirdStore.setState((prev: any) => {
						const byId = prev.channelMessagesByChannelId || {}
						const allMessages = byId['all'] || []

						// Update in all messages
						const updatedAllMessages = allMessages.map((msg: any) =>
							msg.id === m.id ? { ...msg, emoticons: (m as any).emoticons } : msg
						)

						// Also update in the specific channel if it exists
						const channelId = (m as any).channel_id
						const channelMessages = byId[channelId] || []
						const updatedChannelMessages = channelMessages.map((msg: any) =>
							msg.id === m.id ? { ...msg, emoticons: (m as any).emoticons } : msg
						)

						return {
							channelMessagesByChannelId: {
								...byId,
								all: updatedAllMessages,
								...(channelId && { [channelId]: updatedChannelMessages }),
							},
						}
					})
				}
			)

		allDb.subscribe(() => { })
		allDbChannelRef.current = allDb

		return () => {
			if (allDbChannelRef.current) supabase.removeChannel(allDbChannelRef.current)
		}
	}, [channelId, activeWorkspaceId, user?.email])

	// Reap stale typing indicators
	useEffect(() => {
		const interval = setInterval(() => {
			setTypingUsers((prev) => {
				const now = Date.now()
				const next: Record<string, number> = {}
				for (const [email, ts] of Object.entries(prev)) {
					if (now - ts < 1800) next[email] = ts
				}
				return next
			})
		}, 500)
		return () => clearInterval(interval)
	}, [])

	const typingDisplay = useMemo(() => {
		const others = Object.keys(typingUsers).filter(e => e !== user?.email)
		if (others.length === 0) return ''
		const names = others.map(e => profilesByEmail[e]?.first_name)
		return `${names.join(', ')} typing...`
	}, [typingUsers, profilesByEmail, user?.email])

	const { setCurrentChannelId } = useFeedbirdStore()

	// Set current channel ID in store for unread message logic
	useEffect(() => {
		setCurrentChannelId(channelId)

		// Clean up: set currentChannelId to undefined when component unmounts
		// This ensures new messages are marked as unread when user leaves the message panel
		return () => {
			setCurrentChannelId(undefined)
		}
	}, [channelId, setCurrentChannelId])

	// Additional safety: set currentChannelId to null when navigating away from messages
	useEffect(() => {
		const handleRouteChange = () => {
			// Check if we're still on a messages route
			const currentPath = window.location.pathname
			if (!currentPath.startsWith('/messages')) {
				setCurrentChannelId(undefined)
			}
		}

		// Listen for route changes
		window.addEventListener('popstate', handleRouteChange)

		// Also check on mount to handle direct navigation
		handleRouteChange()

		return () => {
			window.removeEventListener('popstate', handleRouteChange)
			setCurrentChannelId(undefined)
		}
	}, [setCurrentChannelId])

	// Global websocket subscription is now handled at the FeedbirdProvider level
	// to ensure users receive updates even when not viewing the message panel

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
					/* Thread view */
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
									onEmojiReaction={addEmojiReaction}
									openDropdownId={openDropdownId}
									setOpenDropdownId={setOpenDropdownId}
									openEmojiId={openEmojiId}
									setOpenEmojiId={setOpenEmojiId}
									openEmoticonsEmojiId={openEmoticonsEmojiId}
									setOpenEmoticonsEmojiId={setOpenEmoticonsEmojiId}
									formatTimeOnly={formatTimeOnly}
									onBoardQuickView={handleBoardQuickView}
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
												onEmojiReaction={addEmojiReaction}
												openDropdownId={openDropdownId}
												setOpenDropdownId={setOpenDropdownId}
												openEmojiId={openEmojiId}
												setOpenEmojiId={setOpenEmojiId}
												openEmoticonsEmojiId={openEmoticonsEmojiId}
												setOpenEmoticonsEmojiId={setOpenEmoticonsEmojiId}
												formatTimeOnly={formatTimeOnly}
												onBoardQuickView={handleBoardQuickView}
											/>

										</div>
									))
								})()}
								<div ref={endRef} />
							</div>
						)}

						{/* Thread composer pinned to bottom */}
						<div className="absolute bottom-4 left-4 right-4 flex justify-center">
							<div className="w-full border border-grey/20 border-solid border-2 rounded-sm bg-white">
								{/* Text area */}
								<div className="pt-2.5 pb-4 px-2.5">
									<div
										ref={textareaRef as any}
										contentEditable
										suppressContentEditableWarning
										onInput={handleContentEditableInput}
										onKeyDown={handleContentEditableKeyDown}
										className="resize-none border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-0 shadow-none text-black text-sm font-normal leading-tight min-h-[56px] max-h-[314px] overflow-y-hidden"
										style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
										data-placeholder="Reply to thread..."
									/>
									{/* Hidden textarea for actual value storage */}
									<textarea
										value={input}
										onChange={() => { }} // No-op, handled by contenteditable
										className="sr-only"
										tabIndex={-1}
									/>
								</div>

								{/* Selected Boards Display for Thread View */}
								{selectedBoards.length > 0 && (
									<div className="px-2.5 pb-2">
										<div className="flex flex-wrap gap-2">
											{selectedBoards.map((board_id) => {
												const board = boardNav.find(b => b.id === board_id);
												if (!board) return null;

												const boardColor = (board as any).color;

												return (
													<div
														key={board_id}
														className="flex items-center gap-2 pl-1 pr-2 py-1 bg-gray-50 rounded-[5px] border border-strokeElement"
													>
														{/* Board Icon with Color Background */}
														<div
															className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
															style={boardColor ? { backgroundColor: boardColor } : { backgroundColor: '#6B7280' }}
														>
															<img
																src={board.image || `/images/boards/static-posts.svg`}
																alt={board.label}
																className="w-3.5 h-3.5 filter brightness-0 invert"
																loading="lazy"
															/>
														</div>

														{/* Board Name */}
														<span className="text-sm font-medium text-gray-700">
															{board.label}
														</span>

														{/* Remove Button (X icon) */}
														<button
															onClick={() => handleBoardSelection(board_id)}
															className="w-4 h-4 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
														>
															<X className="w-3 h-3 text-gray-500 hover:text-gray-700" />
														</button>
													</div>
												);
											})}
										</div>
									</div>
								)}

								{/* Typing indicator */}
								{typingDisplay && (
									<div className="px-3 pb-1 text-[12px] text-grey">{typingDisplay}</div>
								)}

								{/* Actions row */}
								<div className="relative flex items-center justify-between p-2">
									<div className="flex items-center pl-1 gap-2">
										{/* Plus button dropdown */}
										<div className="relative plus-dropdown-container">
											<DropdownMenu
												open={showPlusDropdown}
												onOpenChange={(open) => {
													setShowPlusDropdown(open)
													if (open) {
														// Get the button position for board list positioning
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
														className="size-[24px] p-0 box-border cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10"
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
															setShowPlusDropdown(false)
															setShowBoardList(true)
														}}
														className="text-sm text-black font-medium cursor-pointer"
													>
														Board
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => {
															setShowPlusDropdown(false)
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
											onClick={() => setEmoji((x) => !x)}
											size="icon"
											className="size-[24px] p-0 box-border cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10"
										>
											<ImageIcon className="size-[14px]" />
										</Button>
										{/* Emoji button */}
										<Button
											variant="ghost"
											onClick={() => {
												if (textareaRef.current) {
													setStoredCaretPosition(getCaretOffset(textareaRef.current as HTMLElement));
												}
												setEmoji(x => !x);
											}}
											size="icon"
											className="size-[24px] p-0 box-border cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10"
										>
											<Smile className="size-[14px]" />
										</Button>
										{/* Emoji picker */}
										{emoji && (
											<div className="absolute bottom-12 left-0 z-50 composer-emoji-picker-container">
												<EmojiPicker
													onEmojiClick={(e) => {
														const el = textareaRef.current as HTMLElement | null;
														if (!el) return;

														// If selection is alive, insert at live range.
														// If not, fall back to the STORED VISUAL index; mapping happens inside insertTextAtCaret.
														insertTextAtCaret(el, e.emoji, storedCaretPosition ?? 0);

														setInput(el.textContent || "");
														requestAnimationFrame(() => {
															adjustTextareaHeight?.();
															el.focus();
														});
														setEmoji(false);
													}}
												/>
											</div>
										)}
										{/* @ mention dropdown */}
										{showMentions && filteredMembers.length > 0 && mentionDropdownPosition && (
											<div
												className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-64 mentions-dropdown"
												style={{
													left: mentionDropdownPosition.x,
													top: mentionDropdownPosition.y - filteredMembers.length * 40 // ensures bottom is 8px above caret
												}}
											>
												{/* Debug indicator - shows bottom edge */}
												{filteredMembers.map((member, index) => (
													<div
														key={member.email}
														onClick={() => handleMentionSelect(member)}
														className={cn("flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer", index === selectedMentionIndex ? 'bg-gray-100' : '')}
													>
														<Avatar className="w-6 h-6">
															<AvatarImage src={member.image_url} alt={member.first_name || member.email} />
															<AvatarFallback className="text-[10px] font-medium">
																{(member.first_name || member.email).charAt(0).toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<div className="flex-1 min-w-0">
															<div className="text-sm font-medium text-gray-900 truncate">
																{member.first_name || member.email}
															</div>
															{member.first_name && (
																<div className="text-xs text-gray-500 truncate">
																	{member.email}
																</div>
															)}
														</div>
													</div>
												))}
											</div>
										)}
										{/* @ button */}
										<Button
											variant="ghost"
											size="icon"
											className="size-[24px] p-0 box-border cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10"
											onClick={handleAtButtonClick}
										>
											<AtSign className="size-[14px]" />
										</Button>
									</div>
									<div className="flex items-center pl-1 gap-2">
										{/* Voice button */}
										<Button
											variant="ghost"
											size="icon"
											className="size-[24px] p-0 box-border cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10"
										>
											<Mic className="size-[14px]" />
										</Button>
										{/* Send button */}
										<Button
											onClick={handleSend}
											disabled={!input.trim()}
											className="size-[24px] p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<ArrowUp className="size-[14px]" />
										</Button>
									</div>
								</div>
							</div>
						</div>

						{/* Board List for Thread View */}
						{showBoardList && (
							<div
								className="board-list-container absolute bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden"
								style={{
									width: '190px',
									bottom: '60px',
									left: '16px',
									zIndex: 50
								}}
							>
								<div className="max-h-64 overflow-y-auto">
									{boardNav.length > 0 ? (
										boardNav.map((board) => {
											// Get board color if available
											const boardColor = (board as any).color;
											const isSelected = selectedBoards.includes(board.id);

											return (
												<div
													key={board.id}
													className={cn(
														"group/row flex items-center gap-[6px] p-[6px]",
														"cursor-pointer focus:outline-none hover:bg-[#F4F5F6]",
														isSelected ? "bg-[#F4F5F6]" : "",
													)}
													onClick={() => handleBoardSelection(board.id)}
												>
													{board.image && (
														<div
															className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
															style={isSelected && boardColor ? { backgroundColor: boardColor } : undefined}
														>
															<img
																src={board.image}
																alt={board.label}
																className={cn(
																	"w-3.5 h-3.5",
																	// Make icon white when board is selected and has a colored background
																	isSelected && boardColor && "filter brightness-0 invert"
																)}
																loading="lazy"
															/>
														</div>
													)}
													<span className="text-sm font-normal truncate text-black flex-1 min-w-0">
														{board.label}
													</span>

													{isSelected == true ? (
														<div className="w-4 h-4 bg-main rounded flex items-center justify-center flex-shrink-0 ml-auto">
															<img src="/images/icons/check.svg" alt="check" className="w-3 h-3" />
														</div>
													) : (
														<div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center flex-shrink-0 ml-auto">
														</div>
													)}
												</div>
											);
										})
									) : (
										<div className="p-3 text-sm text-gray-500 text-center">
											No boards available
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				) : (
					/* General view */
					<div className="flex-1 min-h-0 overflow-hidden bg-white relative flex flex-col" >
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
														<div className="flex-1 border-t border-strokeElement" />
														<span className="text-xs text-grey whitespace-nowrap">{formatDayLabel(m.createdAt)}</span>
														<div className="flex-1 border-t border-strokeElement" />
													</div>
												)}

												{/* Message content with MessageItem component */}
												<MessageItem
													message={m}
													channelId={channelId}
													channelsFromStore={channelsFromStore}
													showChannelName={channelId === 'all'}
													showReplyButton={true}
													onReplyClick={() => {
														setSelectedThreadMessage(m)
														setIsThreadView(true)
													}}
													onEmojiReaction={addEmojiReaction}
													openDropdownId={openDropdownId}
													setOpenDropdownId={setOpenDropdownId}
													openEmojiId={openEmojiId}
													setOpenEmojiId={setOpenEmojiId}
													openEmoticonsEmojiId={openEmoticonsEmojiId}
													setOpenEmoticonsEmojiId={setOpenEmoticonsEmojiId}
													formatTimeOnly={formatTimeOnly}
													showDaySeparator={false}
													replies={replies}
													onReplySummaryClick={() => {
														setSelectedThreadMessage(m)
														setIsThreadView(true)
													}}
													formatTimeAgo={formatTimeAgo}
													onBoardQuickView={handleBoardQuickView}
												/>

											</div>
										)
									})}
								<div ref={endRef} />
							</div>
						</div>

						{/* Board List */}
						{showBoardList && (
							<div
								className="board-list-container absolute bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden"
								style={{
									width: '190px',
									bottom: '60px',
									left: '16px',
									zIndex: 50
								}}
							>
								<div className="max-h-64 overflow-y-auto">
									{boardNav.length > 0 ? (
										boardNav.map((board) => {
											// Get board color if available
											const boardColor = (board as any).color;
											const isSelected = selectedBoards.includes(board.id);

											return (
												<div
													key={board.id}
													className={cn(
														"group/row flex items-center gap-[6px] p-[6px]",
														"cursor-pointer focus:outline-none hover:bg-[#F4F5F6]",
														isSelected ? "bg-[#F4F5F6]" : "",
													)}
													onClick={() => handleBoardSelection(board.id)}
												>
													{board.image && (
														<div
															className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
															style={isSelected && boardColor ? { backgroundColor: boardColor } : undefined}
														>
															<img
																src={board.image}
																alt={board.label}
																className={cn(
																	"w-3.5 h-3.5",
																	// Make icon white when board is selected and has a colored background
																	isSelected && boardColor && "filter brightness-0 invert"
																)}
																loading="lazy"
															/>
														</div>
													)}
													<span className="text-sm font-normal truncate text-black flex-1 min-w-0">
														{board.label}
													</span>

													{isSelected == true ? (
														<div className="w-4 h-4 bg-main rounded flex items-center justify-center flex-shrink-0 ml-auto">
															<img src="/images/icons/check.svg" alt="check" className="w-3 h-3" />
														</div>
													) : (
														<div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center flex-shrink-0 ml-auto">
														</div>
													)}
												</div>
											);
										})
									) : (
										<div className="p-3 text-sm text-gray-500 text-center">
											No boards available
										</div>
									)}
								</div>
							</div>
						)}

						{/* Composer pinned to bottom */}
						<div className="absolute bottom-4 left-4 right-4 flex justify-center">
							<div className="w-full border border-grey/20 border-solid border-2 rounded-sm bg-white">
								{/* Text area */}
								<div className="pt-2.5 pb-4 px-2.5">
									<div
										ref={textareaRef as any}
										contentEditable
										suppressContentEditableWarning
										onInput={handleContentEditableInput}
										onKeyDown={handleContentEditableKeyDown}
										className="resize-none border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-0 shadow-none text-black text-sm font-normal leading-tight min-h-[56px] max-h-[314px] overflow-y-hidden"
										style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
									/>
								</div>

								{/* Selected Boards Display */}
								{selectedBoards.length > 0 && (
									<div className="px-2.5 pb-2">
										<div className="flex flex-wrap gap-2">
											{selectedBoards.map((board_id) => {
												const board = boardNav.find(b => b.id === board_id);
												if (!board) return null;

												const boardColor = (board as any).color;

												return (
													<div
														key={board_id}
														className="flex items-center gap-2 pl-1 pr-2 py-1 bg-gray-50 rounded-[5px] border border-strokeElement"
													>
														{/* Board Icon with Color Background */}
														<div
															className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
															style={boardColor ? { backgroundColor: boardColor } : { backgroundColor: '#6B7280' }}
														>
															<img
																src={board.image || `/images/boards/static-posts.svg`}
																alt={board.label}
																className="w-3.5 h-3.5 filter brightness-0 invert"
																loading="lazy"
															/>
														</div>

														{/* Board Name */}
														<span className="text-sm font-medium text-gray-700">
															{board.label}
														</span>

														{/* Remove Button (X icon) */}
														<button
															onClick={() => handleBoardSelection(board_id)}
															className="w-4 h-4 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
														>
															<X className="w-3 h-3 text-gray-500 hover:text-gray-700" />
														</button>
													</div>
												);
											})}
										</div>
									</div>
								)}

								{/* Typing indicator */}
								{typingDisplay && (channelId !== 'all' || selectedChannelForMessage) && (
									<div className="px-3 pb-1 text-[12px] text-grey">{typingDisplay}</div>
								)}

								{/* Actions row */}
								<div className="relative flex items-center justify-between p-2">
									<div className="flex items-center pl-1 gap-2">
										{/* Plus button dropdown */}
										<div className="relative plus-dropdown-container">
											<DropdownMenu
												open={showPlusDropdown}
												onOpenChange={(open) => {
													setShowPlusDropdown(open)
													if (open) {
														// Get the button position for board list positioning
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
														disabled={channelId === 'all' && !selectedChannelForMessage}
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
															setShowPlusDropdown(false)
															setShowBoardList(true)
														}}
														className="text-sm text-black font-medium cursor-pointer"
													>
														Board
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => {
															setShowPlusDropdown(false)
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
											onClick={() => setActiveSidebarTab('board')}
											size="icon"
											disabled={channelId === 'all' && !selectedChannelForMessage}
											className="size-[24px] p-0 box-border cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<ImageIcon className="size-[14px]" />
										</Button>
										{/* Emoji button */}
										<Button
											variant="ghost"
											onClick={() => {
												if (textareaRef.current) {
													setStoredCaretPosition(getCaretOffset(textareaRef.current as HTMLElement));
												}
												setEmoji(x => !x);
											}}
											size="icon"
											className="size-[24px] p-0 box-border cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10"
										>
											<Smile className="size-[14px]" />
										</Button>
										{/* Emoji picker */}
										{emoji && (
											<div className="absolute bottom-12 left-0 z-50 composer-emoji-picker-container">
												<EmojiPicker
													onEmojiClick={(e) => {
														const el = textareaRef.current as HTMLElement | null;
														if (!el) return;

														// If selection is alive, insert at live range.
														// If not, fall back to the STORED VISUAL index; mapping happens inside insertTextAtCaret.
														insertTextAtCaret(el, e.emoji, storedCaretPosition ?? 0);

														setInput(el.textContent || "");
														requestAnimationFrame(() => {
															adjustTextareaHeight?.();
															el.focus();
														});
														setEmoji(false);
													}}
												/>
											</div>
										)}
										{/* @ mention dropdown */}
										{showMentions && filteredMembers.length > 0 && mentionDropdownPosition && (
											<div
												className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-64 mentions-dropdown"
												style={{
													left: mentionDropdownPosition.x,
													top: mentionDropdownPosition.y - filteredMembers.length * 40 // ensures bottom is 8px above caret
												}}
											>
												{/* Debug indicator - shows bottom edge */}
												{filteredMembers.map((member, index) => (
													<div
														key={member.email}
														onClick={() => handleMentionSelect(member)}
														className={cn("flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer", index === selectedMentionIndex ? 'bg-gray-100' : '')}
													>
														<Avatar className="w-6 h-6">
															<AvatarImage src={member.image_url} alt={member.first_name || member.email} />
															<AvatarFallback className="text-[10px] font-medium">
																{(member.first_name || member.email).charAt(0).toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<div className="flex-1 min-w-0">
															<div className="text-sm font-medium text-gray-900 truncate">
																{member.first_name || member.email}
															</div>
															{member.first_name && (
																<div className="text-xs text-gray-500 truncate">
																	{member.email}
																</div>
															)}
														</div>
													</div>
												))}
											</div>
										)}
										{/* @ button */}
										<Button
											variant="ghost"
											size="icon"
											disabled={channelId === 'all' && !selectedChannelForMessage}
											className="size-[24px] p-0 box-border cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10 disabled:opacity-50 disabled:cursor-not-allowed"
											onClick={handleAtButtonClick}
										>
											<AtSign className="size-[14px]" />
										</Button>
										{/* Channel selector for all messages view */}
										{channelId === 'all' && !selectedChannelForMessage && (
											<ChannelSelector
												onChannelSelect={handleChannelSelect}
												selectedChannelId={selectedChannelForMessage}
												onClose={() => setSelectedChannelForMessage(null)}
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
													onClick={() => setSelectedChannelForMessage(null)}
													className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800"
												>
													<X className="h-3 w-3" />
												</Button>
											</div>
										)}
									</div>
									<div className="flex items-center pl-1 gap-2">
										{/* Voice button */}
										<Button
											variant="ghost"
											size="icon"
											disabled={channelId === 'all' && !selectedChannelForMessage}
											className="size-[24px] p-0 box-border cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<Mic className="size-[14px]" />
										</Button>
										{/* Send button */}
										<Button
											onClick={handleSend}
											disabled={!input.trim() || (channelId === 'all' && !selectedChannelForMessage)}
											className="size-[24px] p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<ArrowUp className="size-[14px]" />
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Right sidebar */}
			{showSidebar && (
				<div className="shrink-0 border-l bg-white flex flex-col">
					{/* Sidebar topbar with toggle */}
					<div className="h-10.5 px-3 border-b flex items-center">
						<div className="flex items-center gap-[4px] p-[2px] bg-[#F4F5F6] rounded-[6px]">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setActiveSidebarTab('info')}
								className={cn('px-[8px] text-black rounded-[6px] font-medium text-sm h-[24px] w-[78px] cursor-pointer', activeSidebarTab === 'info' ? 'bg-white shadow' : '')}
							>
								Info
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setActiveSidebarTab('board')}
								className={cn('px-[8px] text-black rounded-[6px] font-medium text-sm h-[24px] w-[78px] cursor-pointer', activeSidebarTab === 'board' ? 'bg-white shadow' : '')}
							>
								Board
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setActiveSidebarTab('media')}
								className={cn('px-[8px] text-black rounded-[6px] font-medium text-sm h-[24px] w-[78px] cursor-pointer', activeSidebarTab === 'media' ? 'bg-white shadow' : '')}
							>
								Media
							</Button>
						</div>
					</div>

					{/* Sidebar content */}
					<div className="flex-1 min-h-0 overflow-auto">
						{activeSidebarTab === 'info' && (
							<div>
								{/* Channel status */}
								<div className="flex flex-col gap-2 border-b border-strokeElement p-3">
									<div className="flex items-center justify-between">
										<span className="text-sm font-normal text-grey">Status</span>
										<div
											style={{
												display: "inline-flex",
												padding: "2px 8px 2px 8px",
												alignItems: "center",
												borderRadius: "100px",
												border: "1px solid rgba(28, 29, 31, 0.05)",
												background: "#DDF9E4",
											}}
											className="text-xs font-medium text-black flex items-center gap-1"
										>
											<span
												className="w-[6px] h-[6px] rounded-full"
												style={{ background: "#0DAD69" }}
											/>
											<span>Active</span>
										</div>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm font-normal text-grey">Since</span>
										<span className="text-sm font-medium text-black">{formatDateFull(channelCreatedAt)}</span>
									</div>
								</div>

								{/* Members */}
								<div className="p-3">
									<div className="text-sm font-semibold text-black mb-2">
										Members <span className="text-sm font-normal text-grey">({members.length})</span>
									</div>
									<div className="space-y-2">
										{members.map((m) => (
											<div key={m.email} className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Avatar className="w-6 h-6">
														<AvatarImage src={m?.imageUrl} alt={m.name} />
														<AvatarFallback className="text-[10px] font-medium">
															{m.name?.charAt(0).toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<div className="text-xs text-black font-medium truncate">{m.name}</div>
												</div>
												{(() => {
													const style = getRoleStyle(m.role)
													return (
														<div
															className="text-xs font-medium px-1.5 py-0.5 rounded-[5px]"
															style={{ background: style.bg, color: style.color }}
														>
															{style.title}
														</div>
													)
												})()}
											</div>
										))}
									</div>
								</div>
							</div>
						)}

						{activeSidebarTab === 'board' && (
							<div className="px-3 pt-2">
								{loadingBoardData ? (
									<div className="flex items-center justify-center py-8">
										<div className="text-sm text-gray-500">Loading boards...</div>
									</div>
								) : boardData.length > 0 ? (
									<div className="flex flex-col gap-2.5">
										<div className="text-sm font-medium text-black">Boards</div>
										<div className="space-y-2">
											{boardData.map((board) => (
												<div
													key={board.id}
													className="bg-white border border-strokeElement rounded-[4px] overflow-hidden w-[246px]"
												>
													{/* Board Card Header */}
													<div
														className="flex items-center justify-between gap-3 px-2 py-1.5 cursor-pointer hover:bg-gray-50 transition-colors"
														onClick={() => toggleBoardExpansion(board.id)}
													>
														<div className="flex items-center gap-1.5 min-w-0 flex-1">
															{board.image && (
																<div
																	className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
																	style={board.color ? { backgroundColor: board.color } : undefined}
																>
																	<img
																		src={board.image}
																		alt={board.label}
																		className={cn(
																			"w-3.5 h-3.5",
																			board.color && "filter brightness-0 invert"
																		)}
																		loading="lazy"
																	/>
																</div>
															)}
															<div className="text-sm font-medium text-black truncate min-w-0">
																{board.label}
															</div>
														</div>
														<div
															className="flex items-center justify-center rounded-sm w-4 h-4 font-normal text-[10px] px-2 py-1"
															style={{
																backgroundColor: board.color || '#F4F5F6',
																color: board.color ? 'white' : 'black'
															}}
														>
															{board.totalPosts}
														</div>
													</div>

													{/* Board Card Body - Status Items */}
													{board.expanded && (
														<div className="border-t border-gray-100 p-2">
															<div className="space-y-2">
																{Object.entries(board.statusCounts).map(([status, count]) => {
																	// Get status config for styling
																	const statusConfig = {
																		"Draft": { icon: "/images/status/draft.svg", bgColor: "#F4F7FA", borderColor: "rgba(28, 29, 31, 0.05)", textColor: "#1C1D1F" },
																		"Pending Approval": { icon: "/images/status/pending-approval.svg", bgColor: "#FAF2CA", borderColor: "rgba(28, 29, 31, 0.05)", textColor: "#1C1D1F" },
																		"Needs Revisions": { icon: "/images/status/needs-revision.svg", bgColor: "#FCE4E5", borderColor: "rgba(28, 29, 31, 0.05)", textColor: "#1C1D1F" },
																		"Revised": { icon: "/images/status/revised.svg", bgColor: "#FEEEE1", borderColor: "#F3E4D7", textColor: "#1C1D1F" },
																		"Approved": { icon: "/images/status/approved.svg", bgColor: "#DDF9E4", borderColor: "rgba(28, 29, 31, 0.05)", textColor: "#1C1D1F" },
																		"Scheduled": { icon: "/images/status/scheduled.svg", bgColor: "#F1F4F9", borderColor: "rgba(28, 29, 31, 0.05)", textColor: "#1C1D1F" },
																		"Publishing": { icon: "/images/publish/publish.svg", bgColor: "#F1F4F9", borderColor: "rgba(28, 29, 31, 0.05)", textColor: "#1C1D1F" },
																		"Published": { icon: "/images/status/published.svg", bgColor: "#E5EEFF", borderColor: "rgba(28, 29, 31, 0.05)", textColor: "#1C1D1F" },
																		"Failed Publishing": { icon: "/images/status/failed-publishing.svg", bgColor: "#F5EEFF", borderColor: "#EAE4F4", textColor: "#1C1D1F" }
																	}[status] || { icon: "/images/status/draft.svg", bgColor: "#F1F4F9", borderColor: "rgba(28, 29, 31, 0.05)", textColor: "#1C1D1F" };

																	return (
																		<div
																			key={status}
																			className="flex items-center justify-between pl-1 pr-1.5 py-0.5 rounded border cursor-pointer transition-colors"
																			style={{
																				backgroundColor: statusConfig.bgColor,
																				border: `1px solid ${statusConfig.borderColor}`,
																			}}
																		>
																			<div className="flex items-center gap-2">
																				<img
																					src={statusConfig.icon}
																					alt={status}
																					className="w-4 h-4"
																				/>
																				<span className="text-sm font-semibold text-black">
																					{status}: {count}
																				</span>
																			</div>
																		</div>
																	);
																})}
															</div>
														</div>
													)}
												</div>
											))}
										</div>
									</div>
								) : (
									<div className="p-4 text-sm text-gray-500 text-center">
										No boards available
									</div>
								)}
							</div>
						)}

						{activeSidebarTab === 'media' && (
							<div>
								{loadingBoardData ? (
									<div className="flex items-center justify-center py-8">
										<div className="text-sm text-gray-500">Loading media...</div>
									</div>
								) : boardData.length > 0 ? (
									<div className="flex flex-col">
										{(() => {
											// Get only scheduled, failed publishing, and published posts from all boards and sort by time
											const allPosts = boardData.flatMap(board =>
												Object.entries(board.postsByStatus)
													.filter(([status]) => ['Scheduled', 'Failed Publishing', 'Published'].includes(status))
													.flatMap(([status, posts]) =>
														posts.map(post => ({
															id: post.id,
															board_id: board.id,
															boardName: board.label,
															status: post.status,
															preview: getPostThumbnail(post),
															format: post.format,
															isVideo: isVideo(post),
															createdAt: post.created_at || post.createdAt || new Date()
														}))
													)
											);

											// Sort by creation time (newest first)
											const sortedPosts = allPosts.sort((a, b) =>
												new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
											);

											if (sortedPosts.length === 0) return null;

											return (
												<div className="grid grid-cols-3">
													{sortedPosts.map((post) => (
														<div
															key={post.id}
															className="bg-white border border-strokeElement overflow-hidden cursor-pointer hover:border-gray-300 transition-colors w-[90px] h-[120px]"
														>
															<div className="w-[90px] h-[120px] bg-gray-100 flex items-center justify-center overflow-hidden relative">
																{post.isVideo ? (
																	<>
																		<video
																			src={post.preview}
																			className="w-full h-full object-cover"
																			muted
																			loop
																			playsInline
																		/>
																		{/* Play icon overlay */}
																		<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
																			<div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden drop-shadow-md">
																				<div className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-t-transparent border-b-transparent border-l-white" />
																			</div>
																		</div>
																	</>
																) : (
																	<img
																		src={post.preview}
																		alt="Post preview"
																		className="w-full h-full object-cover"
																		onError={(e) => {
																			const target = e.target as HTMLImageElement;
																			target.src = '/images/format/image.svg';
																		}}
																	/>
																)}
															</div>
														</div>
													))}
												</div>
											);
										})()}
									</div>
								) : (
									<div className="p-4 text-sm text-gray-500 text-center">
										No media available
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}


