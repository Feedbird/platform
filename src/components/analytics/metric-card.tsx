'use client'

import { useState } from 'react'
import { Info, ArrowUp, ArrowDown } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type Metric = 'followers' | 'posts' | 'impressions' | 'engagement' | 'views'

export interface MetricData {
  metric: Metric
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  value: number
  description: string
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
        active ? 'ring-2 ring-blue-400 border-blue-400 text-blue-500' : 'hover:shadow border border-gray-200'
      )}
    >
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 font-medium">{data.label}</p>
        <div className="flex relative w-4 h-4">
          <div
            className={cn(
              'absolute inset-0 transition-opacity duration-200',
              hovered ? 'opacity-0' : 'opacity-100'
            )}
          >
            <data.icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div
            className={cn(
              'absolute inset-0 transition-opacity duration-200',
              hovered ? 'opacity-100' : 'opacity-0'
            )}
          >
            <Popover open={infoOpen} onOpenChange={setInfoOpen}>
              <PopoverTrigger asChild>
                <div
                  onMouseEnter={() => setInfoOpen(true)}
                  onMouseLeave={() => setInfoOpen(false)}
                  className="hover:bg-black/10 rounded-full transition"
                >
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="p-4 w-56 text-sm">
                <p className="text-sm font-medium mb-2">{data.label}</p>
                <p className="text-xs text-muted-foreground">{data.description}</p>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <p className="text-xl font-semibold">{formatNumber(data.value)}</p>
        <div
          className={cn(
            'flex items-center text-xs font-medium rounded p-1 transition-colors duration-200',
            isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          )}
        >
          {isPositive ? (
            <ArrowUp className="h-3 w-3 mr-1" />
          ) : (
            <ArrowDown className="h-3 w-3 mr-1" />
          )}
          {trendStr}
        </div>
      </div>
    </div>
  )
} 