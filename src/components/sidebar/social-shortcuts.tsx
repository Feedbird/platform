/* components/sidebar/social-shortcuts.tsx */
"use client";

import * as React from 'react';
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { socialSetApi, socialPageApi } from "@/lib/api/api-service";

/**
 * This component:
 *  - Lists all connected pages from the active brand
 *  - Renders a Link to /social/[pageId]
 * 
 * We do *not* call syncPostHistory here anymore.
 * The actual fetch is done in /social/[pageId]/page.tsx.
 */
type PageItem = {
  id: string;
  name: string;
  platform: string;
  connected?: boolean;
  socialSetId?: string | null;
};

type AnyRef<T> = { current: T | null };

function SetConnectorOverlay({
  containerRef,
  setIconRef,
  pageIconRefs,
}: {
  containerRef: AnyRef<HTMLDivElement>;
  setIconRef: AnyRef<HTMLDivElement>;
  pageIconRefs: Array<{ id: string; ref: AnyRef<HTMLDivElement> }>;
}) {
  const [paths, setPaths] = React.useState<{ id: string; d: string }[]>([]);

  React.useLayoutEffect(() => {
    function compute() {
      const container = containerRef.current;
      const startEl = setIconRef.current;
      if (!container || !startEl) {
        setPaths([]);
        return;
      }
      const cRect = container.getBoundingClientRect();
      const sRect = startEl.getBoundingClientRect();
      const x1 = sRect.left - cRect.left + sRect.width / 2;
      const y1 = sRect.bottom - cRect.top; // bottom center of set icon

      const r = 12; // corner radius
      const pageEntries: Array<{ id: string; x2: number; y2: number }> = [];
      for (const { id, ref } of pageIconRefs) {
        const endEl = ref.current;
        if (!endEl) continue;
        const eRect = endEl.getBoundingClientRect();
        const x2 = eRect.left - cRect.left; // left edge of page icon
        const y2 = eRect.top - cRect.top + eRect.height / 2; // center vertically
        pageEntries.push({ id, x2, y2 });
      }

      // Draw single vertical trunk from set bottom to last page (bottom-most)
      const nextPaths: { id: string; d: string }[] = [];
      if (pageEntries.length > 0) {
        const yLast = Math.max(...pageEntries.map((p) => p.y2));
        if (yLast > y1 + r + 1) {
          const dTrunk = `M ${x1},${y1} L ${x1},${yLast - r}`;
          nextPaths.push({ id: `trunk`, d: dTrunk });
        }
      }

      // For each page, only draw the rounded elbow and the horizontal segment
      for (const { id, x2, y2 } of pageEntries) {
        if (y2 <= y1 + r + 2) {
          // Too close to the set icon, approximate with a small smooth curve + horizontal
          const cp = Math.max(8, Math.min(24, Math.abs(y2 - y1) * 0.6));
          const cx1 = x1;
          const cy1 = y1 + cp;
          const cx2 = x1 + r; // push curve toward the right near the elbow
          const cy2 = y2;
          const d = `M ${x1},${y1} C ${cx1},${cy1} ${cx2},${cy2} ${x1 + r},${y2} L ${x2},${y2}`;
          nextPaths.push({ id, d });
          continue;
        }
        const yCornerStart = y2 - r;
        const xCornerEnd = x1 + r;
        const d = `M ${x1},${yCornerStart} A ${r},${r} 0 0 0 ${xCornerEnd},${y2} L ${x2},${y2}`;
        nextPaths.push({ id, d });
      }
      setPaths(nextPaths);
    }

    compute();
    // Recompute on next frame to ensure children refs have mounted
    const raf = requestAnimationFrame(() => compute());
    const t = setTimeout(() => compute(), 50);
    const ro = new ResizeObserver(() => compute());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      ro.disconnect();
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [containerRef, setIconRef, pageIconRefs]);

  if (!paths.length) return null;

  return (
    <svg className="pointer-events-none absolute inset-0 z-0" width="100%" height="100%">
      {paths.map((p) => (
        <path key={p.id} d={p.d} stroke="#E6E4E2" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
    </svg>
  );
}

function SocialSetBlock({
  setId,
  setName,
  pages,
  orderIndex,
  draggingPageId,
  isDragOver,
  onPageDragStart,
  onPageDragEnd,
  onSetDragOver,
  onSetDragLeave,
  onSetDrop,
}: {
  setId: string;
  setName: string;
  pages: PageItem[];
  orderIndex: number;
  draggingPageId: string | null;
  isDragOver: boolean;
  onPageDragStart: (e: React.DragEvent, pageId: string) => void;
  onPageDragEnd: () => void;
  onSetDragOver: (e: React.DragEvent, setId: string) => void;
  onSetDragLeave: (setId: string) => void;
  onSetDrop: (e: React.DragEvent, setId: string) => void;
}) {
  const pathname = usePathname();
  const activeWorkspace = useFeedbirdStore((s) => s.getActiveWorkspace());
  const [expanded, setExpanded] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftName, setDraftName] = React.useState(setName);
  const [saving, setSaving] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const setIconRef = React.useRef<HTMLDivElement | null>(null);
  const pageIconRefs = React.useMemo(
    () => pages.map((p) => ({ id: p.id, ref: React.createRef<HTMLDivElement | null>() })),
    [pages]
  );

  // Group pages by platform (preserving original order)
  const platformGroups = React.useMemo(() => {
    const map = new Map<string, PageItem[]>();
    for (const p of pages) {
      const key = p.platform;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [pages]);

  // Track expanded state for multi-page platforms (default expanded)
  const [platformExpanded, setPlatformExpanded] = React.useState<Record<string, boolean>>({});
  React.useEffect(() => {
    setPlatformExpanded((prev) => {
      const next = { ...prev } as Record<string, boolean>;
      for (const [platform, items] of platformGroups) {
        if (items.length > 1 && next[platform] === undefined) {
          next[platform] = true;
        }
      }
      return next;
    });
  }, [platformGroups]);

  // Refs for platform group icons (used to draw connectors from set → platform)
  const platformIconRefs = React.useMemo(
    () => platformGroups.map(([platform]) => ({ platform, ref: React.createRef<HTMLDivElement | null>() })),
    [platformGroups]
  );
  const platformToRef = React.useMemo(() => {
    const m = new Map<string, React.RefObject<HTMLDivElement | null>>();
    for (const { platform, ref } of platformIconRefs) m.set(platform, ref);
    return m;
  }, [platformIconRefs]);

  // Map page id → its icon ref
  const pageIdToRef = React.useMemo(() => {
    const m = new Map<string, React.RefObject<HTMLDivElement | null>>();
    for (const { id, ref } of pageIconRefs) m.set(id, ref);
    return m;
  }, [pageIconRefs]);

  React.useEffect(() => {
    // Reset draft if external name changes
    setDraftName(setName);
  }, [setName]);

  const startEditing = React.useCallback(() => {
    if (!setId || setId === "__unassigned__") return; // Do not rename special group
    setDraftName(setName);
    setIsEditing(true);
  }, [setId, setName]);

  const commitRename = React.useCallback(async () => {
    if (saving) return;
    const nextName = (draftName || "").trim();
    if (!nextName || nextName === setName) {
      setIsEditing(false);
      setDraftName(setName);
      return;
    }
    try {
      setSaving(true);
      // Optimistic update in store
      useFeedbirdStore.setState((prev: any) => {
        const workspaces = prev.workspaces || [];
        const activeId = activeWorkspace?.id;
        const updated = workspaces.map((w: any) => {
          if (w.id !== activeId) return w;
          const nextSets = (w.socialSets || []).map((s: any) =>
            s.id === setId ? { ...s, name: nextName } : s
          );
          return { ...w, socialSets: nextSets };
        });
        return { workspaces: updated };
      });

      await socialSetApi.updateSocialSetName(setId, nextName);
      setIsEditing(false);
    } catch (e) {
      // Revert on failure
      useFeedbirdStore.setState((prev: any) => {
        const workspaces = prev.workspaces || [];
        const activeId = activeWorkspace?.id;
        const updated = workspaces.map((w: any) => {
          if (w.id !== activeId) return w;
          const nextSets = (w.socialSets || []).map((s: any) =>
            s.id === setId ? { ...s, name: setName } : s
          );
          return { ...w, socialSets: nextSets };
        });
        return { workspaces: updated };
      });
      console.error(e);
      setIsEditing(false);
      setDraftName(setName);
    } finally {
      setSaving(false);
    }
  }, [activeWorkspace?.id, draftName, saving, setId, setName]);

  const cancelRename = React.useCallback(() => {
    if (saving) return;
    setIsEditing(false);
    setDraftName(setName);
  }, [saving, setName]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onDragEnterCapture={(e) => {
        // Track depth so moving between children doesn't trigger leave
        (containerRef as any)._dragDepth = ((containerRef as any)._dragDepth || 0) + 1;
        onSetDragOver(e, setId);
      }}
      onDragLeaveCapture={() => {
        (containerRef as any)._dragDepth = Math.max(0, ((containerRef as any)._dragDepth || 0) - 1);
        if (((containerRef as any)._dragDepth || 0) === 0) {
          onSetDragLeave(setId);
        }
      }}
      onDragOver={(e) => onSetDragOver(e, setId)}
      onDrop={(e) => {
        (containerRef as any)._dragDepth = 0;
        onSetDrop(e, setId);
      }}
    >
      {/* Full-set drag-over highlight overlay */}
      {isDragOver && draggingPageId ? (
        <div className="absolute inset-0 rounded pointer-events-none bg-[#EEEEEE]" />
      ) : null}
      <SidebarMenuItem>
        <button
          type="button"
          onClick={() => {
            if (isEditing) return;
            setExpanded((v) => !v);
          }}
          className={cn(
            "w-full flex items-center gap-2 px-[6px] py-[6px] rounded hover:bg-[#F4F5F6]",
          )}
        >
          <div ref={setIconRef} className="w-3.5 h-3.5 flex items-center justify-center" aria-hidden>
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
                ][orderIndex % 8],
              ].join(' ')}
            />
          </div>
          <span
            className="flex-1 min-w-0 text-left text-sm font-medium text-black truncate"
            onDoubleClick={startEditing}
          >
            {isEditing ? (
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") cancelRename();
                }}
                disabled={saving}
                className="w-full bg-white border border-elementStroke rounded border-1 px-2 py-1 text-sm font-medium text-black"
              />
            ) : (
              setName
            )}
          </span>
          <div className="ml-auto">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-[#75777C]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#75777C]" />
            )}
          </div>
        </button>
      </SidebarMenuItem>

      {expanded && pages.length > 0 && (
        <>
          {platformGroups.map(([platform, items]) => {
            if (items.length > 1) {
              const isOpen = !!platformExpanded[platform];
              const anyActive = items.some((p) => pathname.includes(p.id));
              return (
                <React.Fragment key={platform}>
                  <SidebarMenuItem className="pl-6">
                    <button
                      type="button"
                      onClick={() => setPlatformExpanded((st) => ({ ...st, [platform]: !st[platform] }))}
                      className={cn(
                        "w-full flex items-center gap-2 px-[6px] py-[6px] rounded hover:bg-[#F4F5F6]",
                      )}
                    >
                      <div className="w-[18px] h-[18px] flex items-center justify-center" ref={platformToRef.get(platform) as any}>
                        <Image
                          src={`/images/platforms/${platform}.svg`}
                          alt={platform}
                          width={18}
                          height={18}
                        />
                      </div>
                      <span className={cn("font-medium truncate text-sm", anyActive ? "text-black" : "text-darkGrey")}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </span>
                    </button>
                  </SidebarMenuItem>

                  {isOpen && items.map((page) => {
                    const active = pathname.includes(page.id);
                    const idx = pages.findIndex((p) => p.id === page.id);
                    const iconRef = idx >= 0 ? pageIconRefs[idx]?.ref : undefined;
                    return (
                      <SidebarMenuItem key={page.id} className="pl-12">{/* nested indent */}
                        <SidebarMenuButton
                          asChild
                          className={cn(
                            active && "bg-[#D7E9FF]",
                            "gap-[6px] p-[6px] text-black text-sm font-medium"
                          )}
                        >
                          <Link
                            href={activeWorkspace ? `/${activeWorkspace.id}/social/${page.id}` : `/social/${page.id}`}
                            className="flex items-center gap-2 min-w-0 w-full"
                            draggable
                            onDragStart={(e) => onPageDragStart(e, page.id)}
                            onDragEnd={onPageDragEnd}
                          >
                            <div ref={iconRef} className="w-[18px] h-[18px] flex items-center justify-center">
                              <Image
                                src={`/images/platforms/${page.platform}.svg`}
                                alt={page.name}
                                width={18}
                                height={18}
                              />
                            </div>
                            <span className={cn("font-medium truncate text-sm", active ? "text-black" : "text-darkGrey")}>
                              {page.name}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </React.Fragment>
              );
            }

            // Single item for this platform: render as a regular page row
            const page = items[0];
            const active = pathname.includes(page.id);
            const idx = pages.findIndex((p) => p.id === page.id);
            const iconRef = idx >= 0 ? pageIconRefs[idx]?.ref : undefined;
            return (
              <SidebarMenuItem key={page.id} className="pl-6">{/* 24px left indent */}
                <SidebarMenuButton
                  asChild
                  className={cn(
                    active && "bg-[#D7E9FF]",
                    "gap-[6px] p-[6px] text-black text-sm font-medium"
                  )}
                >
                  <Link
                    href={activeWorkspace ? `/${activeWorkspace.id}/social/${page.id}` : `/social/${page.id}`}
                    className="flex items-center gap-2 min-w-0 w-full"
                    draggable
                    onDragStart={(e) => onPageDragStart(e, page.id)}
                    onDragEnd={onPageDragEnd}
                  >
                    <div ref={iconRef} className="w-[18px] h-[18px] flex items-center justify-center">
                      <Image
                        src={`/images/platforms/${page.platform}.svg`}
                        alt={page.name}
                        width={18}
                        height={18}
                      />
                    </div>
                    <span className={cn("font-medium truncate text-sm", active ? "text-black" : "text-darkGrey")}>
                      {page.name}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          <SetConnectorOverlay
            containerRef={containerRef}
            setIconRef={setIconRef}
            pageIconRefs={(() => {
              const targets: Array<{ id: string; ref: React.RefObject<HTMLDivElement | null> }> = [];
              for (const [platform, items] of platformGroups) {
                if (items.length > 1) {
                  const pref = platformToRef.get(platform);
                  if (pref) targets.push({ id: `platform:${platform}`, ref: pref });
                } else if (items.length === 1) {
                  const p = items[0];
                  const ref = pageIdToRef.get(p.id);
                  if (ref) targets.push({ id: p.id, ref });
                }
              }
              return targets;
            })() as any}
          />

          {platformGroups.map(([platform, items]) => {
            if (items.length <= 1) return null;
            const isOpen = !!platformExpanded[platform];
            if (!isOpen) return null;
            const pref = platformToRef.get(platform);
            if (!pref) return null;
            const childRefs = items
              .map((p) => ({ id: p.id, ref: pageIdToRef.get(p.id)! }))
              .filter((x) => !!x.ref);
            if (!childRefs.length) return null;
            return (
              <SetConnectorOverlay
                key={`overlay:${platform}`}
                containerRef={containerRef}
                setIconRef={pref as any}
                pageIconRefs={childRefs as any}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

export default function SocialShortcuts() {
  const workspace = useFeedbirdStore((s) => s.getActiveWorkspace());
  const [isClient, setIsClient] = React.useState(false);
  const [draggingPageId, setDraggingPageId] = React.useState<string | null>(null);
  const [dragOverSetId, setDragOverSetId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const allPages: PageItem[] = (workspace?.socialPages || []).filter((p: any) => p.connected) as any;
  const socialSets: { id: string; name: string }[] = (workspace as any)?.socialSets || [];

  // Do not early-return here; hooks below must run consistently across renders

  // Group pages by social set id
  const bySetId = new Map<string, PageItem[]>();
  for (const p of allPages) {
    const sid = (p as any).socialSetId || "__unassigned__";
    if (!bySetId.has(sid)) bySetId.set(sid, []);
    bySetId.get(sid)!.push(p);
  }

  // Build render list: existing sets first, then an Unassigned group if present
  const blocks: { id: string; name: string; pages: PageItem[]; orderIndex: number }[] = [];
  socialSets.forEach((s, idx) => {
    const pages = bySetId.get(s.id) || [];
    blocks.push({ id: s.id, name: s.name, pages, orderIndex: idx });
  });
  const unassigned = bySetId.get("__unassigned__");
  if (unassigned && unassigned.length) {
    blocks.push({ id: "__unassigned__", name: "Other Socials", pages: unassigned, orderIndex: blocks.length });
  }

  // Avoid early return before hooks; we'll conditionally render at the end

  const handlePageDragStart = React.useCallback((e: React.DragEvent, pageId: string) => {
    try { e.dataTransfer.setData("text/page-id", pageId); } catch {}
    try { e.dataTransfer.effectAllowed = "move"; } catch {}
    setDraggingPageId(pageId);
  }, []);

  const handlePageDragEnd = React.useCallback(() => {
    setDraggingPageId(null);
    setDragOverSetId(null);
  }, []);

  const handleSetDragOver = React.useCallback((e: React.DragEvent, targetSetId: string) => {
    e.preventDefault();
    if (!draggingPageId) return;
    const page = ((workspace?.socialPages as any[]) || []).find((p: any) => p.id === draggingPageId);
    const sourceSet = (page?.socialSetId || "__unassigned__") as string;
    const normalizedTarget = targetSetId || "__unassigned__";
    if (sourceSet === normalizedTarget) {
      try { e.dataTransfer.dropEffect = "none"; } catch {}
      setDragOverSetId(null);
      return;
    }
    try { e.dataTransfer.dropEffect = "move"; } catch {}
    setDragOverSetId(targetSetId);
  }, [draggingPageId, workspace?.socialPages]);

  const handleSetDragLeave = React.useCallback((setId: string) => {
    console.log("handleSetDragLeave", setId);
    setDragOverSetId((curr) => (curr === setId ? null : curr));
  }, []);

  const movePageToSet = React.useCallback(async (targetSetId: string | null, pageId: string) => {
    const wsId = workspace?.id;
    const pages = ((workspace?.socialPages as any[]) || []) as any[];
    const dragged = pages.find((p) => p.id === pageId);
    if (!wsId || !dragged) return;
    const sourceSetId = (dragged.socialSetId || null) as string | null;
    if (sourceSetId === targetSetId) return;

    // optimistic update
    const prev = useFeedbirdStore.getState();
    const prevWorkspaces = prev.workspaces;
    const prevWorkspaceIdx = prevWorkspaces.findIndex((w: any) => w.id === wsId);
    const prevWorkspace = prevWorkspaces[prevWorkspaceIdx];
    const prevPages = ((prevWorkspace?.socialPages as any[]) || []).map((p: any) => ({ ...p }));

    useFeedbirdStore.setState((st: any) => {
      const workspaces = (st.workspaces || []).map((w: any) => {
        if (w.id !== wsId) return w;
        const nextPages = (w.socialPages || []).map((p: any) =>
          p.id === pageId ? { ...p, socialSetId: targetSetId } : p
        );
        return { ...w, socialPages: nextPages };
      });
      return { workspaces };
    });

    try {
      await socialPageApi.moveToSet(pageId, targetSetId);
    } catch (err) {
      console.error("Failed to move page to set", err);
      // revert
      useFeedbirdStore.setState((st: any) => {
        const workspaces = (st.workspaces || []).map((w: any) => {
          if (w.id !== wsId) return w;
          return { ...w, socialPages: prevPages };
        });
        return { workspaces };
      });
    }
  }, [workspace?.id, workspace?.socialPages]);

  const handleSetDrop = React.useCallback((e: React.DragEvent, targetSetId: string) => {
    e.preventDefault();
    const pageId = (() => { try { return e.dataTransfer.getData("text/page-id"); } catch { return draggingPageId || ""; } })();
    if (!pageId) return;
    const t = targetSetId === "__unassigned__" ? null : targetSetId;
    movePageToSet(t, pageId);
    setDragOverSetId(null);
    setDraggingPageId(null);
  }, [draggingPageId, movePageToSet]);

  const shouldRender = isClient;

  return shouldRender ? (
    <div className="relative">
      {blocks.map((b) => (
        <SocialSetBlock
          key={b.id}
          setId={b.id}
          setName={b.name}
          pages={b.pages}
          orderIndex={b.orderIndex}
          draggingPageId={draggingPageId}
          isDragOver={dragOverSetId === b.id}
          onPageDragStart={handlePageDragStart}
          onPageDragEnd={handlePageDragEnd}
          onSetDragOver={handleSetDragOver}
          onSetDragLeave={handleSetDragLeave}
          onSetDrop={handleSetDrop}
        />
      ))}
    </div>
  ) : null;
}