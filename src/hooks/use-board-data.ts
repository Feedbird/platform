import { useState, useEffect } from 'react'
import { postApi } from '@/lib/api/api-service'
import { useWorkspaceStore } from '@/lib/store'

type BoardData = {
	id: string
	label: string
	image?: string
	color?: string
	totalPosts: number
	statusCounts: Record<string, number>
	postsByStatus: Record<string, any[]>
	expanded: boolean
}

export function useBoardData(activeWorkspaceId: string | null) {
	const [boardData, setBoardData] = useState<BoardData[]>([])
	const [loadingBoardData, setLoadingBoardData] = useState(false)
	const boardNav = useWorkspaceStore(s => s.boardNav)

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

	// Fetch board data when workspace changes
	useEffect(() => {
		if (activeWorkspaceId && boardNav.length > 0) {
			fetchBoardData()
		}
	}, [activeWorkspaceId, boardNav.length])

	return {
		boardData,
		loadingBoardData,
		fetchBoardData,
		toggleBoardExpansion
	}
}
