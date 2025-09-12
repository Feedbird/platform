import React from "react";
import { Button } from "@/components/ui/button";
import {
  AllowMultipleSelectionInput,
  ColumnSelectInput,
  DescriptionInput,
  DropdownItemsInput,
  HelpTextInput,
  OptionSelectInput,
  PlaceholderInput,
  RequiredInput,
  RowsSelectInput,
  TitleInput,
} from "./Inputs";
import { FieldTypeEntitlements } from "@/lib/forms/field.config";

type Props = {
  config: FieldTypeEntitlements;
  updateConfig: (newConfig: any) => void;
  setVisible: (value: null) => void;
};

export default function FieldConfigWrapper({
  config,
  updateConfig,
  setVisible,
}: Props) {
  return (
    <div className="p-4 flex flex-col gap-6">
      {config.title && (
        <TitleInput fieldConfig={config} setFieldConfig={updateConfig} />
      )}
      {config.placeholder && (
        <PlaceholderInput fieldConfig={config} setFieldConfig={updateConfig} />
      )}
      {config.spreadsheetColumns && (
        <ColumnSelectInput fieldConfig={config} setFieldConfig={updateConfig} />
      )}
      {config.allowedRows && (
        <RowsSelectInput fieldConfig={config} setFieldConfig={updateConfig} />
      )}
      {config.description && (
        <DescriptionInput fieldConfig={config} setFieldConfig={updateConfig} />
      )}
      {config.helpText && (
        <HelpTextInput setFieldConfig={updateConfig} fieldConfig={config} />
      )}
      {config.dropdownItems && (
        <DropdownItemsInput
          fieldConfig={config}
          setFieldConfig={updateConfig}
        />
      )}
      {config.optionItems && (
        <OptionSelectInput fieldConfig={config} setFieldConfig={updateConfig} />
      )}
      {config.isRequired && (
        <RequiredInput fieldConfig={config} setFieldConfig={updateConfig} />
      )}
      {config.allowMultipleSelection && (
        <AllowMultipleSelectionInput
          fieldConfig={config}
          setFieldConfig={updateConfig}
        />
      )}
      <Button
        variant="default"
        onClick={() => {
          setVisible(null);
        }}
        className="w-full hover:cursor-pointer shadow-lg bg-[#4670F9] text-white text-sm rounded-sm"
      >
        Save
      </Button>
    </div>
  );
}
