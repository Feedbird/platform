"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronDown, ChevronRight, GripVertical, MoreHorizontal, Plus, Search, AlertTriangle, Check, RefreshCw, Folder, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { ManageSocialsDialog } from "@/components/social/manage-socials-dialog";
import { SocialPage } from "@/lib/social/platforms/platform-types";
import { ChannelIcons } from "@/components/content/shared/content-post-ui";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { socialSetApi, socialPageApi } from "@/lib/api/api-service";

function PageStatusBadge({ page }: { page: SocialPage }) {
	const status = page.status;
	if (status === "expired") {
		return (
			<div className="flex items-center justify-end gap-0.5 text-[10px] text-[#F19525] font-medium rounded-[4px] px-1 py-0.5 bg-[#FFEED8] border border-[#1C1D1F0D]">
				<RefreshCw className="w-2.5 h-2.5" />
				RE-AUTHENTICATE
			</div>
		);
	}
	if (status === "disconnected" || status === "error") {
		return (
			<div className="flex items-center justify-end gap-0.5 text-[10px] text-[#EC5050] font-medium rounded-[4px] px-1 py-0.5 bg-[#FDE3E3] border border-[#1C1D1F0D]">
				<AlertTriangle className="w-2.5 h-2.5" />
				ERROR
			</div>
		);
	}
	if (status === "active") {
		return (
			<div className="flex items-center justify-end gap-0.5 text-[10px] text-[#129E62] font-medium rounded-[4px] px-1 py-0.5 bg-[#DDF9E4] border border-[#1C1D1F0D]">
				<Check className="w-2.5 h-2.5" />
				ACTIVE
			</div>
		);
	}
	return (
		<div className="flex items-center justify-end gap-0.5 text-[10px] text-[#5C5E63] font-medium rounded-[4px] px-1 py-0.5 bg-[#F4F5F6] border border-[#1C1D1F0D]">
			PENDING
		</div>
	);
}

export default function SettingsSocialsPage() {
	const params = useParams();
	const workspaceId = (params?.workspaceId as string) || "";

	const activeWorkspace = useFeedbirdStore((s) => s.getActiveWorkspace());
	const checkPageStatus = useFeedbirdStore((s) => s.checkPageStatus);
	const disconnectPage = useFeedbirdStore((s) => s.disconnectSocialPage);

	const [search, setSearch] = React.useState("");
	const [openDialog, setOpenDialog] = React.useState(false);
	const [createOpen, setCreateOpen] = React.useState(false);
	const [createName, setCreateName] = React.useState("");
	const [isCreatingSet, setIsCreatingSet] = React.useState(false);
	const [expandedSets, setExpandedSets] = React.useState<Record<string, boolean>>({});

	// No explicit loading; rely on activeWorkspace.socialAccounts/socialPages

	const pages: any[] = (activeWorkspace?.socialPages || []) as any[];
	const allPages = pages; // keep a stable reference for handlers scoped inside set maps
	const socialSets: any[] = (activeWorkspace as any)?.socialSets || [];

	// Drag and drop state
	const [draggingPageId, setDraggingPageId] = React.useState<string | null>(null);
	const [dragOverSetId, setDragOverSetId] = React.useState<string | null>(null);
	const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
	const dragPreviewRef = React.useRef<HTMLElement | null>(null);

	function createDragPreviewFrom(el: HTMLElement, e: DragEvent) {
		try {
			const rect = el.getBoundingClientRect();
			const clone = el.cloneNode(true) as HTMLElement;

			// Store initial cursor position relative to element
			const initialCursorX = e.clientX;
			const initialCursorY = e.clientY;
			const initialElementX = rect.left;
			const initialElementY = rect.top;

			// Match original dimensions and start at original position
			clone.style.position = "fixed";
			clone.style.width = `${rect.width}px`;
			clone.style.height = `${rect.height}px`;
			clone.style.left = `${initialElementX}px`;
			clone.style.top = `${initialElementY}px`;
			clone.style.transform = "rotate(3deg)";
			clone.style.pointerEvents = "none";
			clone.style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)";
			clone.style.opacity = "0.95";
			clone.style.zIndex = "9999";

			document.body.appendChild(clone);
			dragPreviewRef.current = clone;

			// Add drag event listener to move clone by cursor movement amount
			const handleDrag = (dragEvent: DragEvent) => {
				if (dragPreviewRef.current) {
					const deltaX = dragEvent.clientX - initialCursorX;
					const deltaY = dragEvent.clientY - initialCursorY;
					dragPreviewRef.current.style.left = `${initialElementX + deltaX}px`;
					dragPreviewRef.current.style.top = `${initialElementY + deltaY}px`;
				}
			};

			document.addEventListener('dragover', handleDrag);

			// Store cleanup function
			(clone as any)._cleanupDrag = () => {
				document.removeEventListener('dragover', handleDrag);
			};
		} catch { }
	}

	function cleanupDragPreview() {
		const node = dragPreviewRef.current;
		if (node && node.parentNode) {
			try {
				// Clean up drag event listener
				if ((node as any)._cleanupDrag) {
					(node as any)._cleanupDrag();
				}
				node.parentNode.removeChild(node);
			} catch { }
		}
		dragPreviewRef.current = null;
		try {
			document.body.style.removeProperty("cursor");
		} catch { }
	}

	const setsWithPages = React.useMemo(() => {
		const lower = search.trim().toLowerCase();
		const bySetId: Record<string, any[]> = {};
		for (const p of pages) {
			const sid = (p as any).socialSetId || "__unassigned__";
			if (!bySetId[sid]) bySetId[sid] = [];
			bySetId[sid].push(p);
		}

		const results: { id: string; name: string; pages: any[]; orderIndex: number }[] = [];
		if (bySetId["__unassigned__"]) {
			const unPages = bySetId["__unassigned__"];
			const filtered = lower ? unPages.filter((p) => p.name.toLowerCase().includes(lower)) : unPages;
			// Sort by orderIndex if available, otherwise maintain current order
			const sorted = filtered.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
			if (sorted.length || !lower) {
				results.push({ id: "__unassigned__", name: "Unassigned", pages: sorted, orderIndex: -1 });
			}
		}
		let orderCounter = 0;
		for (const set of socialSets) {
			const sid = set.id;
			const setPages = bySetId[sid] || [];
			const filtered = lower
				? setPages.filter((p) => p.name.toLowerCase().includes(lower) || (set.name || '').toLowerCase().includes(lower))
				: setPages;
			// Sort by orderIndex if available, otherwise maintain current order
			const sorted = filtered.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
			if (sorted.length || !lower) {
				results.push({ id: sid, name: set.name, pages: sorted, orderIndex: orderCounter });
				orderCounter += 1;
			}
		}
		return results;
	}, [pages, socialSets, search]);

	function toggleSet(id: string) {
		setExpandedSets((prev) => ({ ...prev, [id]: !prev[id] }));
	}

	async function handleMoveOrReorder(targetSetId: string | null, draggedPageId: string, targetIndex: number) {
		if (!workspaceId) return;

		// Identify dragged page and its current set
		const draggedPage = allPages.find(p => p.id === draggedPageId);
		if (!draggedPage) return;
		const sourceSetId = (draggedPage.socialSetId || null) as string | null;

		// Only allow cross-set moves; block same-set reorder
		if (sourceSetId === targetSetId) {
			return;
		}

		// Build lists excluding the dragged page
		const sourcePagesExcludingDragged = allPages.filter(p => (p.socialSetId || null) === sourceSetId && p.id !== draggedPageId);
		const targetPagesExcludingDragged = allPages.filter(p => (p.socialSetId || null) === targetSetId && p.id !== draggedPageId);

		// Compute insertion index within bounds
		const insertIndex = Math.max(0, Math.min(targetIndex, targetPagesExcludingDragged.length));

		// If moving within same set, this acts as reorder; otherwise cross-set move
		const newTargetPages = [...targetPagesExcludingDragged];
		newTargetPages.splice(insertIndex, 0, { ...draggedPage, socialSetId: targetSetId });

		// Prepare new indices for affected sets
		const newOrderIndexById: Record<string, number> = {};
		newTargetPages.forEach((p, idx) => { newOrderIndexById[p.id] = idx; });
		if (sourceSetId !== targetSetId) {
			// Reindex remaining pages in the source set
			sourcePagesExcludingDragged.forEach((p, idx) => { newOrderIndexById[p.id] = idx; });
		}

		// Apply state update optimistically
		useFeedbirdStore.setState((prev: any) => {
			const workspaces = (prev.workspaces || []).map((w: any) => {
				if (w.id !== workspaceId) return w;
				const nextPages = (w.socialPages || []).map((p: any) => {
					const newIndex = newOrderIndexById[p.id];
					if (p.id === draggedPageId) {
						return {
							...p,
							socialSetId: targetSetId,
							orderIndex: newIndex ?? p.orderIndex,
						};
					}
					return newIndex !== undefined ? { ...p, orderIndex: newIndex } : p;
				});
				return { ...w, socialPages: nextPages };
			});
			return { workspaces };
		});

		// Persist set move only if set changed
		try {
			if (sourceSetId !== targetSetId) {
				await socialPageApi.moveToSet(draggedPageId, targetSetId);
			}
		} catch (err) {
			console.error("Failed to persist moveToSet:", err);
		}
	}

	return (
		<div className="w-full h-full flex flex-col gap-4">
			{/* Topbar */}
			<div className="w-full border-b px-4 h-10 flex items-center justify-between">
				<div className="flex items-center gap-1">
					<Link href={`/${workspaceId}`} className="flex items-center justify-center w-4 h-4 cursor-pointer">
						<ArrowLeft className="w-4 h-4 text-grey" />
					</Link>
					<div className="text-sm text-grey font-medium">Socials</div>
				</div>
			</div>

			{/* Main Area */}
			<div className="w-full pt-6 flex flex-1 items-start justify-center overflow-y-auto">
				<div className="w-[512px] space-y-4">
					<div className="flex items-center justify-between pb-4 border-b border-elementStroke">
						<div className="space-y-1">
							<h2 className="text-sm font-medium text-black">Socials</h2>
							<p className="text-sm text-grey font-normal">Connect your social profiles to your workspace.</p>
						</div>
						<Button className="bg-main hover:bg-main/80 px-2.5 rounded-[5px] text-white text-sm font-medium cursor-pointer" onClick={() => setCreateOpen(true)}>
							+New socials set
						</Button>
					</div>

					{/* Search */}
					<div className="relative w-full">
						<Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-[#5C5E63]" />
						<Input
							placeholder="Search username"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-8 text-sm text-black font-normal border-strokeButton"
						/>
					</div>

					{/* Social Sets List */}
					<div className="">
						{setsWithPages.length === 0 && (
							<div className="pt-3 text-sm text-grey font-normal">No socials found.</div>
						)}
						{setsWithPages.map(({ id, name, pages, orderIndex }) => {
							const isOpen = expandedSets[id] ?? true;
							return (
								<div key={id} className="">
									{/* Set Header */}
									<div
										className={cn(
											"flex items-center justify-between py-3 border-t border-elementStroke",
											dragOverSetId === id ? "bg-[#F8FAFF]" : undefined
										)}
										onDragOver={(e) => {
											e.preventDefault();
											try { e.dataTransfer.dropEffect = "move"; } catch { }
											// Disallow reordering within the same set; only cross-set moves
											if (draggingPageId) {
												const dragging = allPages.find(p => p.id === draggingPageId);
												const sourceSet = (dragging?.socialSetId || null) as string | null;
												const targetSet = id === "__unassigned__" ? null : id;
												if (sourceSet === targetSet) {
													try { e.dataTransfer.dropEffect = "none"; } catch { }
													// Clear any previous indicator when hovering same set
													setDragOverSetId(null);
													setDragOverIndex(null);
													return;
												}
											}
											setDragOverSetId(id);
											setDragOverIndex(0);
										}}
										onDragLeave={() => {
											setDragOverSetId((curr) => (curr === id ? null : curr));
											setDragOverIndex((curr) => (dragOverSetId === id ? null : curr));
										}}
										onDrop={async (e) => {
											e.preventDefault();
											const pageId = e.dataTransfer.getData("text/page-id");
											if (!pageId) return;
											try {
												// Disallow reordering within same set; only allow cross-set drop
												const sourceSet = (allPages.find(p => p.id === pageId)?.socialSetId || null) as string | null;
												const targetSetVal = id === "__unassigned__" ? null : id;
												if (sourceSet === targetSetVal) {
													return;
												}
												await handleMoveOrReorder(id === "__unassigned__" ? null : id, pageId, 0);
											} finally {
												setDragOverSetId(null);
												setDraggingPageId(null);
												setDragOverIndex(null);
												cleanupDragPreview();
											}
										}}
									>
										<div className="flex items-center gap-3 min-w-0">
											{(id !== "__unassigned__") ? (
												<div
													className={[
														"w-3.5 h-3.5 rotate-90 rounded-full",
														[
															"bg-[conic-gradient(from_90deg_at_50.00%_50.00%,_rgba(238,_171,_94,_0.20)_0deg,_#EEAB5E_360deg)]",
															"bg-[conic-gradient(from_90deg_at_50.00%_50.00%,_rgba(99,_151,_246,_0.20)_0deg,_#6397F6_360deg)]",
															"bg-[conic-gradient(from_90deg_at_50.00%_50.00%,_rgba(154,_134,_255,_0.20)_0deg,_#9A86FF_360deg)]",
															"bg-[conic-gradient(from_90deg_at_50.00%_50.00%,_rgba(234,_121,_220,_0.20)_0deg,_#EA79DC_360deg)]",
															"bg-[conic-gradient(from_90deg_at_50.00%_50.00%,_rgba(242,_146,_87,_0.20)_0deg,_#F29257_360deg)]",
															"bg-[conic-gradient(from_90deg_at_50.00%_50.00%,_rgba(122,_212,_80,_0.20)_0deg,_#7AD450_360deg)]",
															"bg-[conic-gradient(from_90deg_at_50.00%_50.00%,_rgba(232,_78,_78,_0.20)_0deg,_#E84E4E_360deg)]",
															"bg-[conic-gradient(from_90deg_at_50.00%_50.00%,_rgba(65,_207,_212,_0.20)_0deg,_#41CFD4_360deg)]",
														][orderIndex % 8]
													].join(' ')}
												/>
											) : (
												<Folder className="w-4 h-4 text-darkGrey" />
											)}
											<div className="text-sm text-darkGrey font-normal truncate">{name}</div>
										</div>
										<div className="flex items-center gap-2">
											<div className="flex items-center gap-1 text-main text-sm font-medium cursor-pointer" onClick={() => setOpenDialog(true)}>
												<Plus className="w-3.5 h-3.5" /> Add Social
											</div>
											<div className="cursor-pointer" onClick={() => toggleSet(id)}>
												{isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
											</div>
										</div>
									</div>

									{/* Pages */}
									{isOpen && pages.length > 0 && (
										<div className="">
											{/* Blue line indicator before first item (insert at index 0) */}
											{dragOverSetId === id && dragOverIndex === 0 && (
												<div className="h-0.5 bg-main mx-2 rounded-full transition-all duration-200" />
											)}
											{pages.map((page: any, pageIndex: number) => (
												<React.Fragment key={page.id}>
													<div className="mb-2 flex items-center gap-2">
														<span
															className="cursor-grab"
															draggable
															onDragStart={(e) => {
																setDraggingPageId(page.id);
																e.dataTransfer.setData("text/page-id", page.id);
																e.dataTransfer.effectAllowed = "move";
																// Create preview from the row container rather than the icon
																const wrapper = (e.currentTarget as HTMLElement).parentElement as HTMLElement | null;
																const container = (wrapper?.querySelector('[data-page-container]') as HTMLElement | null) || (e.currentTarget as HTMLElement);
																createDragPreviewFrom(container, e.nativeEvent as unknown as DragEvent);
																try {
																	const emptyImg = new (window as any).Image();
																	emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
																	e.dataTransfer.setDragImage(emptyImg, 0, 0);
																	document.body.style.cursor = "grabbing";
																} catch { }
															}}
															onDragEnd={() => {
																setDraggingPageId(null);
																setDragOverSetId(null);
																setDragOverIndex(null);
																cleanupDragPreview();
															}}
														>
															<GripVertical className="w-4 h-4 text-grey" />
														</span>
														<div
															data-page-container
															className={cn(
																"flex items-center gap-3 px-4 py-4.5 rounded-[6px] border bg-white w-full relative",
																draggingPageId === page.id ? "cursor-grabbing opacity-95" : "cursor-grab"
															)}
															draggable
															onDragStart={(e) => {
																setDraggingPageId(page.id);
																e.dataTransfer.setData("text/page-id", page.id);
																e.dataTransfer.effectAllowed = "move";
																createDragPreviewFrom(e.currentTarget as HTMLElement, e.nativeEvent as unknown as DragEvent);
																try {
																	const emptyImg = new (window as any).Image();
																	emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
																	e.dataTransfer.setDragImage(emptyImg, 0, 0);
																	document.body.style.cursor = "grabbing";
																} catch { }
															}}
															onDragEnd={() => {
																setDraggingPageId(null);
																setDragOverSetId(null);
																setDragOverIndex(null);
																cleanupDragPreview();
															}}
															onDragOver={(e) => {
																e.preventDefault();
																e.dataTransfer.dropEffect = "move";

																// Hide indicator and do nothing when hovering within same set
																if (draggingPageId) {
																	const dragging = allPages.find(p => p.id === draggingPageId);
																	const sourceSet = (dragging?.socialSetId || null) as string | null;
																	const targetSet = id === "__unassigned__" ? null : id;
																	if (sourceSet === targetSet) {
																		try { e.dataTransfer.dropEffect = "none"; } catch { }
																		setDragOverSetId(null);
																		setDragOverIndex(null);
																		return;
																	}
																}

																const rect = e.currentTarget.getBoundingClientRect();
																const mouseY = e.clientY;
																const itemTop = rect.top;
																const itemBottom = rect.bottom;
																const itemHeight = itemBottom - itemTop;
																const midpoint = itemTop + (itemHeight / 2);

																// Determine if cursor is in upper or lower half
																if (mouseY < midpoint) {
																	// Drop above this item
																	setDragOverSetId(id);
																	setDragOverIndex(pageIndex);
																} else {
																	// Drop below this item
																	setDragOverSetId(id);
																	setDragOverIndex(pageIndex + 1);
																}
															}}
															onDragLeave={(e) => {
																// Only clear if we're not hovering over a child element
																const rect = e.currentTarget.getBoundingClientRect();
																const mouseY = e.clientY;
																if (mouseY < rect.top || mouseY > rect.bottom) {
																	setDragOverIndex(null);
																}
															}}
															onDrop={(e) => {
																e.preventDefault();
																const pageId = e.dataTransfer.getData("text/page-id");
																if (pageId && pageId !== page.id) {
																	// Disallow reordering within the same set; only cross-set moves
																	const sourceSet = (allPages.find(p => p.id === pageId)?.socialSetId || null) as string | null;
																	const targetSet = id === "__unassigned__" ? null : id;
																	if (sourceSet === targetSet) {
																		setDragOverSetId(null);
																		setDragOverIndex(null);
																		cleanupDragPreview();
																		return;
																	}
																	// When moving across sets, dropping on an item means insert before that item
																	const insertAt = dragOverIndex !== null ? dragOverIndex : 0;
																	handleMoveOrReorder(targetSet, pageId, insertAt);
																}
																setDragOverSetId(null);
																setDragOverIndex(null);
																cleanupDragPreview();
															}}
														>
															<ChannelIcons channels={[page.platform]} size={24} />
															<div className="flex-1 gap-1 w-auto min-w-0">
																<div className="font-semibold text-black text-sm truncate">{page.name}</div>
																<div className="flex text-sm font-normal gap-2">
																	<span className="text-[#5C5E63] first-letter:uppercase">{page.platform}</span>
																	<span className="text-[#999B9E]">{page.statusUpdatedAt ? format(new Date(page.statusUpdatedAt), "d MMM, yyyy, HH:mm") : page.lastSyncAt ? format(new Date(page.lastSyncAt), "d MMM, yyyy, HH:mm") : ""}</span>
																</div>
															</div>
															<div className="flex items-center justify-end gap-3">
																<PageStatusBadge page={page} />
																<DropdownMenu>
																	<DropdownMenuTrigger asChild>
																		<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
																			<MoreHorizontal className="h-4 w-4 text-darkGrey" />
																		</Button>
																	</DropdownMenuTrigger>
																	<DropdownMenuContent align="end" className="w-44">
																		<DropdownMenuItem className="cursor-pointer" onClick={() => checkPageStatus && checkPageStatus(workspaceId, page.id)}>
																			Check status
																		</DropdownMenuItem>
																		<DropdownMenuItem className="cursor-pointer" onClick={() => setOpenDialog(true)}>
																			Re-authenticate
																		</DropdownMenuItem>
																		<DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => disconnectPage && disconnectPage(workspaceId, page.id)}>
																			Disconnect
																		</DropdownMenuItem>
																	</DropdownMenuContent>
																</DropdownMenu>
															</div>
														</div>
													</div>
													{/* Blue line indicator between items */}
													{dragOverSetId === id && dragOverIndex === pageIndex + 1 && (
														<div className="h-0.5 bg-main mx-2 rounded-full transition-all duration-200" />
													)}
												</React.Fragment>
											))}
											{/* Blue line indicator after last item */}
											{dragOverSetId === id && dragOverIndex === pages.length && (
												<div className="h-0.5 bg-main mx-2 rounded-full transition-all duration-200" />
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Dialog */}
			<ManageSocialsDialog workspaceId={workspaceId} open={openDialog} onOpenChange={setOpenDialog} />

			{/* Create Social Set Dialog */}
			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="max-w-[512px] p-4 gap-4 rounded-[6px] bg-white">
					<DialogHeader>
						<DialogTitle className="text-base font-semibold text-black">Create Socials Set</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-3">
						<Label className="text-sm font-medium text-black">Name</Label>
						<Input
							value={createName}
							onChange={(e) => setCreateName(e.target.value)}
							className="text-sm text-black font-normal px-3 py-2 rounded-[6px] border border-buttonStroke"
						/>
					</div>
					<div className="flex items-center justify-between">
						<div
							className="cursor-pointer text-sm text-black font-medium px-4 py-1.5"
							onClick={() => {
								setCreateOpen(false);
								setCreateName("");
							}}
						>
							Cancel
						</div>
						<div
							className={cn(
								"bg-main text-white text-sm font-medium px-3 py-1.5 rounded-[6px] cursor-pointer",
								(isCreatingSet || !createName.trim()) ? "opacity-50 cursor-not-allowed" : "hover:bg-main/80"
							)}
							onClick={async () => {
								if (isCreatingSet || !createName.trim()) return;
								try {
									setIsCreatingSet(true);
									const created = await socialSetApi.createSocialSet(workspaceId, createName.trim());
									// Update store
									useFeedbirdStore.setState((prev: any) => {
										const wsList = prev.workspaces || [];
										const next = wsList.map((w: any) => {
											if (w.id !== workspaceId) return w;
											const nextSets = Array.isArray(w.socialSets) ? [...w.socialSets] : [];
											nextSets.push({
												id: created.id,
												name: created.name,
												workspaceId: created.workspace_id,
												createdAt: created.created_at ? new Date(created.created_at) : undefined,
												updatedAt: created.updated_at ? new Date(created.updated_at) : undefined,
											});
											return { ...w, socialSets: nextSets };
										});
										return { workspaces: next };
									});
									setCreateOpen(false);
									setCreateName("");
								} catch (e) {
									console.error(e);
								} finally {
									setIsCreatingSet(false);
								}
							}}
						>
							{isCreatingSet ? (
								<div className="flex items-center gap-2">
									<RefreshCw className="w-3.5 h-3.5 animate-spin" />
									Creating...
								</div>
							) : (
								"Create Socials Set"
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}



