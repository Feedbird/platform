'use client'

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import Image                          from 'next/image'
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { Check, ChevronsUpDown, House } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store'
import { useLoading } from '@/lib/providers/loading-provider'
import { startTransition } from 'react'
import React from 'react'

export default function BrandSwitcher() {
  const [isClient, setIsClient] = useState(false);
  const workspaces = useFeedbirdStore(s => s.workspaces)
  const activeWorkspaceId = useFeedbirdStore(s => s.activeWorkspaceId)
  const ws = React.useMemo(() => workspaces.find(w => w.id === activeWorkspaceId), [workspaces, activeWorkspaceId])

  const activeId = useFeedbirdStore(s => s.activeBrandId)
  const setBrand = useFeedbirdStore(s => s.setActiveBrand)
  const { show, hide } = useLoading()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!ws || !isClient) {
    // Render a placeholder or null on the server and initial client render
    return (
      <div className="relative">
        <span className='py-0 text-xs absolute top-[-6px] left-[10px] text-grey bg-background leading-none'>Brand</span>
        <button className="flex items-center gap-[8px] cursor-pointer rounded-[6px] border border-border-button px-[8px] py-[5px] text-sm h-[38px] w-[150px]">
          <span className="font-medium text-sm text-gray-500">Loading…</span>
        </button>
      </div>
    );
  }

  const active = ws.brand && ws.brand.id === activeId ? ws.brand : null

  const select = (id: string) => {
    show()
    startTransition(() => setBrand(id))
    setTimeout(hide, 1000)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className='cursor-pointer p-0'>
        <div className="relative">
          <span className='py-0 text-xs absolute top-[-6px] left-[10px] text-grey bg-background leading-none'>Brand</span>
          <button className="flex items-center gap-[8px] cursor-pointer rounded-[6px] border border-border-button px-[8px] py-[5px] text-sm">
            {active?.logo && (
              <Image
                src={active.logo}
                alt={active.name}
                width={20} height={20}
                className="rounded-md object-contain"
              />
            )}
            <span className="max-w-[150px] truncate font-medium text-sm text-black">
              {active?.name ?? 'Pick a brand'}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-60" />
          </button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0">
        <Command>
          <CommandInput placeholder="Search brand…" />
          <CommandGroup>
            {ws.brand && (
              <CommandItem key={ws.brand.id} onSelect={() => select(ws?.brand?.id ?? '')}>
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    ws.brand.id === activeId ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {ws.brand.logo && (
                  <Image
                    src={ws.brand.logo}
                    alt={ws.brand.name}
                    width={20} height={20}
                    className="rounded-md object-contain size-6"
                  />
                )}
                {ws.brand.name}
              </CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
