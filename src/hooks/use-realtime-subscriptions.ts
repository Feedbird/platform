import { useEffect, useRef } from 'react'
import { useMessageStore, useUserStore } from '@/lib/store'
import { ChannelMessage as DbChannelMessage } from '@/lib/store/types'

type UseRealtimeSubscriptionsProps = {
	channelId: string
	activeWorkspaceId: string | null
	supabase: any
	supabaseInitialized: boolean
	profilesRef: React.MutableRefObject<Record<string, { firstName?: string; imageUrl?: string }>>
}

export function useRealtimeSubscriptions({
	channelId,
	activeWorkspaceId,
	supabase,
	supabaseInitialized,
	profilesRef
}: UseRealtimeSubscriptionsProps) {
	const dbChannelRef = useRef<any>(null)
	const allDbChannelRef = useRef<any>(null)
	const reconnectTimeoutRef = useRef<any>(null)
	const reconnectAttemptRef = useRef<number>(0)
	const user = useUserStore(s => s.user)

	// Realtime subscriptions: DB inserts and typing broadcasts with auto-reconnect
	useEffect(() => {
		if (channelId === 'all' || !supabaseInitialized || !supabase) {
			return
		}

		const subscribeRealtime = () => {
			// Clean old channels
			if (dbChannelRef.current) supabase.removeChannel(dbChannelRef.current)

			// DB changes (INSERT)
			const dbChannel = supabase
				.channel(`channel_messages:${channelId}`)
				.on(
					'postgres_changes',
					{ event: 'INSERT', schema: 'public', table: 'channel_messages', filter: `channel_id=eq.${channelId}` },
					(payload: any) => {
						const m = payload.new as DbChannelMessage
						// Ignore our own messages to avoid echo
						if (m.authorEmail && user?.email && m.authorEmail === user.email) return
						// Avoid duplicates if already in store
						const current = (useMessageStore.getState() as any).channelMessagesByChannelId?.[channelId] || []
						if (current.some((x: any) => x.id === m.id)) return

						const profile = profilesRef.current?.[m.authorEmail]
						const authorName = profile?.firstName || m.authorEmail
						const authorImg = profile?.imageUrl || undefined
						const message = {
							id: m.id,
							author: authorName,
							authorEmail: m.authorEmail,
							authorImageUrl: authorImg,
							text: m.content,
							createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
							parentId: (m as any).parentId || null,
							addon: (m as any).addon,
							readby: (m as any).readby,
							emoticons: (m as any).emoticons,
							channelId: channelId,
						}
						useMessageStore.setState((prev: any) => {
							const byId = prev.channelMessagesByChannelId || {}
							return {
								channelMessagesByChannelId: {
									...byId,
									[channelId]: [...(byId[channelId] || []), message],
									all: [...(byId['all'] || []), message],
								},
							}
						})
					}
				)
				.on(
					'postgres_changes',
					{ event: 'UPDATE', schema: 'public', table: 'channel_messages', filter: `channel_id=eq.${channelId}` },
					(payload: any) => {
						const m = payload.new as DbChannelMessage
						// Update emoticons in existing message - show to all users including sender
						useMessageStore.setState((prev: any) => {
							const byId = prev.channelMessagesByChannelId || {}
							const channelMessages = byId[channelId] || []
							const allMessages = byId['all'] || []

							// Update in channel messages
							const updatedChannelMessages = channelMessages.map((msg: any) =>
								msg.id === m.id ? { ...msg, emoticons: (m as any).emoticons, addon: (m as any).addon } : msg
							)

							// Update in all messages
							const updatedAllMessages = allMessages.map((msg: any) =>
								msg.id === m.id ? { ...msg, emoticons: (m as any).emoticons, addon: (m as any).addon } : msg
							)

							return {
								channelMessagesByChannelId: {
									...byId,
									[channelId]: updatedChannelMessages,
									all: updatedAllMessages,
								},
							}
						})
					}
				)
			dbChannelRef.current = dbChannel

			// Subscribe with status callbacks and auto-reconnect
			dbChannel.subscribe((status: string) => {
				if (status === 'SUBSCRIBED') {
					reconnectAttemptRef.current = 0
				}
				if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
					const attempt = Math.min(reconnectAttemptRef.current + 1, 6)
					reconnectAttemptRef.current = attempt
					const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 30000)
					if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
					reconnectTimeoutRef.current = setTimeout(() => {
						subscribeRealtime()
					}, delayMs)
				}
			})
		}

		subscribeRealtime()

		const onOnline = () => subscribeRealtime()
		const onVisible = () => {
			if (document.visibilityState === 'visible') subscribeRealtime()
		}
		window.addEventListener('online', onOnline)
		document.addEventListener('visibilitychange', onVisible)

		return () => {
			window.removeEventListener('online', onOnline)
			document.removeEventListener('visibilitychange', onVisible)
			if (dbChannelRef.current) supabase.removeChannel(dbChannelRef.current)
			if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
			reconnectAttemptRef.current = 0
		}
	}, [channelId, user?.email, supabaseInitialized, supabase])

	// Realtime for 'all' view: subscribe to all messages in active workspace
	useEffect(() => {
		if (channelId !== 'all' || !activeWorkspaceId || !supabaseInitialized || !supabase) return

		// Clean previous
		if (allDbChannelRef.current) supabase.removeChannel(allDbChannelRef.current)

		const allDb = supabase
			.channel(`channel_messages:all:${activeWorkspaceId}`)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'channel_messages', filter: `workspace_id=eq.${activeWorkspaceId}` },
				(payload: any) => {
					const m = payload.new as DbChannelMessage
					// Ignore our own messages to avoid echo
					if (m.authorEmail && user?.email && m.authorEmail === user.email) return
					// Avoid duplicates in 'all'
					const currentAll = (useMessageStore.getState() as any).channelMessagesByChannelId?.['all'] || []
					if (currentAll.some((x: any) => x.id === m.id)) return
					const profile = profilesRef.current?.[m.authorEmail]
					const authorName = profile?.firstName || m.authorEmail
					const authorImg = profile?.imageUrl || undefined
					const message = {
						id: m.id,
						author: authorName,
						authorEmail: m.authorEmail,
						authorImageUrl: authorImg,
						text: m.content,
						createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
						parentId: (m as any).parentId || null,
						addon: (m as any).addon,
						readby: (m as any).readby,
						emoticons: (m as any).emoticons,
						channelId: (m as any).channelId,
					}
					useMessageStore.setState((prev: any) => ({
						channelMessagesByChannelId: {
							...(prev.channelMessagesByChannelId || {}),
							all: [...(prev.channelMessagesByChannelId?.['all'] || []), message],
						},
					}))
				}
			)
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'channel_messages', filter: `workspace_id=eq.${activeWorkspaceId}` },
				(payload: any) => {
					const m = payload.new as DbChannelMessage
					// Update emoticons in existing message - show to all users including sender
					useMessageStore.setState((prev: any) => {
						const byId = prev.channelMessagesByChannelId || {}
						const allMessages = byId['all'] || []

						// Update in all messages
						const updatedAllMessages = allMessages.map((msg: any) =>
							msg.id === m.id ? { ...msg, emoticons: (m as any).emoticons } : msg
						)

						// Also update in the specific channel if it exists
						const channelId = (m as any).channelId
						const channelMessages = byId[channelId] || []
						const updatedChannelMessages = channelMessages.map((msg: any) =>
							msg.id === m.id ? { ...msg, emoticons: (m as any).emoticons } : msg
						)

						return {
							channelMessagesByChannelId: {
								...byId,
								all: updatedAllMessages,
								...(channelId && { [channelId]: updatedChannelMessages }),
							},
						}
					})
				}
			)

		allDb.subscribe(() => { })
		allDbChannelRef.current = allDb

		return () => {
			if (allDbChannelRef.current) supabase.removeChannel(allDbChannelRef.current)
		}
	}, [channelId, activeWorkspaceId, user?.email, supabaseInitialized, supabase])
}
