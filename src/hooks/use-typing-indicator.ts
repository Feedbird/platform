import { useState, useEffect, useRef } from 'react'
import { useUserStore } from '@/lib/store'

export function useTypingIndicator(supabase: any, channelId: string, supabaseInitialized: boolean) {
	const typingChannelRef = useRef<any>(null)
	const typingTimeoutRef = useRef<any>(null)
	const [typingUsers, setTypingUsers] = useState<Record<string, number>>({})
	const user = useUserStore(s => s.user)

	const notifyTyping = () => {
		if (!typingChannelRef.current || !user?.email) return
		typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { email: user.email } })
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
		typingTimeoutRef.current = setTimeout(() => {
			if (!typingChannelRef.current || !user?.email) return
			typingChannelRef.current.send({ type: 'broadcast', event: 'stop_typing', payload: { email: user.email } })
		}, 1500)
	}

	const stopTyping = () => {
		if (typingChannelRef.current && user?.email) {
			typingChannelRef.current.send({ type: 'broadcast', event: 'stop_typing', payload: { email: user.email } })
		}
	}

	// Setup typing channel subscription
	useEffect(() => {
		if (channelId === 'all' || !supabaseInitialized || !supabase) return

		// Clean old channel
		if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current)

		// Typing broadcast
		const typingChannel = supabase
			.channel(`typing:${channelId}`, { config: { broadcast: { self: false } } })
			.on('broadcast', { event: 'typing' }, ({ payload }: { payload: any }) => {
				const email = payload?.email as string | undefined
				if (!email) return
				setTypingUsers((prev) => ({ ...prev, [email]: Date.now() }))
			})
			.on('broadcast', { event: 'stop_typing' }, ({ payload }: { payload: any }) => {
				const email = payload?.email as string | undefined
				if (!email) return
				setTypingUsers((prev) => {
					const next = { ...prev }
					delete next[email]
					return next
				})
			})

		typingChannelRef.current = typingChannel
		typingChannel.subscribe(() => { /* paired with db channel */ })

		return () => {
			if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current)
		}
	}, [channelId, supabaseInitialized, supabase])

	// Reap stale typing indicators
	useEffect(() => {
		const interval = setInterval(() => {
			setTypingUsers((prev) => {
				const now = Date.now()
				const next: Record<string, number> = {}
				for (const [email, ts] of Object.entries(prev)) {
					if (now - ts < 1800) next[email] = ts
				}
				return next
			})
		}, 500)
		return () => clearInterval(interval)
	}, [])

	return {
		typingUsers,
		notifyTyping,
		stopTyping
	}
}
