'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

type BoardSelectorProps = {
	boardNav: any[]
	selectedBoards: string[]
	onBoardSelection: (boardId: string) => void
	showBoardList: boolean
	onClose: () => void
}

export default function BoardSelector({
	boardNav,
	selectedBoards,
	onBoardSelection,
	showBoardList,
	onClose
}: BoardSelectorProps) {
	if (!showBoardList) return null

	return (
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
								onClick={() => onBoardSelection(board.id)}
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
	)
}

// Selected Boards Display Component
export function SelectedBoardsDisplay({
	selectedBoards,
	boardNav,
	onBoardSelection
}: {
	selectedBoards: string[]
	boardNav: any[]
	onBoardSelection: (boardId: string) => void
}) {
	if (selectedBoards.length === 0) return null

	return (
		<div className="px-2.5 pb-2">
			<div className="flex flex-wrap gap-2">
				{selectedBoards.map((boardId) => {
					const board = boardNav.find(b => b.id === boardId);
					if (!board) return null;

					const boardColor = (board as any).color;

					return (
						<div
							key={boardId}
							className="flex items-center gap-2 pl-1 pr-2 py-1 bg-gray-50 rounded-[5px] border border-elementStroke"
						>
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
							<span className="text-sm font-medium text-gray-700">
								{board.label}
							</span>
							<button
								onClick={() => onBoardSelection(boardId)}
								className="w-4 h-4 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
							>
								<X className="w-3 h-3 text-gray-500 hover:text-gray-700" />
							</button>
						</div>
					);
				})}
			</div>
		</div>
	)
}
