'use client'

import React, { useState, useEffect, useCallback, memo } from 'react'
import { Post, useFeedbirdStore } from '@/lib/store/use-feedbird-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PostRecordModal } from '@/components/content/post-record-modal/post-record-modal'
import { Switch } from '@/components/ui/switch'
import { ManageSocialsDialog } from '@/components/social/manage-socials-dialog'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import {
	Bell,
	Settings,
	CheckCircle,
	RefreshCw,
	MessageSquare,
	AtSign,
	Check,
	AlertCircle,
	MessageCircle,
	CircleCheck,
	FileText,
	Calendar,
	AlertTriangle,
	MoreHorizontal
} from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { Platform, SocialPage } from '@/lib/social/platforms/platform-types'
import { cn, getFullnameinitial } from '@/lib/utils'
import { activityApi, notificationApi, userApi } from '@/lib/api/api-service'

type NotificationType = 'all' | 'unread' | 'comments' | 'approval' | 'mention'

interface Notification {
	id: string
	type: string
	timestamp: Date
	read: boolean
	workspaceId?: string
	metadata?: {
		postId?: string
		post?: Post
		commentId?: string
		userId?: string
		platform?: string
		channelId?: string
		authorEmail?: string
		authorName?: string
		authorImageUrl?: string
		messageId?: string
		postTitle?: string
		// Invitation-specific metadata
		invitedEmail?: string
		workspaceId?: string
		boardId?: string
	}
}

export default function NotificationsPane() {
	const [activeTab, setActiveTab] = useState<NotificationType>('all')
	const [activities, setActivities] = useState<any[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [openPost, setOpenPost] = useState<Post | null>(null)
	const [localReadNotifications, setLocalReadNotifications] = useState<Set<string>>(new Set())
	const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false)
	const [isManageSocialsOpen, setIsManageSocialsOpen] = useState(false)

	// Notification settings state
	const [notificationSettings, setNotificationSettings] = useState({
		communication: {
			enabled: true,
			commentsAndMentions: true
		},
		boards: {
			enabled: true,
			pendingApproval: true,
			scheduled: true,
			published: true,
			boardInviteSent: true,
			boardInviteAccepted: true
		},
		workspaces: {
			enabled: true,
			workspaceInviteSent: true,
			workspaceInviteAccepted: true
		}
	})
	const [isLoadingSettings, setIsLoadingSettings] = useState(false)
	const [isSavingSettings, setIsSavingSettings] = useState(false)

	const user = useFeedbirdStore((s) => s.user)
	const activeBrand = useFeedbirdStore((s) => s.getActiveBrand())
	const activeWorkspace = useFeedbirdStore((s) => s.getActiveWorkspace())
	const workspaces = useFeedbirdStore((s) => s.workspaces)
	const checkPageStatus = useFeedbirdStore((s) => s.checkPageStatus)
	const updateUserNotificationSettings = useFeedbirdStore((s) => s.updateUserNotificationSettings)
	const unread_notification = useFeedbirdStore((s) => s.user?.unread_notification || [])
	// Fetch activities for the workspace
	useEffect(() => {
		const fetchActivities = async () => {
			if (!activeWorkspace?.id) return

			try {
				setIsLoading(true)
				const activitiesData = await activityApi.getWorkspaceActivities(activeWorkspace.id)
				setActivities(activitiesData || [])
			} catch (error) {
				console.error('Failed to fetch activities:', error)
			} finally {
				setIsLoading(false)
			}
		}

		// Clear local read notifications when workspace changes
		setLocalReadNotifications(new Set())
		fetchActivities()
	}, [activeWorkspace?.id])

	// Load notification settings when dialog opens
	useEffect(() => {
		const loadNotificationSettings = async () => {
			if (!isNotificationSettingsOpen || !user?.email) return

			try {
				setIsLoadingSettings(true)
				const response = await fetch(
					`/api/user/notification-settings?user_email=${encodeURIComponent(user.email)}`
				)

				if (response.ok) {
					const data = await response.json()
					setNotificationSettings(data.settings)
				}
			} catch (error) {
				console.error('Failed to load notification settings:', error)
			} finally {
				setIsLoadingSettings(false)
			}
		}

		loadNotificationSettings()
	}, [isNotificationSettingsOpen, user?.email])

	// Save notification settings to database
	const saveNotificationSettings = async () => {
		if (!user?.email) return

		try {
			setIsSavingSettings(true)
			const updatedUser = await userApi.updateNotificationSettings(
				user.email,
				notificationSettings
			)

			// Update the store with the new notification settings
			if (updatedUser?.notification_settings) {
				updateUserNotificationSettings(updatedUser.notification_settings)
			}

		} catch (error) {
			console.error('Failed to save notification settings:', error)
		} finally {
			setIsSavingSettings(false)
		}
	}

	// Get disconnected social pages from the active workspace
	const disconnectedPages = activeWorkspace?.socialPages?.filter(page =>
		!page.connected || page.status === 'disconnected' || page.status === 'expired' || page.status === 'error'
	) || []

	// Convert activities to notifications
	const activityNotifications: Notification[] = activities.map(activity => {

		// Check if this activity is in the user's unread_notification array
		const isUnread = unread_notification.includes(activity.id) && !localReadNotifications.has(activity.id)

		return {
			id: `activity-${activity.id}`,
			type: activity.type,
			timestamp: new Date(activity.created_at),
			read: !isUnread, // Set read to opposite of 
			workspaceId: activity.workspace_id,
			metadata: {
				postId: activity.post_id,
				post: activity.post,
				userId: activity.actor_id,
				authorEmail: activity.actor?.email,
				authorName: activity.actor?.first_name ?
					`${activity.actor.first_name} ${activity.actor.last_name || ''}`.trim() :
					activity.actor?.email?.split('@')[0] || 'Unknown User',
				authorImageUrl: activity.actor?.image_url,
				postTitle: activity.post?.caption?.text || 'Post',
				// Invitation-specific metadata
				invitedEmail: activity.metadata?.invitedEmail,
				workspaceId: activity.metadata?.workspaceId,
				boardId: activity.metadata?.boardId
			}
		}
	})

	// Combine all notifications
	const allNotifications = [...activityNotifications]

	// Filter notifications based on active tab
	const filteredNotifications = allNotifications.filter(notification => {
		switch (activeTab) {
			case 'unread':
				return !notification.read
			case 'comments':
				return notification.type === 'comment' || notification.type === 'message'
			case 'approval':
				return notification.type === 'approved'
			case 'mention':
				return notification.type === 'mention'
			default:
				return true
		}
	})

	// Group notifications by day
	const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
		const date = notification.timestamp
		let dateKey: string

		if (isToday(date)) {
			dateKey = 'Today'
		} else if (isYesterday(date)) {
			dateKey = 'Yesterday'
		} else {
			dateKey = format(date, 'EEEE, MMMM d')
		}

		if (!groups[dateKey]) {
			groups[dateKey] = []
		}
		groups[dateKey].push(notification)
		return groups
	}, {} as Record<string, Notification[]>)

	// Mark all notifications as read
	const markAllAsRead = async () => {
		if (!user?.email) return

		setIsLoading(true)
		try {
			// Add all current unread activity IDs to local read state
			const unreadActivityIds = unread_notification
			setLocalReadNotifications(prev => new Set([...prev, ...unreadActivityIds]))

			// Clear unread_notification array in the store
			useFeedbirdStore.setState((state) => {
				if (!state.user) return state

				return {
					...state,
					user: {
						...state.user,
						unread_notification: []
					}
				}
			})

			// Persist to database
			await notificationApi.removeAllUnreadNotifications(user.email)
		} catch (error) {
			console.error('Error marking all as read:', error)
			// Revert changes if API call fails
			setLocalReadNotifications(prev => {
				const newSet = new Set(prev)
				unread_notification.forEach(id => newSet.delete(id))
				return newSet
			})

			// Revert store changes
			useFeedbirdStore.setState((state) => {
				if (!state.user) return state

				return {
					...state,
					user: {
						...state.user,
						unread_notification: unread_notification
					}
				}
			})
		} finally {
			setIsLoading(false)
		}
	}

	// Mark single notification as read
	const markAsRead = async (id: string) => {
		const notification = allNotifications.find(n => n.id === id)
		if (!notification) return

		if (id.startsWith('activity-')) {
			// Extract the activity ID from the notification ID
			const activityId = id.replace('activity-', '')

			// Add to local read state immediately for UI responsiveness
			setLocalReadNotifications(prev => new Set([...prev, activityId]))

			// Update the store to remove from unread_notification array
			useFeedbirdStore.setState((state) => {
				if (!state.user) return state

				const currentUnread = state.user.unread_notification || []
				const newUnread = currentUnread.filter(notificationId => notificationId !== activityId)

				return {
					...state,
					user: {
						...state.user,
						unread_notification: newUnread
					}
				}
			})

			// Persist to database
			if (user?.email) {
				try {
					await notificationApi.removeUnreadNotification(user.email, activityId)
				} catch (error) {
					console.error('Failed to persist notification removal:', error)
					// Revert local changes if API call fails
					setLocalReadNotifications(prev => {
						const newSet = new Set(prev)
						newSet.delete(activityId)
						return newSet
					})

					// Revert store changes
					useFeedbirdStore.setState((state) => {
						if (!state.user) return state

						const currentUnread = state.user.unread_notification || []
						if (!currentUnread.includes(activityId)) {
							return {
								...state,
								user: {
									...state.user,
									unread_notification: [...currentUnread, activityId]
								}
							}
						}
						return state
					})
				}
			}
		}
	}

	// Open manage socials dialog
	const openManageSocials = () => {
		setIsManageSocialsOpen(true)
	}

	// Get platform icon
	const getPlatformIcon = (platform: Platform) => {
		const iconMap: Record<Platform, string> = {
			facebook: '/images/platforms/facebook.svg',
			instagram: '/images/platforms/instagram.svg',
			linkedin: '/images/platforms/linkedin.svg',
			youtube: '/images/platforms/youtube.svg',
			tiktok: '/images/platforms/tiktok.svg',
			pinterest: '/images/platforms/pinterest.svg',
			google: '/images/platforms/google.svg'
		}
		return iconMap[platform] || '/images/platforms/comment.svg'
	}

	// Use shared helper for avatar fallback

	// Get status icon for post
	const getStatusIcon = (type?: string) => {
		switch (type) {
			case 'revision_request':
				return '/images/status/needs-revision.svg'
			case 'revised':
				return '/images/status/revised.svg'
			case 'approved':
				return '/images/status/approved.svg'
			case 'scheduled':
				return '/images/status/scheduled.svg'
			case 'published':
				return '/images/status/published.svg'
			case 'failed Publishing':
				return '/images/status/failed-publishing.svg'
			case 'workspace_invited_sent':
				return '/images/status/draft.svg' // You can change this to a more appropriate icon
			case 'board_invited_sent':
				return '/images/status/draft.svg' // You can change this to a more appropriate icon
			default:
				return null
		}
	}

	// Small blocks preview component for notifications
	const NotificationBlocksPreview = memo(({ post }: { post: Post }) => {

		if (!post || !post.blocks || post.blocks.length === 0) {
			return (
				<div className="bg-gray-100 rounded border flex items-center justify-center" style={{ width: '42px', height: '56px' }}>
					<FileText className="w-4 h-4 text-gray-400" />
				</div>
			)
		}

		// Show only the first block as a small preview
		const firstBlock = post.blocks[0]
		const currentVersion = firstBlock.versions.find(v => v.id === firstBlock.currentVersionId)

		if (!currentVersion?.file?.url) {
			return (
				<div className="bg-gray-100 rounded border flex items-center justify-center" style={{ width: '42px', height: '56px' }}>
					<FileText className="w-4 h-4 text-gray-400" />
				</div>
			)
		}

		const isVideo = currentVersion.file.kind === 'video'

		return (
			<div className="rounded border overflow-hidden bg-gray-100 flex-shrink-0" style={{ width: '42px', height: '56px' }}>
				{isVideo ? (
					<video
						src={currentVersion.file.url}
						className="w-full h-full object-cover"
						muted
					/>
				) : (
					<img
						src={currentVersion.file.url}
						alt="Post preview"
						className="w-full h-full object-cover"
					/>
				)}
			</div>
		)
	})

	// Generate activity message with actor name
	const getActivityMessageWithActor = (type: string, actorName?: string, invitedEmail?: string, workspaceId?: string, boardId?: string) => {
		const actor = actorName || 'Someone'

		// Helper functions to get workspace and board names
		const getWorkspaceName = (workspaceId?: string) => {
			if (!workspaceId) return 'a workspace'
			const workspace = workspaces.find(w => w.id === workspaceId)
			return workspace?.name || 'a workspace'
		}

		const getBoardName = (boardId?: string) => {
			if (!boardId) return 'a board'
			const board = workspaces.flatMap(w => w.boards).find(b => b.id === boardId)
			return board?.name || 'a board'
		}

		switch (type) {
			case 'revision_request':
				return (
					<>
						<span className="text-black">{actor}</span>
						<span className="text-darkGrey"> need revision on a record</span>
					</>
				)
			case 'revised':
				return (
					<>
						<span className="text-black">{actor}</span>
						<span className="text-darkGrey"> revised a record</span>
					</>
				)
			case 'approved':
				return (
					<>
						<span className="text-black">{actor}</span>
						<span className="text-darkGrey"> approved a record</span>
					</>
				)
			case 'scheduled':
				return (
					<>
						<span className="text-black">{actor}</span>
						<span className="text-darkGrey"> records scheduled</span>
					</>
				)
			case 'published':
				return (
					<>
						<span className="text-black">{actor}</span>
						<span className="text-darkGrey"> published the record</span>
					</>
				)
			case 'failed_publishing':
				return (
					<>
						<span className="text-black">{actor}</span>
						<span className="text-darkGrey"> records failed published</span>
					</>
				)
			case 'comment':
				return (
					<>
						<span className="text-black">{actor}</span>
						<span className="text-darkGrey"> commented on a record</span>
					</>
				)
			case 'workspace_invited_sent':
				return (
					<>
						<span className="text-black">{actor}</span>
						<span className="text-darkGrey"> invited </span>
						<span className="text-black">{invitedEmail || 'someone'}</span>
						<span className="text-darkGrey"> to the </span>
						<span className="text-black">{getWorkspaceName(workspaceId)}</span>
						<span className="text-darkGrey"> workspace</span>
					</>
				)
			case 'board_invited_sent':
				return (
					<>
						<span className="text-black">{actor}</span>
						<span className="text-darkGrey"> invited </span>
						<span className="text-black">{invitedEmail || 'someone'}</span>
						<span className="text-darkGrey"> to the </span>
						<span className="text-black">{getBoardName(boardId)}</span>
						<span className="text-darkGrey"> board</span>
					</>
				)
			case 'workspace_invited_accepted':
				return (
					<>
						<span className="text-black">{actor}</span>
						<span className="text-darkGrey"> accepted the invitation to join the </span>
						<span className="text-black">{getWorkspaceName(workspaceId)}</span>
						<span className="text-darkGrey"> workspace.</span>
					</>
				)
			case 'workspace_invited_declined':
				return (
					<>
						<span className="text-black">{actor}</span>
						<span className="text-darkGrey"> declined the invitation to join the </span>
						<span className="text-black">{getWorkspaceName(workspaceId)}</span>
						<span className="text-darkGrey"> workspace.</span>
					</>
				)
			case 'workspace_access_requested':
				return (
					<>
						<span className="text-black">{actor}</span>
						<span className="text-darkGrey"> requested to join the </span>
						<span className="text-black">{getWorkspaceName(workspaceId)}</span>
						<span className="text-darkGrey"> workspace.</span>
					</>
				)
			default:
				return (
					<>
						<span className="text-black">{actor}</span>
						<span className="text-darkGrey"> updated a record</span>
					</>
				)
		}
	}

	// Get notification icon
	const getNotificationIcon = (type: string, metadata?: any) => {
		// If we have author information, show avatar
		if (metadata?.authorName || metadata?.authorEmail || metadata?.authorImageUrl) {
			return (
				<Avatar className="w-8 h-8">
					{metadata?.authorImageUrl && (
						<AvatarImage
							src={metadata.authorImageUrl}
							alt={metadata.authorName || 'User avatar'}
						/>
					)}
					<AvatarFallback className="text-xs font-medium bg-gray-100 text-gray-600">
						{getFullnameinitial(undefined, undefined, metadata.authorName || metadata.authorEmail || 'U')}
					</AvatarFallback>
				</Avatar>
			)
		}
	}

	const unreadCount = allNotifications.filter(n => !n.read).length

	// Handle notification click
	const handleNotificationClick = (notification: Notification) => {
		if (notification.metadata?.post) {
			// Open the post record modal
			setOpenPost(notification.metadata.post)
		}

		// Mark as read
		markAsRead(notification.id)
	}

	return (
		<div className="h-full flex flex-col bg-white">
			{/* Header */}
			<div className="h-10.5 px-3 border-b bg-white shrink-0 flex items-center">
				<div className="flex items-center justify-between w-full">
					<span className="text-sm font-medium text-darkgray">
						Notifications
					</span>
				</div>
			</div>

			{/* Body */}
			<div className="flex-1 min-h-0 flex flex-col p-4">
				{/* View Switcher and Actions */}
				<div className="flex items-center justify-between px-4 mb-8">
					{/* View Switcher */}
					<div className="py-0.5">
						<div className="flex items-center gap-[4px] p-[2px] bg-[#F4F5F6] rounded-[6px] h-full">
							{(['all', 'unread', 'comments', 'approval', 'mention'] as NotificationType[]).map((tab) => (
								<Button
									key={tab}
									variant="ghost"
									size="sm"
									onClick={() => setActiveTab(tab)}
									className={cn(
										'px-[8px] text-black rounded-[6px] font-medium text-sm h-[24px] w-[102px] cursor-pointer flex items-center gap-1',
										activeTab === tab
											? 'bg-white shadow'
											: ''
									)}
								>
									{tab === 'all' && (
										<>
											All
										</>
									)}
									{tab === 'unread' && (
										<>
											Unread
										</>
									)}
									{tab === 'comments' && (
										<>
											<MessageCircle className="size-[14px] text-darkGrey" />
											Comments
										</>
									)}
									{tab === 'approval' && (
										<>
											<Check className="size-[14px] text-darkGrey" />
											Approval
										</>
									)}
									{tab === 'mention' && (
										<>
											<AtSign className="size-[14px] text-darkGrey" />
											Mention
										</>
									)}
								</Button>
							))}
						</div>
					</div>


					{/* Action Buttons */}
					<div className="flex items-center space-x-2">
						<Button
							variant="ghost"
							size="sm"
							disabled={unreadCount === 0}
							onClick={markAllAsRead}
							className={cn(
								"h-6 px-2 text-sm flex items-center gap-1 cursor-pointer font-normal",
								unreadCount > 0
									? "text-main hover:text-main"
									: "text-grey"
							)}
						>
							<CheckCircle className={cn(
								'size-[14px]',
								unreadCount > 0 ? 'text-main' : 'text-grey'
							)} />
							Mark all as read
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsNotificationSettingsOpen(true)}
							className="h-6 px-2 text-sm text-black font-normal cursor-pointer rounded-[4px] border-buttonStroke flex items-center gap-1"
						>
							<Settings className="size-[14px] text-grey" />
							Notification Settings
						</Button>
					</div>
				</div>

				{/* Welcome Message */}
				<div className="flex flex-col items-start px-4 mb-4">
					<h2 className="text-xl font-semibold text-black mb-2">
						Hi 👋, {user?.firstName || 'there'} {user?.lastName || ''}
					</h2>
					<p className="text-darkGrey text-sm">
						Welcome to Feedbird! Your journey to social media growth starts now
					</p>
				</div>

				{/* Social Page Reconnect Section */}
				{disconnectedPages.length > 0 && (
					<div className="px-4 mb-4">
						<div className="space-y-2">
							{disconnectedPages.map((page) => (
								<div
									key={page.id}
									className="flex items-center justify-between px-3 py-2 bg-[#FDF4E9] border border-[#FCDCB6] rounded-lg"
								>
									<div className="flex items-center space-x-2">
										<Image
											src={getPlatformIcon(page.platform)}
											alt={page.platform}
											width={16}
											height={16}
											className="w-4 h-4"
										/>
										<p className="text-sm font-medium text-black">{page.name}</p>
										<p className="text-sm font-normal text-darkGrey">
											needs to be reconnected
										</p>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={openManageSocials}
										disabled={isLoading}
										className="h-6 !p-1 text-sm border-buttonStroke text-main rounded-[4px]"
									>
										<RefreshCw className="size-[14px] text-main" />
									</Button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Notifications List */}
				<div className="flex-1 overflow-y-auto">
					<div className="px-4 pb-4">
						{isLoading && activities.length === 0 ? (
							<div className="text-center py-12">
								<RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-spin" />
								<p className="text-gray-500 text-sm mb-2">Loading notifications...</p>
							</div>
						) : Object.keys(groupedNotifications).length === 0 ? (
							<div className="text-center py-12">
								<Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
								<p className="text-gray-500 text-sm mb-2">No notifications to show</p>
								<p className="text-xs text-gray-400">
									{activeTab === 'all' && 'You\'re all caught up!'}
									{activeTab === 'unread' && 'No unread notifications'}
									{activeTab === 'comments' && 'No comment notifications'}
									{activeTab === 'approval' && 'No approval notifications'}
									{activeTab === 'mention' && 'No mention notifications'}
								</p>
							</div>
						) : (
							<div className="">
								{Object.entries(groupedNotifications).map(([date, dayNotifications]) => (
									<div key={date}>
										<h4 className="text-xs font-medium text-darkGrey uppercase tracking-wider py-2">
											{date}
										</h4>
										<div className="">
											{dayNotifications.map((notification) => (
												<div
													key={notification.id}
													className={`py-3 border-t border-borderGrey transition-colors cursor-pointer hover:bg-gray-50 ${!notification.read ? 'bg-[#EDF6FF]' : ''
														}`}
													onClick={() => handleNotificationClick(notification)}
												>
													<div className="flex items-center">
														{/* Icon/Avatar */}
														<div className="flex-shrink-0 mr-3 relative">
															{/* Show workspace/board icon for invitation activities */}
															{(notification.type === 'workspace_invited_sent' || notification.type === 'workspace_invited_accepted' || notification.type === 'workspace_invited_declined' || notification.type === 'workspace_access_requested' || notification.type === 'board_invited_sent') ? (
																notification.type === 'workspace_invited_sent' || notification.type === 'workspace_invited_accepted' || notification.type === 'workspace_invited_declined' || notification.type === 'workspace_access_requested' ? (
																	(() => {
																		const workspace = workspaces.find(w => w.id === notification.workspaceId)
																		const workspaceName = workspace?.name || 'Workspace'
																		const hasLogo = workspace?.logo

																		return workspace?.logo ? (
																			<div className="w-6 h-6 rounded-[3px] flex items-center justify-center relative">
																				<Image
																					src={workspace.logo}
																					alt="Workspace"
																					width={24}
																					height={24}
																					className="w-6 h-6 rounded-[3px]"
																				/>
																			</div>
																		) : (
																			<div className="w-6 h-6 rounded-[3px] flex items-center justify-center bg-[#B5B5FF] text-xs font-medium text-[#43439F]">
																				{workspaceName.substring(0, 1).toUpperCase()}{workspaceName.substring(1, 2).toLowerCase()}
																			</div>
																		)
																	})()
																) : (
																	(() => {
																		const board = workspaces.flatMap(w => w.boards).find(b => b.id === notification.metadata?.boardId)
																		return (
																			<div className="w-6 h-6 rounded-[3px] flex items-center justify-center relative"
																				style={{
																					backgroundColor: board?.color || '#f3f4f6'
																				}}
																			>
																				<Image
																					src={board?.image || '/images/boards/static-posts.svg'}
																					alt="Board"
																					width={12}
																					height={12}
																					className="w-3 h-3"
																				/>
																			</div>
																		)
																	})()
																)
															) : (
																/* Show actor avatar for other activities */
																(notification.metadata?.authorName || notification.metadata?.authorEmail || notification.metadata?.authorImageUrl) ? (
																	<>
																		<Avatar className="w-6 h-6">
																			{notification.metadata?.authorImageUrl && (
																				<AvatarImage
																					src={notification.metadata.authorImageUrl}
																					alt={notification.metadata.authorName || 'User avatar'}
																				/>
																			)}
																			<AvatarFallback className="text-xs font-medium bg-gray-100 text-gray-600">
																				{getFullnameinitial(undefined, undefined, notification.metadata.authorName || notification.metadata.authorEmail || 'U')}
																			</AvatarFallback>
																		</Avatar>
																		{/* Status Icon Overlay */}
																		{notification.type && getStatusIcon(notification.type) && (
																			<div
																				className="absolute -bottom-1 -right-1 flex items-center justify-center"
																			>
																				<Image
																					src={getStatusIcon(notification.type)!}
																					alt={`${notification.type} status`}
																					width={14}
																					height={14}
																					className="w-3.5 h-3.5"
																				/>
																			</div>
																		)}
																	</>
																) : (
																	getNotificationIcon(notification.type, notification.metadata)
																)
															)}
														</div>

														{/* Activity Message and Caption Summary */}
														<div className="flex-1 min-w-0">
															{/* Activity Message with Timestamp */}
															<div className="flex items-center justify-start">
																<p className={`text-sm font-medium`}>
																	{notification.type && notification.metadata?.authorName ?
																		getActivityMessageWithActor(
																			notification.type,
																			notification.metadata.authorName,
																			notification.metadata.invitedEmail,
																			notification.workspaceId,
																			notification.metadata.boardId
																		) :
																		""
																	}
																</p>
																<p className="text-sm text-grey ml-2 flex-shrink-0">
																	{formatDistanceToNow(notification.timestamp, { addSuffix: true })}
																</p>
															</div>

															{/* Caption Summary */}
															{notification.metadata?.post?.caption && (
																<p className="text-sm text-black mt-1">
																	"{notification.metadata.post.caption.default.length > 30
																		? `${notification.metadata.post.caption.default.substring(0, 30)}...`
																		: notification.metadata.post.caption.default}"
																</p>
															)}
														</div>

														{/* Preview and Three Dot Button */}
														<div className="flex items-center space-x-2 flex-shrink-0">
															{/* Block Preview */}
															{notification.metadata?.post && (
																<NotificationBlocksPreview post={notification.metadata.post} />
															)}

															{/* Three Dot Button */}
															<Button
																variant="ghost"
																size="sm"
																onClick={(e) => {
																	e.stopPropagation()
																}}
																className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
															>
																<MoreHorizontal className="w-4 h-4" />
															</Button>
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Post Record Modal */}
			{openPost && (
				<PostRecordModal
					selectedPost={openPost}
					open
					onClose={() => setOpenPost(null)}
					onPostSelect={(postId) => {
						// Find the post by ID from all posts in the workspace
						const allPosts = useFeedbirdStore.getState().getAllPosts();
						const post = allPosts.find(p => p.id === postId);
						if (post) {
							setOpenPost(post);
						}
					}}
				/>
			)}

			{/* Notification Settings Dialog */}
			<Dialog open={isNotificationSettingsOpen} onOpenChange={setIsNotificationSettingsOpen}>
				<DialogContent className="w-[480px] p-4 [&>button]:hidden">
					<DialogHeader>
						<DialogTitle className="text-xl text-black font-semibold">Notification Settings</DialogTitle>
					</DialogHeader>

					<div className="">
						{/* Communication Section */}
						<div className="space-y-3 pb-4">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-sm font-medium text-black">Communication</h3>
								<Switch
									checked={notificationSettings.communication.enabled}
									onCheckedChange={(checked) =>
										setNotificationSettings(prev => ({
											...prev,
											communication: {
												enabled: checked,
												commentsAndMentions: checked ? prev.communication.commentsAndMentions : false
											}
										}))
									}
									className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3"
								/>
							</div>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-normal text-black">Comment, mentions, replies (in boards)</span>
									<Switch
										checked={notificationSettings.communication.enabled && notificationSettings.communication.commentsAndMentions}
										disabled={!notificationSettings.communication.enabled}
										onCheckedChange={(checked) =>
											setNotificationSettings(prev => ({
												...prev,
												communication: { ...prev.communication, commentsAndMentions: checked }
											}))
										}
										className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
									/>
								</div>
							</div>
						</div>

						{/* Boards Section */}
						<div className="space-y-3 py-4 border-y border-elementStroke">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-sm font-medium text-black">Boards</h3>
								<Switch
									checked={notificationSettings.boards.enabled}
									onCheckedChange={(checked) =>
										setNotificationSettings(prev => ({
											...prev,
											boards: {
												enabled: checked,
												pendingApproval: checked ? prev.boards.pendingApproval : false,
												scheduled: checked ? prev.boards.scheduled : false,
												published: checked ? prev.boards.published : false,
												boardInviteSent: checked ? prev.boards.boardInviteSent : false,
												boardInviteAccepted: checked ? prev.boards.boardInviteAccepted : false
											}
										}))
									}
									className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3"
								/>
							</div>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-normal text-black">Records 'Pending Approval'</span>
									<Switch
										checked={notificationSettings.boards.enabled && notificationSettings.boards.pendingApproval}
										disabled={!notificationSettings.boards.enabled}
										onCheckedChange={(checked) =>
											setNotificationSettings(prev => ({
												...prev,
												boards: { ...prev.boards, pendingApproval: checked }
											}))
										}
										className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
									/>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm font-normal text-black">Records 'Scheduled'</span>
									<Switch
										checked={notificationSettings.boards.enabled && notificationSettings.boards.scheduled}
										disabled={!notificationSettings.boards.enabled}
										onCheckedChange={(checked) =>
											setNotificationSettings(prev => ({
												...prev,
												boards: { ...prev.boards, scheduled: checked }
											}))
										}
										className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
									/>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm font-normal text-black">Records 'Published'</span>
									<Switch
										checked={notificationSettings.boards.enabled && notificationSettings.boards.published}
										disabled={!notificationSettings.boards.enabled}
										onCheckedChange={(checked) =>
											setNotificationSettings(prev => ({
												...prev,
												boards: { ...prev.boards, published: checked }
											}))
										}
										className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
									/>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm font-normal text-black">Board invite sent</span>
									<Switch
										checked={notificationSettings.boards.enabled && notificationSettings.boards.boardInviteSent}
										disabled={!notificationSettings.boards.enabled}
										onCheckedChange={(checked) =>
											setNotificationSettings(prev => ({
												...prev,
												boards: { ...prev.boards, boardInviteSent: checked }
											}))
										}
										className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
									/>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm font-normal text-black">Board invite accepted</span>
									<Switch
										checked={notificationSettings.boards.enabled && notificationSettings.boards.boardInviteAccepted}
										disabled={!notificationSettings.boards.enabled}
										onCheckedChange={(checked) =>
											setNotificationSettings(prev => ({
												...prev,
												boards: { ...prev.boards, boardInviteAccepted: checked }
											}))
										}
										className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
									/>
								</div>
							</div>
						</div>

						{/* Workspaces Section */}
						<div className="space-y-3 py-4">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-sm font-medium text-black">Workspaces</h3>
								<Switch
									checked={notificationSettings.workspaces.enabled}
									onCheckedChange={(checked) =>
										setNotificationSettings(prev => ({
											...prev,
											workspaces: {
												enabled: checked,
												workspaceInviteSent: checked ? prev.workspaces.workspaceInviteSent : false,
												workspaceInviteAccepted: checked ? prev.workspaces.workspaceInviteAccepted : false
											}
										}))
									}
									className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3"
								/>
							</div>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-normal text-black">Workspace invite sent</span>
									<Switch
										checked={notificationSettings.workspaces.enabled && notificationSettings.workspaces.workspaceInviteSent}
										disabled={!notificationSettings.workspaces.enabled}
										onCheckedChange={(checked) =>
											setNotificationSettings(prev => ({
												...prev,
												workspaces: { ...prev.workspaces, workspaceInviteSent: checked }
											}))
										}
										className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
									/>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm font-normal text-black">Workspace invite accepted</span>
									<Switch
										checked={notificationSettings.workspaces.enabled && notificationSettings.workspaces.workspaceInviteAccepted}
										disabled={!notificationSettings.workspaces.enabled}
										onCheckedChange={(checked) =>
											setNotificationSettings(prev => ({
												...prev,
												workspaces: { ...prev.workspaces, workspaceInviteAccepted: checked }
											}))
										}
										className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
									/>
								</div>
							</div>
						</div>
					</div>

					<DialogFooter className="flex justify-end gap-2 pt-4">
						<Button
							variant="outline"
							onClick={() => setIsNotificationSettingsOpen(false)}
							disabled={isSavingSettings}
						>
							Cancel
						</Button>
						<Button
							variant="default"
							onClick={async () => {
								await saveNotificationSettings()
								setIsNotificationSettingsOpen(false)
							}}
							disabled={isSavingSettings || isLoadingSettings}
							className="bg-main hover:bg-[#0F4FD9] text-white"
						>
							{isSavingSettings ? 'Saving...' : 'Save'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Manage Socials Dialog */}
			{activeWorkspace && (
				<ManageSocialsDialog
					workspaceId={activeWorkspace.id}
					open={isManageSocialsOpen}
					onOpenChange={setIsManageSocialsOpen}
				/>
			)}
		</div>
	)
}


