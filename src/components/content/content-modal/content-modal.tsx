"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  MouseEvent,
  DragEvent,
  WheelEvent,
  Fragment,
} from "react";

// Shadcn UI & local components:
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  X,
  Download,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Maximize2,
  Minimize2,
  Send,
  Smile,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import { avatarColor, CommentsPanel } from "@/components/post/comments-panel";
import { formatTimeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  useFeedbirdStore,
  Block,
  VersionComment,
  Post,
} from "@/lib/store/use-feedbird-store";
import { Avatar } from "@/components/post/comments-panel";

/* ------------------------------------------------------------------
   #1 “PinBubble” – Renders a single comment in pinned sub-thread
   plus its children recursively.
------------------------------------------------------------------*/
function PinBubble({
  comment,
  commentsById,
  level,
  onReply,
}: {
  comment: VersionComment;
  commentsById: Map<string, VersionComment[]>;
  level: number;
  onReply: (commentId: string) => void;
}) {
  const children = commentsById.get(comment.id) || [];

  return (
    <div className="mb-3">
      {/* top row => author, date */}
      <div className="flex gap-3 items-center">
        <Avatar name={comment.author} />
        <span className="font-medium text-sm text-black">{comment.author}</span>
        <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
      </div>

      {/* actual bubble => comment text + reply button */}
      <div className="pl-11 mt-1">
        <div className="bg-white border rounded-md shadow-sm p-2">
          <p className="text-sm whitespace-pre-wrap text-black mb-1">{comment.text}</p>
          <button
            className="text-xs text-black font-bold hover:underline"
            onClick={() => onReply(comment.id)}
          >
            Reply
          </button>
        </div>
      </div>

      {/* recursion for children */}
      {children.length > 0 && (
        <div className="mt-3 ml-8 border-l border-gray-200 pl-4">
          {children.map((c) => (
            <PinBubble
              key={c.id}
              comment={c}
              commentsById={commentsById}
              level={level + 1}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   #2 “PinCommentPanel”
   - Re-fetch version from store, so we have up-to-date comments
   - Build a "commentsById" map for hierarchy
   - Add onWheel={(e)=> e.stopPropagation()} on ScrollArea to
     avoid passing scroll to the main container => no zoom there.
------------------------------------------------------------------*/
function PinCommentPanel({
  postId,
  blockId,
  versionId,
  rootId, // pinned root's ID
}: {
  postId: string;
  blockId: string;
  versionId: string;
  rootId: string;          // pinned root's ID
}) {
  const store = useFeedbirdStore();

  // 1) re-fetch the entire version from store (so new comments appear)
  const version = store
    .getPost(postId)
    ?.blocks.find((b) => b.id === blockId)
    ?.versions.find((v) => v.id === versionId);

  const allComments = version?.comments || [];

  // 2) Build a map: parentId => list of children
  const commentsById = useMemo(() => {
    const map = new Map<string, VersionComment[]>();
    for (const c of allComments) {
      const arr = map.get(c.parentId || "") || [];
      arr.push(c);
      map.set(c.parentId || "", arr);
    }
    return map;
  }, [allComments]);

  // pinned root => if not found, early return
  const root = allComments.find((c) => c.id === rootId);
  if (!root) return <div className="p-4 text-sm">Comment not found.</div>;

  // local state
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // scroll ref
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allComments.length]);

  // handle sending
  function handleSend() {
    if (!input.trim()) return;
    // if we have a nested reply target, parent = replyTo; else the pinned root
    const parent = replyTo || rootId;
    store.addVersionComment(postId, blockId, versionId, input.trim(), undefined, parent);
    setInput("");
    setReplyTo(null);
  }

  // recursively render the pinned root (which might have children)
  const pinnedThread = (
    <PinBubble
      comment={root}
      commentsById={commentsById}
      level={0}
      onReply={(id) => setReplyTo(id)}
    />
  );

  return (
    <div className="bg-white w-96 flex flex-col shadow-md rounded-md">
      {/* scroll area => entire pinned sub-thread
          onWheel => prevent event from bubbling => no zoom in main */}
      <ScrollArea
        className="flex-1 p-4 max-h-[400px] overflow-y-auto"
        onWheel={(e) => e.stopPropagation()}
      >
        {pinnedThread}
        <div ref={scrollRef} />
      </ScrollArea>

      {/* composer row at bottom */}
      <div className="bg-white flex justify-center p-4 rounded-md">
        <div className="w-full border rounded-[8px] bg-white">
          {/* optional "Replying to X" line */}
          {replyTo && (
            <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded-t-[8px] text-xs">
              Replying to <strong>{root.author}</strong>
              <button
                onClick={() => setReplyTo(null)}
                className="cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="h-[70px]">
            <textarea
              autoFocus
              className="w-full text-sm h-full bg-white border-b px-3 py-2 rounded-t-[8px] focus:outline-none strong-focus"
              placeholder="Reply comment"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
          </div>
          {/* Row 2: emoji, @, send */}
          <div className="relative flex items-center justify-between rounded-b-[8px] h-[43px]">
            <div className="flex items-center h-full">
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <Smile size={18} />
              </Button>
              <div className="w-px bg-gray-300 h-5" />
              <Button variant="ghost" size="icon" className="cursor-pointer">
                @
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="mr-2 cursor-pointer"
            >
              <Send size={18} className="mr-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   “NewPinComposer” => brand-new pinned root
------------------------------------------------------------------ */
function NewPinComposer({
  onSend,
  onCancel,
}: {
  onSend: (text: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState("");

  function handleSend() {
    if (!val.trim()) return;
    onSend(val.trim());
  }

  return (
    <div className="bg-white w-96 rounded shadow-md">
      {/* Row 1: text input */}
      <div className="h-[70px]">
        <textarea
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Write a comment"
          className="w-full text-sm h-full bg-white border-b px-3 py-2 rounded-t-[8px] focus:outline-none strong-focus"
        />
      </div>

      {/* Row 2: emoji, @, send */}
      <div className="relative flex items-center justify-between rounded-b-[8px] h-[43px]">
        <div className="flex items-center h-full">
          {/* Emoji button */}
          <Button variant="ghost" size="icon">
            <Smile size={18} />
          </Button>
          <div className="w-px bg-gray-300 h-5" />

          {/* @ button */}
          <Button variant="ghost" size="icon">
            @
          </Button>
          <div className="w-px bg-gray-300 h-5" />
        </div>

        {/* Send button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSend}
          className="mr-2"
        >
          <Send size={18} className="mr-1" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   “PinItem” => pinned avatar in main viewer
------------------------------------------------------------------ */
function PinItem({
  postId,
  blockId,
  versionId,
  comment,
  zoom,
  toLeft,
  toTop,
  isPopoverOpen,
  setPopoverOpen,
}: {
  postId: string;
  blockId: string;
  versionId: string;
  comment: VersionComment;
  zoom: number;
  toLeft: (n: number) => string;
  toTop:  (n: number) => string;
  isPopoverOpen: boolean;
  setPopoverOpen: (id: string | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  if (!comment.rect) return null;

  // center of pinned rect
  const cx = comment.rect.x + comment.rect.w / 2;
  const cy = comment.rect.y + comment.rect.h / 2;

  // highlight if hovered or if popover is open
  const highlight = hovered || isPopoverOpen;

  function handleClick() {
    setPopoverOpen(isPopoverOpen ? null : comment.id);
  }

  return (
    <Fragment>
      {/* highlight rect if hovered or open */}
      {highlight && (
        <div
          className="absolute border-2 border-blue-400 pointer-events-none"
          style={{
            left: toLeft(comment.rect.x),
            top: toTop(comment.rect.y),
            width: comment.rect.w * zoom,
            height: comment.rect.h * zoom,
          }}
        />
      )}

      <Popover
        open={isPopoverOpen}
        modal
        onOpenChange={(o) => setPopoverOpen(o ? comment.id : null)}
      >
        <PopoverTrigger asChild>
          <div
            className={cn(
              "absolute w-6 h-6 rounded-full rounded-bl-none text-white",
              "text-[10px] font-semibold flex items-center justify-center cursor-pointer",
              avatarColor(comment.author)
            )}
            style={{
              left: toLeft(cx),
              top: toTop(cy),
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleClick}
          >
            {comment.author[0].toUpperCase()}
          </div>
        </PopoverTrigger>

        <PopoverContent side="top" align="center" className="p-0 border rounded-md max-w-none sm:max-w-none">
          <PinCommentPanel
            postId={postId}
            blockId={blockId}
            versionId={versionId}
            rootId={comment.id}
          />
        </PopoverContent>
      </Popover>
    </Fragment>
  );
}

/* ------------------------------------------------------------------
   “ContentModal” => the main big modal
------------------------------------------------------------------ */
interface ContentModalProps {
  postId: string;
  block: Block;
  onClose: () => void;
  initialVersionId?: string;
}

export function ContentModal({ postId, block, onClose, initialVersionId }: ContentModalProps) {
  const store = useFeedbirdStore();

  // find the updated block from store
  const realBlock =
    store.getPost(postId)?.blocks.find((b) => b.id === block.id) ?? block;

  // current version
  const [verId, setVerId] = useState(initialVersionId || realBlock.currentVersionId);
  const version = useMemo(
    () => realBlock.versions.find((v) => v.id === verId),
    [realBlock, verId]
  );
  if (!version) return null;

  const pinned = version.comments;
  const isVideo = version.file.kind === "video";

  // toggles
  const [showPins, setShowPins] = useState(true);
  const [zoom, setZoom] = useState(1);

  // track fullscreen
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  useEffect(() => {
    const fsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fsChange);
    return () => document.removeEventListener("fullscreenchange", fsChange);
  }, []);

  // container ref => center-based approach
  const containerRef = useRef<HTMLDivElement>(null);
  function getLocalCoords(e: MouseEvent | WheelEvent) {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    // offset from center
    return {
      x: (e.clientX - (rect.left + rect.width / 2)) / zoom,
      y: (e.clientY - (rect.top + rect.height / 2)) / zoom,
    };
  }
  function toLeft(x: number) {
    return `calc(50% + ${x * zoom}px)`;
  }
  function toTop(y: number) {
    return `calc(50% + ${y * zoom}px)`;
  }

  // version switching
  function handlePrevVer() {
    const idx = realBlock.versions.findIndex((v) => v.id === verId);
    if (idx > 0) {
      setVerId(realBlock.versions[idx - 1].id);
    }
  }
  function handleNextVer() {
    const idx = realBlock.versions.findIndex((v) => v.id === verId);
    if (idx < realBlock.versions.length - 1) {
      setVerId(realBlock.versions[idx + 1].id);
    }
  }

  // new pin rect
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [draftRect, setDraftRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [pendingRect, setPendingRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  // for controlling popovers
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  function onMouseDown(e: MouseEvent) {
    // If the user is pressing inside a child popover, do nothing
    // (But typically we rely on stopPropagation from the child).
    e.preventDefault();
    setDragStart(getLocalCoords(e));
    setDraftRect(null);
  }
  function onMouseMove(e: MouseEvent) {
    if (!dragStart) return;
    e.preventDefault();
    const c = getLocalCoords(e);
    setDraftRect({
      x: dragStart.x,
      y: dragStart.y,
      w: c.x - dragStart.x,
      h: c.y - dragStart.y,
    });
  }
  function onMouseUp() {
    if (draftRect && Math.abs(draftRect.w) > 20 && Math.abs(draftRect.h) > 20) {
      // store as pending
      const nx = Math.min(draftRect.x, draftRect.x + draftRect.w);
      const ny = Math.min(draftRect.y, draftRect.y + draftRect.h);
      const nw = Math.abs(draftRect.w);
      const nh = Math.abs(draftRect.h);
      setPendingRect({ x: nx, y: ny, w: nw, h: nh });
      setOpenPopoverId("NEW");
    }
    setDragStart(null);
    setDraftRect(null);
  }
  function onWheel(e: WheelEvent) {
    // If the user is scrolling the main container => we do zoom
    // (But if it's the pinned popover, we already do e.stopPropagation there)
    e.preventDefault();
    const delta = e.deltaY < 0 ? +0.1 : -0.1;
    setZoom((z) => {
      let next = z + delta;
      if (next < 0.2) next = 0.2;
      if (next > 5) next = 5;
      return next;
    });
  }

  function doDownload() {
    if (version) {
      const link = document.createElement("a");
      link.href = version.file.url;
      link.download = `version-${version.id}.${isVideo ? "mp4" : "jpg"}`;
      link.click();
    }
  }

  function toggleFs() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "w-screen h-screen max-w-none sm:max-w-none p-0 border-0 rounded-none pointer-events-auto",
          "bg-[#404653]",
          '[&>button:last-child]:hidden',
          'gap-0',
        )}
        style={{
          width: "100vw",
          height: "100vh",
        }}
      >
        <DialogTitle className="sr-only">Full-screen viewer</DialogTitle>

        <div className="w-full h-full flex flex-row">
          <div className="flex flex-1 overflow-hidden relative">
            {/* top bar */}
            <div className="h-14 bg-[#404653] text-white flex items-center justify-between px-6 py-5 shrink-0 w-full border-b border-[#ffffff10]">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-white cursor-pointer" onClick={onClose}>
                  <X size={20} />
                </Button>
                <span className="text-sm font-bold truncate max-w-[400px]">
                  {version.file.url}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Select value={verId} onValueChange={setVerId}>
                  <SelectTrigger className="h-8 bg-[#555B68] text-sm font-bold text-white border-none cursor-pointer">
                    <SelectValue placeholder="Version" />
                  </SelectTrigger>
                  <SelectContent>
                    {realBlock.versions.map((v, idx) => (
                      <SelectItem key={v.id} value={v.id} className="cursor-pointer">
                        V{idx + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={doDownload}
                  className="h-9 bg-[#555B68] cursor-pointer text-sm font-bold text-white border-none"
                >
                  <Download size={16} />
                  Download
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => setShowPins((s) => !s)}
                >
                  {showPins ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>

            {/* main area => zoom, drag rect, pinned items */}
            <div
              className="flex flex-1 overflow-hidden"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onWheel={onWheel}
              onDragStart={(e: DragEvent) => e.preventDefault()}
            >
              {/* version nav arrows */}
              <button
                className="absolute z-10 left-4 top-1/2 -translate-y-1/2 cursor-pointer w-8 h-8 rounded-full text-white flex items-center justify-center"
                onClick={handlePrevVer}
                disabled={realBlock.versions[0].id === verId}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="absolute z-10 right-4 top-1/2 -translate-y-1/2 cursor-pointer w-8 h-8 rounded-full text-white flex items-center justify-center"
                onClick={handleNextVer}
                disabled={realBlock.versions.at(-1)?.id === verId}
              >
                <ChevronRight size={18} />
              </button>

              {/* zoom bar => bottom center */}
              <div
                className="
                  absolute bottom-4 left-1/2 -translate-x-1/2
                  flex items-center gap-2
                "
              >
                <div className="flex items-center gap-2 px-1 z-10 border border-[2px] border-[#525964] rounded-[8px] bg-transparent text-white font-bold">
                  <Button
                    variant="ghost"
                    className="cursor-pointer"
                    size="icon"
                    onClick={() => setZoom((z) => Math.max(z - 0.25, 0.2))}
                  >
                    <Minus size={16} />
                  </Button>
                  <span className="w-10 text-center text-sm">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    className="cursor-pointer"
                    size="icon"
                    onClick={() => setZoom((z) => Math.min(z + 0.25, 5))}
                  >
                    <Plus size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer"
                    onClick={() => setZoom(1)}
                  >
                    100%
                  </Button>
                </div>
                <div className="flex items-center gap-2 z-10 border border-[2px] border-[#525964] rounded-[8px] bg-transparent text-white font-bold">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer"
                    onClick={toggleFs}
                  >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </Button>
                </div>
              </div>

              {/* media => center-based transform */}
              <div
                ref={containerRef}
                className="absolute top-1/2 left-1/2"
                style={{
                  transform: `translate(-50%,-50%) scale(${zoom})`,
                  transformOrigin: "center center",
                }}
              >
                {isVideo ? (
                  <video
                    src={`/api/proxy?url=${encodeURIComponent(version.file.url)}`}
                    controls
                    draggable={false}
                    className="max-w-[80vw] max-h-[80vh] object-contain"
                  />
                ) : (
                  <img
                    src={`/api/proxy?url=${encodeURIComponent(version.file.url)}`}
                    draggable={false}
                    className="max-w-[80vw] max-h-[80vh] object-contain"
                  />
                )}
              </div>

              {/* draw rectangle preview */}
              {draftRect && (
                <div
                  className="absolute border-2 border-dashed border-yellow-400 bg-yellow-300/20 pointer-events-none"
                  style={{
                    left: toLeft(Math.min(draftRect.x, draftRect.x + draftRect.w)),
                    top: toTop(Math.min(draftRect.y, draftRect.y + draftRect.h)),
                    width: Math.abs(draftRect.w) * zoom,
                    height: Math.abs(draftRect.h) * zoom,
                  }}
                />
              )}

              {/* brand-new pin => popover composer */}
              {showPins && pendingRect && (
                <Popover
                  open={openPopoverId === "NEW"}
                  onOpenChange={(o) => {
                    if (!o) {
                      setPendingRect(null);
                      setOpenPopoverId(null);
                    }
                  }}
                  modal={true}
                >
                  <PopoverTrigger asChild>
                    <div
                      className="
                        absolute w-6 h-6 rounded-full rounded-bl-none bg-pink-600 text-white
                        text-[10px] font-bold flex items-center justify-center
                        cursor-pointer
                      "
                      style={{
                        left: toLeft(pendingRect.x + pendingRect.w / 2),
                        top: toTop(pendingRect.y + pendingRect.h / 2),
                      }}
                      onClick={() => setOpenPopoverId("NEW")}
                    >
                      +
                    </div>
                  </PopoverTrigger>

                  <PopoverContent
                    side="top"
                    align="center"
                    className="p-0 border-0 rounded-none max-w-none sm:max-w-none rounded-md"
                  >
                    <NewPinComposer
                      onSend={(txt) => {
                        store.addVersionComment(
                          postId,
                          block.id,
                          verId,
                          txt,
                          pendingRect
                        );
                        setPendingRect(null);
                        setOpenPopoverId(null);
                      }}
                      onCancel={() => {
                        setPendingRect(null);
                        setOpenPopoverId(null);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              )}

              {/* existing pins */}
              {showPins &&
                pinned.map((com) => (
                  <PinItem
                    key={com.id}
                    postId={postId}
                    blockId={block.id}
                    versionId={verId}
                    comment={com}
                    zoom={zoom}
                    toLeft={toLeft}
                    toTop={toTop}
                    isPopoverOpen={openPopoverId === com.id}
                    setPopoverOpen={(id) => setOpenPopoverId(id)}
                  />
                ))}
            </div>
          </div>

          {/* right => entire version-level CommentsPanel */}
          <div
            className="w-[360px] shrink-0 border-l bg-white
                        flex flex-col h-full overflow-hidden max-h-screen"
          >
            <div className="flex-1 min-h-0 overflow-hidden">
              <CommentsPanel
                post={{ id: postId } as Post}
                block={realBlock}
                versionId={verId}
                showHeader
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
