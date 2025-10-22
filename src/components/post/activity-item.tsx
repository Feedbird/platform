"use client";

import { Activity } from "@/lib/store";
import { format } from "date-fns";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  activity: Activity;
  onViewVersionHistory?: () => void;
  onRevertApproval?: () => void;
}

export function ActivityItem({ activity, onViewVersionHistory, onRevertApproval }: ActivityItemProps) {
  const getActorDisplayName = (actorId: string, actor?: any) => {
    // If we have actor data from the database, use it
    if (actor) {
      if (actor.first_name) {
        return actor.first_name;
      }
      if (actor.email) {
        // Fallback to email if no first name
        return actor.email.split('@')[0];
      }
    }
    // Final fallback to a shortened version of the ID
    return actorId.substring(0, 8) + '...';
  };

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'revision_request':
        return '/images/status/needs-revision.svg';
      case 'revised':
        return '/images/status/revised.svg';
      case 'approved':
        return '/images/status/approved.svg';
      case 'scheduled':
        return '/images/status/scheduled.svg';
      case 'published':
        return '/images/status/published.svg';
      case 'failed_publishing':
        return '/images/status/failed-publishing.svg';
      case 'workspace_invited_sent':
        return '/images/status/draft.svg'; // You can change this to a more appropriate icon
      case 'board_invited_sent':
        return '/images/status/draft.svg'; // You can change this to a more appropriate icon
      default:
        return '/images/status/draft.svg';
    }
  };

  const getActivityText = () => {
    switch (activity.type) {
      case 'revision_request':
        return (
          <div>
            <span className="text-sm font-medium text-darkGrey">
              Revision requested by 
            </span>
            <span className="text-sm font-medium text-black">
              {' ' + getActorDisplayName(activity.actorId, (activity as any).actor)}
            </span>
          </div>
        );
      case 'revised':
        return (
          <div>
            <span className="text-sm font-medium text-darkGrey">
              Revision
            </span>
            <span className="text-sm font-medium text-black">
              {' v' + activity.metadata?.versionNumber || '1'}
            </span>
            <span className="text-sm font-medium text-darkGrey">
              {' ' + 'ready for review'}
            </span>
          </div>
        );
      case 'approved':
        return (
          <div>
            <span className="text-sm font-medium text-darkGrey">
            Approved by
            </span>
            <span className="text-sm font-medium text-black">
              {' ' + getActorDisplayName(activity.actorId, (activity as any).actor)}
            </span>
          </div>
        );
      case 'scheduled':
        const scheduledTime = activity.metadata?.publishTime;
        return (
          <div>
            <span className="text-sm font-medium text-darkGrey">
              Scheduled for
            </span>
            <span className="text-sm font-medium text-black">
              {scheduledTime ? ' ' + format(new Date(scheduledTime), "MMM d, p") : ' later'}
            </span>
          </div>
        );
      case 'published':
        const publishTime = activity.metadata?.publishTime;
        return (
          <div>
            <span className="text-sm font-medium text-darkGrey">
              Published on
            </span>
            <span className="text-sm font-medium text-black">
              {publishTime ? ' ' + format(new Date(publishTime), "MMM d, p") : ' now'}
            </span>
          </div>
        );
      case 'failed_publishing':
        return (
          <span className="text-sm font-medium text-darkGrey">
            Failed Publishing
          </span>
        );
      case 'workspace_invited_sent':
        const workspaceMetadata = activity.metadata as { invitedEmail?: string; workspaceId?: string } | undefined;
        return (
          <div>
            <span className="text-sm font-medium text-darkGrey">
              Invited
            </span>
            <span className="text-sm font-medium text-black">
              {' ' + (workspaceMetadata?.invitedEmail || 'someone')}
            </span>
            <span className="text-sm font-medium text-darkGrey">
              {' to workspace'}
            </span>
          </div>
        );
      case 'board_invited_sent':
        const boardMetadata = activity.metadata as { invitedEmail?: string; boardId?: string; workspaceId?: string } | undefined;
        return (
          <div>
            <span className="text-sm font-medium text-darkGrey">
              Invited
            </span>
            <span className="text-sm font-medium text-black">
              {' ' + (boardMetadata?.invitedEmail || 'someone')}
            </span>
            <span className="text-sm font-medium text-darkGrey">
              {' to board'}
            </span>
          </div>
        );
      default:
        return (
          <span className="text-sm font-medium text-darkGrey">
            {activity.type}
          </span>
        );
    }
  };

  const getActionButton = () => {
    switch (activity.type) {
      case 'revised':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewVersionHistory}
            className="text-sm text-black h-7 px-2 cursor-pointer"
          >
            <img src="/images/boards/clock-fast-forward.svg" alt="version history" className="w-4 h-4" />
            See Version History
          </Button>
        );
      case 'approved':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={onRevertApproval}
            className="text-sm h-7 px-2 text-black cursor-pointer"
          >
            <img src="/images/boards/reverse-left.svg" alt="version history" className="w-4 h-4" />
            Revert Approval
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col mb-3">
      <div className="flex items-center justify-between w-full pb-2">
        <div className="flex items-center gap-2">
          <Image
            src={getActivityIcon()}
            alt={activity.type}
            width={16}
            height={16}
            className="mt-0.5"
          />
            {getActivityText()}
        </div>
         <span className="text-xs text-grey">
           {(() => {
             const at = activity.createdAt instanceof Date ? activity.createdAt : new Date(activity.createdAt as any);
             return isNaN(at.getTime()) ? '' : format(at, "MMM d, p");
           })()}
         </span>
      </div>
      <div className="flex items-center gap-2 pl-5">
        {getActionButton()}
      </div>
    </div>
  );
} 