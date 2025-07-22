'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getPageName } from '@/lib/utils'

export function DynamicTitle() {
  const pathname = usePathname()

  useEffect(() => {
    const pageName = getPageName(pathname)
    document.title = `${pageName} | Feedbird`
  }, [pathname])

  return null
} 