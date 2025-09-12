import { Checkbox } from "@/components/ui/checkbox";
import {
  ComplexObjectType,
  FieldTypeEntitlements,
} from "@/lib/forms/field.config";
import Image from "next/image";
import React from "react";

type Props = {
  config: FieldTypeEntitlements;
};

function OptionCard({
  option,
  totalItems,
}: {
  option: ComplexObjectType & { image?: string };
  totalItems: number;
}) {
  const getWidthClass = () => {
    if (totalItems === 1) return "w-full";
    if (totalItems === 2) return "w-[calc(50%-0.375rem)]";
    if (totalItems === 3) return "w-[calc(33.333%-0.5rem)]";
    return "w-[calc(25%-0.5625rem)]";
  };

  return (
    <div
      className={`border-1 items-center bg-white border-[#D3D3D3] rounded-[6px] p-2 flex flex-row justify-between ${getWidthClass()}`}
    >
      {option.image && (
        <Image
          src={option.image}
          alt="option_image_card"
          className="aspect-square object-fill rounded-[6px]"
          width={72}
          height={72}
        />
      )}
      <span className="text-[#1C1D1F] font-normal text-sm">{option.value}</span>
      <Checkbox
        className="bg-white rounded-full size-5"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function OptionsPlaceholder({ config }: Props) {
  const options = React.useMemo(
    () =>
      config.optionItems?.optionValues?.length
        ? config.optionItems.optionValues
        : [],
    [config]
  );

  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <OptionCard key={opt.order} option={opt} totalItems={options.length} />
      ))}
    </div>
  );
}
