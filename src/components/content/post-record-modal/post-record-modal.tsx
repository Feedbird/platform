"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronUp, ChevronDown, X, MessageCircle,
  Clock, Maximize2, Minimize2, Paperclip,
  MoreHorizontal, CircleChevronDown,
  CalendarIcon,
  SquareCheckBig
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useStoreWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { getSuggestedSlots } from "@/lib/scheduling/getSuggestedSlots";
import { Post, Block } from "@/lib/store/use-feedbird-store";

/* sub-components (cloned or adapted) */
import { BlocksViewer } from "@/components/post/blocks-viewer";
import { CaptionEditor } from "@/components/post/caption-editor";
import { CommentsPanel } from "@/components/post/comments-panel";
import ActivityFeed from "@/components/post/activity-feed";
import { ContentModal } from "@/components/content/content-modal/content-modal";
import ScheduleDialog from "@/components/post/schedule-dialog";

/* simpler inline "clones" for status, channels, format, date */
import { InlineStatusEditor, InlinePlatformsEditor, InlineFormatEditor, InlineDateEditor, ApproveCell, UpdateDateCell } from "./inlines";

/* shared UI bits */
import { StatusChip } from "@/components/content/shared/content-post-ui";

export function PostRecordModal({ postId, open, onClose }:{
  postId: string;
  open: boolean;
  onClose(): void;
}) {
  const posts = useStoreWithEqualityFn(useFeedbirdStore, (s) => s.getActivePosts(), shallow);
  const updatePost = useFeedbirdStore((s) => s.updatePost);
  const brand = useFeedbirdStore((s) => s.getActiveBrand());
  const post = posts.find((p) => p.id === postId);

  /* local states */
  const [pane, setPane] = useState<"comments"|"activity">("comments");
  const [expanded, setExpanded] = useState(true);
  const [slots, setSlots] = useState<ReturnType<typeof getSuggestedSlots>|null>(null);
  const [activeBlock, setActiveBlock] = useState<Block|null>(null);

  if (!post) {
    // Post might not be available yet if things are loading.
    return null;
  }

  const idx    = posts.findIndex(p => p.id === postId);

  // actions
  const approve = () => {
    updatePost(post.id, { status: "Approved" });
    setSlots(getSuggestedSlots(post, posts));
  };
  const requestChange = () => {
    updatePost(post.id, { status: "Needs Revisions" });
  };

  const dateDisplay = post.publishDate
    ? post.publishDate.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Unscheduled";

  function switchPost(dir:"prev"|"next"){
    // ...
  }

  const cKey = post.comments.length;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className={cn(
            "max-w-none sm:max-w-none flex flex-col p-0 border-0 overflow-hidden",
            '[&>button:last-child]:hidden',
            'gap-0',
            expanded ? "rounded-none" : "rounded-2xl"
          )}
          style={
            expanded
              ? { width: "100vw", height: "100vh" }
              : { width: "60vw", height: "90vh" }
          }
        >
          <DialogTitle className="sr-only">Post details</DialogTitle>

          {/* header */}
          <header className="h-14 flex items-center justify-between border-b px-4 bg-white">
            {/* left: up/down => brand => vertical bar => status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={()=>switchPost("prev")} disabled={idx<=0}>
                  <ChevronUp className="w-6 h-6 text-black" />
                </Button>
                <Button variant="ghost" size="icon" onClick={()=>switchPost("next")} disabled={idx>=posts.length-1}>
                  <ChevronDown className="w-6 h-6 text-black" width={24} height={24}/>
                </Button>
              </div>
              <span className="text-base font-semibold text-black">
                {brand?.name ?? "—"}
              </span>

              <div className="w-px bg-gray-300 h-5 mx-1" />

              {/* post status chip */}
              <StatusChip status={post.status} widthFull={false} />
            </div>

            {/* right: date => expand => attach => ... => comments => activity => close */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-black">{dateDisplay}</span>
              <Button variant="ghost" size="icon" onClick={()=>setExpanded(x=>!x)}>
                {expanded ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
              </Button>
              <Button variant="ghost" size="icon"><Paperclip size={18}/></Button>
              <Button variant="ghost" size="icon"><MoreHorizontal size={18}/></Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={()=>setPane("comments")}
                className={pane==="comments" ? "bg-muted" : ""}
              >
                <MessageCircle size={18}/>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={()=>setPane("activity")}
                className={pane==="activity" ? "bg-muted" : ""}
              >
                <Clock size={18}/>
              </Button>

              <Button variant="ghost" size="icon" onClick={onClose}>
                <X size={18}/>
              </Button>
            </div>
          </header>

          {/* body */}
          <div className="flex flex-1 overflow-hidden">
            {/* centre */}
            <div className="flex-1 flex flex-col overflow-auto p-6 gap-6 bg-white">
              {/* Blocks viewer */}
              <BlocksViewer blocks={post.blocks} onExpandBlock={(b)=>setActiveBlock(b)}/>

              {/* Caption editor */}
              <CaptionEditor
                post={post}
                onChange={cap=> updatePost(post.id, { caption:{...post.caption,...cap} })}
              />

              {/* REST AREA with 6 fields */}
              <div className={`${expanded ? "flex flex-row" : "grid grid-cols-3"} gap-3`}>
                {/* STATUS */}
                <div className="w-full flex flex-col p-3 rounded-md border gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CircleChevronDown size={16} />
                    <span>Status</span>
                  </div>
                  <InlineStatusEditor post={post}/>
                </div>

                {/* SOCIALS */}
                <div className="w-full flex flex-col p-3 rounded-md border gap-2">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    {/* example icon for Socials */}
                    <Image src={`/content/multiple-select.svg`} alt="channels" width={16} height={16} />
                    <span>Socials</span>
                  </div>
                  <InlinePlatformsEditor post={post}/>
                </div>

                {/* FORMAT */}
                <div className="w-full flex flex-col p-3 rounded-md border gap-2">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    {/* example icon for Format */}
                    <CircleChevronDown size={16} />
                    <span>Format</span>
                  </div>
                  <InlineFormatEditor post={post}/>
                </div>

                {/* PUBLISH DATE/TIME */}
                <div className="w-full flex flex-col p-3 rounded-md border gap-2">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    {/* example icon => lucide Clock */}
                    <CalendarIcon size={16} />
                    <span>Post Time</span>
                  </div>
                  <InlineDateEditor post={post}/>
                </div>

                {/* APPROVE */}
                <div className="w-full flex flex-col p-3 rounded-md border gap-2">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    {/* example icon => check */}
                    <SquareCheckBig size={16} />
                    <span>Approve</span>
                  </div>
                  <ApproveCell post={post}/>
                </div>

                {/* LAST UPDATED */}
                <div className="w-full flex flex-col p-3 rounded-md border gap-2">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    {/* example icon => refresh / time */}
                    <Clock size={16} />
                    <span>Last Update</span>
                  </div>
                  <UpdateDateCell post={post} />
                </div>

              </div>

            </div>

            {/* sidebar: comments or activity */}
            <motion.aside key={pane} className="w-[360px] shrink-0 flex h-full flex-col border-l bg-white">
              {/* {pane==="comments" && (
                <div className="p-4 border-b flex flex-wrap gap-2">
                  <Button size="sm" onClick={approve} className="bg-emerald-600 text-white hover:bg-emerald-700">
                    ✓ Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={requestChange} className="border-red-500 text-red-600">
                    ✕ Request
                  </Button>
                  {post.status==="Approved" && (
                    <Button
                      size="sm"
                      onClick={()=>setSlots(slots ?? getSuggestedSlots(post,posts))}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Schedule
                    </Button>
                  )}
                </div>
              )} */}

              {pane==="comments"
                ? <CommentsPanel key={cKey} post={post} isPost showHeader/>
                : <ActivityFeed activities={post.activities}/>
              }
            </motion.aside>
          </div>
        </DialogContent>
      </Dialog>

      {/* block expand modal */}
      {activeBlock && (
        <ContentModal
          postId={post.id}
          block={activeBlock}
          onClose={()=>setActiveBlock(null)}
        />
      )}

      {/* schedule */}
      {slots && (
        <ScheduleDialog
          open={true}
          slots={slots}
          onClose={()=>setSlots(null)}
          onConfirm={(date)=>{
            toast.success(`Scheduled: ${date.toLocaleString()}`);
            setSlots(null);
          }}
        />
      )}
    </>
  );
}
