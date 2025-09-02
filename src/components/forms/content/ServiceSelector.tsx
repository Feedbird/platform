"use client";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import React from "react";
import { ServicesMultiSelect } from "../ServicesMultiSelect";
import { Button } from "@/components/ui/button";

export default function ServiceSelector() {
  const { activeWorkspaceId } = useFeedbirdStore();
  const [selectedServices, onSelectionChange] = React.useState<string[]>([]);
  return (
    <header className="flex flex-col gap-5">
      <div className="p-4 rounded-[5px] border-1 border-[#D3D3D3] flex flex-col gap-2.5">
        <div className="flex flex-col">
          <span className="text-[#1C1D1F] font-medium text-base">
            Select Service
          </span>
          <p className="text-[13px] text-[#5C5E63]">
            Clients get access to this form after buying your service. Their
            order will remain Pending until the form is filled out.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-[#1C1D1F] font-medium">
            Choose Services
          </span>
          <div className="flex flex-row justify-between w-full">
            <ServicesMultiSelect
              className="w-[60%]"
              workspaceId={activeWorkspaceId || ""}
              selectedServices={selectedServices}
              onSelectionChange={onSelectionChange}
            />
            <Button className="bg-[#4670F9] rounded-[6px] py-1.5 px-3 text-white text-[13px] flex flex-row hover:cursor-pointer">
              Save
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col not-visited:gap-1">
        <h1 className="text-black font-semibold">Intake Form</h1>
        <p className="text-gray-500 text-xs">
          Clients get access to this form after buying your service. Their order
          will remain Pending until the form is filled out.
        </p>
      </div>
    </header>
  );
}
