import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";

function FormIcon({
  color,
  width = 14,
  height = 15,
  opacity = 1,
}: {
  color?: string;
  width?: number;
  height?: number;
  opacity?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 14 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, opacity }}
    >
      <circle cx="7" cy="7.14844" r="7" fill={color ?? "#E8E4E1"} />
      <circle cx="7.00158" cy="7.14855" r="3.21642" fill="white" />
    </svg>
  );
}

export default function EmptyFormPreview({
  iconColor,
  iconOpacity,
}: {
  iconColor?: string;
  iconOpacity?: number;
}) {
  return (
    <div className="rounded-[8px] bg-white w-full py-3.5 shadow-sm items-center pl-3 pr-5 gap-3 flex flex-row border-1 border-border-primary">
      <FormIcon
        color={iconColor}
        width={20}
        height={20}
        opacity={iconOpacity}
      />
      <div className="flex flex-col flex-1 gap-1.5">
        <div className="w-full h-2 bg-[#E8E4E1] rounded-full"></div>
        <div className="w-[40%] h-2 bg-[#E8E4E1]/70 rounded-full"></div>
      </div>
    </div>
  );
}
