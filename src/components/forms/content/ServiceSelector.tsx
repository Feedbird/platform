"use client";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import React from "react";
import { ServicesMultiSelect } from "../ServicesMultiSelect";
import { Service } from "@/lib/supabase/client";
import { ModalMultiSelect } from "./ModalMultiSelect";
import { useFormStore } from "@/lib/store/forms-store";

type ServiceSelectorProps = {
  formServices: Service[];
};

export default function ServiceSelector({
  formServices,
}: ServiceSelectorProps) {
  const { services } = useFormStore();
  const [selectedServices, setSelectedServices] = React.useState<Service[]>(
    formServices || []
  );

  const handleServicesChange = (selectedIds: string[]) => {
    setSelectedServices(
      services.filter((service) => selectedIds.includes(service.id.toString()))
    );
  };

  return (
    <header className="flex flex-col gap-5 p-6 max-w-[900px] mx-auto">
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
            <ModalMultiSelect
              options={services}
              selectedValues={selectedServices.map((s) => s.id.toString())}
              onSelectionChange={handleServicesChange}
              className="w-full"
              placeholder="Select services..."
              maxDisplayTags={3}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col not-visited:gap-1">
        <h1 className="text-black font-semibold text-lg">Intake Form</h1>
        <p className="text-gray-500 text-sm">
          Clients get access to this form after buying your service. Their order
          will remain Pending until the form is filled out.
        </p>
      </div>
    </header>
  );
}
