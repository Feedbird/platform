'use client'

import { useEffect } from 'react'
import { useFeedbirdStore, usePostStatusTimeUpdater } from '@/lib/store/use-feedbird-store'
import { supabase, ChannelMessage as DbChannelMessage } from '@/lib/supabase/client'
import { userApi } from '@/lib/api/api-service'

export default function FeedbirdProvider({ children }: { children: React.ReactNode }) {
  const workspaces = useFeedbirdStore(s => s.workspaces)
  const user = useFeedbirdStore(s => s.user)
  const activeWorkspaceId = useFeedbirdStore(s => s.activeWorkspaceId)
  const currentChannelId = useFeedbirdStore(s => s.currentChannelId)

  // Initialize post status time updater
  usePostStatusTimeUpdater();

  // Global websocket subscription for handling unread messages
  // This ensures users receive websocket updates even when not viewing the message panel
  useEffect(() => {
    if (!user?.email || !activeWorkspaceId) return

    // Subscribe to all new messages in the active workspace
    const globalMessageChannel = supabase
      .channel(`global_messages:${activeWorkspaceId}:${user.email}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'channel_messages', 
          filter: `workspace_id=eq.${activeWorkspaceId}` 
        },
        (payload: any) => {
          const m = payload.new as DbChannelMessage
          // Ignore our own messages
          if (m.author_email === user.email) return

          // Handle the race condition: remove API might arrive before add API
          // If user is viewing this channel context, remove from unread_msg
          // If user is NOT viewing this channel context, add to local store
          
          const store = useFeedbirdStore.getState()
          const currentChannelId = store.currentChannelId
          let shouldMarkAsRead = false
          
          if (currentChannelId === 'all') {
            // User is viewing 'all messages' of the same workspace
            shouldMarkAsRead = true
          } else if (currentChannelId === m.channel_id) {
            // User is viewing the specific channel where the message was sent
            shouldMarkAsRead = true
          } else if (currentChannelId === undefined || currentChannelId === null) {
            // User is not viewing any message panel - mark as unread
            shouldMarkAsRead = false
          }
          
          if (shouldMarkAsRead) {
            console.log('Global User is viewing this message context, removing from unread:', m.id)
            
            setTimeout(() => {
              userApi.removeUnreadMessage(user.email, m.id)
            }, 200) 
          } else {
            console.log('Global User is NOT viewing this message context, adding to local store:', m.id)
            store.addUnreadMessage(m.id)
          }
        }
      )

    globalMessageChannel.subscribe()

    return () => {
      supabase.removeChannel(globalMessageChannel)
    }
  }, [user?.email, activeWorkspaceId, currentChannelId])

  return <>{children}</>
}
