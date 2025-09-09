"use client";
import { Form } from "@/lib/supabase/client";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import React from "react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import { ComplexObjectType } from "@/lib/forms/field.config";
import MultiSelectPlaceholder from "./content/MultiSelectPlaceholder";
import SpreadSheetTablePlaceholder from "./content/SpreadSheetTablePlaceholder";
import OptionsPlaceholder from "./content/OptionsPlaceholder";
import { Button } from "../ui/button";

export interface FormField {
  id: string;
  type: string;
  position: number;
  config?: any;
}

interface FormCanvasProps {
  form: Form;
  formFields: FormField[];
  setFormFields: React.Dispatch<React.SetStateAction<FormField[]>>;
  activeId?: string | null;
  overId?: string | null;
  selectedFieldId?: string | null;
  onFieldSelect?: (
    val: { id: string; type: string; config: any } | null
  ) => void;
}

export default function FormCanvas({
  form,
  formFields,
  setFormFields,
  activeId,
  overId,
  selectedFieldId,
  onFieldSelect,
}: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "form-canvas",
    data: {
      type: "form-area",
    },
  });
  const [formCover, setFormCover] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCoverImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, create a local preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormCover(previewUrl);

      // TODO: Implement actual upload using the useImageUploader hook
    }
  };

  const fieldIds = formFields.map((f) => f.id);

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[600px] px-6 transition-colors duration-200 ${
        isOver ? "bg-blue-50" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[900px] p-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div
            className={`w-full relative h-[160px] ${
              formCover ? "" : "bg-[#F4F5F6]"
            } flex items-center justify-center`}
          >
            {formCover ? (
              <>
                <Image
                  src={formCover}
                  alt="form_cover_image"
                  width={920}
                  height={160}
                  className="w-full h-full object-cover object-top z-10"
                />
                <div
                  onClick={handleCoverImageClick}
                  className={`absolute w-full h-full bg-transparent transition-all duration-100 content-center text-center z-20 text-transparent hover:bg-black/20 hover:backdrop-blur-xs hover:text-gray-500 font-semibold hover:cursor-pointer`}
                >
                  Change cover
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Image
                  src="/images/forms/image-plus.svg"
                  width={16}
                  height={16}
                  alt="add-image-icon"
                />
                <div className="flex flex-col text-center">
                  <span
                    className="text-sm underline hover:cursor-pointer text-black font-medium"
                    onClick={handleCoverImageClick}
                  >
                    +Add Cover
                  </span>
                  <p className="text-sm text-gray-500">
                    Optimal dimensions 920x160
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex flex-col gap-1 p-6">
            <div className="flex flex-col gap-2 p-3">
              <h2 className="text-[#1C1D1F] font-semibold text-3xl">
                {form.title}
              </h2>
              <p className="text-sm text-[#5C5E63] font-normal">
                {form.description ?? "Add description here"}
              </p>
            </div>
            <div className="flex flex-col p-3 gap-2">
              <div>
                <span className="text-[#1C1D1F] text-base">
                  Your company name
                </span>
                <p className="text-[#5C5E63] font-normal text-sm">
                  Giving this project a title will help you find it later.
                </p>
              </div>
              <Input className="border-[#D3D3D3] border-1 rounded-[6px] px-3 py-1.5" />
            </div>
            {formFields.length === 0 ? (
              <div className="p-3 w-full h-[60px]">
                <div className="bg-[#EDF6FF] w-full h-full border-[#4670F9] border-1 border-dashed rounded-[6px]">
                  <span className="text-[#4670F9] text-[13px] flex items-center justify-center h-full">
                    +Add Components
                  </span>
                </div>
              </div>
            ) : (
              <SortableContext
                items={fieldIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {formFields.map((field, index) => (
                    <React.Fragment key={field.id}>
                      {/* Insertion indicator */}
                      {activeId &&
                        overId === field.id &&
                        activeId !== field.id &&
                        !formFields.find((f) => f.id === activeId) && (
                          <div className="h-[1px] bg-blue-400 rounded-full mx-4 transition-all duration-200" />
                        )}
                      <SimpleFormField
                        field={field}
                        selectedFieldId={selectedFieldId}
                        onFieldSelect={onFieldSelect}
                        onDelete={(fieldId) => {
                          setFormFields((prev) =>
                            prev.filter((f) => f.id !== fieldId)
                          );
                        }}
                      />
                    </React.Fragment>
                  ))}
                </div>
              </SortableContext>
            )}
            <div className="flex flex-row py-6 px-3 gap-3 items-center">
              <Image
                src="/images/logo/logo(1).svg"
                alt="feedbird_logo"
                width={87}
                height={14}
                className="h-3.5"
              />
              <span className="text-xs text-gray-500 h-4">
                Do not submit passwords through this form. Report malicious form
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple field renderer for now
function SimpleFormField({
  field,
  selectedFieldId,
  onFieldSelect,
  onDelete,
}: {
  field: FormField;
  selectedFieldId?: string | null;
  onFieldSelect?: (
    val: { id: string; type: string; config: any } | null
  ) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedFieldId === field.id;

  const handleFieldClick = () => {
    if (onFieldSelect) {
      const newValue = isSelected
        ? null
        : { id: field.id, type: field.type, config: field.config };
      onFieldSelect(newValue);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleFieldClick}
      className={`group rounded-[6px] p-3 hover:border-blue-300 border-1 relative cursor-pointer transition-all ${
        isDragging ? "opacity-50" : "opacity-100"
      } ${
        isSelected
          ? "border-1.5 border-[#4670F9] shadow-md bg-[#EDF6FF]"
          : "border-white bg-white"
      }`}
    >
      <Image
        {...attributes}
        {...listeners}
        className="absolute -left-5 opacity-0 group-hover:opacity-80 cursor-grab hover:cursor-grabbing transition-opacity "
        alt="drag_handle_icon"
        width={16}
        height={16}
        src="/images/forms/dragdots.svg"
      />

      {/* Delete Button */}
      <button
        onClick={(event) => {
          event.stopPropagation();
          onDelete(field.id);
          if (isSelected && onFieldSelect) {
            onFieldSelect(null);
          }
        }}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Field Content */}
      <div className="">
        {field.type === "text" && (
          <div className="flex flex-col gap-2">
            <label className="block text-base text-[#1C1D1F]">
              {field.config.title.value}
            </label>
            {field.config.description && (
              <p className="text-sm text-[#838488] font-normal">
                {field.config.description.value}
              </p>
            )}
            <Input
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-[6px] border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {field.type === "textarea" && (
          <div className="flex flex-col gap-2">
            <label className="block text-base text-[#1C1D1F]">
              {field.config.title.value}
            </label>
            {field.config.description && (
              <p className="text-sm text-[#838488] font-normal">
                {field.config.description.value}
              </p>
            )}
            <Textarea
              rows={5}
              onClick={(e) => e.stopPropagation()}
              className="w-full border bg-white border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {field.type === "dropdown" && (
          <div className="flex flex-col gap-2">
            <label className="block text-base text-[#1C1D1F]">
              {field.config.title.value}
            </label>
            {!field.config?.allowMultipleSelection?.value ? (
              <Select>
                <SelectTrigger className="w-full rounded-[6px] border-1 border-[#D3D3D3] cursor-pointer text-[#1C1D1F]">
                  Select option
                </SelectTrigger>
                <SelectContent avoidCollisions>
                  {field.config?.dropdownItems?.dropdownValues?.length ? (
                    field.config.dropdownItems.dropdownValues
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
                values={
                  field.config?.dropdownItems?.dropdownValues?.length
                    ? field.config.dropdownItems.dropdownValues.sort(
                        (i: ComplexObjectType) => i.order
                      )
                    : []
                }
              />
            )}
          </div>
        )}

        {field.type === "checkbox" && (
          <div className="flex flex-row gap-3">
            <Checkbox
              className="size-5"
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
            <div className="flex flex-col gap-0.5">
              <label className="block text-base text-[#1C1D1F]">
                {field.config.title.value}
              </label>
              {field.config.description && (
                <p className="text-sm text-[#838488] font-normal">
                  {field.config.description.value}
                </p>
              )}
            </div>
          </div>
        )}

        {field.type === "section-break" && (
          <div className="flex flex-col gap-1.5">
            <label className="block text-base text-[#1C1D1F]">
              {field.config.title.value}
            </label>
            {field.config.description && (
              <p className="text-sm text-[#838488] font-normal">
                {field.config.description.value}
              </p>
            )}
          </div>
        )}
        {field.type === "attachment" && (
          <div className="flex flex-col gap-1.5">
            <label className="block text-base text-[#1C1D1F]">
              {field.config.title.value}
            </label>
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
                  SVG, PNG, JPG
                </p>
              </div>
            </div>
          </div>
        )}

        {field.type === "spreadsheet" && (
          <div className="flex flex-col gap-3">
            <label className="block text-base text-[#1C1D1F]">
              {field.config.title.value}
            </label>
            {field.config.description && (
              <p className="text-sm text-[#838488] font-normal">
                {field.config.description.value}
              </p>
            )}
            <SpreadSheetTablePlaceholder config={field.config} />
          </div>
        )}

        {field.type === "option" && (
          <div className="flex flex-col gap-3">
            <label className="block text-base text-[#1C1D1F]">
              {field.config.title.value}
            </label>
            {field.config.description && (
              <p className="text-sm text-[#838488] font-normal">
                {field.config.description.value}
              </p>
            )}
            <OptionsPlaceholder config={field.config} />
          </div>
        )}

        {field.type === "page-break" && (
          <div className="flex flex-row items-center justify-between gap-3">
            <div className="flex flex-col">
              {field.config.description && (
                <p className="text-sm text-[#838488] font-normal">
                  {field.config.description.value}
                </p>
              )}
              <label className="block text-base text-[#1C1D1F]">
                {field.config.title.value}
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
        )}
      </div>
    </div>
  );
}
