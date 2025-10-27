import { Checkbox } from "@/components/ui/checkbox";
import {
  ComplexObjectType,
  FieldTypeEntitlements,
} from "@/lib/forms/field.config";
import Image from "next/image";
import React from "react";

type MainProps = {
  config: FieldTypeEntitlements;
};

type OptionCardProps = {
  isSelected: boolean;
  handleSelection: (value: string) => void;
  option: ComplexObjectType & { image?: string };
  totalItems: number;
  isMultipleSelection?: boolean;
};

export function OptionCard({
  option,
  isSelected,
  handleSelection,
  totalItems,
  isMultipleSelection = false,
}: OptionCardProps) {
  const getWidthClass = () => {
    if (totalItems === 1) return "w-full";
    if (totalItems === 2) return "w-[calc(50%-0.375rem)]";
    if (totalItems === 3) return "w-[calc(33.333%-0.5rem)]";
    return "w-[calc(25%-0.5625rem)]";
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        handleSelection(option.value);
      }}
      className={`border-1 hover:cursor-pointer items-center ${
        isSelected
          ? "bg-[#EDF6FF] border-[#4670F9]"
          : "bg-white border-[#D3D3D3]"
      } rounded-[6px] p-2 flex flex-row justify-between ${getWidthClass()}`}
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
      <span className="text-black font-normal text-sm">{option.value}</span>
      <Checkbox
        checked={isSelected}
        className={`bg-white ${
          isMultipleSelection ? "rounded-[3px]" : "rounded-full"
        } size-5`}
      />
    </div>
  );
}

export default function OptionsPlaceholder({ config }: MainProps) {
  const [optionsChecked, setCheckedOptions] = React.useState<string[]>([]);

  const handleOptionsCheck = (value: string) => {
    if (config?.allowMultipleSelection?.value) {
      setCheckedOptions((prev) => {
        if (prev.includes(value)) {
          return prev.filter((v) => v !== value);
        }
        return [...prev, value];
      });
    } else {
      if (optionsChecked.includes(value)) {
        setCheckedOptions([]);
        return;
      }
      setCheckedOptions([value]);
    }
  };
  const options = React.useMemo(
    () =>
      config.optionItems?.optionValues?.length
        ? config.optionItems.optionValues
        : [],
    [config]
  );

  React.useEffect(() => {
    setCheckedOptions([]);
  }, [config.allowMultipleSelection?.value]);

  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <OptionCard
          isMultipleSelection={
            (config?.allowMultipleSelection?.value as boolean) || false
          }
          key={opt.order}
          option={opt}
          totalItems={options.length}
          handleSelection={handleOptionsCheck}
          isSelected={optionsChecked.includes(opt.value)}
        />
      ))}
    </div>
  );
}
