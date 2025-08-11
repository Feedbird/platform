"use client";

import { useState, useRef, useEffect, Fragment, useLayoutEffect } from "react";
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
  AtSign,
  MessageSquare,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { Textarea } from "@/components/ui/textarea";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

import {
  Post,
  Block,
  BaseComment,
  Activity,
  useFeedbirdStore,
} from "@/lib/store/use-feedbird-store";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/components/content/shared/content-post-ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ActivityItem } from "./activity-item";
import { getCurrentUserDisplayName } from "@/lib/utils/user-utils";
import { formatTimeAgo } from "@/lib/utils";

// using shared formatTimeAgo from utils

// Removed local Avatar in favor of shared UI Avatar with imageUrl support

function MessageItem({
  c,
  all,
  onReply,
  showReplies,
  toggleReplies,
  getTotalRepliesCount,
  depth = 0,
}: {
  c: BaseComment;
  all: BaseComment[];
  onReply(id: string, author: string): void;
  showReplies?: Record<string, boolean>;
  toggleReplies?: (id: string) => void;
  getTotalRepliesCount?: (messages: any[]) => number;
  depth?: number;
}) {
  const replies = all.filter((x) => x.parentId === c.id);
  const totalReplies = getTotalRepliesCount ? getTotalRepliesCount(replies) : replies.length;
  const showCommentReplies = showReplies ? showReplies[c.id] : false;
  
  const contentRef = useRef<HTMLDivElement>(null);
  const lastReplyRef = useRef<HTMLDivElement>(null);
  const [lineStyle, setLineStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    const calculateLineStyle = () => {
      if (showCommentReplies && replies.length > 0 && contentRef.current && lastReplyRef.current) {
        const top = contentRef.current.offsetHeight + 8;
        const bottom = lastReplyRef.current.offsetHeight - 20;
        
        const newStyle: React.CSSProperties = {
          transform: 'translateX(-50%)',
          top: `${top}px`,
          bottom: `${bottom}px`,
          height: 'auto',
        };
        setLineStyle(newStyle);
      } else {
        setLineStyle({});
      }
    };

    calculateLineStyle();
    
    window.addEventListener('resize', calculateLineStyle);
    return () => window.removeEventListener('resize', calculateLineStyle);

  }, [showCommentReplies, replies.length]);

  // Calculate padding based on depth
  const paddingLeft = 8 + depth * 4;

  return (
    <div key={c.id} className="relative">
      <div className="pl-4 pt-3">
        <div ref={contentRef}>
          {/* Header with avatar, name and time in same div */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 relative">
              {/* Horizontal line at the left of avatar */}
              <svg
                className="absolute"
                style={{
                  left: '-16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
                width="16"
                height="7"
                viewBox="0 0 16 7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1 Q2.5 6 16 6"
                  stroke="#EAE9E9"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              <Avatar className="w-5 h-5">
                <AvatarImage src={c.authorImageUrl} alt={c.author} />
                <AvatarFallback className="text-[10px] font-medium">
                  {c.author?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-black">{c.author}</span>
            </div>
            <span className="text-xs text-darkGrey">{formatTimeAgo(c.createdAt)}</span>
          </div>
          
          {/* Message content */}
          <p className="text-sm text-black mb-2">{c.text}</p>
          
                     {/* Action buttons */}
           <div className="flex items-center gap-3">
             <button
               onClick={() => onReply(c.id, c.author)}
               className="text-xs text-darkGrey font-medium flex items-center gap-1 cursor-pointer hover:text-black py-1"
             >
               Reply
             </button>
             
             {totalReplies > 0 && toggleReplies && (
               <button
                 onClick={() => toggleReplies(c.id)}
                 className="text-xs text-darkGrey hover:text-black font-medium cursor-pointer"
               >
                 {showCommentReplies ? `Hide replies (${totalReplies})` : `Show replies (${totalReplies})`}
               </button>
             )}
           </div>
        </div>
             {/* Show replies if expanded */}
       {showCommentReplies && replies.length > 0 && (
         <div>
           {/* Connection line for replies */}
           <div 
             className="absolute w-0.5 bg-elementStroke"
             style={lineStyle}
           />
           <div className="">
             {replies.map((r, index) => (
               <div key={r.id} ref={index === replies.length - 1 ? lastReplyRef : null}>
                 <MessageItem
                   key={r.id}
                   c={r}
                   all={all}
                   onReply={onReply}
                   showReplies={showReplies}
                   toggleReplies={toggleReplies}
                   getTotalRepliesCount={getTotalRepliesCount}
                   depth={depth + 1}
                 />
               </div>
             ))}
           </div>
         </div>
       )}
      </div>

    </div>
  );
}

export function RevisionComment({
  c,
  all,
  onReply,
  showReplies,
  toggleReplies,
  getTotalRepliesCount,
}: {
  c: BaseComment;
  all: BaseComment[];
  onReply(id: string, author: string): void;
  showReplies?: Record<string, boolean>;
  toggleReplies?: (id: string) => void;
  getTotalRepliesCount?: (messages: any[]) => number;
}) {
  const replies = all.filter((x) => x.parentId === c.id);
  const totalReplies = getTotalRepliesCount ? getTotalRepliesCount(replies) : replies.length;
  const showCommentReplies = showReplies ? showReplies[c.id] : false;
  
  const commentContentRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [lineStyle, setLineStyle] = useState<React.CSSProperties>({});
  console.log("comment: ", c);
  useLayoutEffect(() => {
    const calculateLineStyle = () => {
      if (showCommentReplies && replies.length > 0 && commentContentRef.current && lastMessageRef.current) {
        const top = commentContentRef.current.offsetHeight + 20;
        const bottom = lastMessageRef.current.offsetHeight - 8;
        
        const newStyle: React.CSSProperties = {
          top: `${top}px`,
          bottom: `${bottom}px`,
          height: 'auto',
        };
        setLineStyle(newStyle);
      } else {
        setLineStyle({});
      }
    };

    calculateLineStyle();
    const observer = new ResizeObserver(calculateLineStyle);
    if (commentContentRef.current) {
      observer.observe(commentContentRef.current);
    }
    if (lastMessageRef.current) {
      observer.observe(lastMessageRef.current);
    }
    
    window.addEventListener('resize', calculateLineStyle);
    return () => {
      window.removeEventListener('resize', calculateLineStyle);
      observer.disconnect();
    };
  }, [showCommentReplies, replies.length]);

  return (
    <div className="mb-4 pb-3 relative">
      <div className="absolute w-0.5 bg-elementStroke" style={lineStyle} />
      <div className="flex flex-col items-start gap-3">
        <div className="flex-1 w-full bg-white rounded-sm border border-elementStroke p-2.5">
          <div ref={commentContentRef}>
            {/* Header with avatar, name and time in same div */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={c.authorImageUrl} alt={c.author} />
                  <AvatarFallback className="text-[10px] font-medium">
                    {c.author?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-black">{c.author}</span>
              </div>
              <span className="text-xs text-darkGrey">{formatTimeAgo(c.createdAt)}</span>
            </div>
            
            {/* Comment content */}
            <p className="text-sm text-black mb-2">{c.text}</p>
            
            {/* Action buttons */}
            <div className="flex justify-between items-center gap-3 text-darkGrey hover:text-black">
              <button
                onClick={() => onReply(c.id, c.author)}
                className="text-xs font-medium flex items-center gap-1 cursor-pointer pt-1"
              >
                <MessageSquare className="w-3 h-3" />
                Reply
              </button>
              <div
                style={{
                  display: "inline-flex",
                  padding: "2px 6px 2px 3px",
                  alignItems: "center",
                  gap: "4px",
                  width: "auto",
                  borderRadius: "4px",
                  border: `1px solid rgba(28, 29, 31, 0.05)`,
                  backgroundColor: "#FCE4E5",
                  color: "#1C1D1F",
                }}
                className="text-xs font-semibold whitespace-nowrap tracking-[-0.24px]"
              >
                <Image
                  className='w-[16px] h-[16px]'
                  src="/images/status/needs-revision.svg"
                  alt="Revision"
                  width={11}
                  height={11}
                />
                <span>Revision</span>
              </div>
            </div>
            
          </div>
        </div>
            {/* Show replies button */}
            {totalReplies > 0 && toggleReplies && (
              <button
                onClick={() => toggleReplies(c.id)}
                className="text-xs text-darkGrey hover:text-black font-medium pl-4 cursor-pointer"
              >
                {showCommentReplies ? `Hide replies (${totalReplies})` : `Show replies (${totalReplies})`}
              </button>
            )}
      </div>

      {/* Show replies if expanded */}
      {showCommentReplies && replies.length > 0 && (
        <div>
          {replies.map((r, index) => (
            <div key={r.id} ref={index === replies.length - 1 ? lastMessageRef : null}>
              <MessageItem
                c={r}
                all={all}
                onReply={onReply}
                showReplies={showReplies}
                toggleReplies={toggleReplies}
                getTotalRepliesCount={getTotalRepliesCount}
                depth={0}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActivityPanel({
  post,
  block,
  versionId,
  showHeader = false,
  allowCommenting = false, // New prop to control when commenting is allowed
  onSwitchToVersion, // Callback to switch to version panel
}: {
  post: Post;
  block?: Block;
  versionId?: string;
  showHeader?: boolean;
  allowCommenting?: boolean; // Only true when post-record-modal is opened after "Request changes"
  onSwitchToVersion?: () => void; // Callback to switch to version panel
}) {
  // Store actions
  const addPostComment = useFeedbirdStore((s) => s.addPostComment);
  const addBlockComment = useFeedbirdStore((s) => s.addBlockComment);
  const addVersionComment = useFeedbirdStore((s) => s.addVersionComment);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // comments data
  let comments: BaseComment[] = post.comments;
  // activities data
  const activities: Activity[] = post.activities;

  // Local state for composer
  const [input, setInput] = useState("");
  const [emoji, setEmoji] = useState(false);
  const [reply, setReply] = useState<{ id: string; author: string } | null>(
    null
  );
  const [markAsRevision, setMarkAsRevision] = useState(allowCommenting);
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  
  // Enable commenting when replying or when markAsRevision is true
  const [localAllowCommenting, setLocalAllowCommenting] = useState(allowCommenting);
  
  // Update local commenting state when prop changes
  useEffect(() => {
    setLocalAllowCommenting(allowCommenting);
  }, [allowCommenting]);
  
  // Enable commenting when reply is set
  useEffect(() => {
    if (reply) {
      setLocalAllowCommenting(true);
    }
  }, [reply]);

  // Auto-show replies for comments that have replies but are not in showReplies state
  useEffect(() => {
    const newShowReplies = { ...showReplies };
    let hasChanges = false;
    
         comments.forEach(comment => {
       const hasReplies = comments.filter((x: BaseComment) => x.parentId === comment.id).length > 0;
       const isCurrentlyShown = showReplies[comment.id];
       // If comment has replies but replies are not shown, show them
       if (hasReplies && !isCurrentlyShown) {
         newShowReplies[comment.id] = true;
         hasChanges = true;
       }
     });
    
    if (hasChanges) {
      setShowReplies(newShowReplies);
    }
  }, [comments]); // Removed showReplies from dependencies to prevent infinite loop
  


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
      // Add the comment and get the comment ID
      const commentId = await addPostComment(post.id, input.trim(), reply?.id, markAsRevision);
      
      // Add revision request activity if marked as revision
      if (markAsRevision) {
        const addActivity = useFeedbirdStore.getState().addActivity;
        addActivity({
          postId: post.id,
          actor: getCurrentUserDisplayName(),
          action: "requested changes",
          type: "revision_request",
          metadata: {
            revisionComment: input.trim(),
            commentId: commentId // Store the actual comment ID
          }
        });
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

  // Helper functions for replies management
  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const getTotalRepliesCount = (messages: any[]): number => {
    let count = messages.length;
    messages.forEach(message => {
      count += getTotalRepliesCount(message.replies || []);
    });
    return count;
  };

  // Create refs and state for all activities at once
  const sortedActivities = activities.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const activityRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lineHeights, setLineHeights] = useState<number[]>([]);

  // Initialize refs array
  useEffect(() => {
    activityRefs.current = activityRefs.current.slice(0, sortedActivities.length);
  }, [sortedActivities.length]);

  // Calculate line heights for all activities
  useEffect(() => {
    const calculateLineHeights = () => {
      const newLineHeights: number[] = [];
      
      for (let i = 0; i < sortedActivities.length - 1; i++) {
        const currentActivity = activityRefs.current[i];
        const nextActivity = activityRefs.current[i + 1];
        
        if (currentActivity && nextActivity) {
          const currentRect = currentActivity.getBoundingClientRect();
          const nextRect = nextActivity.getBoundingClientRect();
          const distance = nextRect.top - currentRect.top;
          newLineHeights.push(distance);
        } else {
          newLineHeights.push(0);
        }
      }
      
      setLineHeights(newLineHeights);
    };

    calculateLineHeights();
    
    // Recalculate on window resize and when replies visibility changes
    window.addEventListener('resize', calculateLineHeights);
    const observer = new ResizeObserver(calculateLineHeights);
    
    // Observe all activity elements
    activityRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });
    
    return () => {
      window.removeEventListener('resize', calculateLineHeights);
      observer.disconnect();
    };
  }, [sortedActivities.length, showReplies]);

  return (
    /**
     * 1) Constrain the height with max-h (or rely on a parent that sets a specific height).
     *    Make sure we have "overflow-hidden" and "flex flex-col" so we can properly scroll inside.
     */
    <div className="flex flex-col h-full overflow-hidden">
      {/* HEADER (white background, fixed height) */}
      <div className="items-center bg-white">
        {/* STATUS */}
        <div className="flex flex-col py-3 px-4 border-b border-elementStroke">
          <div className="flex items-center gap-1 text-sm font-medium">
            <Image src={`/images/columns/status.svg`} alt="status" width={16} height={16} />
            <span className="text-sm font-medium text-black">Status</span>
          </div>
          <div className="pt-2">
            <StatusChip status={post.status} widthFull={false} />
          </div>
        </div>
          
        {/* Posting Time */}
        <div className="flex flex-col py-3 px-4 border-b border-elementStroke">
          <div className="flex items-center gap-1 text-sm font-medium">
            <Image src={`/images/columns/post-time.svg`} alt="posting time" width={16} height={16} />
            <span className="text-sm font-medium text-black">Posting Time</span>
          </div>
          <div className="pt-2">
            <span className="text-sm text-muted-foreground">
              {post.publishDate ? format(new Date(post.publishDate), "MMM d, p") : "Not scheduled"}
            </span>
          </div>
        </div>

      </div>

      {/* MAIN PANEL (gray background) */}
      <div
        className="flex-1 flex flex-col relative overflow-hidden"
        style={{ backgroundColor: "#F7F7F7" }}
      >
        {/* Unified Timeline */}
        {
          // For posts, show activities and comments in unified timeline
          (activities.length > 0 ) ? (
            <ScrollArea className="flex-1 min-h-0 p-4 pb-[130px]">
                             <div className="relative">
                 {sortedActivities.map((activity, index) => {
                   const matchingComment = comments.find(
                     (c) => c.id === activity.metadata?.commentId
                   );
                   return (
                   <div
                     key={activity.id} 
                     ref={el => { activityRefs.current[index] = el; }} 
                     className="relative mb-5"
                   >
                     {/* Connection line to next activity (except for the last one) */}
                     {index < sortedActivities.length - 1 && lineHeights[index] > 0 && (
                       <div 
                         className="absolute left-2 top-5.5 w-0.5 bg-elementStroke" 
                         style={{ height: `${lineHeights[index]}px` }}
                       />
                     )}
                     
                     <ActivityItem
                       activity={activity}
                       onViewVersionHistory={() => {
                         if (onSwitchToVersion) {
                           onSwitchToVersion();
                         }
                       }}
                       onRevertApproval={() => {
                         // TODO: Implement revert approval
                         console.log('Revert approval');
                       }}
                     />
                     
                     {/* Show revision comment and its replies below revision_request activities */}
                     {activity.type === 'revision_request' && activity.metadata?.revisionComment && (
                       <div className="pl-6 mt-2">
                         {/* Create a virtual comment from the revision request */}
                         <RevisionComment
                             key={activity.metadata.commentId}
                             c={{
                               id: activity.metadata.commentId,
                               text: activity.metadata.revisionComment,
                               author: activity.actor,
                               authorEmail: matchingComment?.authorEmail,
                               authorImageUrl: matchingComment?.authorImageUrl,
                               createdAt: activity.at,
                               parentId: undefined,
                             } as BaseComment}
                             all={comments}
                             onReply={(id, author) => setReply({ id, author })}
                             showReplies={showReplies}
                             toggleReplies={toggleReplies}
                             getTotalRepliesCount={getTotalRepliesCount}
                           />
                       </div>
                     )}
                   </div>
                 )})}
              </div>
              <div ref={endRef} />
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center pb-35">
              <img 
                src="/images/boards/comment-container1.svg" 
                alt="No comments" 
                className="w-45 h-16 mb-4 opacity-50"
              />
              <img 
                src="/images/boards/comment-container2.svg" 
                alt="No comments" 
                className="w-55 h-16 mb-4 opacity-50"
              />
              <div className="flex flex-col items-center">
                <div className="text-sm text-black font-semibold mb-2">No comments yet</div>
                <div className="text-xs font-normal text-darkGrey">Pro tip: click and drag on images and videos</div>
                <div className="text-xs font-normal text-darkGrey">to annotate them when you preview</div>
              </div>
            </div>
          )
        }
        {/* Chat box - always visible */}
        <div className="absolute bottom-2 w-full flex flex-col items-center">
          {reply && (
            <div className="w-86 p-2 bg-blue-50 border border-grey/20 border-b-0 rounded-t-sm flex items-center justify-between mb-1">
              <div className="text-xs text-blue-700">
                Replying to {reply.author}
              </div>
              <button
                onClick={() => setReply(null)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="w-86 border border-grey/20 border-solid border-2 rounded-sm bg-white">
            {/* Text area - 56px height */}
            <div className="border-b-1 border-grey/20 border-solid">
              <Textarea
                autoFocus
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Write a comment"
                className="h-18 resize-none border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-0 shadow-none"
                style={{ border: "none", outline: "none", boxShadow: "none" }}
              />
              <div className="flex items-center space-x-2 pl-2 pb-2">
                <Switch
                  checked={markAsRevision}
                  onCheckedChange={(checked: boolean) => setMarkAsRevision(checked)}
                  className="w-6 h-4 data-[state=checked]:bg-[#EC5050] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3"
                />  
                <Label htmlFor="revision" className="text-sm text-black">
                  Mark as revision
                </Label>
              </div>
            </div>

            <div className="relative flex items-center justify-between h-[32px] p-2">
              <div className="flex items-center h-full">
                {/* Emoji button */}
                <Button variant="ghost" onClick={() => setEmoji((x) => !x)} className="w-7 h-7 cursor-pointer">
                  <Smile size={18} />
                </Button>

                {/* Emoji picker (if open) */}
                {emoji && (
                  <div className="absolute bottom-12 left-0 z-50">
                    <EmojiPicker onEmojiClick={(e) => setInput((p) => p + e.emoji)} />
                  </div>
                )}

                {/* @ button */}
                <Button variant="ghost" className="w-7 h-7 cursor-pointer">
                    <AtSign size={18} />
                </Button>

              </div>

              {/* Send button */}
              <Button
                onClick={send}
                disabled={!input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-4.5 w-4.5 p-0 cursor-pointer"
              >
                <img src="/images/boards/send-icon.svg" className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
