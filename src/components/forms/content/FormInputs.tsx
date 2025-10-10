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
import { ChevronRight } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import OptionalInputChip from "./OptionalInputChip";

export type CommonProps = {
  config: any;
  isPreview?: boolean;
};

export function SingleTextInput({ config }: CommonProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <label className="text-base text-black flex flex-row items-center gap-2">
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
        onClick={(e) => e.stopPropagation()}
        placeholder={config?.placeholder?.value || ""}
        className="w-full rounded-[6px] border bg-white border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent"
      />
    </div>
  );
}

export function TextAreaInput({ config }: CommonProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-base text-black flex flex-row items-center gap-2">
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
        onClick={(e) => e.stopPropagation()}
        placeholder={config?.placeholder?.value || ""}
        className="w-full border bg-white border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 text-black focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

export function CheckboxInput({ config, isPreview }: CommonProps) {
  const [checked, setChecked] = React.useState(false);

  return (
    <div
      className={`flex flex-row gap-3 ${
        isPreview ? "hover:cursor-pointer" : ""
      }`}
      onClick={(e) => {
        if (isPreview) {
          e.stopPropagation();
          setChecked(!checked);
        }
      }}
    >
      <Checkbox
        className="size-5 bg-white"
        checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          setChecked(!checked);
        }}
      />
      <div className="flex flex-col gap-0.5">
        <label className="text-base text-black flex flex-row items-center gap-2">
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

export function DropdownInput({ config }: CommonProps) {
  const [ddValue, setDDValue] = React.useState<string>("");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-base text-black flex flex-row items-center gap-2">
          {config.title.value}
          {!config.isRequired.value && <OptionalInputChip />}
        </label>
        {config.helpText && (
          <p className="text-sm text-[#838488] font-normal">
            {config.helpText.value}
          </p>
        )}
      </div>
      {!config?.allowMultipleSelection?.value ? (
        <Select value={ddValue} onValueChange={(value) => setDDValue(value)}>
          <SelectTrigger className="w-full rounded-[6px] border-1 border-[#D3D3D3] bg-white cursor-pointer text-black">
            {ddValue
              ? ddValue
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
      <label className="block text-base text-black">{config.title.value}</label>
      {config.description && (
        <p className="text-sm text-[#838488] font-normal">
          {config.description.value}
        </p>
      )}
    </div>
  );
}

export function AttachmentInput({ config, isPreview }: CommonProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-base text-black flex flex-row items-center gap-2">
        {config.title.value}
        {!config.isRequired.value && <OptionalInputChip />}
      </label>
      {config.description && (
        <p className="text-sm text-[#838488] font-normal">
          {config.description.value}
        </p>
      )}
      <div
        onClick={() => {
          if (isPreview)
            toast.warning("File upload not implemented in preview");
        }}
        className={`w-full rounded-[6px] border-1 border-[#D3D3D3] p-4.5 border-dashed flex justify-center bg-white ${
          isPreview ? "hover:cursor-pointer" : ""
        }`}
      >
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

export function SpreadSheetInput({ config, isPreview }: CommonProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-base text-black flex flex-row items-center gap-2">
        {config.title.value}
        {!config.isRequired.value && <OptionalInputChip />}
      </label>
      {config.description && (
        <p className="text-sm text-[#838488] font-normal">
          {config.description.value}
        </p>
      )}
      <SpreadSheetTablePlaceholder
        config={config}
        isPreview={isPreview ?? false}
      />
    </div>
  );
}

export function OptionInput({ config }: CommonProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-base text-black flex flex-row items-center gap-2">
          {config.title.value}
          {!config.isRequired.value && <OptionalInputChip />}
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

export type PageBreakProps = CommonProps & {
  pageNumber: number;
};

export function PageBreakInput({
  config,
  isPreview,
  pageNumber,
}: PageBreakProps) {
  return (
    <div
      className={`flex flex-row items-center justify-between gap-3 ${
        isPreview ? "mt-3" : ""
      }`}
    >
      <div className="flex flex-col">
        {isPreview && pageNumber > 1 && (
          <Button
            variant="ghost"
            onClick={(e) => e.stopPropagation()}
            className="hover:cursor-pointer border-1 border-[#D3D3D3] radius-[6px]"
          >
            Back
          </Button>
        )}
        {!isPreview && config.description && (
          <p className="text-sm text-[#838488] font-normal">
            {config.description.value}
          </p>
        )}
        {!isPreview && (
          <label className="block text-base text-black">
            {config.title.value}
          </label>
        )}
      </div>
      <Button
        variant="default"
        onClick={(e) => e.stopPropagation()}
        className="shadow-md bg-[#4670F9] rounded-[6px] text-white cursor-pointer px-3 py-1.5 border-1 border-black/10 flex flex-row"
      >
        Next
        <ChevronRight />
      </Button>
    </div>
  );
}

export function PageEnding({ pages }: { pages: number }) {
  return (
    <div className="flex flex-row justify-between mt-6">
      {pages > 1 ? (
        <Button
          variant="ghost"
          onClick={(e) => e.stopPropagation()}
          className="hover:cursor-pointer border-1 border-[#D3D3D3] radius-[6px]"
        >
          Back
        </Button>
      ) : (
        <div></div>
      )}
      <Button
        variant="default"
        onClick={(e) => e.stopPropagation()}
        className="shadow-md bg-[#4670F9] rounded-[6px] text-white cursor-pointer px-3 py-1.5 border-1 border-black/10 flex flex-row"
      >
        Review
        <ChevronRight />
      </Button>
    </div>
  );
}
