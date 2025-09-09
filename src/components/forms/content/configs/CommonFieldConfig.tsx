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
};

export default function FieldConfigWrapper({ config, updateConfig }: Props) {
  const [fieldConfig, setFieldConfig] = React.useState(config);

  React.useEffect(() => {
    setFieldConfig(config);
  }, [config]);

  return (
    <div className="p-4 flex flex-col gap-6">
      {fieldConfig.title && (
        <TitleInput fieldConfig={fieldConfig} setFieldConfig={setFieldConfig} />
      )}
      {fieldConfig.placeholder && (
        <PlaceholderInput
          fieldConfig={fieldConfig}
          setFieldConfig={setFieldConfig}
        />
      )}
      {fieldConfig.spreadsheetColumns && (
        <ColumnSelectInput
          fieldConfig={fieldConfig}
          setFieldConfig={setFieldConfig}
        />
      )}
      {fieldConfig.allowedRows && (
        <RowsSelectInput
          fieldConfig={fieldConfig}
          setFieldConfig={setFieldConfig}
        />
      )}
      {fieldConfig.description && (
        <DescriptionInput
          fieldConfig={fieldConfig}
          setFieldConfig={setFieldConfig}
        />
      )}
      {fieldConfig.helpText && (
        <HelpTextInput
          setFieldConfig={setFieldConfig}
          fieldConfig={fieldConfig}
        />
      )}
      {fieldConfig.dropdownItems && (
        <DropdownItemsInput
          fieldConfig={fieldConfig}
          setFieldConfig={setFieldConfig}
        />
      )}
      {fieldConfig.optionItems && (
        <OptionSelectInput
          fieldConfig={fieldConfig}
          setFieldConfig={setFieldConfig}
        />
      )}
      {fieldConfig.isRequired && (
        <RequiredInput
          fieldConfig={fieldConfig}
          setFieldConfig={setFieldConfig}
        />
      )}
      {fieldConfig.allowMultipleSelection && (
        <AllowMultipleSelectionInput
          fieldConfig={fieldConfig}
          setFieldConfig={setFieldConfig}
        />
      )}
      <Button
        variant="default"
        onClick={() => updateConfig(fieldConfig)}
        className="w-full hover:cursor-pointer shadow-lg bg-[#4670F9] text-white text-sm rounded-sm"
      >
        Save
      </Button>
    </div>
  );
}
