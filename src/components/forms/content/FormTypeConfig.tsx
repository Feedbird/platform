import { UIFormFieldDefaults } from "@/lib/forms/fields";
import React from "react";
import FieldConfigWrapper from "./configs/CommonFieldConfig";
import Image from "next/image";
import { FieldTypeEntitlements } from "@/lib/forms/field.config";

type Props = {
  isVisible?: boolean;
  setVisible: React.Dispatch<
    React.SetStateAction<{ id: string; type: string; config: any } | null>
  >;
  fieldId: string;
  config: Partial<FieldTypeEntitlements>;
  updateFieldConfig: (fieldId: string, newConfig: any) => void;
};

export default function FormTypeConfig({
  isVisible = true,
  updateFieldConfig,
  fieldId,
  config,
  setVisible,
}: Props) {
  const updateConfig = (newConfig: any) => {
    if (fieldId) {
      updateFieldConfig(fieldId, newConfig);
    }
  };

  // Always render the container for smooth animations, but conditionally render content
  return (
    <div
      className={`absolute right-0 border-border-primary z-20 border-l-1 w-[320px] bg-[#FAFAFA] h-full flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out ${
        isVisible ? "transform translate-x-0" : "transform translate-x-full"
      }`}
    >
      {config && (
        <>
          <header className="border-border-primary border-b-1 w-full p-3 text-black font-medium flex gap-2">
            <Image
              src="/images/boards/arrow-left.svg"
              alt="back_icon"
              width={15}
              onClick={() => setVisible(null)}
              className="cursor-pointer"
              height={15}
            />
            <div className="flex flex-row gap-1">
              <span>Edit Field</span>
              <p className="text-[#838488] font-normal">
                ({Object.keys(config).length})
              </p>
            </div>
          </header>
          <div>
            <FieldConfigWrapper updateConfig={updateConfig} config={config} />
          </div>
        </>
      )}
    </div>
  );
}
