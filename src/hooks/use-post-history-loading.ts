import { useSocialStore } from '@/lib/store'

export function usePostHistoryLoading(pageId: string) {
  const isLoading = useSocialStore(s => s.syncingPostHistory[pageId] ?? false)
  
  return isLoading
} 