"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Post, usePostStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ApproveCell({
  post,
}: {
  post: Post;
}) {
  const approvePost = usePostStore(s => s.approvePost);
  const requestChanges = usePostStore(s => s.requestChanges);
  const setPostRevised = usePostStore(s => s.setPostRevised);
  
  const isApproved = post.status === "Approved";
  const isInRevision = post.status === "Needs Revisions";
  const isScheduledOrPosted = post.status === "Scheduled" || post.status === "Published";

  // Define which statuses allow approval/revision actions
  const allowedStatusesForApproval = [
    "Pending Approval",
    "Revised", 
    "Needs Revisions",
    "Approved"
  ];
  
  const canPerformApprovalAction = allowedStatusesForApproval.includes(post.status);

  const handleClick = () => {
    if (!canPerformApprovalAction) {
      return; // Do nothing if not allowed
    }

    // Don't trigger approval action when hovering over interactive elements
    if (isHovering && (isApproved || isInRevision)) {
      return;
    }

    if (isApproved) {
      // If currently approved, change to "Needs Revisions"
      requestChanges(post.id);
    } else {
      // For any other allowed status, approve it
      approvePost(post.id);
    }
  };

  const handleRemoveApproval = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the main click handler
    requestChanges(post.id);
  };

  const handleRevision = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the main click handler
    setPostRevised(post.id);
  };

  const [isHovering, setIsHovering] = React.useState(false);

  const approveTooltip = `Unavailable when status is ${post.status}. Allowed: Pending Approval, Needs Revisions, Revised, Approved.`;

  const content = (
    <div
      className={cn(
        "inline-flex items-center w-full h-full overflow-hidden px-[8px] py-[6px]",
        canPerformApprovalAction ? "cursor-pointer" : "cursor-not-allowed opacity-50"
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-center flex-nowrap min-w-0">
        <div className="flex-shrink-0">
          {isApproved || isScheduledOrPosted ? (
            <div
              style={{
                display: "inline-flex",
                padding: "2px 6px 2px 4px",
                alignItems: "center",
                gap: "4px",
                borderRadius: "4px",
                border: "1px solid rgba(28, 29, 31, 0.05)",
                background: "#DDF9E4",
              }}
              className="text-xs font-medium leading-[18px] relative"
            >
              <Image src="/images/status/approved.svg" alt="approved" width={14} height={14} />
              <span>Approved</span>
              {isApproved && (
                <div 
                  className={cn(
                    "absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center transition-opacity duration-200 cursor-pointer",
                    isHovering ? "opacity-100" : "opacity-0"
                  )}
                  onClick={handleRemoveApproval}
                  title="Remove approval"
                >
                  <svg 
                    width="8" 
                    height="8" 
                    viewBox="0 0 8 8" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M1 1L7 7M7 1L1 7" 
                      stroke="white" 
                      strokeWidth="1.2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          ) : isInRevision ? (
            <div
              style={{
                display: "inline-flex",
                padding: "2px 6px 2px 4px", 
                alignItems: "center",
                gap: "4px",
                borderRadius: "4px",
                border: "1px solid rgba(28, 29, 31, 0.05)",
                background: "#FCE4E5",
              }}
              className="text-xs font-medium leading-[18px] relative"
            >
              <Image src="/images/status/needs-revision.svg" alt="needs revision" width={14} height={14} />
              <span>Revision</span>
              <div 
                className={cn(
                  "absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center transition-opacity duration-200 cursor-pointer",
                  isHovering ? "opacity-100" : "opacity-0"
                )}
                onClick={handleRevision}
                title="Mark as revised"
              >
                <svg 
                  width="8" 
                  height="8" 
                  viewBox="0 0 8 8" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M1 1L7 7M7 1L1 7" 
                    stroke="white" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "inline-flex",
                padding: "2px",
                alignItems: "center",
                gap: "10px",
                borderRadius: "6px",
                background: "#FFF",
                boxShadow: "0px 1px 2px -1px rgba(7, 10, 22, 0.02)",
              }}
              className="border border-border-button"
            >
              <img src="/images/icons/approvals.svg" alt="approve" style={{ width: '18px', height: '18px' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return canPerformApprovalAction ? (
    content
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent sideOffset={4} className="bg-[#151515] text-white border-none text-xs">{approveTooltip}</TooltipContent>
    </Tooltip>
  );
}
