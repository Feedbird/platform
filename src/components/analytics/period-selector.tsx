'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
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
    <div className="flex items-center gap-2 overflow-hidden">
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
                'py-1 text-sm font-medium rounded-sm transition-colors',
                period == 'Custom' 
                  ? value === period ? 'px-2 bg-main text-white' : 'px-2 border border-buttonStroke text-black' 
                  : value === period ? 'px-3 bg-main text-white' : 'px-3 bg-backgroundHover hover:bg-backgroundHover/60 text-black'
              )}
            >
              {period === 'Custom' ? (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{value === 'Custom' ? getDisplayText() : 'Custom'}</span>
                  <ChevronDown className="w-4 h-4" />
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
                    className="bg-main text-white hover:bg-main/90"
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