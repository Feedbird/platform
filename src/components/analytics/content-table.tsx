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
import { ChevronUp, ChevronDown, Video } from 'lucide-react'
import { TopPost } from './top-post-card'

function shortNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(2) + 'K'
  return n.toString()
}

interface ContentTableProps {
  data: TopPost[]
}

export function ContentTable({ data }: ContentTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<TopPost>[]>(() => {
    return [
      {
        id: 'post',
        header: '',
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex gap-2 items-center">
              <div className="relative w-12 h-12 flex-shrink-0">
                {p.video && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                )}
                <img
                  src={p.imgUrl}
                  alt="thumbnail"
                  className="w-12 h-12 object-cover rounded-sm"
                />
              </div>
              <div className="flex flex-col">
                <p className="line-clamp-1 text-sm font-medium">{p.caption}</p>
                <span className="text-xs text-gray-500">{p.date}</span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'impressions',
        header: 'Impress.',
        cell: (info) => shortNumber(info.getValue<number>()),
        enableSorting: true,
      },
      {
        accessorKey: 'engagement',
        header: 'Engmt.',
        cell: (info) => shortNumber(info.getValue<number>()),
        enableSorting: true,
      },
      {
        accessorKey: 'plays',
        header: 'Plays',
        cell: (info) => {
          const val = info.getValue<number>()
          return val ? shortNumber(val) : '--'
        },
        enableSorting: true,
      },
      {
        accessorKey: 'reacts',
        header: 'Reacts',
        cell: (info) => shortNumber(info.getValue<number>()),
        enableSorting: true,
      },
      {
        accessorKey: 'comments',
        header: 'Comments',
        cell: (info) => shortNumber(info.getValue<number>()),
        enableSorting: true,
      },
      {
        accessorKey: 'shares',
        header: 'Shares',
        cell: (info) => shortNumber(info.getValue<number>()),
        enableSorting: true,
      },
    ]
  }, [])

  const table = useReactTable<TopPost>({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="overflow-x-auto mt-4 bg-white rounded-lg">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const sortable = header.column.getCanSort()
                const sortDir = header.column.getIsSorted()
                return (
                  <th
                    key={header.id}
                    className="whitespace-nowrap py-2 font-medium text-left border-b border-gray-200 text-right"
                  >
                    {sortable ? (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="group inline-flex items-center gap-1"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortDir === 'asc' && (
                          <ChevronUp className="h-4 w-4 text-blue-600" />
                        )}
                        {sortDir === 'desc' && (
                          <ChevronDown className="h-4 w-4 text-blue-600" />
                        )}
                        {!sortDir && (
                          <ChevronDown className="h-4 w-4 opacity-0 group-hover:opacity-40 transition" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={`py-2 px-3 ${cell.column.id === 'post' ? '' : 'text-right'}`}>
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