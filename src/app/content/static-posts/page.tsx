'use client'

import { Suspense } from 'react'
import { StaticPostsInner } from './_inner'

export default function StaticPostsPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <StaticPostsInner />
    </Suspense>
  )
}
