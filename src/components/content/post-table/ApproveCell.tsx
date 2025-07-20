"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Post } from "@/lib/store/use-feedbird-store";
import { cn } from "@/lib/utils";

export function ApproveCell({
  post,
  updatePost,
}: {
  post: Post;
  updatePost: (id: string, updates: Partial<Post>) => void;
}) {
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

    if (isApproved) {
      // If currently approved, change to "Needs Revisions"
      updatePost(post.id, {
        status: "Needs Revisions",
      });
    } else {
      // For any other allowed status, approve it
      updatePost(post.id, {
        status: "Approved",
      });
    }
  };

  const handleRemoveApproval = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the main click handler
    updatePost(post.id, {
      status: "Needs Revisions",
    });
  };

  return (
    <div
      className={cn(
        "inline-flex items-center w-full h-full overflow-hidden px-[8px] py-[6px]",
        canPerformApprovalAction ? "cursor-pointer" : "cursor-not-allowed opacity-50"
      )}
      onClick={handleClick}
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
              className="text-xs font-semibold leading-[18px] relative group"
            >
              <Image src="/images/status/approved.svg" alt="approved" width={14} height={14} />
              <span>Approved</span>
              
              {/* X icon that appears on hover when approved */}
              {isApproved && (
                <div 
                  className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
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
                padding: "4px 8px 4px 4px", 
                alignItems: "center",
                gap: "4px",
                borderRadius: "4px",
                border: "1px solid rgba(28, 29, 31, 0.05)",
                background: "#FCE4E5",
              }}
              className="text-xs font-semibold leading-[18px]"
            >
              <Image src="/images/status/needs-revision.svg" alt="needs revision" width={14} height={14} />
              <span>Revision</span>
            </div>
          ) : (
            <div
              style={{
                display: "inline-flex",
                padding: "6px",
                alignItems: "center",
                gap: "10px",
                borderRadius: "6px",
                background: "#FFF",
                boxShadow: "0px 1px 2px -1px rgba(7, 10, 22, 0.02)",
              }}
              className="border border-border-button"
            >
              <Image src="/images/sidebar/approvals.svg" alt="approve" width={14} height={14} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
