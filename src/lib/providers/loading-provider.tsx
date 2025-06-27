'use client'

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  type FC,
  Suspense,
} from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import type { Platform } from '@/lib/social/platforms/platform-types'

type LoadingCtx = { 
  show: (text?: string, platform?: Platform) => void; 
  hide: () => void;
  update: (text: string) => void;
  isLoading: boolean;
  loadingText?: string;
  platform?: Platform;
}

const LoadingContext = createContext<LoadingCtx>({} as LoadingCtx)

export const useLoading = () => useContext(LoadingContext)

/** Global loading spinner component */
function GlobalSpinner({ text, platform }: { text?: string; platform?: Platform }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm" 
         style={{ backgroundColor: 'rgba(28, 29, 31, 0.70)' }}>
      <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          {platform && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Image
                  src={`/images/platforms/${platform}.svg`}
                  alt={platform}
                  width={16}
                  height={16}
                />
              </div>
            </div>
          )}
        </div>
        {text && (
          <p className="text-sm text-gray-600 font-medium text-center">{text}</p>
        )}
      </div>
    </div>
  )
}

/** Navigation watcher component that uses useSearchParams */
function NavigationWatcher() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const loading = useContext(LoadingContext)

  // Hide loading when navigation completes
  useEffect(() => {
    loading.hide()
  }, [pathname, searchParams, loading])

  return null
}

/** Put this just inside <body> in app/layout.tsx */
export const LoadingProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState<string | undefined>()
  const [platform, setPlatform] = useState<Platform | undefined>()

  // Auto-hide loading after 10 seconds as a safety net
  useEffect(() => {
    if (!isLoading) return

    const timeout = setTimeout(() => {
      console.warn('Loading spinner auto-hidden after 10 seconds')
      setIsLoading(false)
      setLoadingText(undefined)
      setPlatform(undefined)
    }, 10000)

    return () => clearTimeout(timeout)
  }, [isLoading])

  // Handle page visibility change to reset loading state
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoading) {
        // Reset loading state when page becomes visible again
        setIsLoading(false)
        setLoadingText(undefined)
        setPlatform(undefined)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isLoading])

  const show = useCallback((text?: string, platform?: Platform) => {
    setIsLoading(true)
    setLoadingText(text)
    setPlatform(platform)
  }, [])

  const update = useCallback((text: string) => {
    if (isLoading) {
      setLoadingText(text);
    }
  }, [isLoading]);

  const hide = useCallback(() => {
    setIsLoading(false)
    setLoadingText(undefined)
    setPlatform(undefined)
  }, [])

  const value: LoadingCtx = {
    isLoading,
    loadingText,
    platform,
    show,
    hide,
    update,
  }

  return (
    <LoadingContext.Provider value={value}>
      <Suspense fallback={null}>
        <NavigationWatcher />
      </Suspense>
      {children}
      {isLoading && createPortal(
        <GlobalSpinner text={loadingText} platform={platform} />,
        document.body
      )}
    </LoadingContext.Provider>
  )
}

// Note: This helper is deprecated. Use useAsyncLoading hook instead for better React integration.
// Enhanced helper function with better error handling - requires LoadingContext to be available
export function createWithLoadingHelper(loadingContext: LoadingCtx) {
  return async function withLoading<T>(
    operation: () => Promise<T>,
    loadingText?: string,
    platform?: Platform
  ): Promise<T> {
    try {
      loadingContext.show(loadingText, platform)
      const result = await operation()
      return result
    } catch (error) {
      console.error('Operation failed:', error)
      throw error
    } finally {
      loadingContext.hide()
    }
  }
}
