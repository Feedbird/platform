'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { Platform } from '@/lib/social/platforms/platform-types'
import { cn } from '@/lib/utils'

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

  const columns = useMemo<ColumnDef<SocialAccount>[]>(() => {
    return [
      {
        id: 'account',
        header: 'Account',
        cell: ({ row }) => {
          const account = row.original
          return (
            <div className="flex items-center gap-2.5">
              <Image
                src={`/images/platforms/${account.platform}.svg`}
                alt={account.platform}
                width={18}
                height={18}
              />
              <div className="flex flex-col gap-1">
                <div className="font-medium text-sm text-black">{account.name}</div>
                <div className="text-xs text-darkGrey font-normal">Connected</div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'totalFollowersGained',
        header: 'Total Followers Gained',
        cell: (info) => (
          <div className="text-sm font-medium text-darkGrey text-right">
            +{shortNumber(info.getValue<number>())}
          </div>
        ),
      },
      {
        accessorKey: 'impressions',
        header: 'Impressions',
        cell: (info) => (
          <div className="text-sm text-darkGrey text-right">
            {shortNumber(info.getValue<number>())}
          </div>
        ),
      },
      {
        accessorKey: 'engagement',
        header: 'Engagement',
        cell: (info) => (
          <div className="text-sm text-darkGrey text-right">
            {shortNumber(info.getValue<number>())}
          </div>
        ),
      },
      {
        accessorKey: 'followerGrowthPercent',
        header: 'Follower Growth %',
        cell: (info) => {
          const value = info.getValue<number>()
          const isPositive = value >= 0
          return (
            <div className="flex justify-end">
              <div
                className={cn(
                  'flex items-center text-xs font-medium rounded-[4px] px-1 transition-colors duration-200',
                  isPositive ? 'bg-[#E7F8E1] text-[#247E00]' : 'bg-red-500/10 text-red-500'
                )}
              >
                {isPositive ? '+' : ''}{formatPercent(value)}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'engagementRate',
        header: 'Engagement Rate',
        cell: (info) => (
          <div className="text-sm text-darkGrey text-right">
            {formatPercent(info.getValue<number>())}
          </div>
        ),
      },
    ]
  }, [])

  const table = useReactTable<SocialAccount>({
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
                const isAccountColumn = header.id === 'account'
                return (
                  <th
                    key={header.id}
                    className={`px-3 py-2 ${isAccountColumn ? 'text-left' : 'text-right'} text-xs font-medium text-darkGrey tracking-wider border-y ${!isLastColumn ? 'border-r border-strokeElement' : ''}`}
                  >
                    <div className={`flex ${isAccountColumn ? 'justify-start' : 'justify-end'}`}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-strokeElement">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell, index) => {
                const isLastColumn = index === row.getVisibleCells().length - 1
                return (
                  <td key={cell.id} className={`px-3 py-2 whitespace-nowrap ${!isLastColumn ? 'border-r border-strokeElement' : ''}`}>
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