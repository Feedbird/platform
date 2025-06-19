'use client'

import { Suspense } from 'react'
import { EmailDesignInner } from './_inner'

export default function EmailDesignPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <EmailDesignInner />
    </Suspense>
  )
}
