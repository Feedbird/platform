'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Hash, ChevronDown, X } from 'lucide-react'
import { useWorkspaceStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface ChannelSelectorProps {
  onChannelSelect: (channelId: string) => void
  selectedChannelId: string | null
  onClose: () => void
}

export default function ChannelSelector({ onChannelSelect, selectedChannelId, onClose }: ChannelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const activeWorkspaceId = useWorkspaceStore(s => s.activeWorkspaceId)
  const EMPTY_CHANNELS: any[] = []
  const rawChannels = useWorkspaceStore((s) => {
    const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId)
    return (ws as any)?.channels ?? EMPTY_CHANNELS
  }) as any[]
  
  const channels = rawChannels.filter((channel: any) => channel.id !== 'all')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChannelSelect = (channelId: string) => {
    onChannelSelect(channelId)
    setIsOpen(false)
  }

  const selectedChannel = channels.find((c: any) => c.id === selectedChannelId)

  return (
         <div ref={dropdownRef} className="h-[24px] flex items-center">
      <Button
         variant="outline"
         onClick={() => setIsOpen(!isOpen)}
         className="h-[24px] px-2 box-border cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10 text-blue-700 bg-blue-50 text-xs"
       >
         <Hash className="h-3 w-3 mr-1" />
         {selectedChannel ? `#${selectedChannel.name}` : 'Select'}
         <ChevronDown className={cn("h-3 w-3 ml-1 transition-transform", isOpen && "rotate-180")} />
       </Button>

             {isOpen && (
         <div className="absolute bottom-full left-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">Select a channel to send message to:</div>
            {channels.map((channel: any) => (
              <button
                key={channel.id}
                onClick={() => handleChannelSelect(channel.id)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors",
                  selectedChannelId === channel.id && "bg-blue-100 text-blue-700"
                )}
              >
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{channel.name}</span>
                </div>
                {channel.description && (
                  <div className="text-xs text-gray-500 mt-1 ml-6 truncate">
                    {channel.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

             {selectedChannelId && (
         <Button
           variant="ghost"
           size="icon"
           onClick={onClose}
           className="size-[24px] p-0 ml-1 text-gray-500 hover:text-gray-700"
         >
           <X className="h-3 w-3" />
         </Button>
       )}
    </div>
  )
}
