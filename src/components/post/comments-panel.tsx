"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import Image                            from 'next/image'
import { motion } from "framer-motion";
import {
  Smile,
  Send,
  MessageCircle,
  Bell,
  BellOff,
  MoreVertical,
  Check,
  X,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Post,
  Block,
  BaseComment,
  usePostStore,
} from "@/lib/store";
import { cn, formatTimeAgo } from "@/lib/utils";

const COLORS = [
  "bg-rose-500",
  "bg-pink-500",
  "bg-fuchsia-500",
  "bg-purple-500",
  "bg-violet-500",
  "bg-indigo-500",
  "bg-blue-500",
  "bg-sky-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-green-500",
  "bg-lime-500",
  "bg-yellow-500",
  "bg-amber-500",
];

export function avatarColor(name: string) {
  return COLORS[
    name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length
  ];
}

export function Avatar({ name }: { name: string }) {
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0",
        avatarColor(name)
      )}
    >
      {name[0].toUpperCase()}
    </div>
  );
}

export function Bubble({
  c,
  all,
  level,
  onReply,
}: {
  c: BaseComment;
  all: BaseComment[];
  level: number;
  onReply(id: string, author: string): void;
}) {
  const replies = all.filter((x) => x.parentId === c.id);

  return (
    <Fragment>
      <motion.div layout className="mb-4" style={{ marginLeft: level * 24 }}>
        <div className="flex gap-3 items-center">
          <Avatar name={c.author} />
          <span className="font-medium text-sm text-black">{c.author}</span>
          <span className="text-xs text-muted-foreground">{formatTimeAgo(c.createdAt)}</span>
        </div>
        <div className="pl-11 rounded-xl w-full">
          <div className="bg-white border rounded-[8px] shadow-sm w-full p-2">
            <p className="text-sm whitespace-pre-wrap text-black">{c.text}</p>
            <button
              className="text-xs mt-1 text-black font-bold hover:underline cursor-pointer"
              onClick={() => onReply(c.id, c.author)}
            >
              Reply
            </button>
          </div>
        </div>
      </motion.div>

      {replies.map((r) => (
        <Bubble
          key={r.id}
          c={r}
          all={all}
          level={level + 1}
          onReply={onReply}
        />
      ))}
    </Fragment>
  );
}

export function CommentsPanel({
  post,
  block,
  versionId,
  showHeader = false,
  isPost = false,
}: {
  post: Post;
  block?: Block;
  versionId?: string;
  showHeader?: boolean;
  isPost?: boolean;
}) {
  // Store actions
  const addPostComment = usePostStore((s) => s.addPostComment);
  const addBlockComment = usePostStore((s) => s.addBlockComment);
  const addVersionComment = usePostStore((s) => s.addVersionComment);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  // comments data
  let comments: BaseComment[] = [];
  if (isPost) {
    comments = post.comments;
  } else if (block && versionId) {
    const ver = block.versions.find((v) => v.id === versionId);
    if (ver) {
      comments = ver.comments;
    }
  } else if (block) {
    comments = block.comments;
  }

  // Local state for composer
  const [input, setInput] = useState("");
  const [emoji, setEmoji] = useState(false);
  const [reply, setReply] = useState<{ id: string; author: string } | null>(
    null
  );
  const [markAsRevision, setMarkAsRevision] = useState(false);

  // "Watch" popover logic
  const [watch, setWatch] = useState(true);

  // For auto-scrolling
  const endRef = useRef<HTMLDivElement>(null);

  // If NOT replying, scroll to bottom when comment count changes
  useEffect(() => {
    if (!reply) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments.length, reply]);

  // Send comment logic
  const send = async () => {
    if (!input.trim()) return;

    try {
      if (isPost) {
        await addPostComment(post.id, input.trim(), reply?.id);
      } else if (block && versionId) {
        await addVersionComment(
          post.id,
          block.id,
          versionId,
          input.trim(),
          undefined,
          reply?.id,
          markAsRevision,
        );
      } else if (block) {
        await addBlockComment(post.id, block.id, input.trim(), reply?.id);
      }

      setInput("");
      setReply(null);
      setEmoji(false);
      setMarkAsRevision(false);

      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (error) {
      console.error('Failed to send comment:', error);
      // You might want to show an error message to the user here
    }
  };

  // Root-level comments
  const roots = comments.filter((c) => !c.parentId);

  return (
    /**
     * 1) Constrain the height with max-h (or rely on a parent that sets a specific height).
     *    Make sure we have "overflow-hidden" and "flex flex-col" so we can properly scroll inside.
     */
    <div className="flex flex-col h-full overflow-hidden">
      {/* HEADER (white background, fixed height) */}
      <div className="h-[64px] px-[20px] py-[22px] flex items-center justify-between bg-white border-b shrink-0">
        {/* Left side: title */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-black text-sm">Comments</span>
        </div>

        {/* Right side: watch/unwatch + more */}
        <div className="flex items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="cursor-pointer">
                {watch ? <Bell size={16} /> : <BellOff size={16} />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="flex flex-col space-y-3 px-[16px] py-[4px]">
                <button
                  className="flex items-start justify-between w-full text-left cursor-pointer"
                  onClick={() => setWatch(true)}
                >
                  <div className="flex gap-2">
                    <Bell size={18} />
                    <div>
                      <p className="text-sm font-medium">Watch</p>
                      <p className="text-xs text-muted-foreground">
                        Notify me on all activity for this record.
                      </p>
                    </div>
                  </div>
                  {watch && <Check size={16} className="mt-1 mr-1" />}
                </button>

                <button
                  className="flex items-start justify-between w-full text-left cursor-pointer"
                  onClick={() => setWatch(false)}
                >
                  <div className="flex gap-2">
                    <BellOff size={18} />
                    <div>
                      <p className="text-sm font-medium">Unwatch</p>
                      <p className="text-xs text-muted-foreground">
                        Notify me only on @mentions or assignment.
                      </p>
                    </div>
                  </div>
                  {!watch && <Check size={16} className="mt-1 mr-1" />}
                </button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <MoreVertical size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">Extra actions…</PopoverContent>
          </Popover>
        </div>
      </div>

      {/* MAIN PANEL (gray background) */}
      <div
        className="flex-1 flex flex-col relative overflow-hidden"
        style={{ backgroundColor: "#F7F7F7" }}
      >
        {/**
         * 2) The ScrollArea must be placed in a container with `flex-1 min-h-0 overflow-auto`
         *    plus enough bottom padding so that the pinned composer won't cover the last comment.
         */}
        {roots.length ? (
          <ScrollArea className="flex-1 min-h-0 p-4 pb-[130px]">
            <>
              {roots.map((c) => (
                <Bubble
                  key={c.id}
                  c={c}
                  all={comments}
                  level={0}
                  onReply={(id, author) => setReply({ id, author })}
                />
              ))}
              <div ref={endRef} />
            </>
          </ScrollArea>
          ) : <div
              className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground select-none mt-[-100px]"
            >
              <Image
                src={'/comments/comment.svg'}
                alt={'comments'}
                width={56} height={56}
                className="rounded-md object-contain
                            bg-muted/50 p-1"
              />
              <span className="text-sm font-bold text-black">No comments yet.</span>
              <span className="text-sm text-center">Pro tip: click and drag on images and videos to annotate them</span>
            </div>
        }
        {/**
         * 3) Pin the composer at the bottom so it doesn't push content down.
         *    Use absolute or sticky positioning. Below, we do absolute pinned to bottom.
         */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4">
          <div className="w-[312px] border rounded-[8px] bg-white">
            {/* If replying, show small indicator */}
            {reply && (
              <div className="flex items-center justify-between bg-muted px-2 py-1 rounded-t-[8px] text-xs">
                <div>
                  Replying to <strong>{reply.author}</strong>
                </div>
                <button onClick={() => setReply(null)} className="cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Row 1: text input */}
            <div className="h-[56px]">
              <textarea
                autoFocus
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Write a comment"
                className="w-full text-sm h-full bg-white border-b px-3 py-2 rounded-t-[8px] focus:outline-none strong-focus"
              />
            </div>

            {/* Row 2: emoji, @, mark as revision, send */}
            <div className="relative flex items-center justify-between rounded-b-[8px] h-[43px]">
              <div className="flex items-center h-full">
                {/* Emoji button */}
                <Button variant="ghost" size="icon" onClick={() => setEmoji((x) => !x)} className="cursor-pointer">
                  <Smile size={18} />
                </Button>
                <div className="w-px bg-gray-300 h-5" />

                {/* Emoji picker (if open) */}
                {emoji && (
                  <div className="absolute bottom-12 left-0 z-50">
                    <EmojiPicker onEmojiClick={(e) => setInput((p) => p + e.emoji)} />
                  </div>
                )}

                {/* @ button */}
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  @
                </Button>
                <div className="w-px bg-gray-300 h-5" />

                {/* Mark as revision */}
                <div className="flex items-center space-x-2 ml-1">
                  <Checkbox
                    id="revision"
                    checked={markAsRevision}
                    onCheckedChange={(checked) => setMarkAsRevision(Boolean(checked))}
                  />
                  <Label htmlFor="revision" className="text-sm">
                    Mark as revision
                  </Label>
                </div>
              </div>

              {/* Send button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={send}
                disabled={!input.trim()}
                className="mr-2 cursor-pointer"
              >
                <Send size={18} className="mr-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
