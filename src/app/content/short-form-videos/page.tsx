'use client'

import { Suspense } from 'react'
import { ShortVideosInner } from './_inner'

export default function ShortVideosPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <ShortVideosInner />
    </Suspense>
  )
}
