"use client";
import {
  ColumnMeta,
  ConditionGroup,
} from "@/components/content/post-table/FilterPopover";
import {
  useReactTable,
  Table as ReactTableType,
  flexRender,
  getCoreRowModel,
} from "@tanstack/react-table";
import { ColumnDef } from "@tanstack/table-core";
import { ChevronDownIcon, ChevronUpIcon, ListPlus } from "lucide-react";
import React from "react";
import FormsFiltersPopover from "./FormsFiltersPopover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Form, Service } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import EmptyFormsComponent from "../EmptyForms";
import { humanizeDate } from "@/lib/utils/transformers";
import { useForms } from "@/contexts/FormsContext";
import FormDeleteModal from "./FormDeleteModal";
import FormSettingsModal from "./FormSettingsModal";
import FormStatusBadge from "./configs/FormStatusBadge";
import { PopoverPortal } from "@radix-ui/react-popover";

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
    id: "root",
    andOr: "AND",
    children: [],
  });
  const [columnOrder, setColumnOrder] = React.useState<string[]>([
    "placeholder",
    "rowIndex",
    "name",
    "type",
    "submissions",
    "status",
    "lastUpdated",
    "actions",
  ]);
  const [columnNames, setColumnNames] = React.useState<Record<string, string>>({
    name: "Name",
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

  const handleEditClick = (form: TableForm) => {
    selectFormForEditing(form);
    router.push(`/forms/${form.id}`);
  };

  const baseColumns: ColumnDef<TableForm>[] = React.useMemo(() => {
    return [
      {
        id: "placeholder",
        header: () => <div className="w-8" />,
        size: 10,
        minSize: 10,
        enableHiding: false,
        enableSorting: false,
        enableResizing: false,
        cell: () => null,
      },
      {
        id: "rowIndex",
        header: () => <Checkbox checked={false} />,
        size: 30,
        maxSize: 32,
        minSize: 30,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,

        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <span className="text-xs text-[#5C5E63] font-extralight">
              {row.index + 1}
            </span>
          </div>
        ),
      },
      {
        id: "name",
        accessorKey: "formName",
        header: () => (
          <div className="flex items-center text-[#1C1D1F] text-sm font-medium">
            Name
          </div>
        ),
        minSize: 275,
        // size: 350,
        cell: ({ row }) => (
          <div className="group flex items-center py-1">
            {/* <span className="text-lg">{row.original.icon}</span> */}
            <div className="flex flex-col flex-1 gap-0.5">
              <span className="text-sm font-medium text-[#4670F9]">
                {row.original.title}
              </span>
              <span className="text-xs text-[#838488] font-normal">
                {(row.original as any).fields_count || 0} Questions
              </span>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                onClick={() => handleEditClick(row.original)}
                className="px-3 py-1.5 bg-[#4670F9] text-white text-sm font-medium hover:bg-blue-700 rounded-[5px] transition-colors hover:cursor-pointer"
              >
                Edit
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/forms/${row.original.id}/preview`);
                }}
                className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-[5px] hover:bg-gray-50 transition-colors hover:cursor-pointer"
              >
                Preview
              </Button>
            </div>
          </div>
        ),
      },
      {
        id: "type",
        accessorKey: "services",
        header: () => (
          <div className="flex items-center text-[#1C1D1F] text-sm font-medium">
            Services
          </div>
        ),
        minSize: 120,
        size: 150,
        cell: ({ row }) => (
          <div className="text-sm flex flex-row flex-wrap font-medium text-[#1C1D1F] gap-1">
            {row.original.services.map((s) => (
              <div
                key={s.id}
                className="border-1 rounded-[5px] border-[#D3D3D3] px-1.5"
              >
                {s.name}
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "submissions",
        accessorKey: "submissionsCount",
        header: () => (
          <div className="flex items-center gap-[6px] text-[#1C1D1F] text-sm font-medium">
            Submissions
          </div>
        ),
        minSize: 70,
        size: 110,
        cell: ({ row }) => (
          <span className="text-xs font-medium text-[#1C1D1F]">
            {row.original.submissions_count || 0}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: () => (
          <div className="flex items-center gap-[6px] text-[#1C1D1F] text-sm font-medium">
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
        id: "lastUpdated",
        accessorKey: "lastEditedAt",
        header: () => (
          <div className="flex items-center gap-[6px] text-[#1C1D1F] text-sm font-medium">
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
        id: "actions",
        header: () => <div className="w-8" />,
        size: 25,
        minSize: 25,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Popover>
              <PopoverTrigger
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalActiveForm(
                    tabledData.find((f) => f.id === row.original.id) ??
                      tabledData[0]
                  );
                }}
                className="hover:bg-gray-100 rounded transition-colors hover:cursor-pointer min-w-4"
              >
                <Image
                  src="/images/forms/actions.svg"
                  alt="actions_icon"
                  width={16}
                  height={16}
                />
              </PopoverTrigger>
              <PopoverPortal>
                <PopoverContent
                  // onClick={() => isDropdownOpen(false)}
                  className="mr-6 rounded-sm border-1 border-border-primary p-2 flex flex-col font-medium text-sm text-[#1C1D1F] gap-0.5 max-w-[130px]"
                >
                  <button className="flex flex-row w-full gap-2 p-1 hover:bg-gray-100 rounded-xs transition-colors hover:cursor-pointer active:bg-white">
                    <Image
                      src="/images/forms/write.svg"
                      alt="write_icon"
                      width={14}
                      height={14}
                    />
                    <span>Rename</span>
                  </button>
                  <button
                    className="flex flex-row w-full gap-2 p-1 hover:bg-gray-100 rounded-xs transition-colors hover:cursor-pointer active:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSettingsModalOpen(true);
                    }}
                  >
                    <Image
                      src="/images/boards/settings.svg"
                      alt="settings_icon"
                      width={14}
                      height={14}
                    />
                    <span>Settings</span>
                  </button>
                  <button className="flex flex-row w-full gap-2 p-1 hover:bg-gray-100 rounded-xs transition-colors hover:cursor-pointer active:bg-white">
                    <Image
                      src="/images/boards/duplicate.svg"
                      alt="duplicate_icon"
                      width={14}
                      height={14}
                    />
                    <span>Duplicate</span>
                  </button>
                  <button className="flex flex-row w-full gap-2 p-1 hover:bg-gray-100 rounded-xs transition-colors hover:cursor-pointer active:bg-white">
                    <Image
                      src="/images/boards/share.svg"
                      alt="share_icon"
                      width={14}
                      height={14}
                    />
                    <span>Share</span>
                  </button>
                  <button
                    className="flex flex-row w-full gap-2 p-1 hover:bg-gray-100 rounded-xs transition-colors hover:cursor-pointer active:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModalOpen(true);
                    }}
                  >
                    <Image
                      src="/images/boards/delete.svg"
                      alt="delete_icon"
                      width={14}
                      height={14}
                    />
                    <span>Delete</span>
                  </button>
                </PopoverContent>
              </PopoverPortal>
            </Popover>
          </div>
        ),
      },
    ];
  }, []);

  const filterableColumns = React.useMemo(() => {
    const ALLOWED_FILTER_COLUMNS = new Set([
      "name",
      "submissions",
      "lastEdited",
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
    columnResizeMode: "onChange",
    debugTable: true,
    getCoreRowModel: getCoreRowModel(),
  });

  function stickyStyles(
    colId: string,
    zIndex = 10
  ): React.CSSProperties | undefined {
    const styles: React.CSSProperties = {
      position: "sticky",
      zIndex,
    };

    // Smooth shadow transition
    if (colId === "name") {
      // Base transition; actual box-shadow handled by CSS when
      // the scroll container has `.scrolling-horiz` class.
      styles.transition = "box-shadow 0.2s ease-in-out";
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
      <TableHeader className="sticky top-0 z-[13] bg-[#EAE9E9] text-[#1C1D1F]">
        {table.getHeaderGroups().map((hg) => (
          <TableRow
            key={hg.id}
            className="bg-[#FBFBFB] border-b border-gray-200"
          >
            {hg.headers.map((h, index) =>
              h.isPlaceholder ? null : (
                <TableHead
                  key={h.id}
                  className={cn(
                    "relative text-left border-b border-r border-gray-200 px-2 py-2 h-8"
                  )}
                  style={{ width: h.getSize(), ...stickyStyles(h.id, 10) }}
                >
                  {(() => {
                    const canDrag = h.id !== "rowIndex" && h.id !== "drag";
                    const sortStatus = h.column.getIsSorted();
                    const headerContent = flexRender(
                      h.column.columnDef.header,
                      h.getContext()
                    );

                    return (
                      <>
                        <div
                          className="flex cursor-pointer select-none items-center justify-between gap-2 h-full"
                          onClick={(e) => {
                            if (h.column.getCanSort() && e.detail === 1) {
                              const handler =
                                h.column.getToggleSortingHandler();
                              if (typeof handler === "function") handler(e);
                            }
                          }}
                          draggable={canDrag}
                          onDragStart={(e) => {
                            if (!canDrag) return;
                            e.dataTransfer.setData("text/plain", h.id);
                          }}
                          onDragOver={(e) => {
                            if (!canDrag) return;
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            if (!canDrag) return;
                            const fromId = e.dataTransfer.getData("text/plain");
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
                          <div className="flex items-center gap-1 text-[#1C1D1F] w-full">
                            {headerContent}
                          </div>
                          {sortStatus === "asc" && (
                            <ChevronUpIcon
                              size={16}
                              className="text-blue-600"
                            />
                          )}
                          {sortStatus === "desc" && (
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
                            className="absolute top-0 h-full w-2 cursor-col-resize -right-1 z-10"
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
      <div className="flex items-center justify-between gap-2 p-2 bg-white">
        <div className="flex items-center gap-2">
          <FormsFiltersPopover
            open={filterOpen}
            onOpenChange={setFilterOpen}
            columns={filterableColumns as ColumnMeta[]}
            rootGroup={filterTree}
            setRootGroup={setFilterTree}
            hasFilters={hasActiveFilters}
          />
        </div>
      </div>
      <div
        className={`bg-background border-t-1 border-[#EAE9E9] overflow-auto max-h-full ${
          tabledData.length === 0 ? "" : "mb-12"
        }`}
      >
        <table
          data-grouped="true"
          className="
            w-full caption-bottom text-sm
            table-fixed bg-background
          "
          style={{ borderCollapse: "collapse" }}
        >
          <RenderHeader table={table} stickyStyles={stickyStyles} />
          <tbody>
            {table.getRowModel().rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                onClick={() => handleEditClick(row.original)}
                className="group hover:bg-[#FBFBFB] border-b border-gray-200 hover:cursor-pointer"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      "py-1.5 px-2 text-sm border-r border-gray-200 bg-white group-hover:bg-[#FBFBFB]"
                    )}
                    style={{
                      width: cell.column.getSize(),
                      ...stickyStyles(cell.column.id),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tabledData.length === 0 && <EmptyFormsComponent />}
      <FormDeleteModal
        open={deleteModalOpen}
        onClose={setDeleteModalOpen}
        setForms={setTableData}
        formId={localActiveForm?.id || ""}
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
