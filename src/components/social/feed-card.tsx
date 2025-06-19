/* components/social/feed-card.tsx */
'use client'

import Image                    from 'next/image'
import { Heart, MessageCircle } from 'lucide-react'
import { cn }                   from '@/lib/utils'

/* ---------- type that matches the /api/history payload --------- */
export type FeedCardItem = {
  id        : string
  created   : string              // ISO string
  platform  : string              // “linkedin”, “facebook” …
  post      : string              // raw text
  mediaUrls : string[]            // 0-N images / thumbs
  postUrl   : string              // canonical link
}

/* tiny helpers --------------------------------------------------- */
const pretty = (iso:string)=> new Intl.DateTimeFormat(
  'en-US', { dateStyle:'medium', timeStyle:'short' }
).format(new Date(iso))

const clean = (s:string)=> s.replace(/^\[Sent with Free Plan\]\s*/i, '')

export default function FeedCard({ item }: { item: FeedCardItem }) {
  const {
    created, platform, post: text, mediaUrls, postUrl,
  } = item

  /* fallbacks (free plan doesn’t return avatar / profile names) */
  const avatar   = `/platforms/${platform}.svg`
  const name     = platform[0].toUpperCase()+platform.slice(1)
  const username = platform

  return (
    <article
      className="flex flex-col overflow-hidden rounded-lg border
                 bg-background shadow-sm hover:shadow-md transition-shadow min-w-md"
    >
      {/* header --------------------------------------------------- */}
      <header className="flex items-center gap-3 px-4 py-3">
        <Image
          src={avatar}
          alt={platform}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover bg-muted p-1"
        />
        <div className="min-w-0">
          <p className="font-medium leading-tight truncate">{name}</p>
          <p className="text-xs text-muted-foreground">@{username}</p>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {pretty(created)}
        </span>
      </header>

      {/* caption -------------------------------------------------- */}
      {text && (
        <p className="px-4 pb-3 text-sm whitespace-pre-line">
          {clean(text)}
        </p>
      )}

      {/* media grid (1-4) ---------------------------------------- */}
      {mediaUrls?.length > 0 && (
        <div
          className={cn(
            'grid gap-px bg-border',
            mediaUrls.length === 1 && 'grid-cols-1',
            mediaUrls.length === 2 && 'grid-cols-2',
            mediaUrls.length >= 3 && 'grid-cols-2',
          )}
        >
          {mediaUrls.slice(0,4).map((src,i)=>(
            <Image
              key={i}
              src={src}
              alt=""
              width={600}
              height={600}
              className="aspect-square w-full object-cover"
            />
          ))}
        </div>
      )}

      {/* footer actions (visual only) ----------------------------- */}
      <footer className="flex items-center gap-6 px-4 py-2 text-muted-foreground">
        <button className="flex items-center gap-1 hover:text-foreground">
          <Heart className="h-4 w-4" /> <span>Like</span>
        </button>
        <button className="flex items-center gap-1 hover:text-foreground">
          <MessageCircle className="h-4 w-4" /> <span>Comment</span>
        </button>
      </footer>
    </article>
  )
}
