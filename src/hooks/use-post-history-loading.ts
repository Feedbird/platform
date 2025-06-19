import { useFeedbirdStore } from '@/lib/store/use-feedbird-store'

export function usePostHistoryLoading(pageId: string) {
  const isLoading = useFeedbirdStore(s => s.syncingPostHistory[pageId] ?? false)
  
  return isLoading
} 