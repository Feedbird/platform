'use client';
import React, { useEffect } from 'react';
import { ModalMultiSelect } from './modal-multi-select';
import { useFormStore } from '@/lib/store';
import { useForms } from '@/contexts/forms/forms-context';

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
    <header className="mx-auto flex max-w-[900px] flex-col gap-5 p-6">
      <div className="flex flex-col gap-2.5 rounded-[5px] border-1 border-[#D3D3D3] p-4">
        <div className="flex flex-col">
          <span className="text-base font-medium text-black">
            Select Service
          </span>
          <p className="text-[13px] text-[#5C5E63]">
            Clients get access to this form after buying your service. Their
            order will remain Pending until the form is filled out.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-medium text-black">
            Choose Services
          </span>
          <div className="flex w-full flex-row justify-between">
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
        <h1 className="text-lg font-semibold text-black">Intake Form</h1>
        <p className="text-sm text-gray-500">
          Clients get access to this form after buying your service. Their order
          will remain Pending until the form is filled out.
        </p>
      </div>
    </header>
  );
}
