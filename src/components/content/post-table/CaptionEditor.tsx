// CaptionEditor.tsx
"use client";
import * as React from "react";
import Image from "next/image";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Lock, Unlock, X } from "lucide-react";
import { Post, CaptionData, useWorkspaceStore } from "@/lib/store";
import { Platform } from "@/lib/social/platforms/platform-types";
import { checkCaptionQuality } from "./CaptionRules";
import { ChannelIcons } from "@/components/content/shared/content-post-ui";
import { Button } from "@/components/ui/button";

function removePhoneNumbersForPlatform(platform: Platform, text:string){
  const phoneRegex = /\b\d{3}-\d{4}\b/g;
  if(platform==="google"){
    return text.replace(phoneRegex,"[removed]");
  }
  return text;
}

export interface CaptionEditorProps {
  open: boolean;
  post: Post;
  onClose: () => void;
  onSave: (caption: CaptionData) => void;
}

interface DraftCaption {
  synced: boolean;
  default: string;
  perPlatform: Partial<Record<Platform, string>>;
}

/** SinglePlatformEditor remains the same. */
function SinglePlatformEditor({
  platform,
  value,
  onChange,
}: {
  platform: Platform;
  value: string;
  onChange: (v: string) => void;
}) {
  const err = checkCaptionQuality(value, platform);
  return (
    <div className="h-full flex flex-col min-h-0">
      <textarea
        className={`
          w-full flex-1 min-h-0 rounded-md border px-2 py-1 text-sm
          resize-none focus:outline-none
          bg-white
          ${err ? "border-orange-500" : "border-gray-300"}
        `}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {err && <p className="text-xs text-orange-600 mt-1">{err}</p>}
    </div>
  );
}

export function CaptionEditor({
  open,
  post,
  onClose,
  onSave,
}: CaptionEditorProps) {
  const dragControls = useDragControls();
  const [draft, setDraft] = React.useState<DraftCaption>({
    synced: true,
    default: "",
    perPlatform: {},
  });
  const isInitialMount = React.useRef(true);
  const hasOpened = React.useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [size, setSize] = React.useState<{ width: number; height: number }>({
    width: 480,
    height: 420,
  });
  
  const ws = useWorkspaceStore((s) => s.getActiveWorkspace());

  const availablePlatforms = React.useMemo(() => {
    const pages = ws?.socialPages || [];
    const platformIds = post.pages
      .map((pageId) => pages.find((p) => p.id === pageId)?.platform)
      .filter((p): p is Platform => !!p);
    return [...new Set(platformIds)];
  }, [post, ws?.socialPages]);

  const [activePlatform, setActivePlatform] = React.useState<Platform>(
    availablePlatforms[0] || "instagram"
  );

  React.useEffect(() => {
    if (open && !hasOpened.current) {
      setDraft({
        synced: post.caption.synced,
        default: post.caption.default,
        perPlatform: { ...(post.caption.perPlatform || {}) },
      });
      setActivePlatform(availablePlatforms[0] || "instagram");
      // reset position and size when opening, center in viewport
      const initial = { width: 480, height: 420 };
      setSize(initial);
      const vw = typeof window !== "undefined" ? window.innerWidth : 0;
      const vh = typeof window !== "undefined" ? window.innerHeight : 0;
      const cx = Math.max(0, Math.round((vw - initial.width) / 2));
      const cy = Math.max(0, Math.round((vh - initial.height) / 2));
      x.set(cx);
      y.set(cy);
      isInitialMount.current = true; // Reset debounce on open
      hasOpened.current = true;
    } else if (!open) {
      hasOpened.current = false; // Reset on close
    }
  }, [open, post, availablePlatforms]);

  // Debounced auto-save
  React.useEffect(() => {
    if (!open) return;
    
    // Do not save on the initial render when the draft is first populated.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const handler = setTimeout(() => {
      onSave(draft);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [draft, onSave, open]);

  if (!open) return null;

  function handleSave() {
    onSave(draft);
    onClose();
  }

  function toggleSynced() {
    const newDraft = { ...draft };
    newDraft.synced = !newDraft.synced;

    if (!newDraft.synced) {
      // When going from synced to unsynced, populate per-platform fields
      const pp: Partial<Record<Platform, string>> = {};
      for (const platform of availablePlatforms) {
        pp[platform] = newDraft.default;
      }
      newDraft.perPlatform = pp;
    }
    setDraft(newDraft);
  }

  const MIN_WIDTH = 360;
  const MIN_HEIGHT = 240;

  function startResize(
    dir: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw",
    e: React.PointerEvent
  ) {
    e.preventDefault();
    e.stopPropagation();

    const startX = x.get();
    const startY = y.get();
    const startWidth = size.width;
    const startHeight = size.height;
    const originClientX = e.clientX;
    const originClientY = e.clientY;

    const getMax = () => ({
      maxWidth: Math.floor(window.innerWidth * 0.95),
      maxHeight: Math.floor(window.innerHeight * 0.9),
    });

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - originClientX;
      const dy = ev.clientY - originClientY;

      let nextWidth = startWidth;
      let nextHeight = startHeight;
      let nextX = startX;
      let nextY = startY;

      const { maxWidth, maxHeight } = getMax();

      const clamp = (val: number, min: number, max: number) =>
        Math.min(max, Math.max(min, val));

      const hasE = dir.includes("e");
      const hasW = dir.includes("w");
      const hasS = dir.includes("s");
      const hasN = dir.includes("n");

      if (hasE) {
        nextWidth = clamp(startWidth + dx, MIN_WIDTH, maxWidth);
      }
      if (hasW) {
        nextWidth = clamp(startWidth - dx, MIN_WIDTH, maxWidth);
        // move x so right edge stays put
        nextX = startX + (startWidth - nextWidth);
      }
      if (hasS) {
        nextHeight = clamp(startHeight + dy, MIN_HEIGHT, maxHeight);
      }
      if (hasN) {
        nextHeight = clamp(startHeight - dy, MIN_HEIGHT, maxHeight);
        // move y so bottom edge stays put
        nextY = startY + (startHeight - nextHeight);
      }

      // apply
      setSize({ width: nextWidth, height: nextHeight });
      x.set(nextX);
      y.set(nextY);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        id="caption-float"
        drag
        dragListener={false}
        dragControls={dragControls}
        dragMomentum={false}
        className="max-w-[95vw] max-h-[90vh] min-w-[360px] min-h-[240px] bg-gray-100 rounded-lg shadow-2xl border border-gray-400 overflow-hidden flex flex-col relative"
        style={{ width: size.width, height: size.height, x, y }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {/* header */}
        <div
          className="flex items-center justify-between p-3 cursor-move border-b bg-white rounded-t-lg"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Image
              src="/images/columns/caption.svg"
              alt="caption"
              width={14}
              height={14}
            />
            <span>Edit Caption</span>
          </div>
          <div className="flex items-center gap-2">
            <Toggle
              pressed={!draft.synced}
              onPressedChange={toggleSynced}
              className="ml-auto cursor-pointer h-8 w-8"
              size="sm"
            >
              {draft.synced ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
            </Toggle>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-600 cursor-pointer h-8 w-8"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* body */}
        <div className="px-3 py-4 flex-1 overflow-hidden flex flex-col min-h-0" onPointerDown={(e) => e.stopPropagation()}>
          {draft.synced ? (
            <SinglePlatformEditor
              platform={availablePlatforms[0] || "instagram"}
              value={draft.default}
              onChange={(v) => setDraft({ ...draft, default: v })}
            />
          ) : availablePlatforms.length > 0 ? (
            <Tabs
              value={activePlatform}
              onValueChange={(v) => setActivePlatform(v as Platform)}
            >
              <TabsList className="flex-wrap mb-2 shrink-0">
                {availablePlatforms.map((platform) => (
                  <TabsTrigger
                    key={platform}
                    value={platform}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <ChannelIcons channels={[platform]} />
                    <span className="text-xs capitalize">{platform}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex-1 min-h-0 overflow-hidden">
                {availablePlatforms.map((platform) => {
                  const val = draft.perPlatform?.[platform] ?? "";
                  return (
                    <TabsContent key={platform} value={platform} className="h-full">
                      <SinglePlatformEditor
                        platform={platform}
                        value={val}
                        onChange={(v) => {
                          setDraft({
                            ...draft,
                            perPlatform: {
                              ...draft.perPlatform,
                              [platform]: v,
                            },
                          });
                        }}
                      />
                    </TabsContent>
                  );
                })}
              </div>
            </Tabs>
          ) : (
            <div className="h-full flex flex-col min-h-0">
              <div className="text-center text-sm text-gray-500 mb-2">
                <p>No social pages are connected for this post.</p>
                <p className="mt-1">Connect a page to add a platform-specific caption.</p>
              </div>
              <SinglePlatformEditor
                platform={availablePlatforms[0] || "instagram"}
                value={draft.default}
                onChange={(v) => setDraft({ ...draft, default: v })}
              />
            </div>
          )}
        </div>
        {/* resize handles - sides */}
        <div
          className="absolute inset-y-0 left-0 w-2 cursor-w-resize z-20"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => startResize("w", e)}
        />
        <div
          className="absolute inset-y-0 right-0 w-2 cursor-e-resize z-20"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => startResize("e", e)}
        />
        <div
          className="absolute inset-x-0 top-0 h-2 cursor-n-resize z-20"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => startResize("n", e)}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-2 cursor-s-resize z-20"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => startResize("s", e)}
        />
        {/* resize handles - corners */}
        <div
          className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => startResize("nw", e)}
        />
        <div
          className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => startResize("ne", e)}
        />
        <div
          className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => startResize("sw", e)}
        />
        <div
          className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-30"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => startResize("se", e)}
        />
      </motion.div>
    </motion.div>
  );
}
