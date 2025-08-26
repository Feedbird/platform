'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { Platform } from '@/lib/social/platforms/platform-types'

export interface SocialAccount {
  id: string
  platform: Platform
  name: string
  handle: string
  totalFollowersGained: number
  impressions: number
  engagement: number
  followerGrowthPercent: number
  engagementRate: number
}

function shortNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function formatPercent(n: number): string {
  return n.toFixed(1) + '%'
}

interface SocialAccountsTableProps {
  data: SocialAccount[]
}

export function SocialAccountsTable({ data }: SocialAccountsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<SocialAccount>[]>(() => {
    return [
      {
        id: 'account',
        header: 'Account',
        cell: ({ row }) => {
          const account = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded bg-gray-100">
                <Image
                  src={`/images/platforms/${account.platform}.svg`}
                  alt={account.platform}
                  width={20}
                  height={20}
                />
              </div>
              <div>
                <div className="font-medium text-sm">{account.name}</div>
                <div className="text-xs text-gray-500">@{account.handle}</div>
              </div>
            </div>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'totalFollowersGained',
        header: 'Total Followers Gained',
        cell: (info) => (
          <div className="text-sm font-medium">
            +{shortNumber(info.getValue<number>())}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'impressions',
        header: 'Impressions',
        cell: (info) => (
          <div className="text-sm">
            {shortNumber(info.getValue<number>())}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'engagement',
        header: 'Engagement',
        cell: (info) => (
          <div className="text-sm">
            {shortNumber(info.getValue<number>())}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'followerGrowthPercent',
        header: 'Follower Growth %',
        cell: (info) => {
          const value = info.getValue<number>()
          const isPositive = value >= 0
          return (
            <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{formatPercent(value)}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'engagementRate',
        header: 'Engagement Rate',
        cell: (info) => (
          <div className="text-sm">
            {formatPercent(info.getValue<number>())}
          </div>
        ),
        enableSorting: true,
      },
    ]
  }, [])

  const table = useReactTable<SocialAccount>({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const sortable = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                return (
                  <th
                    key={header.id}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortable && (
                        <div className="flex flex-col">
                          <ChevronUp 
                            className={`h-3 w-3 ${sorted === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                          <ChevronDown 
                            className={`h-3 w-3 -mt-1 ${sorted === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                        </div>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 