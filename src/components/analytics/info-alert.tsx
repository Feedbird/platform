'use client'

import { useState } from 'react'
import { Info, X as XIcon } from 'lucide-react'

export function InfoAlert() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="flex justify-between items-center rounded-md bg-blue-400/10 border border-blue-200 py-4 px-6 text-sm text-blue-900">
      <p className="flex items-center font-medium text-muted-foreground gap-2">
        <Info className="w-5 h-5 text-blue-500" /> Due to API limitations,{' '}
        <em>Audience analytics are not available for Facebook Pages.</em>
        <a
          href="https://developers.facebook.com/blog/post/2023/12/14/page-insights-metrics-deprecation"
          target="_blank"
          rel="noreferrer"
          className="ml-1 text-blue-500"
        >
          Learn more
        </a>
      </p>
      <button
        onClick={() => setVisible(false)}
        className="text-blue-900 hover:text-blue-700 cursor-pointer"
      >
        <XIcon className="w-5 h-5 text-muted-foreground" />
      </button>
    </div>
  )
} 