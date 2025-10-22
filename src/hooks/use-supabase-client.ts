import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export function useSupabaseClient() {
	const [supabase, setSupabase] = useState<any>(null)
	const [supabaseInitialized, setSupabaseInitialized] = useState(false)

	useEffect(() => {
		const initializeSupabase = async () => {
			try {
				const response = await fetch('/api/supabase/config')
				if (!response.ok) {
					throw new Error('Failed to fetch Supabase config')
				}
				
				const { supabaseUrl, supabaseAnonKey } = await response.json()
				const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
				setSupabase(supabaseClient)
				setSupabaseInitialized(true)
			} catch (error) {
				console.error('Error initializing Supabase client:', error)
			}
		}

		initializeSupabase()
	}, [])

	return { supabase, supabaseInitialized }
}
