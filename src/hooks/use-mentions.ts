import { useState, useEffect } from 'react'
import { workspaceHelperApi } from '@/lib/api/api-service'
import { useWorkspaceStore } from '@/lib/store'

type WorkspaceMember = {
	email: string
	firstName?: string
	imageUrl?: string
}

export function useMentions(activeWorkspaceId: string | null) {
	const [showMentions, setShowMentions] = useState(false)
	const [mentionQuery, setMentionQuery] = useState('')
	const [mentionPosition, setMentionPosition] = useState<{ start: number; end: number } | null>(null)
	const [filteredMembers, setFilteredMembers] = useState<WorkspaceMember[]>([])
	const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
	const [mentionDropdownPosition, setMentionDropdownPosition] = useState<{ x: number; y: number } | null>(null)
	const [previousHTML, setPreviousHTML] = useState('')

	// Workspace members for @mentions
	const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([])

	useEffect(() => {
		if (!activeWorkspaceId) return
		workspaceHelperApi.getWorkspaceMembers(activeWorkspaceId).then(resp => {
			setWorkspaceMembers(resp.users)
		}).catch(() => { })
	}, [activeWorkspaceId])

	const filterMembers = (query: string) => {
		const filtered = workspaceMembers.filter(m =>
			(m.firstName || m.email).toLowerCase().startsWith(query.toLowerCase())
		)
		setFilteredMembers(filtered)
		setMentionQuery(query)
		setShowMentions(true)
		setSelectedMentionIndex(0)
	}

	const hideMentions = () => {
		setShowMentions(false)
		setMentionQuery('')
		setMentionPosition(null)
		setMentionDropdownPosition(null)
	}

	const selectMention = (index: number) => {
		setSelectedMentionIndex(index)
	}

	const navigateMentions = (direction: 'up' | 'down') => {
		if (filteredMembers.length === 0) return
		
		if (direction === 'down') {
			setSelectedMentionIndex(prev =>
				prev < filteredMembers.length - 1 ? prev + 1 : 0
			)
		} else {
			setSelectedMentionIndex(prev =>
				prev > 0 ? prev - 1 : filteredMembers.length - 1
			)
		}
	}

	return {
		showMentions,
		mentionQuery,
		mentionPosition,
		filteredMembers,
		selectedMentionIndex,
		mentionDropdownPosition,
		previousHTML,
		workspaceMembers,
		setMentionPosition,
		setMentionDropdownPosition,
		setPreviousHTML,
		filterMembers,
		hideMentions,
		selectMention,
		navigateMentions
	}
}
