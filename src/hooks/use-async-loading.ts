import { useCallback } from 'react'
import { useLoading } from '@/lib/providers/loading-provider'
import type { Platform } from '@/lib/social/platforms/platform-types'
import { toast } from 'sonner'
import { handleError } from '@/lib/utils/error-handler'

type LoadingMessages = {
  loading: string
  success: string
  error: string
}

export function useAsyncLoading() {
  const loading = useLoading()

  const executeWithLoading = useCallback(async <T>(
    operation: () => Promise<T>,
    messages?: string | LoadingMessages,
    onFinallyOrPlatform?: (() => void) | Platform
  ): Promise<T | undefined> => {
    const isObjectMessages = typeof messages === 'object'
    const onFinally = typeof onFinallyOrPlatform === 'function' ? onFinallyOrPlatform : undefined
    const platform = typeof onFinallyOrPlatform === 'string' ? onFinallyOrPlatform : undefined

    let toastId: string | number | undefined

    try {
      if (isObjectMessages) {
        toastId = toast.loading(messages.loading)
      } else {
        loading.show(messages, platform)
      }
      
      const result = await operation()
      
      if (isObjectMessages) {
        toast.success(messages.success, { id: toastId })
      }
      
      return result
    } catch (error: any) {
      if (isObjectMessages) {
        toast.error(messages.error, { 
          id: toastId,
          description: error?.message,
        })
      } else {
        handleError(error, "An unexpected error occurred", { log: false });
      }
      return undefined
    } finally {
      if (isObjectMessages) {
        if (onFinally) onFinally()
      } else {
        loading.hide()
      }
    }
  }, [loading])

  return {
    executeWithLoading,
    showLoading: loading.show,
    hideLoading: loading.hide,
    updateLoading: loading.update,
    isLoading: loading.isLoading,
  }
} 