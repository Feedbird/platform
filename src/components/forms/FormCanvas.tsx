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
import { useImageUploader } from "@/hooks/use-image-uploader";

export interface FormField {
  id: string;
  type: string;
  label: string;
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
  onFieldSelect?: (fieldId: string | null) => void;
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
      console.log("File selected:", file);
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
      <div className="mx-auto max-w-[820px] p-4">
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
                  className="w-full h-full object-cover z-10"
                />
                <div
                  onClick={handleCoverImageClick}
                  className={`absolute w-full h-full bg-transparent transition-all duration-100 content-center text-center z-20 text-transparent hover:bg-black/20 hover:backdrop-blur-xs hover:text-black font-semibold hover:cursor-pointer`}
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
                <div className="bg-[#EDF6FF] w-full h-full border-[#4670F9] border-1 border-dashed">
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
                <div className="space-y-4">
                  {formFields.map((field, index) => (
                    <React.Fragment key={field.id}>
                      {/* Insertion indicator */}
                      {activeId &&
                        overId === field.id &&
                        activeId !== field.id &&
                        !formFields.find((f) => f.id === activeId) && (
                          <div className="h-1 bg-blue-400 rounded-full mx-4 transition-all duration-200" />
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
                src="/images/logo/logo.png"
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
  onFieldSelect?: (fieldId: string | null) => void;
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
      // Toggle selection: if already selected, deselect; otherwise select this field
      onFieldSelect(isSelected ? null : field.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleFieldClick}
      className={`group rounded-lg p-4 bg-white hover:border-blue-300 border-1 relative cursor-pointer transition-all ${
        isDragging ? "opacity-50" : "opacity-100"
      } ${isSelected ? "border-2 border-blue-500 shadow-md" : "border-white"}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute right-8 top-2 opacity-0 group-hover:opacity-100 cursor-grab hover:cursor-grabbing transition-opacity"
      >
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l4-4 4 4m0 6l-4 4-4-4"
          />
        </svg>
      </div>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(field.id)}
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
      <div className="mr-12">
        {field.type === "text" && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {field.label}
            </label>
            <input
              type="text"
              placeholder="Type your answer here..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {field.type === "textarea" && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {field.label}
            </label>
            <textarea
              placeholder="Type your answer here..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {field.type === "dropdown" && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {field.label}
            </label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Select an option...</option>
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
        )}

        {field.type === "checkbox" && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {field.label}
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">Option 1</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">Option 2</span>
              </label>
            </div>
          </div>
        )}

        {!["text", "textarea", "dropdown", "checkbox"].includes(field.type) && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {field.label}
            </label>
            <div className="text-gray-500 italic">
              {field.type} field (not implemented yet)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
