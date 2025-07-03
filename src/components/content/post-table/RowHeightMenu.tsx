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
import { Rows2, Rows3, Rows4, RectangleHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import ExpandIcon from "@mui/icons-material/Expand";
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // example from MUI (or use any other icon)
import ShortTextIcon from "@mui/icons-material/ShortText"; // example icon
import HeightIcon from "@mui/icons-material/Height"; // example icon
import { cn } from "@/lib/utils";
import { Maximize2 } from "lucide-react";

interface RowHeightMenuProps {
  rowHeight: number;
  setRowHeight: React.Dispatch<React.SetStateAction<number>>;
}

export function RowHeightMenu({ rowHeight, setRowHeight }: RowHeightMenuProps) {
  // Control whether the dropdown is open or closed
  const [open, setOpen] = React.useState(false);

  // We can define each label + icon
  const possibleHeights = [
    { value: 40, label: "Short", icon: <Rows4 className="h-3 w-3 text-[#838488]" /> },
    { value: 48, label: "Medium", icon: <Rows3 className="h-3 w-3 text-[#838488]" /> },
    { value: 72, label: "Tall", icon: <Rows2 className="h-3 w-3 text-[#838488]" /> },
    { value: 120, label: "Extra Tall", icon: <RectangleHorizontal className="h-3 w-3 text-[#838488]" /> },
    // { value: 160, label: "XX-Large", icon: <Maximize2 className="h-3 w-3" /> },
  ];

  // Find the current selected height option
  const currentHeight = possibleHeights.find(item => item.value === rowHeight) || possibleHeights[1];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-[6px] px-[8px] py-[2px] rounded-[100px] border border-[#D3D3D3] shadow-none cursor-pointer",
          )}
        >
          {currentHeight.icon}
          <span className="text-sm font-medium text-black">Row Height</span>
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
              {/* Left icon */}
              {item.icon}
              <span>{item.label}</span>
            </div>
            {/* Right icon to show current selection */}
            {rowHeight === item.value && (
              <CheckCircleIcon fontSize="small" sx={{ color: "#00c951" }} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
