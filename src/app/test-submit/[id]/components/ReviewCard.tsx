import React from "react";

type Props = {
  index: number;
  title: string;
  value: string | string[];
};

export default function ReviewCard({ index, title, value }: Props) {
  return (
    <div className="p-4 border-1 border-[#EAE9E9] flex flex-row justify-between items-center rounded-[6px]">
      <div className="flex flex-row gap-5 w-[60%] items-center">
        <p className="text-[#838488] font-medium text-sm">{index}.</p>
        <p className="text-[#1C1D1F] text-sm font-medium">{title}</p>
      </div>
      <div className="gap-1 flex flex-row items-center w-[40%] justify-between">
        <div className="px-2">
          <p className="text-[#5C5E63] font-normal text-sm">
            {Array.isArray(value) ? value.join(", ") : value}
          </p>
        </div>
        <span className="text-[#4670F9] text-sm font-normal hover:cursor-pointer hover:underline">
          Edit
        </span>
      </div>
    </div>
  );
}
