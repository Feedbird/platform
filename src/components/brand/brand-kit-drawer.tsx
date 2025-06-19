'use client'

import * as React from 'react'
import Image                          from 'next/image'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
}                                     from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuTrigger,
  DropdownMenuContent, DropdownMenuItem,
}                                     from '@/components/ui/dropdown-menu'
import { Button }                     from '@/components/ui/button'
import { ChevronRight, Plus, ArrowRightToLine, ChevronDown  }         from 'lucide-react'
import { useFeedbirdStore }           from '@/lib/store/use-feedbird-store'
import { cn }                         from '@/lib/utils'

/* tiny helper ------------------------------------------------------ */
const Field = ({ label, children }:{
  label:string; children:React.ReactNode
}) => (
  <div className="space-y-1">
    <div className="px-6 pb-5">
      <p className="text-sm font-medium text-primary-foreground pb-1">{label}</p>
      {children}
    </div>
    <hr/>
  </div>
)

export default function BrandKitDrawer(
  { open, onOpenChange }:
  { open:boolean; onOpenChange:(o:boolean)=>void },
) {
  const {
    workspaces, activeWorkspaceId, activeBrandId,
    setActiveBrand, addBrand,
  } = useFeedbirdStore()

  const ws     = workspaces.find(w => w.id === activeWorkspaceId)
  const brands = ws?.brands ?? []
  const brand  = brands.find(b => b.id === activeBrandId)

  if (!brand) return null

  /* ----------------- markup -------------------------------------- */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        /* slide-in / out animation */
        className={cn(
          'fixed inset-y-0 right-0 z-50 h-full w-[360px] max-w-none rounded-none',
          'border-l bg-background p-0',
          'left-auto top-0 translate-x-0 translate-y-0',
          'transition-transform duration-300 translate-x-full',
          'data-[state=open]:translate-x-0',
          '[&>button:last-child]:hidden',
          'overflow-x-hidden'
        )}
      >
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-[#EAECF0]">
          <DialogTitle className="text-primary-foreground">Brand information</DialogTitle>
          <Button
            size="icon" variant="ghost"
            onClick={()=>onOpenChange(false)}
            className="cursor-pointer"
          >
            <ArrowRightToLine className="h-5 w-5"/>
          </Button>
        </DialogHeader>
        {/* ---------- brand selector ------------------------------ */}
        <div>
          <Field label="Brand">
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="outline-none ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-border cursor-pointer">
                <Button
                  variant="outline"
                  className="w-full h-full justify-between gap-2"
                >
                  <div className="flex justify-center items-center gap-2">
                    {brand.logo && (
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        width={20} height={20}
                        className="rounded-md object-contain size-6"
                      />
                    )}
                    <p className='truncate flex-1 leading-tight text-sm text-primary-foreground'>{brand.name}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-60"/>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="left"
                align="start"
                sideOffset={4}
                className="min-w-[280px] w-full">
                {brands.map(b => (
                  <DropdownMenuItem
                    key={b.id}
                    onSelect={()=>setActiveBrand(b.id)}
                    className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-border w-full"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 w-full">
                      {b.logo ? (
                        <Image
                          src={b.logo}
                          alt={b.name}
                          width={24}
                          height={24}
                          className="rounded-md object-contain flex-shrink-0"
                        />
                      ) : (
                        <div className="size-6 bg-muted rounded-md flex-shrink-0" />
                      )}
                      <span className="truncate text-accent-foreground">{b.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-sm font-medium text-foreground pt-2">Brand name</p>
            <p className="text-sm font-medium text-primary-foreground pt-2">{brand?.name}</p>
          </Field>
        </div>

        {/* ---------- details ------------------------------------- */}
        <div className="pb-8 overflow-y-auto overflow-x-hidden space-y-6">
          <Field label="Logo">
            {brand.logo
              ? (
                <Image
                  src={brand.logo}
                  alt=""
                  width={72} height={72}
                  className="border rounded p-1 bg-muted"
                />
              )
              : <span className="text-sm text-muted-foreground">None</span>}
          </Field>

          <Field label="Fonts">
            {brand.styleGuide?.fonts?.length
              ? <p className="text-sm">{brand.styleGuide.fonts.join(', ')}</p>
              : <span className="text-sm text-muted-foreground">—</span>}
          </Field>

          <Field label="Colors">
            {brand.styleGuide?.colors?.length
              ? (
                <div className="grid grid-cols-3 gap-1">
                  {brand.styleGuide.colors.map((c,i)=>(
                    <p key={i} className="flex gap-1 w-full h-full">
                    <span className="h-6 w-6 rounded" style={{background:c}}/>
                    <span className="text-sm text-muted-foreground">{c}</span>
                    </p>
                  ))}
                  
                </div>
              )
              : <span className="text-sm text-muted-foreground">—</span>}
          </Field>

          <Field label="Social media channel">
            {brand.socialPages?.length
              ? (
                <div className="flex gap-2">
                  {brand.socialPages.map(sp=>(
                    <span key={sp.id}>{sp.platform}</span>
                  ))}
                </div>
              )
              : <span>No socials connected</span>
            }
          </Field>

          <Field label="Links">
            <a
              href={brand.link || '#'}
              target="_blank"
              className="text-sm underline truncate max-w-[260px]"
            >
              {brand.link || '—'}
            </a>
          </Field>

          <Field label="Brand voice">
            <p className="text-sm whitespace-pre-wrap">{brand.voice || '—'}</p>
          </Field>

          <Field label="Preferences">
            <p className="text-sm whitespace-pre-wrap">{brand.prefs || '—'}</p>
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  )
}
