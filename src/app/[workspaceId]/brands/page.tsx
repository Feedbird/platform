'use client'

import { Suspense } from 'react'
import { BrandsInner } from './_inner'
import { DynamicTitle } from '@/components/layout/dynamic-title'

export default function EmailDesignPage() {
  return (
    <>
      <DynamicTitle />
      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <BrandsInner />
      </Suspense>
    </>
  )
}
