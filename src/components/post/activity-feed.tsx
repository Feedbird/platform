'use client';

import { Activity } from '@/lib/store/use-feedbird-store';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, X, MessageCircle, Clock,
  Send, Smile,
} from 'lucide-react';

const ago = (d: Date) => {
  const s = ~~((Date.now() - +d) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${~~(s / 60)}m ago`;
  if (s < 86400) return `${~~(s / 3600)}h ago`;
  return d.toLocaleDateString();
};

export default function ActivityFeed({ activities }: { activities: Activity[] }) {
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
                a.action.includes('version')  && 'bg-sky-500',
                a.action.includes('comment')  && 'bg-emerald-500',
                a.action.includes('approved') && 'bg-indigo-500',
                a.action.includes('changes')  && 'bg-rose-500',
              )}
            />

            <p
              className={cn(
                'text-sm leading-snug',
                a.action.includes('version')  && 'text-sky-600',
                a.action.includes('comment')  && 'text-emerald-600',
                a.action.includes('approved') && 'text-indigo-600',
                a.action.includes('changes')  && 'text-rose-600',
              )}
            >
              <span className="font-medium">{a.actor}</span> {a.action}
            </p>

            <time className="text-xs text-muted-foreground">{ago(new Date(a.at))}</time>
          </li>
        ))}

        {!activities.length && (
          <li className="text-center text-muted-foreground">No activity yet</li>
        )}
      </ul>
    </div>
  );
}
