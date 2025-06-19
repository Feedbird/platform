'use client'

import * as React from 'react'

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 h-full overflow-hidden">
      {children}
    </div>
  )
}
