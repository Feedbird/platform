import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ComplexObjectType } from "@/lib/forms/field.config";
import MultiSelectPlaceholder from "./MultiSelectPlaceholder";
import Image from "next/image";
import SpreadSheetTablePlaceholder from "./SpreadSheetTablePlaceholder";
import OptionsPlaceholder from "./OptionsPlaceholder";
import { Button } from "@/components/ui/button";

export type CommonProps = {
  config: any;
};

export function SingleTextInput({ config }: CommonProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <label className="block text-base text-[#1C1D1F]">
          {config.title.value}
        </label>
        {config.description && (
          <p className="text-sm text-[#838488] font-normal">
            {config.description.value}
          </p>
        )}
      </div>
      <Input
        onClick={(e) => e.stopPropagation()}
        placeholder={config?.placeholder?.value || ""}
        className="w-full rounded-[6px] border bg-white border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#1C1D1F] focus:border-transparent"
      />
    </div>
  );
}

export function TextAreaInput({ config }: CommonProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label className="block text-base text-[#1C1D1F]">
          {config.title.value}
        </label>
        {config.description && (
          <p className="text-sm text-[#838488] font-normal">
            {config.description.value}
          </p>
        )}
      </div>
      <Textarea
        rows={5}
        onClick={(e) => e.stopPropagation()}
        placeholder={config?.placeholder?.value || ""}
        className="w-full border bg-white border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 text-[#1C1D1F] focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

export function CheckboxInput({ config }: CommonProps) {
  return (
    <div className="flex flex-row gap-3">
      <Checkbox
        className="size-5 bg-white"
        onClick={(e) => {
          e.stopPropagation();
        }}
      />
      <div className="flex flex-col gap-0.5">
        <label className="block text-base text-[#1C1D1F]">
          {config.title.value}
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

export function DropdownInput({ config }: CommonProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label className="block text-base text-[#1C1D1F]">
          {config.title.value}
        </label>
        {config.helpText && (
          <p className="text-sm text-[#838488] font-normal">
            {config.helpText.value}
          </p>
        )}
      </div>
      {!config?.allowMultipleSelection?.value ? (
        <Select value="" onValueChange={() => {}}>
          <SelectTrigger className="w-full rounded-[6px] border-1 border-[#D3D3D3] bg-white cursor-pointer text-[#1C1D1F]">
            {config?.placeholder?.value || "Select an option"}
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
        <MultiSelectPlaceholder
          placeholder={config?.placeholder?.value}
          values={
            config?.dropdownItems?.dropdownValues?.length
              ? config.dropdownItems.dropdownValues.sort(
                  (i: ComplexObjectType) => i.order
                )
              : []
          }
        />
      )}
    </div>
  );
}

export function SectionBreakInput({ config }: CommonProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="block text-base text-[#1C1D1F]">
        {config.title.value}
      </label>
      {config.description && (
        <p className="text-sm text-[#838488] font-normal">
          {config.description.value}
        </p>
      )}
    </div>
  );
}

export function AttachmentInput({ config }: CommonProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="block text-base text-[#1C1D1F]">
        {config.title.value}
      </label>
      {config.description && (
        <p className="text-sm text-[#838488] font-normal">
          {config.description.value}
        </p>
      )}
      <div className="w-full rounded-[6px] border-1 border-[#D3D3D3] p-4.5 border-dashed flex justify-center bg-white">
        <div className="flex flex-col items-center gap-1">
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
        </div>
      </div>
    </div>
  );
}

export function SpreadSheetInput({ config }: CommonProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="block text-base text-[#1C1D1F]">
        {config.title.value}
      </label>
      {config.description && (
        <p className="text-sm text-[#838488] font-normal">
          {config.description.value}
        </p>
      )}
      <SpreadSheetTablePlaceholder config={config} />
    </div>
  );
}

export function OptionInput({ config }: CommonProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="block text-base text-[#1C1D1F]">
          {config.title.value}
        </label>
        {config.description && (
          <p className="text-sm text-[#838488] font-normal">
            {config.description.value}
          </p>
        )}
      </div>
      <OptionsPlaceholder config={config} />
    </div>
  );
}

export function PageBreakInput({ config }: CommonProps) {
  return (
    <div className="flex flex-row items-center justify-between gap-3">
      <div className="flex flex-col">
        {config.description && (
          <p className="text-sm text-[#838488] font-normal">
            {config.description.value}
          </p>
        )}
        <label className="block text-base text-[#1C1D1F]">
          {config.title.value}
        </label>
      </div>
      <Button
        variant="default"
        onClick={(e) => e.stopPropagation()}
        className="mr-4 shadow-lg bg-[#4670F9] rounded-[6px] text-white cursor-pointer px-3 py-1.5"
      >
        Next
      </Button>
    </div>
  );
}
