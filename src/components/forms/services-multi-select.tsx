"use client";
import React from "react";
import { MultiSelect } from "@/components/ui/multi-select";
import { useFormStore } from "@/lib/store";

interface ServicesMultiSelectProps {
  selectedServices: string[];
  onSelectionChange: (serviceIds: string[]) => void;
  className?: string;
  placeholder?: string;
}

export function ServicesMultiSelect({
  selectedServices,
  onSelectionChange,
  className = "",
  placeholder = "Select services...",
}: ServicesMultiSelectProps) {
  const { services } = useFormStore();
  const [loading, setLoading] = React.useState(false);
  const servicesOptions = React.useMemo(
    () =>
      services.map((service) => ({
        id: service.id.toString(),
        name: service.name,
        value: service.id.toString(),
      })),
    [services]
  );

  return (
    <MultiSelect
      options={servicesOptions}
      selectedValues={selectedServices}
      onSelectionChange={onSelectionChange}
      placeholder={placeholder}
      className={className}
      loading={loading}
      searchable={true}
      maxDisplayTags={2}
    />
  );
}
