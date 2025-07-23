"use client";

import * as React from "react";
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { cn } from "@/lib/utils";
import { Rows4, Rows3, Rows2, RectangleHorizontal, Maximize2 } from "lucide-react";
import { ROW_HEIGHT_CONFIG, RowHeightType } from "@/lib/utils";

interface RowHeightMenuProps {
  rowHeight: RowHeightType;
  setRowHeight: React.Dispatch<React.SetStateAction<RowHeightType>>;
}

export function RowHeightMenu({ rowHeight, setRowHeight }: RowHeightMenuProps) {
  // Control whether the dropdown is open or closed
  const [open, setOpen] = React.useState(false);

  // We can define each label + icon (using custom SVGs)
  const possibleHeights = [
    {
      value: "Small" as RowHeightType,
      label: "Small",
      icon: <Rows4 fontSize="small" width={12} height={12} />,
    },
    {
      value: "Medium" as RowHeightType,
      label: "Medium",
      icon: <Rows3 fontSize="small" width={12} height={12} />,
    },
    {
      value: "Large" as RowHeightType,
      label: "Large",
      icon: <Rows2 fontSize="small" width={12} height={12} />,
    },
    {
      value: "X-Large" as RowHeightType,
      label: "X-Large",
      icon: <RectangleHorizontal fontSize="small" width={12} height={12} />,
    },
    {
      value: "XX-Large" as RowHeightType,
      label: "XX-Large",
      icon: <Maximize2 fontSize="small" width={12} height={12} />,
    },
  ];

  // Find the current selected height option
  const currentHeight = possibleHeights.find(item => item.value === rowHeight) || possibleHeights[1];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-[6px] px-[8px] py-[4px] rounded-[100px] border border-[#D3D3D3] shadow-none cursor-pointer",
          )}
        >
          {currentHeight.icon}
          <span className="text-sm font-medium text-black leading-[16px]">{currentHeight.label}</span>
          {/* {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} */}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2 w-[240px] flex flex-col" align="start">
        <DropdownMenuLabel>Row Height</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {possibleHeights.map((item) => (
          <DropdownMenuItem
            key={item.value}
            // override the default close behavior
            // by preventing the event's default
            onSelect={(event) => {
              event.preventDefault(); // prevents auto-close
              setRowHeight(item.value);
            }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {rowHeight === item.value && (
              <CheckCircleIcon fontSize="small" sx={{ color: "#00c951" }} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
