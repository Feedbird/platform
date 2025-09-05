'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export interface HistoricalStatsData {
  id: string
  publish_date: string
  followers_count: number
  followers_rate: number
  following_count: number
  media_count: number
  engagement_rate: number
  caption: string
  format: string
}

function shortNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function formatPercent(n: number): string {
  if (typeof n !== 'number' || isNaN(n)) {
    return '0.0%'
  }
  return n.toFixed(1) + '%'
}

interface HistoricalStatsTableProps {
  data: HistoricalStatsData[]
}

export function HistoricalStatsTable({ data }: HistoricalStatsTableProps) {
  const columns = useMemo<ColumnDef<HistoricalStatsData>[]>(() => {
    return [
      {
        id: 'post',
        header: 'Post',
        cell: ({ row }) => {
          const item = row.original
          const publishDate = item.publish_date ? format(new Date(item.publish_date), 'MMM d, yyyy') : 'Not published'

          return (
            <div className="flex flex-col gap-1">
              <div className="text-xs text-darkGrey">{publishDate}</div>
            </div>
          )
        },
      },
      {
        id: 'followers',
        header: 'Followers',
        cell: ({ row }) => {
          const item = row.original
          const isPositive = item.followers_rate >= 0
          return (
            <div className="flex justify-end gap-1">
              <div className="text-sm text-darkGrey">
                {shortNumber(item.followers_count)}
              </div>
              <div
                className={cn(
                  'flex items-center text-xs font-medium rounded-[4px] px-1 transition-colors duration-200',
                  isPositive ? 'bg-[#E7F8E1] text-[#247E00]' : 'bg-red-500/10 text-red-500'
                )}
              >
                {isPositive ? '+' : ''}{formatPercent(item.followers_rate)}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'following_count',
        header: 'Following Count',
        cell: (info) => (
          <div className="text-sm text-darkGrey text-right">
            {shortNumber(info.getValue<number>() || 0)}
          </div>
        ),
      },
      {
        accessorKey: 'media_count',
        header: 'Media Count',
        cell: (info) => (
          <div className="text-sm text-darkGrey text-right">
            {shortNumber(info.getValue<number>() || 0)}
          </div>
        ),
      },
      {
        accessorKey: 'engagement_rate',
        header: 'Engagement Rate',
        cell: (info) => (
          <div className="text-sm text-darkGrey text-right">
            {formatPercent(info.getValue<number>() || 0)}
          </div>
        ),
      },
    ]
  }, [])

  const table = useReactTable<HistoricalStatsData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-x-auto rounded-b-sm">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-[#FBFBFB]">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header, index) => {
                const isLastColumn = index === hg.headers.length - 1
                const isPostColumn = header.id === 'post'
                return (
                  <th
                    key={header.id}
                    className={`px-3 py-2 ${isPostColumn ? 'text-left' : 'text-right'} text-xs font-medium text-darkGrey tracking-wider border-y ${!isLastColumn ? 'border-r border-elementStroke' : ''}`}
                  >
                    <div className={`flex ${isPostColumn ? 'justify-start' : 'justify-end'}`}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-elementStroke">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell, index) => {
                const isLastColumn = index === row.getVisibleCells().length - 1
                return (
                  <td key={cell.id} className={`px-3 py-2 whitespace-nowrap ${!isLastColumn ? 'border-r border-elementStroke' : ''}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
