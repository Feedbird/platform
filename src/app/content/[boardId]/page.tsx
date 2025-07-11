'use client'

import { Suspense } from 'react'
import { BoardInner } from './_inner'

export default function BoardPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <BoardInner />
    </Suspense>
  )
} 