import { MultiSelect } from "@/components/ui/multi-select";
import React from "react";

type Props = {
  values: { value: string; order: string }[];
};

export default function MultiSelectPlaceholder({ values }: Props) {
  const [selectedValues, setSelectedValues] = React.useState<string[]>([]);
  return (
    <MultiSelect
      selectedValues={selectedValues}
      onSelectionChange={setSelectedValues}
      placeholder="Select options"
      options={values.map((v) => ({
        id: v.order,
        name: v.value,
        value: v.value,
      }))}
    />
  );
}
