'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getFullnameinitial } from '@/lib/utils'
import { useBoardData } from '@/hooks/use-board-data'

type MemberItem = {
	email?: string
	name: string
	role: string
	imageUrl?: string
}

type MessagesSidebarProps = {
	members: MemberItem[]
	channelCreatedAt: Date
	activeSidebarTab: 'info' | 'board' | 'media'
	onTabChange: (tab: 'info' | 'board' | 'media') => void
	activeWorkspaceId: string | null
	onBoardQuickView: (boardId: string) => void
}

const ROLE_TITLE: Record<string, string> = {
	designer: 'Designer',
	member: 'Member',
	client: 'Client',
	accountmanager: 'Account Manager',
	admin: 'Admin',
}

const getRoleTitle = (role: string) => {
	const key = role.replace(/\s+/g, '').toLowerCase()
	return ROLE_TITLE[key] ?? role
}

const formatDateFull = (date: Date) => format(date, 'MMMM d, yyyy')

export default function MessagesSidebar({
	members,
	channelCreatedAt,
	activeSidebarTab,
	onTabChange,
	activeWorkspaceId,
	onBoardQuickView
}: MessagesSidebarProps) {
	const { boardData, loadingBoardData, toggleBoardExpansion } = useBoardData(activeWorkspaceId)

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
		return currentVer?.file.kind === "video";
	};

	return (
		<div className="shrink-0 border-l bg-white flex flex-col">
			{/* Sidebar topbar with toggle */}
			<div className="h-10.5 px-3 border-b flex items-center">
				<div className="flex items-center gap-[4px] p-[2px] bg-[#F4F5F6] rounded-[6px]">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onTabChange('info')}
						className={cn('px-[8px] text-black rounded-[6px] font-medium text-sm h-[24px] w-[78px] cursor-pointer', activeSidebarTab === 'info' ? 'bg-white shadow' : '')}
					>
						Info
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onTabChange('board')}
						className={cn('px-[8px] text-black rounded-[6px] font-medium text-sm h-[24px] w-[78px] cursor-pointer', activeSidebarTab === 'board' ? 'bg-white shadow' : '')}
					>
						Board
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onTabChange('media')}
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
						<div className="flex flex-col gap-2 border-b border-elementStroke p-3">
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
													{getFullnameinitial(undefined, undefined, m.name || '?')}
												</AvatarFallback>
											</Avatar>
											<div className="text-xs text-black font-medium truncate">{m.name}</div>
										</div>
										{(() => {
											const title = getRoleTitle(m.role);
											return (
												<div
													className="text-xs font-medium px-1.5 py-0.5 rounded-[5px] bg-backgroundHover text-darkGrey"
												>
													{title}
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
											className="bg-white border border-elementStroke rounded-[4px] overflow-hidden w-[246px]"
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
													boardId: board.id,
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
													className="bg-white border border-elementStroke overflow-hidden cursor-pointer hover:border-gray-300 transition-colors w-[90px] h-[120px]"
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
	)
}
