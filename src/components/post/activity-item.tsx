"use client";

import { Activity } from "@/lib/store/use-feedbird-store";
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
              {' ' + activity.actor}
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
              {' ' + activity.actor}
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
      default:
        return (
          <span className="text-sm font-medium text-darkGrey">
            {activity.action}
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
             const at = activity.at instanceof Date ? activity.at : new Date(activity.at as any);
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