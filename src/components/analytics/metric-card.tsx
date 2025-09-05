'use client'

import React, { useState } from 'react'
import { Info, ArrowUp, ArrowDown } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type Metric = 'followers' | 'reach' | 'impressions' | 'engagements' | 'views'

export interface MetricData {
  metric: Metric
  label: string
  icon: React.ReactElement
  value: number
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  }
  return num.toString()
}

interface MetricCardProps {
  data: MetricData
  diff: number
  active: boolean
  onClick(): void
}

export function MetricCard({ data, diff, active, onClick }: MetricCardProps) {
  const isPositive = diff >= 0
  const trendStr = diff + '%'
  const [hovered, setHovered] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        setInfoOpen(false)
      }}
      className={cn(
        'relative flex flex-col rounded-sm p-4 w-full min-w-[160px] transition-all duration-200 cursor-pointer bg-white gap-2',
        active ? 'ring-1 ring-main border-main' : 'hover:shadow border border-elementStroke'
      )}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-darkGrey font-normal">{data.label}</p>
          <div className="flex items-center gap-2">
            <p className="text-xl text-black font-semibold">{formatNumber(data.value)}</p>
            <div
              className={cn(
                'flex items-center text-xs font-medium rounded-[4px] px-1 transition-colors duration-200',
                isPositive ? 'bg-[#E7F8E1] text-[#247E00]' : 'bg-red-500/10 text-red-500'
              )}
            >
              {trendStr}
            </div>
          </div>
        </div>
        <div
          className="flex items-center justify-center bg-[#D7E9FF] rounded-full w-8 h-8"
        >
          {React.cloneElement(data.icon, {
            className: cn("w-3.5 h-3.5", (data.icon as any).props?.className)
          } as any)}
        </div>
      </div>

    </div>
  )
} 