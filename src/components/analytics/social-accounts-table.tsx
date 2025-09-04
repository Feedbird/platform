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

// Legacy interface for backward compatibility - will be removed
export interface SocialPageDisplay {
  id: string
  platform: Platform
  name: string
  pageId: string
  connected: boolean
  status: string
  accountId: string
  followerCount?: number
  postCount?: number
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

interface SocialAccountsTableProps {
  data: SocialAccount[] | SocialPageDisplay[]
}

export function SocialAccountsTable({ data }: SocialAccountsTableProps) {

  const columns = useMemo<ColumnDef<SocialAccount | SocialPageDisplay>[]>(() => {
    return [
      {
        id: 'account',
        header: 'Account',
        cell: ({ row }) => {
          const item = row.original
          const isSocialAccount = 'handle' in item
          const displayName = item.name
          const statusText = isSocialAccount ? 'Connected' : (item as SocialPageDisplay).connected ? 'Active' : 'Disconnected'

          return (
            <div className="flex items-center gap-2.5">
              <Image
                src={`/images/platforms/${item.platform}.svg`}
                alt={item.platform}
                width={18}
                height={18}
              />
              <div className="flex flex-col gap-1">
                <div className="font-medium text-sm text-black">{displayName}</div>
                <div className="text-xs text-darkGrey font-normal">{statusText}</div>
              </div>
            </div>
          )
        },
      },
      {
        id: 'followers',
        header: 'Followers',
        cell: ({ row }) => {
          const item = row.original
          const followerCount = 'followerCount' in item ? item.followerCount : 0
          return (
            <div className="text-sm text-darkGrey text-right">
              {shortNumber(followerCount || 0)}
            </div>
          )
        },
      },
      {
        id: 'posts',
        header: 'Posts',
        cell: ({ row }) => {
          const item = row.original
          const postCount = 'postCount' in item ? item.postCount : ('totalFollowersGained' in item ? item.totalFollowersGained : 0)
          return (
            <div className="text-sm text-darkGrey text-right">
              {shortNumber(postCount || 0)}
            </div>
          )
        },
      },
      {
        accessorKey: 'impressions',
        header: 'Impressions',
        cell: (info) => (
          <div className="text-sm text-darkGrey text-right">
            {shortNumber(info.getValue<number>() || 0)}
          </div>
        ),
      },
      {
        accessorKey: 'engagement',
        header: 'Engagement',
        cell: (info) => (
          <div className="text-sm text-darkGrey text-right">
            {shortNumber(info.getValue<number>() || 0)}
          </div>
        ),
      },
      {
        accessorKey: 'followerGrowthPercent',
        header: 'Follower Growth %',
        cell: (info) => {
          const value = info.getValue<number>() || 0
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
            {formatPercent(info.getValue<number>() || 0)}
          </div>
        ),
      },
    ]
  }, [])

  const table = useReactTable<SocialAccount | SocialPageDisplay>({
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