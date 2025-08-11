"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Bell, ArrowRight, Smile, AtSign, MessageSquare, CheckCircle, ChevronDown, ChevronLeft, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GroupComment, GroupMessage } from "@/lib/store/use-feedbird-store";
import EmojiPicker from "emoji-picker-react";
import { formatTimeAgo as sharedFormatTimeAgo } from "@/lib/utils";

interface GroupFeedbackSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  groupData: {
    month: number;
    comments: GroupComment[];
  } | null;
  month: number;
  onAddComment: (text: string) => void;
  onAddMessage: (commentId: string, text: string, parentMessageId?: string) => void;
  onResolveComment: (commentId: string) => void;
  onDeleteAiSummary: (commentId: string, summaryIndex: number) => void;
}

interface MessageItemProps {
  message: GroupMessage;
  commentId: string;
  depth?: number;
  showReplies: Record<string, boolean>;
  toggleReplies: (id: string) => void;
  handleReplyClick: (commentId: string, author: string, messageId?: string) => void;
  getTotalRepliesCount: (messages: GroupMessage[]) => number;
  formatTimeAgo: (date: Date | string) => string;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  commentId,
  depth = 0,
  showReplies,
  toggleReplies,
  handleReplyClick,
  getTotalRepliesCount,
  formatTimeAgo,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const lastReplyRef = useRef<HTMLDivElement>(null);
  const [lineStyle, setLineStyle] = useState<React.CSSProperties>({});
  const showMessageReplies = showReplies[`${commentId}-${message.id}`] || false;

  useLayoutEffect(() => {
    const calculateLineStyle = () => {
      if (showMessageReplies && message.replies.length > 0 && contentRef.current && lastReplyRef.current) {
        const top = contentRef.current.offsetHeight + 8;
        const bottom = lastReplyRef.current.offsetHeight - 20;
        
        const newStyle: React.CSSProperties = {
          transform: 'translateX(-50%)',
          top: `${top}px`,
          bottom: `${bottom}px`,
          height: 'auto',
        };
        setLineStyle(newStyle);
      }
    };

    calculateLineStyle();
    
    window.addEventListener('resize', calculateLineStyle);
    return () => window.removeEventListener('resize', calculateLineStyle);

  }, [showMessageReplies, message.replies]);


  const totalReplies = getTotalRepliesCount(message.replies);

  return (
    <div key={message.id} className="relative">
      <div className="pl-4 pt-3">
        <div ref={contentRef}>
          {/* Header with avatar, name and time in same div */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 relative">
              {/* Horizontal line at the left of avatar, without shifting avatar/name */}
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
                  stroke="#D1D5DB"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              <Avatar className="w-5 h-5">
                <AvatarImage src={message.authorImageUrl} alt={message.author} />
                <AvatarFallback className="text-[10px] font-medium">
                  {message.author?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-black">{message.author}</span>
            </div>
            <span className="text-xs text-darkGrey">{formatTimeAgo(message.createdAt)}</span>
          </div>
          
          {/* Message content */}
          <p className="text-sm text-darkGrey mb-2">{message.text}</p>
          
          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleReplyClick(commentId, message.author, message.id)}
              className="text-xs text-darkGrey hover:text-black font-medium"
            >
              Reply
            </button>
            
            {totalReplies > 0 && (
              <button
                onClick={() => toggleReplies(`${commentId}-${message.id}`)}
                className="text-xs text-darkGrey hover:text-black font-medium"
              >
                {showMessageReplies ? `Hide replies (${totalReplies})` : `Show replies (${totalReplies})`}
              </button>
            )}
          </div>
        </div>

        {/* Show replies if expanded */}
        {showMessageReplies && message.replies.length > 0 && (
          <div>
            {/* Connection line for replies */}
            <div 
              className="absolute w-0.5 bg-gray-300"
              style={lineStyle}
            />
            <div className="">
              {message.replies.map((reply, index) => (
                <div key={reply.id} ref={index === message.replies.length - 1 ? lastReplyRef : null}>
                  <MessageItem
                    message={reply}
                    commentId={commentId}
                    depth={depth + 1}
                    showReplies={showReplies}
                    toggleReplies={toggleReplies}
                    handleReplyClick={handleReplyClick}
                    getTotalRepliesCount={getTotalRepliesCount}
                    formatTimeAgo={formatTimeAgo}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CommentItem: React.FC<{
  comment: GroupComment;
  showReplies: Record<string, boolean>;
  toggleReplies: (id: string) => void;
  onResolveComment: (commentId: string) => void;
  handleReplyClick: (commentId: string, author: string, messageId?: string) => void;
  getTotalRepliesCount: (messages: GroupMessage[]) => number;
  formatTimeAgo: (date: Date | string) => string;
}> = ({
  comment,
  showReplies,
  toggleReplies,
  onResolveComment,
  handleReplyClick,
  getTotalRepliesCount,
  formatTimeAgo
}) => {
  const totalReplies = getTotalRepliesCount(comment.messages);
  const showCommentReplies = showReplies[comment.id] || false;
  const commentContentRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [lineStyle, setLineStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    const calculateLineStyle = () => {
      if (showCommentReplies && comment.messages.length > 0 && commentContentRef.current && lastMessageRef.current) {
        const top = commentContentRef.current.offsetHeight;
        const bottom = lastMessageRef.current.offsetHeight - 8;
        
        const newStyle: React.CSSProperties = {
          top: `${top}px`,
          bottom: `${bottom}px`,
          height: 'auto',
        };
        setLineStyle(newStyle);
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
  }, [showCommentReplies, comment.messages]);

  return (
    <div key={comment.id} className="pb-3 relative">
      <div className="absolute w-0.5 bg-gray-300" style={lineStyle} />
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div ref={commentContentRef}>
            {/* Header with avatar, name and time in same div */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={comment.authorImageUrl} alt={comment.author} />
                  <AvatarFallback className="text-[10px] font-medium">
                    {comment.author?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-black">{comment.author}</span>
              </div>
              <span className="text-xs text-darkGrey">{formatTimeAgo(comment.createdAt)}</span>
            </div>
            
            {/* Comment content - always show */}
            <p className="text-sm text-darkGrey mb-2">{comment.text}</p>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => handleReplyClick(comment.id, comment.author)}
                className="text-xs text-darkGrey font-medium flex items-center gap-1 cursor-pointer rounded-sm border border-grey/10 hover:bg-grey/10 py-1 pl-1 pr-1.5"
              >
                <MessageSquare className="w-3 h-3" />
                Reply
              </button>
              
              {comment.resolved ? (
                <button
                  disabled
                  className="text-xs font-medium flex items-center gap-1 cursor-default rounded-sm border py-1 pl-1 pr-1.5"
                  style={{
                    borderColor: "#148C59",
                    color: "#148C59",
                    background: "rgba(20, 140, 89, 0.06)",
                  }}
                >
                  <img src="/images/boards/resolved.svg" alt="resolved" className="w-4 h-4" />
                  Resolved
                </button>
              ) : (
                <button
                  onClick={() => onResolveComment(comment.id)}
                  className="text-xs text-darkGrey font-medium flex items-center gap-1 cursor-pointer rounded-sm border border-grey/10 hover:bg-grey/10 py-1 pl-1 pr-1.5"
                >
                  <img src="/images/sidebar/approvals.svg" alt="resolve" className="w-4 h-4" />
                  Resolve
                </button>
              )}
            </div>
          </div>
          
          <div>
            {/* Show replies button */}
            {totalReplies > 0 && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-xs text-darkGrey hover:text-black font-medium pl-4"
              >
                {showCommentReplies ? `Hide replies (${totalReplies})` : `Show replies (${totalReplies})`}
              </button>
            )}
            
            {/* Show replies if expanded */}
            {showCommentReplies && comment.messages.length > 0 && (
              <div>
                {comment.messages.map((message, index) => (
                  <div key={message.id} ref={index === comment.messages.length - 1 ? lastMessageRef : null}>
                    <MessageItem
                      key={message.id}
                      message={message}
                      commentId={comment.id}
                      depth={0}
                      showReplies={showReplies}
                      toggleReplies={toggleReplies}
                      handleReplyClick={handleReplyClick}
                      getTotalRepliesCount={getTotalRepliesCount}
                      formatTimeAgo={formatTimeAgo}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export function GroupFeedbackSidebar({
  isOpen,
  onClose,
  groupData,
  month,
  onAddComment,
  onAddMessage,
  onResolveComment,
  onDeleteAiSummary,
}: GroupFeedbackSidebarProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ 
    commentId: string; 
    messageId?: string; 
    text: string; 
    author: string;
  } | null>(null);
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [showAiSummary, setShowAiSummary] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [emoji, setEmoji] = useState(false);

  const comments = groupData?.comments || [];

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [comments.length]);

  const handleSendComment = () => {
    if (newComment.trim()) {
      if (replyingTo) {
        // This is a reply
        if (replyingTo.messageId) {
          // Reply to a message
          onAddMessage(replyingTo.commentId, newComment.trim(), replyingTo.messageId);
        } else {
          // Reply to a comment
          onAddMessage(replyingTo.commentId, newComment.trim());
        }
        setReplyingTo(null);
      } else {
        // This is a new comment
        onAddComment(newComment.trim());
      }
      setNewComment("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const formatTimeAgo = (date: Date | string) => sharedFormatTimeAgo(date);

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const getTotalRepliesCount = (messages: GroupMessage[]): number => {
    let count = messages.length;
    messages.forEach(message => {
      count += getTotalRepliesCount(message.replies);
    });
    return count;
  };

  // Auto-show replies for comments that have messages but are not in showReplies state
  useEffect(() => {
    const newShowReplies = { ...showReplies };
    let hasChanges = false;
    
    comments.forEach(comment => {
      const hasMessages = comment.messages.length > 0;
      const isCurrentlyShown = showReplies[comment.id];
      
      // If comment has messages but replies are not shown, show them
      if (hasMessages && !isCurrentlyShown) {
        newShowReplies[comment.id] = true;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      setShowReplies(newShowReplies);
    }
  }, [comments]); // Removed showReplies from dependencies to prevent infinite loop

  const handleReplyClick = (commentId: string, author: string, messageId?: string) => {
    setReplyingTo({ 
      commentId, 
      messageId, 
      text: "", 
      author 
    });
    // Focus the textarea after a short delay to ensure state is updated
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with light blur effect */}
      <div 
        className="fixed inset-0 bg-grey/10 backdrop-blur-[1px] z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-[360px] bg-white shadow-lg z-50 flex flex-col">
        {/* Header - 48px height */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-black">
            Group Feedback - Month {month}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10">
                <img src="/images/sidebar/notifications.svg" className="w-5 h-5" alt="notification" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content - occupies rest space, scrollable */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto"
        >
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
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
          ) : (
            <div>
              {/* AI Summary section - 40px height */}
              <div className="flex items-center justify-between px-4 py-3 h-10 border-b border-grey/20 border-solid">
                <div className="flex items-center gap-2" onClick={() => setShowAiSummary(!showAiSummary)} style={{ cursor: 'pointer' }}>
                  {showAiSummary ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronLeft className="w-4 h-4 text-gray-600" />}
                  <img src="/images/boards/stars-01.svg" alt="AI" className="w-4 h-4" />
                  <span className="text-sm text-main font-medium">AI Summary</span>
                </div>
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-grey/10 text-[10px] text-darkGrey">
                  {comments.length}
                </span>
              </div>
              
              {showAiSummary && (
                <div className="p-3 space-y-3 bg-grey/10">
                  {comments.map(comment => (
                    comment.aiSummary && comment.aiSummary.length > 0 && (
                      <div key={comment.id}>
                        <div className="bg-white p-3 rounded-sm border border-grey/20">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={comment.authorImageUrl} alt={comment.author} />
                                <AvatarFallback className="text-[10px] font-medium">
                                  {comment.author?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-black">{comment.author}</span>
                            </div>
                            <span className="text-xs text-darkGrey">{formatTimeAgo(comment.createdAt)}</span>
                          </div>
                          <div className="text-xs text-darkGrey space-y-2">
                            {comment.aiSummary.map((item, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <img src="/images/publish/unschedule.svg" alt="delete" className="w-4 h-4 cursor-pointer" onClick={() => onDeleteAiSummary(comment.id, index)} />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2 px-3 flex items-center justify-between">
                            <div 
                                className="flex items-center gap-1 text-darkGrey hover:text-black cursor-pointer"
                                onClick={() => navigator.clipboard.writeText(comment.aiSummary?.join('\\n') ?? '')}
                            >
                                <Copy className="w-3 h-3" />
                                <span className="text-xs font-medium">Copy</span>
                            </div>
                            <div className="flex items-center gap-2 text-darkGrey">
                                <ThumbsUp className="w-3 h-3 cursor-pointer hover:text-black" />
                                <ThumbsDown className="w-3 h-3 cursor-pointer hover:text-black" />
                            </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Comments list */}
              <div className="px-4 pt-3 pb-35">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    showReplies={showReplies}
                    toggleReplies={toggleReplies}
                    onResolveComment={onResolveComment}
                    handleReplyClick={handleReplyClick}
                    getTotalRepliesCount={getTotalRepliesCount}
                    formatTimeAgo={formatTimeAgo}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat box - 88px height, 344px width, sticky at bottom */}
        {/* Reply context - show above the chat box when replying */}
        <div className="absolute bottom-2 w-full flex flex-col items-center">
          {replyingTo && (
            <div className="w-86 p-2 bg-blue-50 border border-grey/20 border-b-0 rounded-t-sm flex items-center justify-between mb-1">
              <div className="text-xs text-blue-700">
                Replying to {replyingTo.author}
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="h-26 w-86 border border-grey/20 border-solid border-2 rounded-sm bg-white">
            {/* Text area - 56px height */}
            <div className="h-18 border-b-1 border-grey/20 border-solid">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                className="h-full resize-none border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-0 shadow-none"
                style={{ border: "none", outline: "none", boxShadow: "none" }}
              />
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
                    <EmojiPicker onEmojiClick={(e) => setNewComment((p) => p + e.emoji)} />
                  </div>
                )}

                {/* @ button */}
                <Button variant="ghost" className="w-7 h-7 cursor-pointer">
                    <AtSign size={18} />
                </Button>

              </div>

              {/* Send button */}
              <Button
                onClick={handleSendComment}
                disabled={!newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-4.5 w-4.5 p-0 cursor-pointer"
              >
                <img src="/images/boards/send-icon.svg" className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 