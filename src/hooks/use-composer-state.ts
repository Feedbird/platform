import { useState, useEffect, useMemo } from 'react'
import { useMentions } from '@/hooks/use-mentions'
import { useTypingIndicator } from '@/hooks/use-typing-indicator'

export function useComposerState(
	activeWorkspaceId: string | null,
	supabase: any,
	channelId: string,
	supabaseInitialized: boolean
) {
	const [input, setInput] = useState('')
	const [emoji, setEmoji] = useState(false)
	const [showPlusDropdown, setShowPlusDropdown] = useState(false)
	const [showBoardList, setShowBoardList] = useState(false)

	const {
		showMentions,
		mentionQuery,
		filteredMembers,
		selectedMentionIndex,
		mentionDropdownPosition,
		workspaceMembers,
		filterMembers,
		hideMentions,
		navigateMentions
	} = useMentions(activeWorkspaceId)

	const { typingUsers, notifyTyping, stopTyping } = useTypingIndicator(supabase, channelId, supabaseInitialized)

	// Mock user and profilesByEmail for now - these should be passed as props
	const user = { email: 'test@example.com', firstName: 'Test' }
	const profilesByEmail: Record<string, { first_name?: string; image_url?: string }> = {}

	// Close dropdowns when clicking outside
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

			// Close composer emoji picker
			if (emoji && !target.closest('.composer-emoji-picker-container')) {
				setEmoji(false)
			}

			// Close mentions dropdown
			if (showMentions && !target.closest('.mentions-dropdown')) {
				hideMentions()
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [emoji, showMentions, showPlusDropdown, showBoardList, hideMentions])

	// Typing indicator display
	const typingDisplay = useMemo(() => {
		const others = Object.keys(typingUsers).filter(e => e !== user?.email)
		if (others.length === 0) return ''
		const names = others.map(e => profilesByEmail[e]?.first_name)
		return `${names.join(', ')} typing...`
	}, [typingUsers, profilesByEmail, user?.email])

	const handleMentionDetected = (query: string, position: { x: number; y: number }) => {
		filterMembers(query)
		// Position is handled by the component
	}

	const handleMentionHidden = () => {
		hideMentions()
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (showMentions && filteredMembers.length > 0) {
			if (e.key === 'ArrowDown') {
				e.preventDefault()
				navigateMentions('down')
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				navigateMentions('up')
			} else if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault()
				const selectedMember = filteredMembers[selectedMentionIndex]
				if (selectedMember) {
					// This will be handled by the parent component
					return { type: 'mention-select', member: selectedMember }
				}
			} else if (e.key === 'Escape') {
				e.preventDefault()
				hideMentions()
			}
		} else if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			return { type: 'send' }
		}
		return null
	}

	return {
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
	}
}
