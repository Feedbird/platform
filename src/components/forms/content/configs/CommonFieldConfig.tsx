import React from "react";
import { UIFormField } from "@/lib/forms/fields";
import { Button } from "@/components/ui/button";
import {
  AllowMultipleSelectionInput,
  DescriptionInput,
  DropdownItemsInput,
  HelpTextInput,
  PlaceholderInput,
  RequiredInput,
  TitleInput,
} from "./Inputs";

type Props = {
  field: UIFormField;
};

export default function FieldConfigWrapper({ field }: Props) {
  const [fieldConfig, setFieldConfig] = React.useState(field.config);

  React.useEffect(() => {
    setFieldConfig(field.config);
  }, [field]);

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
        className="w-full hover:cursor-pointer shadow-lg bg-[#4670F9] text-white text-sm rounded-sm"
      >
        Save
      </Button>
    </div>
  );
}
