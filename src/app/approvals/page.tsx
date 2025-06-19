'use client'

import { Suspense } from 'react'
import { ApprovalsInner } from './_inner'

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <ApprovalsInner />
    </Suspense>
  )
}
