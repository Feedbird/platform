'use client'

import { Suspense } from 'react'
import { ApprovalsInner } from './_inner'
import { DynamicTitle } from '@/components/layout/dynamic-title'

export default function ApprovalsPage() {
  return (
    <>
      <DynamicTitle />
      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <ApprovalsInner />
      </Suspense>
    </>
  )
}
