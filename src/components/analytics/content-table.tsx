'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, Video } from 'lucide-react'
import { TopPost } from './top-post-card'
import { FormatBadge } from '@/components/content/shared/content-post-ui'
import { format } from 'date-fns'

function shortNumber(n: number): string {
  if (typeof n !== 'number' || isNaN(n)) {
    return '0'
  }
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(2) + 'K'
  return n.toString()
}

interface ContentTableProps {
  data: TopPost[]
}

export function ContentTable({ data }: ContentTableProps) {
  const columns = useMemo<ColumnDef<TopPost>[]>(() => {
    return [
      {
        id: 'post',
        header: 'Post',
        cell: ({ row }) => {
          const p = row.original

          // Get first block for thumbnail
          const firstBlock = Array.isArray(p.blocks) && p.blocks.length > 0 ? p.blocks[0] : null
          const currentVer = firstBlock ? firstBlock.versions?.find((v) => v.id === firstBlock.currentVersionId) : null
          const isVideo = currentVer?.file?.kind === 'video'

          // Extract text from caption
          const captionText = typeof p.caption === 'string'
            ? p.caption
            : Array.isArray(p.caption)
              ? p.caption.map(block => block.text || '').join(' ')
              : p.caption?.text || 'No caption'

          // Format publish date
          const publishDate = p.publishDate ? format(new Date(p.publishDate), 'MMM d, yyyy') : 'Not published'

          return (
            <div className="flex gap-3 items-center max-w-[296px]">
              <div className="relative w-12 h-12 flex-shrink-0">
                {firstBlock && currentVer ? (
                  <>
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 rounded-sm">
                        <Video className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <img
                      src={currentVer.file.url}
                      alt="thumbnail"
                      className="w-12 h-12 object-cover rounded-sm"
                    />
                  </>
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-sm flex items-center justify-center">
                    <div className="text-xs text-gray-500">No image</div>
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <p className="max-w-[210px] truncate text-sm font-medium text-black">{captionText}</p>
                <span className="text-xs text-darkGrey">{publishDate}</span>
              </div>
            </div>
          )
        },
      },
      {
        id: 'format',
        header: 'Format',
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex justify-center">
              <FormatBadge kind={p.format} widthFull={false} />
            </div>
          )
        },
      },
      {
        accessorKey: 'analytics_impressions',
        header: 'Impressions',
        cell: (info) => (
          <div className="text-sm text-darkGrey text-right">
            {shortNumber(info.getValue<number>() || 0)}
          </div>
        ),
      },
      {
        accessorKey: 'analytics_engagement',
        header: 'Engagements',
        cell: (info) => (
          <div className="text-sm text-darkGrey text-right">
            {shortNumber(info.getValue<number>() || 0)}
          </div>
        ),
      },
      {
        id: 'plays',
        header: 'Plays',
        cell: ({ row }) => {
          const p = row.original
          // For videos, show impressions as plays, otherwise show dash
          const isVideo = p.format === 'video'
          const playsValue = isVideo ? p.analyticsImpressions || 0 : 0
          return (
            <div className="text-sm text-darkGrey text-right">
              {playsValue > 0 ? shortNumber(playsValue) : '--'}
            </div>
          )
        },
      },
      {
        accessorKey: 'analytics_reacts',
        header: 'Reacts',
        cell: (info) => (
          <div className="text-sm text-darkGrey text-right">
            {shortNumber(info.getValue<number>() || 0)}
          </div>
        ),
      },
      {
        accessorKey: 'analytics_comments',
        header: 'Comments',
        cell: (info) => (
          <div className="text-sm text-darkGrey text-right">
            {shortNumber(info.getValue<number>() || 0)}
          </div>
        ),
      },
      {
        accessorKey: 'analytics_shares',
        header: 'Shares',
        cell: (info) => (
          <div className="text-sm text-darkGrey text-right">
            {shortNumber(info.getValue<number>() || 0)}
          </div>
        ),
      },
    ]
  }, [])

  const table = useReactTable<TopPost>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-x-auto rounded-b-sm">
      <table className="w-full text-sm border-collapse table-fixed">
        <thead className="bg-[#FBFBFB]">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header, index) => {
                const isLastColumn = index === hg.headers.length - 1
                const isPostColumn = header.id === 'post'
                const isFormatColumn = header.id === 'format'
                return (
                  <th
                    key={header.id}
                    className={`px-3 py-2 text-xs font-medium text-darkGrey tracking-wider border-y ${!isLastColumn ? 'border-r border-elementStroke' : ''} ${isPostColumn || isFormatColumn ? 'text-left' : 'text-right'}`}
                    style={{
                      width: isPostColumn ? '296px' :
                             header.id === 'format' ? '100px' :
                             header.id === 'impressions' ? '100px' :
                             header.id === 'engagements' ? '100px' :
                             header.id === 'plays' ? '100px' :
                             header.id === 'reacts' ? '100px' :
                             header.id === 'comments' ? '100px' :
                             header.id === 'shares' ? '100px' : 'auto'
                    }}
                  >
                    <div className={`flex ${isPostColumn || isFormatColumn ? 'justify-start' : 'justify-end'}`}>
                      <span className={`${!isPostColumn && !isFormatColumn ? 'truncate text-xs' : ''}`}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
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
                const isPostCell = cell.column.id === 'post'
                const isFormatCell = cell.column.id === 'format'
                return (
                  <td
                    key={cell.id}
                    className={`px-3 py-3 whitespace-nowrap ${!isLastColumn ? 'border-r border-elementStroke' : ''}`}
                    style={{
                      width: isPostCell ? '296px' :
                             cell.column.id === 'format' ? '100px' :
                             cell.column.id === 'analytics_impressions' ? '100px' :
                             cell.column.id === 'analytics_engagement' ? '100px' :
                             cell.column.id === 'plays' ? '100px' :
                             cell.column.id === 'analytics_reacts' ? '100px' :
                             cell.column.id === 'analytics_comments' ? '100px' :
                             cell.column.id === 'analytics_shares' ? '100px' : 'auto'
                    }}
                  >
                    {isPostCell || isFormatCell ? (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    ) : (
                      <div className="text-right">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    )}
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