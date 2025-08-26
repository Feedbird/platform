'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'

export type Period = '7D' | '1M' | '3M' | '1Y' | 'All-time' | 'Custom'

interface PeriodSelectorProps {
  value: Period
  onChange: (period: Period, customRange?: { from: Date; to: Date }) => void
  customRange?: { from: Date; to: Date }
}

export function PeriodSelector({ value, onChange, customRange }: PeriodSelectorProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({
    from: customRange?.from,
    to: customRange?.to,
  })

  const periods: Period[] = ['7D', '1M', '3M', '1Y', 'All-time', 'Custom']

  const handlePeriodClick = (period: Period) => {
    if (period === 'Custom') {
      setIsCustomOpen(true)
    } else {
      onChange(period)
    }
  }

  const handleCustomApply = () => {
    if (tempRange.from && tempRange.to) {
      onChange('Custom', { from: tempRange.from, to: tempRange.to })
      setIsCustomOpen(false)
    }
  }

  const getDisplayText = () => {
    if (value === 'Custom' && customRange) {
      return `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d')}`
    }
    return value
  }

  return (
    <div className="flex items-center gap-1 border border-gray-200 rounded-md overflow-hidden">
      {periods.map((period) => (
        <Popover
          key={period}
          open={period === 'Custom' ? isCustomOpen : false}
          onOpenChange={period === 'Custom' ? setIsCustomOpen : undefined}
        >
          <PopoverTrigger asChild>
            <button
              onClick={() => handlePeriodClick(period)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors',
                value === period
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50',
                period !== 'Custom' && 'border-r border-gray-200 last:border-r-0'
              )}
            >
              {period === 'Custom' ? (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{value === 'Custom' ? getDisplayText() : 'Custom'}</span>
                </div>
              ) : (
                period
              )}
            </button>
          </PopoverTrigger>
          {period === 'Custom' && (
            <PopoverContent className="p-4" align="end">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">From</label>
                  <CalendarComponent
                    mode="single"
                    selected={tempRange.from}
                    onSelect={(date) => setTempRange(prev => ({ ...prev, from: date }))}
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">To</label>
                  <CalendarComponent
                    mode="single"
                    selected={tempRange.to}
                    onSelect={(date) => setTempRange(prev => ({ ...prev, to: date }))}
                    className="rounded-md border"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsCustomOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleCustomApply}
                    disabled={!tempRange.from || !tempRange.to}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          )}
        </Popover>
      ))}
    </div>
  )
} 