'use client'

import * as React from 'react'
import {
  DropdownMenu, DropdownMenuTrigger,
  DropdownMenuContent, DropdownMenuItem,
}                    from '@/components/ui/dropdown-menu'
import { Button }    from '@/components/ui/button'
import { Bell }      from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Notif = { id:string; text:string; date:Date }

const dummy: Notif[] = [
  { id:'1', text:'Post approved by client',   date:new Date(Date.now()-3_600_000) },
  { id:'2', text:'New comment on Reel draft', date:new Date(Date.now()-86_400_000) },
  { id:'3', text:'Your subscription renews tomorrow', date:new Date(Date.now()-172_800_000) },
]

export default function NotificationBell() {
  const unread = dummy.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative cursor-pointer">
          <Bell className="h-5 w-5"/>
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5
                             h-4 w-4 rounded-full bg-destructive text-[10px]
                             flex items-center justify-center text-background">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64">
        {dummy.map(n => (
          <DropdownMenuItem key={n.id} className="flex flex-col gap-0.5 items-start">
            <span className="text-sm">{n.text}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(n.date,{addSuffix:true})}
            </span>
          </DropdownMenuItem>
        ))}
        {dummy.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
