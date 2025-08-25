/* app/brands/page.tsx */
'use client'

import * as React                       from 'react'
import Image                            from 'next/image'
import Link                             from 'next/link'
import { useRouter, useSearchParams }   from 'next/navigation'
import {
  MoreHorizontal, Plus, Pencil, Trash,
}                                       from 'lucide-react'
import {
  DropdownMenu, DropdownMenuTrigger,
  DropdownMenuContent, DropdownMenuItem,
}                                       from '@/components/ui/dropdown-menu'
import { Button }                       from '@/components/ui/button'
import { EmptyState }                   from '@/components/empty-state/empty-state'
import BrandSheet                       from '@/components/brand/brand-sheet'
import { useFeedbirdStore }             from '@/lib/store/use-feedbird-store'
import { toast }                        from 'sonner'
import { ChannelIcons } from '@/components/content/shared/content-post-ui'

/* ---------- colour strip ----------------------------------------- */
function ColorStrip ({ colors }: { colors: string[] }) {
  if (!colors.length)
    return <span className="text-muted-foreground">—</span>

  return (
    <div className="flex h-3 rounded overflow-hidden">
      {colors.map((c, i) => (
        <span key={i} style={{ background: c }} className="flex-1"/>
      ))}
    </div>
  )
}

/* ---------- 3-dot row menu --------------------------------------- */
function RowMenu (
  { id, name }:
  { id: string; name: string },
) {
  const router        = useRouter()
  const { removeBrand } = useFeedbirdStore()

  const del = () => {
    removeBrand(id)
    toast.success(`Brand “${name}” deleted`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-8 w-8 rounded-md hover:bg-muted
                     flex items-center justify-center"
          onClick={e => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4 cursor-pointer"/>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-24 cursor-pointer">
        <DropdownMenuItem
          className="gap-2 cursor-pointer text-sm text-foreground"
          onSelect={e => {
            e.stopPropagation()
            router.push(`?edit=${id}`)
          }}
        >
          <Pencil className="h-3.5 w-3.5"/> Edit
        </DropdownMenuItem>

        <DropdownMenuItem
          className="gap-2 text-destructive cursor-pointer"
          onSelect={e => {
            e.preventDefault(); del()
          }}
        >
          <Trash className="h-3.5 w-3.5 text-[#ff0000]"/> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ---------- main page -------------------------------------------- */
export function BrandsInner () {
  const router = useRouter()
  const qs     = useSearchParams()

  /* open sheet if ?new or ?edit=id is present ---------------------- */
  const sheetMode = qs.has('new') ? 'new' : qs.get('edit') || null
  if (sheetMode) router.prefetch('/brands')        // smooth back-nav

  const {
    getActiveWorkspace,
    setActiveBrand,
  } = useFeedbirdStore()

  const brand = getActiveWorkspace()?.brand;

  /* empty-state ---------------------------------------------------- */
  if (!brand)
    return (
      <EmptyState
        title="Your brand is empty"
        description="Brand will appear here if you create it"
        action={(
          <Link
            href="?new=1"
            className="inline-flex items-center gap-2 rounded-md
                       bg-[#4D3AF1] px-3 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4"/> Create brand
          </Link>
        )}
      />
    )

  /* ---------------------------------------------------------------- */
  return (
    <>
      <div className="mx-auto w-full max-w-6xl my-6
                      rounded-lg bg-background text-foreground shadow-sm">

        {/* headings row -------------------------------------------- */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_100px_48px] gap-4
                        px-6 py-4 text-sm font-medium text-primary-foreground">
          <span>Name</span><span>Font</span><span>Socials</span>
          <span>Colors</span>
          <span className="sr-only">view</span>
          <span className="sr-only">menu</span>
        </div>

        {/* data rows ------------------------------------------------ */}
          <div
            key={brand.id}
            className="grid grid-cols-[2fr_1fr_1fr_1fr_100px_48px] gap-4
                       items-center px-6 py-3 border-t
                       hover:bg-muted/40 cursor-pointer text-sm"
            onClick={() => setActiveBrand(brand.id)}
          >
            {/* name + logo */ }
            <div className="flex items-center gap-3 min-w-0">
              <Image
                src={brand.logo || '/placeholder-logo.svg'}
                alt={brand.name}
                width={36} height={36}
                className="h-9 w-9 rounded-md object-contain
                           bg-muted/50 p-1"
              />
              <span className="truncate text-primary-foreground">{brand.name}</span>
            </div>

            {/* font */ }
            <span
              className="truncate"
              style={{ fontFamily: brand.styleGuide?.fonts?.[0] }}
            >
              {brand.styleGuide?.fonts?.join(', ') || '—'}
            </span>

            {/* socials */ }
            <ChannelIcons channels={brand.socialPages?.map(p => p.platform) || []}/>

            {/* colors */ }
            <ColorStrip   colors  ={brand.styleGuide?.colors || []}/>

            {/* view brand */ }
            <Link
              href={`?edit=${brand.id}`}
              className="rounded-md border px-2 py-1 text-sm
                         text-primary hover:bg-primary/10"
              onClick={e => e.stopPropagation()}
            >
              View brand
            </Link>

            {/* three-dot menu */ }
            <RowMenu id={brand.id} name={brand.name}/>
          </div>
      </div>

      {/* full-screen sheet (reads query-params internally) --------- */}
      <BrandSheet/>
    </>
  )
}
