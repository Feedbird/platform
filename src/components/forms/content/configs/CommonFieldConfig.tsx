import { FieldTypeEntitlementNativeDefinition } from "@/lib/forms/field.config";
import React from "react";
import { configInputMapper } from "./ConfigMapper";
import { UIFormField } from "@/lib/forms/fields";
import { Button } from "@/components/ui/button";

type Props = {
  field: UIFormField;
};

export default function FieldConfigWrapper({ field }: Props) {
  const configElements = configInputMapper(field);

  return (
    <div className="p-4 flex flex-col gap-6">
      {configElements.map((Element, idx) => (
        <Element key={idx} />
      ))}
      <Button
        variant="default"
        className="w-full hover:cursor-pointer shadow-lg bg-[#4670F9] text-white text-sm rounded-sm"
      >
        Save
      </Button>
    </div>
  );
}
