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
import { CalendarIcon, FolderOpen, Columns2, ChevronDown, ChevronUp, ListPlus, Film } from "lucide-react";
import { ColumnID, columnMeta } from "./ColumnMetadata";
import { cn } from "@/lib/utils";

const GROUP_OPTIONS = [
  {
    id: "status",
    label: "Status",
    icon: <FolderOpen className="mr-1 h-3 w-3" />,
  },
  {
    id: "month",
    label: "Month",
    icon: <CalendarIcon className="mr-1 h-3 w-3" />,
  },
  {
    id: "platforms",
    label: "Socials",
    icon: <ListPlus className="mr-1 h-3 w-3" />,
  },
  {
    id: "format",
    label: "Format",
    icon: <Film className="mr-1 h-3 w-3" />,
  },
] as const;

export function GroupMenu({
  grouping,
  setGrouping,
}: {
  grouping: string[];
  setGrouping: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-[6px] px-2 py-[3px] rounded-xs hover:bg-[#F4F5F6] shadow-none cursor-pointer",
            grouping.length > 0 && "bg-[#D7E9FF]"
          )}
        >
          <Image src="/images/icons/table-toolbar-group.svg" alt="Group" width={12} height={12} />
          <span className="text-sm font-medium text-black leading-[16px]">
            {grouping.length === 1 
              ? `Grouped by ${GROUP_OPTIONS.find(opt => opt.id === grouping[0])?.label || grouping[0]}`
              : grouping.length > 1 
                ? `Grouped by ${grouping.length} fields` 
                : "Group"
            }
          </span>
          {/* {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} */}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2 w-[240px] flex flex-col" align="start">
        <DropdownMenuLabel className="text-sm">Group By</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {GROUP_OPTIONS.map((option) => {
          const checked = grouping.includes(option.id);
          return (
            <div key={option.id} className="flex items-center justify-between gap-2 px-2 py-1">
              <Switch
                checked={checked}
                onCheckedChange={(val) => {
                  if (val) {
                    setGrouping((prev) => [...prev, option.id]);
                  } else {
                    setGrouping((prev) => prev.filter((g) => g !== option.id));
                  }
                }}
                className="bg-green-500 data-[state=checked]:bg-green-500"
              />
              <div className="flex-1 text-sm">
                <div className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </div>
              </div>
            </div>
          );
        })}
        <DropdownMenuSeparator />
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" size="sm" onClick={() => setGrouping([])}>
            Clear
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}