"use client";
import * as React from "react";
import Image                  from 'next/image'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { SortingState } from "@tanstack/react-table";
import { ColumnID, columnMeta } from "./ColumnMetadata";
import { cn } from "@/lib/utils";

interface SortMenuProps {
  sorting: SortingState;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  columnNames: Record<string, string>;
  columns: { id: string; getCanSort: () => boolean }[];
}

export function SortMenu({ sorting, setSorting, columnNames, columns }: SortMenuProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-[6px] px-2 py-[3px] rounded-xs hover:bg-[#F4F5F6] shadow-none cursor-pointer",
            sorting.length > 0 && "bg-[#FDE3E3]"
          )}
        >
          <Image src="/images/icons/table-toolbar-sort.svg" alt="Sort" width={12} height={12} />
          <span className="text-sm font-medium text-black leading-[16px]">
            {sorting.length === 1 
              ? `Sorted by ${columnMeta[sorting[0].id as ColumnID]?.label || sorting[0].id}`
              : sorting.length > 1 
                ? `Sorted by ${sorting.length} fields` 
                : "Sort"
            }
          </span>
          {/* {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} */}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2 w-[240px] flex flex-col" align="start">
        <DropdownMenuLabel className="text-sm">Sort By</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns
          .filter((c) => c.getCanSort())
          .map((col) => {
            const idx = sorting.findIndex((s) => s.id === col.id);
            const isActive = idx >= 0;
            let desc = false;
            if (isActive) {
              desc = sorting[idx].desc === true;
            }
            return (
              <div key={col.id} className="flex items-center justify-between gap-2 px-2 py-1">
                <Switch
                  checked={isActive}
                  onCheckedChange={(ch) => {
                    if (ch) {
                      setSorting((prev) => [...prev, { id: col.id, desc: false }]);
                    } else {
                      setSorting((prev) => prev.filter((s) => s.id !== col.id));
                    }
                  }}
                  className="bg-green-500 data-[state=checked]:bg-green-500"
                />
                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-2">
                    {columnMeta[col.id as ColumnID]?.icon}
                    {columnMeta[col.id as ColumnID]?.label || col.id}
                  </div>
                </div>
                {isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSorting((prev) => {
                        const newArr = [...prev];
                        newArr[idx] = { ...newArr[idx], desc: !desc };
                        return newArr;
                      });
                    }}
                    className="h-4 px-2 text-xs"
                  >
                    {desc ? (
                      <ChevronDown className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-blue-600" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        <DropdownMenuSeparator />
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" size="sm" onClick={() => setSorting([])}>
            Clear
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}