import OptionalInputChip from "@/components/forms/content/OptionalInputChip";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/lib/supabase/client";
import React from "react";
import { Select, SelectContent, SelectItem } from "@radix-ui/react-select";
import { SelectTrigger } from "@/components/ui/select";
import { ComplexObjectType } from "@/lib/forms/field.config";
import { MultiSelect } from "@/components/ui/multi-select";
import { OptionCard } from "@/components/forms/content/OptionsPlaceholder";
import Image from "next/image";

export type CommonProps = {
  setParent: (value: string | string[] | File, field: FormField) => void;
  field: FormField;
};

export function SingleTextControlled({ setParent, field }: CommonProps) {
  const [value, setValue] = React.useState("");

  const config = field.config;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setParent(e.target.value, field);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <label className="text-base text-[#1C1D1F] flex flex-row items-center gap-2">
          {config.title.value}
          {!config.isRequired.value && <OptionalInputChip />}
        </label>
        {config.description && (
          <p className="text-sm text-[#838488] font-normal">
            {config.description.value}
          </p>
        )}
      </div>
      <Input
        value={value}
        onChange={handleChange}
        placeholder={config?.placeholder?.value || ""}
        className="w-full rounded-[6px] border bg-white border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#1C1D1F] focus:border-transparent"
      />
    </div>
  );
}

export function LongTextControlled({ setParent, field }: CommonProps) {
  const [value, setValue] = React.useState("");

  const config = field.config;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setParent(e.target.value, field);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-base text-[#1C1D1F] flex flex-row items-center gap-2">
          {config.title.value}
          {!config.isRequired.value && <OptionalInputChip />}
        </label>
        {config.description && (
          <p className="text-sm text-[#838488] font-normal">
            {config.description.value}
          </p>
        )}
      </div>
      <Textarea
        rows={5}
        value={value}
        onChange={handleChange}
        placeholder={config?.placeholder?.value || ""}
        className="w-full border bg-white border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 text-[#1C1D1F] focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

export function CheckboxControlled({ setParent, field }: CommonProps) {
  const [checked, setChecked] = React.useState(false);

  const config = field.config;
  const handleChange = () => {
    const newValue = !checked;
    setChecked(newValue);
    setParent(newValue ? "yes" : "no", field);
  };

  return (
    <div
      className={`flex flex-row gap-3 hover:cursor-pointer`}
      onClick={handleChange}
    >
      <Checkbox
        className="size-5 bg-white"
        checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          handleChange();
        }}
      />
      <div className="flex flex-col gap-0.5">
        <label className="text-base text-[#1C1D1F] flex flex-row items-center gap-2">
          {config.title.value}
          {!config.isRequired.value && <OptionalInputChip />}
        </label>
        {config.description && (
          <p className="text-sm text-[#838488] font-normal">
            {config.description.value}
          </p>
        )}
      </div>
    </div>
  );
}

export function DropdownControlled({ setParent, field }: CommonProps) {
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>([]);

  const config = field.config;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-base text-[#1C1D1F] flex flex-row items-center gap-2">
          {config.title.value}
          {!config.isRequired.value && <OptionalInputChip />}
        </label>
        {config.helpText && (
          <p className="text-sm text-[#838488] font-normal">
            {config.helpText.value}
          </p>
        )}

        {!config?.allowMultipleSelection?.value ? (
          <Select
            value={selectedOptions[0] ?? ""}
            onValueChange={(value) => {
              setSelectedOptions([value]);
              setParent(value, field);
            }}
          >
            <SelectTrigger className="w-full rounded-[6px] border-1 border-[#D3D3D3] bg-white cursor-pointer text-[#1C1D1F]">
              {selectedOptions.length
                ? selectedOptions[0]
                : config?.placeholder?.value || "Select an option"}
            </SelectTrigger>
            <SelectContent avoidCollisions>
              {config?.dropdownItems?.dropdownValues?.length ? (
                config.dropdownItems.dropdownValues
                  .sort((i: ComplexObjectType) => i.order)
                  .map((item: ComplexObjectType) => (
                    <SelectItem key={item.order} value={item.value}>
                      {item.value}
                    </SelectItem>
                  ))
              ) : (
                <SelectItem value="no-value">No values</SelectItem>
              )}
            </SelectContent>
          </Select>
        ) : (
          <MultiSelect
            selectedValues={selectedOptions}
            onSelectionChange={(e) => {
              setSelectedOptions(e);
              setParent(e, field);
            }}
            placeholder={config?.placeholder?.value || "Select options"}
            options={(config?.dropdownItems?.dropdownValues?.length
              ? config.dropdownItems.dropdownValues.sort(
                  (i: ComplexObjectType) => i.order
                )
              : []
            ).map((v: ComplexObjectType) => ({
              id: v.order,
              name: v.value,
              value: v.value,
            }))}
          />
        )}
      </div>
    </div>
  );
}

export function OptionsControlled({ field, setParent }: CommonProps) {
  const [optionsChecked, setCheckedOptions] = React.useState<string[]>([]);
  const config = field.config;

  const handleOptionsCheck = (value: string) => {
    if (config?.allowMultipleSelection?.value) {
      if (optionsChecked.includes(value)) {
        const newValue = optionsChecked.filter((v) => v !== value);
        setCheckedOptions(newValue);
        setParent(newValue, field);
      } else {
        const newValue = [...optionsChecked, value];
        setCheckedOptions(newValue);
        setParent(newValue, field);
      }
    } else {
      if (optionsChecked.includes(value)) {
        setCheckedOptions([]);
        setParent([], field);
        return;
      }
      setCheckedOptions([value]);
      setParent([value], field);
    }
  };
  const options: (ComplexObjectType & { image?: string })[] = React.useMemo(
    () =>
      config.optionItems?.optionValues?.length
        ? config.optionItems.optionValues
        : [],
    [config]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-base text-[#1C1D1F] flex flex-row items-center gap-2">
          {config.title.value}
          {!config.isRequired.value && <OptionalInputChip />}
        </label>
        {config.description && (
          <p className="text-sm text-[#838488] font-normal">
            {config.description.value}
          </p>
        )}
      </div>
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
    </div>
  );
}

export function AttachmentControlled({ setParent, field }: CommonProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const config = field.config;

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParent(selectedFile, field); // You might want to pass the file object instead
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setParent(droppedFile.name, field); // You might want to pass the file object instead
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-base text-[#1C1D1F] flex flex-row items-center gap-2">
        {config.title.value}
        {!config.isRequired.value && <OptionalInputChip />}
      </label>
      {config.description && (
        <p className="text-sm text-[#838488] font-normal">
          {config.description.value}
        </p>
      )}
      <div
        onClick={handleFileClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`w-full rounded-[6px] border-1 border-[#D3D3D3] hover:bg-[#EDF6FF] p-4.5 border-dashed flex justify-center bg-white hover:cursor-pointer transition-colors`}
      >
        <div className="flex flex-col items-center gap-1">
          {file ? (
            <>
              <div className="p-2 rounded-full h-9 w-9 border-1 border-[#4670F9] bg-[#EDF6FF] flex items-center justify-center">
                <Image
                  src="/images/forms/upload.svg"
                  alt="file_uploaded_icon"
                  width={16}
                  height={16}
                  className="text-[#4670F9]"
                />
              </div>
              <div className="text-center">
                <p className="text-[#4670F9] font-semibold text-sm">
                  {file.name}
                </p>
                <p className="text-[#5C5E63] font-normal text-xs">
                  Click to change file
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-full h-9 w-9 border-1 border-[#D3D3D3] flex items-center justify-center">
                <Image
                  src="/images/forms/upload.svg"
                  alt="upload_icon"
                  width={16}
                  height={16}
                />
              </div>
              <div className="flex flex-row gap-1">
                <span className="text-[#4670F9] font-semibold text-sm hover:underline">
                  Click to upload
                </span>
                <p className="text-[#5C5E63] font-normal text-sm">
                  or drag and drop
                </p>
              </div>
              <p className="text-[#5C5E63] font-normal text-sm">
                {config?.placeholder?.value || "SVG, PNG, JPG"}
              </p>
            </>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={config?.acceptedFileTypes?.value || "image/*"}
        className="hidden"
      />
    </div>
  );
}

export function SpreadSheetControlled({ field, setParent }: CommonProps) {
  const config = field.config;
  const columns: { value: string; order: number }[] =
    config.spreadsheetColumns?.columns || [];
  const sampleRows = config.allowedRows?.value || 2;

  const [spreadsheetData, setSpreadsheetData] = React.useState<string[]>(() => {
    const columnHeaders = columns
      .sort((a, b) => a.order - b.order)
      .map((col) => col.value)
      .join("|");

    const initialData = [columnHeaders];
    for (let i = 0; i < sampleRows; i++) {
      initialData.push(new Array(columns.length).fill("").join("|"));
    }
    return initialData;
  });

  const hasInitialized = React.useRef(false);

  React.useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      setParent(spreadsheetData, field);
    }
  }, [spreadsheetData, field, setParent]);

  const handleCellChange = (
    rowIndex: number,
    columnIndex: number,
    value: string
  ) => {
    setSpreadsheetData((prevData) => {
      const newData = [...prevData];
      const dataRowIndex = rowIndex + 1;

      if (newData[dataRowIndex]) {
        const rowValues = newData[dataRowIndex].split("|");
        rowValues[columnIndex] = value;
        newData[dataRowIndex] = rowValues.join("|");
      }

      setParent(newData, field);
      return newData;
    });
  };

  const getCellValue = (rowIndex: number, columnIndex: number): string => {
    const dataRowIndex = rowIndex + 1;
    if (spreadsheetData[dataRowIndex]) {
      const rowValues = spreadsheetData[dataRowIndex].split("|");
      return rowValues[columnIndex] || "";
    }
    return "";
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-base text-[#1C1D1F] flex flex-row items-center gap-2">
        {config.title.value}
        {!config.isRequired.value && <OptionalInputChip />}
      </label>
      {config.description && (
        <p className="text-sm text-[#838488] font-normal">
          {config.description.value}
        </p>
      )}
      <table className="w-full border-separate border-spacing-0 rounded-lg overflow-hidden border border-[#EAE9E9]">
        <thead className="">
          <tr className="bg-[#FBFBFB] text-[#5C5E63] font-medium text-left text-[13px]">
            <th className="w-7 border-r border-b border-[#EAE9E9] first:rounded-tl-[6px]"></th>
            {columns.map((col, index) => (
              <th
                key={col.order}
                className={`border-r border-b border-[#EAE9E9] p-2 pt-2.5 ${
                  index === columns.length - 1
                    ? "rounded-tr-[6px] border-r-0"
                    : ""
                }`}
              >
                {col.value}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: sampleRows as number }).map((_, rowIndex) => {
            const isLastRow = rowIndex === (sampleRows as number) - 1;
            return (
              <tr key={rowIndex}>
                <td
                  className={`w-7 border-r border-b border-[#EAE9E9] p-2.5 text-[#5C5E63] font-normal text-xs font-mono bg-[#FBFBFB] ${
                    isLastRow ? "rounded-bl-[6px] border-b-0" : ""
                  }`}
                >
                  {rowIndex + 1}
                </td>
                {columns.map((_, columnIndex) => (
                  <td
                    key={columnIndex}
                    className={`px-2.5 border-r border-b border-[#EAE9E9] bg-white ${
                      isLastRow && columnIndex === columns.length - 1
                        ? "rounded-br-[6px] border-r-0 border-b-0"
                        : isLastRow
                        ? "border-b-0"
                        : columnIndex === columns.length - 1
                        ? "border-r-0"
                        : ""
                    }`}
                  >
                    <input
                      type="text"
                      value={getCellValue(rowIndex, columnIndex)}
                      onChange={(e) =>
                        handleCellChange(rowIndex, columnIndex, e.target.value)
                      }
                      className="w-full border-none outline-none bg-transparent text-sm py-1"
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
