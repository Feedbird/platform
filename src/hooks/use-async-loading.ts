import { useCallback } from 'react'
import { useLoading } from '@/lib/providers/loading-provider'
import type { Platform } from '@/lib/social/platforms/platform-types'

export function useAsyncLoading() {
  const loading = useLoading()

  const executeWithLoading = useCallback(async <T>(
    operation: () => Promise<T>,
    loadingText?: string,
    platform?: Platform
  ): Promise<T> => {
    try {
      loading.show(loadingText, platform)
      const result = await operation()
      return result
    } catch (error) {
      // Log error for debugging but don't prevent it from propagating
      console.error('Async operation failed:', error)
      throw error
    } finally {
      // Always hide loading, even if operation fails
      loading.hide()
    }
  }, [loading])

  return {
    executeWithLoading,
    showLoading: loading.show,
    hideLoading: loading.hide,
    isLoading: loading.isLoading,
  }
} 