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

interface RowHeightMenuProps {
  rowHeight: number;
  setRowHeight: React.Dispatch<React.SetStateAction<number>>;
}

export function RowHeightMenu({ rowHeight, setRowHeight }: RowHeightMenuProps) {
  // Control whether the dropdown is open or closed
  const [open, setOpen] = React.useState(false);

  // We can define each label + icon (using custom SVGs)
  const possibleHeights = [
    {
      value: 40,
      label: "Short",
      icon: (
        <Image
          src="/images/row-height/short.svg"
          alt="Short row height"
          width={12}
          height={12}
        />
      ),
    },
    {
      value: 48,
      label: "Medium",
      icon: (
        <Image
          src="/images/row-height/medium.svg"
          alt="Medium row height"
          width={12}
          height={12}
        />
      ),
    },
    {
      value: 72,
      label: "Tall",
      icon: (
        <Image
          src="/images/row-height/tall.svg"
          alt="Tall row height"
          width={12}
          height={12}
        />
      ),
    },
    {
      value: 120,
      label: "Extra Tall",
      icon: (
        <Image
          src="/images/row-height/extra-tall.svg"
          alt="Extra tall row height"
          width={12}
          height={12}
        />
      ),
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
