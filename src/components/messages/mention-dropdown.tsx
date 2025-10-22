'use client'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { getFullnameinitial } from '@/lib/utils'

type WorkspaceMember = {
	email: string
	first_name?: string
	image_url?: string
}

type MentionDropdownProps = {
	showMentions: boolean
	filteredMembers: WorkspaceMember[]
	selectedMentionIndex: number
	mentionDropdownPosition: { x: number; y: number } | null
	onMentionSelect: (member: WorkspaceMember) => void
	mentionQuery: string
}

export default function MentionDropdown({
	showMentions,
	filteredMembers,
	selectedMentionIndex,
	mentionDropdownPosition,
	onMentionSelect,
	mentionQuery
}: MentionDropdownProps) {
	if (!showMentions || filteredMembers.length === 0 || !mentionDropdownPosition) {
		return null
	}

	return (
		<div
			className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-64 mentions-dropdown"
			style={{
				left: mentionDropdownPosition.x,
				top: mentionDropdownPosition.y - filteredMembers.length * 40
			}}
		>
			{filteredMembers.map((member, index) => (
				<div
					key={member.email}
					onClick={() => onMentionSelect(member)}
					className={cn(
						"flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer", 
						index === selectedMentionIndex ? 'bg-gray-100' : ''
					)}
				>
					<Avatar className="w-6 h-6">
						<AvatarImage src={member.image_url} alt={member.first_name || member.email} />
						<AvatarFallback className="text-[10px] font-medium">
							{getFullnameinitial(undefined, undefined, member.first_name || member.email)}
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
	)
}
