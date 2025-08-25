'use client'

import { Suspense } from 'react'
import { BoardInner } from './_inner'
import { DynamicTitle } from '@/components/layout/dynamic-title'

export default function BoardPage() {
  return (
    <>
      <DynamicTitle />
      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <BoardInner />
      </Suspense>
    </>
  )
} 