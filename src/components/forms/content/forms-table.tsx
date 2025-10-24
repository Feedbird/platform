'use client';
import FormsFiltersPopover, {
  ColumnMeta,
  ConditionGroup,
} from './FormsFiltersPopover';
import {
  useReactTable,
  Table as ReactTableType,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { ColumnDef } from '@tanstack/table-core';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Clock4,
  FileInputIcon,
  FolderPen,
  LayersIcon,
  ListCheckIcon,
  ListPlus,
  TrendingUp,
} from 'lucide-react';
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, Service } from '@/lib/supabase/interfaces';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import EmptyFormsComponent from '../EmptyForms';
import { humanizeDate } from '@/lib/utils/transformers';
import { useForms } from '@/contexts/FormsContext';
import FormDeleteModal from './FormDeleteModal';
import FormSettingsModal from './FormSettingsModal';
import FormStatusBadge from './configs/FormStatusBadge';
import FormTableContextMenu from './FormTableContextMenu';
import FormSearchPopover from './FormSearchPopover';

export interface TableForm extends Form {
  submissions_count?: number;
  fields_count?: number;
  services: Service[];
}

export type FormsTableProps = {
  forms: TableForm[];
};

export default function FormsTable({ forms }: FormsTableProps) {
  // Hooks
  const router = useRouter();
  const { selectFormForEditing } = useForms();

  // States
  const [tabledData, setTableData] = React.useState<TableForm[]>(forms);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [filterTree, setFilterTree] = React.useState<ConditionGroup>({
    id: 'root',
    andOr: 'AND',
    children: [],
  });
  const [columnOrder, setColumnOrder] = React.useState<string[]>([
    'placeholder',
    'rowIndex',
    'name',
    'type',
    'submissions',
    'status',
    'lastUpdated',
    'actions',
  ]);
  const [columnNames, setColumnNames] = React.useState<Record<string, string>>({
    name: 'Name',
  });
  const [localActiveForm, setLocalActiveForm] =
    React.useState<TableForm | null>(null);

  const hasActiveFilters = React.useMemo(() => {
    // Check if any condition has selected values
    return filterTree.children.some(
      (condition) =>
        condition.selectedValues && condition.selectedValues.length > 0
    );
  }, [filterTree]);

  const originalData = React.useMemo(() => forms, [forms]);

  const handleEditClick = (form: TableForm) => {
    selectFormForEditing(form);
    router.push(`forms/${form.id}`);
  };

  const baseColumns: ColumnDef<TableForm>[] = React.useMemo(() => {
    return [
      {
        id: 'placeholder',
        header: () => <div className="w-8" />,
        size: 10,
        minSize: 10,
        enableHiding: false,
        enableSorting: false,
        enableResizing: false,
        cell: () => null,
      },
      {
        id: 'rowIndex',
        header: () => <Checkbox checked={false} />,
        size: 30,
        maxSize: 32,
        minSize: 30,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,

        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <span className="text-xs font-extralight text-[#5C5E63]">
              {row.index + 1}
            </span>
          </div>
        ),
      },
      {
        id: 'name',
        accessorKey: 'formName',
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.title?.toLowerCase() || '';
          const b = rowB.original.title?.toLowerCase() || '';
          return a.localeCompare(b);
        },
        header: () => (
          <div className="flex items-center gap-1 text-sm font-medium text-black">
            <FolderPen color="#5C5E63" width={16} height={16} />
            <p>Name</p>
          </div>
        ),
        minSize: 275,
        // size: 350,
        cell: ({ row }) => (
          <div className="group flex items-center py-1">
            {/* <span className="text-lg">{row.original.icon}</span> */}
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-black">
                {row.original.title}
              </span>
              <span className="text-xs font-normal text-[#838488]">
                {(row.original as any).fields_count || 0} Questions
              </span>
            </div>
            <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                onClick={() => handleEditClick(row.original)}
                className="rounded-[5px] bg-[#4670F9] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:cursor-pointer hover:bg-blue-700"
              >
                Edit
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`forms/${row.original.id}/preview`);
                }}
                className="rounded-[5px] border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:cursor-pointer hover:bg-gray-50"
              >
                Preview
              </Button>
            </div>
          </div>
        ),
      },
      {
        id: 'type',
        accessorKey: 'service',
        header: () => (
          <div className="flex items-center gap-1 text-sm font-medium text-black">
            <LayersIcon size={16} color="#5C5E63" />
            Service
          </div>
        ),
        minSize: 120,
        size: 150,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-row flex-wrap gap-1 text-sm font-medium text-black">
            {row.original.services.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-1 rounded-full bg-[#D2E2FF] px-2 text-black"
              >
                <TrendingUp size={14} color="black" />
                {s.name}
              </div>
            ))}
          </div>
        ),
      },
      {
        id: 'submissions',
        accessorKey: 'submissionsCount',
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.submissions_count || 0;
          const b = rowB.original.submissions_count || 0;
          return a - b;
        },
        header: () => (
          <div className="flex items-center gap-[6px] text-sm font-medium text-black">
            <FileInputIcon size={16} color="#5C5E63" />
            Submissions
          </div>
        ),
        minSize: 70,
        size: 110,
        cell: ({ row }) => (
          <span className="text-xs font-medium text-black">
            {row.original.submissions_count || 0}
          </span>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: () => (
          <div className="flex items-center gap-[6px] text-sm font-medium text-black">
            <ListCheckIcon size={16} color="#5C5E63" />
            Status
          </div>
        ),
        size: 85,
        minSize: 95,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FormStatusBadge status={row.original.status} />
          </div>
        ),
      },
      {
        id: 'lastUpdated',
        accessorKey: 'lastEditedAt',
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const a = new Date(rowA.original.updated_at);
          const b = new Date(rowB.original.updated_at);
          return a.getTime() - b.getTime();
        },
        header: () => (
          <div className="flex items-center gap-[6px] text-sm font-medium text-black">
            <Clock4 color="#5C5E63" width={16} height={16} />
            Last updated
          </div>
        ),
        size: 100,
        cell: ({ row }) => (
          <span className="text-sm text-gray-500">
            {humanizeDate(row.original.updated_at)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="w-8" />,
        size: 25,
        minSize: 25,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        cell: ({ row }) => (
          <FormTableContextMenu
            setTableData={setTableData}
            setLocalActiveForm={setLocalActiveForm}
            setSettingsModalOpen={setSettingsModalOpen}
            setDeleteModalOpen={setDeleteModalOpen}
            tabledData={tabledData}
            row={row}
          />
        ),
      },
    ];
  }, []);

  const filterableColumns = React.useMemo(() => {
    const ALLOWED_FILTER_COLUMNS = new Set([
      'name',
      'submissions',
      'lastEdited',
    ]);

    const iconMap: Record<string, React.JSX.Element> = {
      name: <ListPlus className="mr-1 h-3 w-3" />,
    };

    return baseColumns
      .filter((col) => ALLOWED_FILTER_COLUMNS.has(col.id!))
      .map((col) => ({
        id: col.id,
        label: columnNames[col.id!] || col.id,
        icon: iconMap[col.id!] || undefined,
      }));
  }, [columnNames]);

  const table = useReactTable<TableForm>({
    data: tabledData,
    columns: baseColumns,
    state: {
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    debugTable: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10, // Default page size
      },
    },
  });

  function stickyStyles(
    colId: string,
    zIndex = 10
  ): React.CSSProperties | undefined {
    const styles: React.CSSProperties = {
      position: 'sticky',
      zIndex,
    };

    // Smooth shadow transition
    if (colId === 'name') {
      // Base transition; actual box-shadow handled by CSS when
      // the scroll container has `.scrolling-horiz` class.
      styles.transition = 'box-shadow 0.2s ease-in-out';
    }

    return styles;
  }

  function RenderHeader({
    table,
    stickyStyles,
  }: {
    table: ReactTableType<TableForm>;
    stickyStyles: (id: string, z?: number) => React.CSSProperties | undefined;
  }) {
    return (
      <TableHeader className="sticky top-0 z-[13] bg-[#EAE9E9] text-black">
        {table.getHeaderGroups().map((hg) => (
          <TableRow
            key={hg.id}
            className="border-b border-gray-200 bg-[#FBFBFB]"
          >
            {hg.headers.map((h, index) =>
              h.isPlaceholder ? null : (
                <TableHead
                  key={h.id}
                  className={cn(
                    'relative h-8 border-r border-b border-gray-200 px-2 py-2 text-left'
                  )}
                  style={{ width: h.getSize(), ...stickyStyles(h.id, 10) }}
                >
                  {(() => {
                    const canDrag = h.id !== 'rowIndex' && h.id !== 'drag';
                    const sortStatus = h.column.getIsSorted();
                    const headerContent = flexRender(
                      h.column.columnDef.header,
                      h.getContext()
                    );

                    return (
                      <>
                        <div
                          className="flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                          onClick={(e) => {
                            if (h.column.getCanSort() && e.detail === 1) {
                              const handler =
                                h.column.getToggleSortingHandler();
                              if (typeof handler === 'function') handler(e);
                            }
                          }}
                          draggable={canDrag}
                          onDragStart={(e) => {
                            if (!canDrag) return;
                            e.dataTransfer.setData('text/plain', h.id);
                          }}
                          onDragOver={(e) => {
                            if (!canDrag) return;
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            if (!canDrag) return;
                            const fromId = e.dataTransfer.getData('text/plain');
                            if (!fromId) return;
                            setColumnOrder((prev) => {
                              const newOrder = [...prev];
                              const fromIndex = newOrder.indexOf(fromId);
                              const toIndex = newOrder.indexOf(h.id);
                              if (fromIndex < 0 || toIndex < 0) return prev;
                              newOrder.splice(
                                toIndex,
                                0,
                                newOrder.splice(fromIndex, 1)[0]
                              );
                              return newOrder;
                            });
                          }}
                        >
                          <div className="flex w-full items-center gap-1 text-black">
                            {headerContent}
                          </div>
                          {sortStatus === 'asc' && (
                            <ChevronUpIcon
                              size={16}
                              className="text-blue-600"
                            />
                          )}
                          {sortStatus === 'desc' && (
                            <ChevronDownIcon
                              size={16}
                              className="text-blue-600"
                            />
                          )}
                        </div>

                        {/* Resizer Handle */}
                        {h.column.getCanResize() && (
                          <div
                            onDoubleClick={() => h.column.resetSize()}
                            onMouseDown={h.getResizeHandler()}
                            onTouchStart={h.getResizeHandler()}
                            className="absolute top-0 -right-1 z-10 h-full w-2 cursor-col-resize"
                          />
                        )}
                      </>
                    );
                  })()}
                </TableHead>
              )
            )}
          </TableRow>
        ))}
      </TableHeader>
    );
  }
  return (
    <>
      <div className="flex items-center justify-between gap-2 bg-white p-2">
        <div className="flex items-center gap-2">
          <FormsFiltersPopover
            open={filterOpen}
            onOpenChange={setFilterOpen}
            columns={filterableColumns as ColumnMeta[]}
            rootGroup={filterTree}
            setRootGroup={setFilterTree}
            hasFilters={hasActiveFilters}
          />
          <FormSearchPopover
            setFormTableData={setTableData}
            originalData={originalData}
          />
        </div>
      </div>
      <div
        className={`bg-background border-elementStroke flex max-h-[calc(100vh-120px)] flex-col border-t-1`}
      >
        <div className="flex-1 overflow-auto">
          <table
            data-grouped="true"
            className="bg-background w-full table-fixed caption-bottom text-sm"
            style={{ borderCollapse: 'collapse' }}
          >
            <RenderHeader table={table} stickyStyles={stickyStyles} />
            <tbody>
              {table.getRowModel().rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  onClick={() => handleEditClick(row.original)}
                  className="group border-b border-gray-200 hover:cursor-pointer hover:bg-[#FBFBFB]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        'border-r border-gray-200 bg-white px-2 py-1.5 text-sm group-hover:bg-[#FBFBFB]'
                      )}
                      style={{
                        width: cell.column.getSize(),
                        ...stickyStyles(cell.column.id),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {tabledData.length > 0 && (
          <div className="flex flex-shrink-0 items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-xs font-semibold">
                Showing{' '}
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}{' '}
                to{' '}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}{' '}
                of {table.getFilteredRowModel().rows.length} results
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="rounded-sm px-2 py-1"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="rounded-sm px-2 py-1"
              >
                Previous
              </Button>

              <span className="text-xs font-medium text-black">
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="rounded-sm px-2 py-1"
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="rounded-sm px-2 py-1"
              >
                Last
              </Button>

              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="border-buttonStroke ml-2 rounded-sm border px-2 py-1 text-sm font-normal text-black"
              >
                {[10, 20, 30, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {tabledData.length === 0 && <EmptyFormsComponent />}

      <FormDeleteModal
        open={deleteModalOpen}
        onClose={setDeleteModalOpen}
        setForms={setTableData}
        formId={localActiveForm?.id || ''}
      />
      {localActiveForm && (
        <FormSettingsModal
          setForm={setLocalActiveForm}
          open={!!localActiveForm && settingsModalOpen}
          onClose={setSettingsModalOpen}
          form={localActiveForm!}
        />
      )}
    </>
  );
}
