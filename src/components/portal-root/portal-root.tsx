'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function PortalRoot() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  return mounted
    ? createPortal(<div id="portal" />, document.body)
    : null
}