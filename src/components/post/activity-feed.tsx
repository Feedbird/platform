'use client';

import { Activity } from '@/lib/store';
import { cn, formatTimeAgo } from '@/lib/utils';
import {
  ChevronLeft, X, MessageCircle, Clock,
  Send, Smile,
} from 'lucide-react';

// using shared formatTimeAgo

export default function ActivityFeed({ activities }: { activities: Activity[] }) {
  const getActorDisplayName = (actorId: string, actor?: any) => {
    // If we have actor data from the database, use it
    if (actor) {
      if (actor.firstName) {
        return actor.firstName;
      }
      if (actor.email) {
        // Fallback to email if no first name
        return actor.email.split('@')[0];
      }
    }
    // Final fallback to a shortened version of the ID
    return actorId.substring(0, 8) + '...';
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'revision_request':
        return 'requested changes';
      case 'revised':
        return 'created a new revision';
      case 'approved':
        return 'approved';
      case 'scheduled':
        return 'scheduled';
      case 'published':
        return 'published';
      case 'failed_publishing':
        return 'failed to publish';
      default:
        return activity.type;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* header bar (optional) */}
      <div className="h-10 px-4 flex items-center gap-2 border-b bg-muted/40 shrink-0">
        <Clock size={16} />
        <span className="font-medium text-sm">Activities</span>
      </div>
      <ul className="relative pl-4 pr-4 pt-4 space-y-6">
        <span className="absolute left-2 top-0 bottom-0 w-px bg-muted" />

        {activities.map(a => (
          <li key={a.id} className="relative pl-4">
            <span
              className={cn(
                'absolute -left-2 top-1 w-3 h-3 rounded-full animate-ping',
                a.type.includes('revised')  && 'bg-sky-500',
                a.type.includes('comment')  && 'bg-emerald-500',
                a.type.includes('approved') && 'bg-indigo-500',
                a.type.includes('revision') && 'bg-rose-500',
              )}
            />

            <p
              className={cn(
                'text-sm leading-snug',
                a.type.includes('revised')  && 'text-sky-600',
                a.type.includes('comment')  && 'text-emerald-600',
                a.type.includes('approved') && 'text-indigo-600',
                a.type.includes('revision') && 'text-rose-600',
              )}
            >
              <span className="font-medium">{getActorDisplayName(a.actorId, a.actor)}</span> {getActivityText(a)}
            </p>

            <time className="text-xs text-muted-foreground">{formatTimeAgo(a.createdAt)}</time>
          </li>
        ))}

        {!activities.length && (
          <li className="text-center text-muted-foreground">No activity yet</li>
        )}
      </ul>
    </div>
  );
}
