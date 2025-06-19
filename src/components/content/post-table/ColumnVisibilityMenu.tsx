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
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table } from "@tanstack/react-table";
import { ColumnID, columnMeta } from "./ColumnMetadata";
import { cn } from "@/lib/utils";

interface ColumnVisibilityMenuProps {
  table: Table<any>;
  hiddenCount: number;
  colVisOpen: boolean;
  setColVisOpen: React.Dispatch<React.SetStateAction<boolean>>;
  columnNames: Record<string, string>;
}

export function ColumnVisibilityMenu({
  table,
  hiddenCount,
  colVisOpen,
  setColVisOpen,
  columnNames,
}: ColumnVisibilityMenuProps) {
  const [open, setOpen] = React.useState(false);
  const hiddenColumns = Object.entries(columnNames).filter(([_, visible]) => !visible).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-[6px] px-[8px] py-[7px] rounded-[6px] border border-border-button shadow-none cursor-pointer",
          )}
        >
          <Image src="/images/icons/table-toolbar-columns.svg" alt="Columns" width={14} height={14} />
          <span className="text-sm font-semibold">{hiddenColumns > 0 ? `${hiddenColumns} columns hidden` : "Columns"}</span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2 w-[240px] max-h-72 overflow-y-auto" align="start">
        <DropdownMenuLabel className="text-sm">Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table.getAllLeafColumns().map((col) => {
          if (col.id === "drag" || col.id === "rowIndex") return null;
          const visible = col.getIsVisible();
          return (
            <div key={col.id} className="flex items-center justify-between gap-2 px-2 py-1">
              <Switch
                checked={visible}
                onCheckedChange={(val) => col.toggleVisibility(val)}
                className="bg-green-500 data-[state=checked]:bg-green-500"
              />
              <Label className="text-sm flex-1 truncate">
                <div className="flex items-center gap-2">
                  {columnMeta[col.id as ColumnID]?.icon}
                  {columnMeta[col.id as ColumnID]?.label || col.id}
                </div>
              </Label>
            </div>
          );
        })}
        <DropdownMenuSeparator />
        <div className="flex gap-2 justify-end pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              table.getAllLeafColumns().forEach((col) => {
                if (col.id === "drag" || col.id === "rowIndex") return;
                col.toggleVisibility(false);
              });
            }}
          >
            Hide all
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              table.getAllLeafColumns().forEach((col) => {
                col.toggleVisibility(true);
              });
            }}
          >
            Show all
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
