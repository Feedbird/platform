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

export default function BrandSwitcher() {
  const [isClient, setIsClient] = useState(false);
  const ws       = useFeedbirdStore(s => s.getActiveWorkspace())
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
        <span className='py-0 text-xs absolute top-[-8px] left-[10px] text-grey bg-background leading-none'>Brand</span>
        <button className="flex items-center gap-[8px] cursor-pointer rounded-[6px] border border-border-button px-[8px] py-[5px] text-sm h-[38px] w-[150px]">
          <span className="font-semibold text-sm text-gray-500">Loading…</span>
        </button>
      </div>
    );
  }

  const active = ws.brands.find(b => b.id === activeId)

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
          <span className='py-0 text-xs absolute top-[-8px] left-[10px] text-grey bg-background leading-none'>Brand</span>
          <button className="flex items-center gap-[8px] cursor-pointer rounded-[6px] border border-border-button px-[8px] py-[5px] text-sm">
            {active?.logo && (
              <Image
                src={active.logo}
                alt={active.name}
                width={20} height={20}
                className="rounded-md object-contain"
              />
            )}
            <span className="max-w-[150px] truncate font-semibold text-sm text-black">
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
            {ws.brands.map(b => (
              <CommandItem key={b.id} onSelect={() => select(b.id)}>
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    b.id === activeId ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {b.logo && (
                  <Image
                    src={b.logo}
                    alt={b.name}
                    width={20} height={20}
                    className="rounded-md object-contain size-6"
                  />
                )}
                {b.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
