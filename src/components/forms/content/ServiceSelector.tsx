"use client";
import React, { useEffect } from "react";
import { ModalMultiSelect } from "./ModalMultiSelect";
import { useFormStore } from "@/lib/store/forms-store";
import { useForms } from "@/contexts/FormsContext";

type ServiceSelectorProps = {
  formServices: { id: string; name: string }[];
};

export default function ServiceSelector({
  formServices,
}: ServiceSelectorProps) {
  const { services } = useFormStore();
  const { activeForm } = useForms();
  const [selectedServices, setSelectedServices] = React.useState<
    { id: string; name: string }[]
  >(formServices || []);

  const handleServicesChange = (selectedIds: string[]) => {
    setSelectedServices(
      services.filter((service) => selectedIds.includes(service.id.toString()))
    );
  };

  useEffect(() => {
    setSelectedServices(activeForm?.services || []);
  }, [activeForm]);

  return (
    <header className="flex flex-col gap-5 p-6 max-w-[900px] mx-auto">
      <div className="p-4 rounded-[5px] border-1 border-[#D3D3D3] flex flex-col gap-2.5">
        <div className="flex flex-col">
          <span className="text-black font-medium text-base">
            Select Service
          </span>
          <p className="text-[13px] text-[#5C5E63]">
            Clients get access to this form after buying your service. Their
            order will remain Pending until the form is filled out.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-black font-medium">
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
