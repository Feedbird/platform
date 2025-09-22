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
import FieldRenderWrapper from "./content/FieldRenderWrapper";
import { useForms } from "@/contexts/FormsContext";
import { TableForm } from "./content/forms-table";
import { useFormEditor } from "@/contexts/FormEditorContext";
import { Popover, PopoverTrigger } from "../ui/popover";
import { PopoverContent, PopoverPortal } from "@radix-ui/react-popover";
import {
  FormFieldsArray,
  FormFieldType,
  UIFormFieldDefaults,
} from "@/lib/forms/fields";

export interface CanvasFormField {
  id: string;
  type: string;
  position: number;
  config?: any;
}

interface FormCanvasProps {
  form: Form;
  formFields: CanvasFormField[];
  setFormFields: React.Dispatch<React.SetStateAction<CanvasFormField[]>>;
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
  const [editingTitle, setEditingTitle] = React.useState(false);
  const [editingDescription, setEditingDescription] = React.useState(false);
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const { setActiveForm, activeForm } = useForms();
  const { setFilesToUpload } = useFormEditor();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const coverRef = React.useRef<HTMLDivElement | null>(null);
  const [coverOffset, setCoverOffset] = React.useState<number>(
    (activeForm?.cover_offset as number) ?? 50
  );
  const [isDraggingCover, setIsDraggingCover] = React.useState(false);

  const handleCoverImageClick = () => {
    fileInputRef.current?.click();
  };

  React.useEffect(() => {
    // keep local offset in sync with activeForm (when switching forms)
    setCoverOffset((activeForm?.cover_offset as number) ?? 50);
  }, [activeForm?.cover_url, activeForm?.cover_offset]);

  const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));

  const handleCoverPointerDown = (e: React.PointerEvent) => {
    // start drag on handle
    const el = coverRef.current;
    if (!el) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    setIsDraggingCover(true);
  };

  const handleCoverPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingCover) return;
    const el = coverRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // compute percentage (0 = top, 100 = bottom)
    const y = e.clientY - rect.top;
    const percent = clamp((y / rect.height) * 100, 0, 100);
    setCoverOffset(percent);
    setActiveForm(
      (prev) => ({ ...(prev as TableForm), cover_offset: percent } as TableForm)
    );
  };

  const handleCoverPointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch (err) {
      /* ignore */
    }
    setIsDraggingCover(false);
    // final value already set during move; could trigger save here if desired
  };

  const handleFormValuesChange = (title?: string, description?: string) => {
    setActiveForm(
      (prev) =>
        ({
          ...prev,
          title: title ?? prev?.title,
          description: description ?? prev?.description,
        } as TableForm)
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, create a local preview URL
      const previewUrl = URL.createObjectURL(file);
      setActiveForm(
        (prev) => ({ ...prev, cover_url: previewUrl } as TableForm)
      );
      // Keep track of files to upload and path to update form accordingly
      setFilesToUpload((prev) => [...prev, { path: "form/cover_url", file }]);
    }
  };

  const addNewField = (fieldType: FormFieldType) => {
    const newField: CanvasFormField = {
      id: crypto.randomUUID(),
      position: formFields.length,
      type: fieldType.toLowerCase(),
      config: UIFormFieldDefaults[fieldType].config,
    };

    setFormFields((prev) => {
      const updated = [...prev, newField];
      return updated;
    });

    setPopoverOpen(false);
  };

  const fieldIds = formFields.map((f) => f.id);

  return (
    <div ref={setNodeRef} className="min-h-[600px] px-6 bg-transparent">
      <div className="mx-auto max-w-[900px] p-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div
            className={`w-full relative h-[160px] ${
              activeForm?.cover_url ? "" : "bg-[#F4F5F6]"
            } flex items-center justify-center`}
          >
            {activeForm?.cover_url ? (
              <>
                <div
                  ref={coverRef}
                  className="w-full h-full relative overflow-hidden"
                >
                  <Image
                    src={activeForm.cover_url}
                    alt="form_cover_image"
                    width={920}
                    height={160}
                    style={{ objectPosition: `50% ${coverOffset}%` }}
                    className="w-full h-full object-cover z-10"
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveForm(
                        (prev) =>
                          ({
                            ...(prev as TableForm),
                            cover_url: undefined,
                            cover_offset: 50,
                          } as TableForm)
                      );
                    }}
                    className="absolute right-2 top-2 z-40 bg-white/90 p-1 rounded-md hover:bg-white border border-gray-200 hover:cursor-pointer"
                    aria-label="Remove cover"
                  >
                    <Image
                      src="/images/forms/delete-red.svg"
                      alt="delete_cover_icon"
                      width={16}
                      height={16}
                    />
                  </button>

                  {/* small circular draggable handle left-aligned */}
                  <div
                    role="slider"
                    aria-label="Adjust cover vertical position"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(coverOffset)}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handleCoverPointerDown(e);
                    }}
                    onPointerMove={(e) => {
                      e.stopPropagation();
                      handleCoverPointerMove(e);
                    }}
                    onPointerUp={(e) => {
                      e.stopPropagation();
                      handleCoverPointerUp(e);
                    }}
                    onPointerCancel={(e) => {
                      e.stopPropagation();
                      handleCoverPointerUp(e);
                    }}
                    className="absolute left-6 z-30"
                    style={{
                      top: `${coverOffset}%`,
                      transform: "translateY(-50%)",
                    }}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shadow border ${
                        isDraggingCover ? "bg-blue-500" : "bg-white"
                      } cursor-row-resize`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 10l5 5 5-5"
                        />
                      </svg>
                    </div>
                  </div>

                  <div
                    onClick={handleCoverImageClick}
                    className={`absolute w-full h-full bg-transparent transition-all duration-100 content-center text-center z-20 text-transparent hover:bg-black/20 hover:backdrop-blur-xs hover:text-gray-500 font-semibold hover:cursor-pointer`}
                  >
                    Change cover
                  </div>
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
                  <button
                    type="button"
                    className="text-sm underline hover:cursor-pointer text-black font-medium bg-transparent border-none p-0"
                    onClick={handleCoverImageClick}
                  >
                    +Add Cover
                  </button>
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
              {editingTitle ? (
                <input
                  type="text"
                  value={activeForm?.title}
                  onChange={(e) =>
                    handleFormValuesChange(e.target.value, undefined)
                  }
                  onBlur={() => setEditingTitle(false)}
                  className="outline-none text-[#1C1D1F] font-semibold text-3xl border-b-[1px]"
                />
              ) : (
                <h2
                  className="text-[#1C1D1F] font-semibold text-3xl"
                  onDoubleClick={() => setEditingTitle(true)}
                >
                  {form.title}
                </h2>
              )}
              {editingDescription && activeForm?.description ? (
                <input
                  type="textarea"
                  value={activeForm.description}
                  onChange={(e) =>
                    handleFormValuesChange(undefined, e.target.value)
                  }
                  onBlur={() => setEditingDescription(false)}
                  className="outline-none text-sm text-[#5C5E63] font-normal border-b-[1px]"
                />
              ) : (
                <p
                  className="text-sm text-[#5C5E63] font-normal"
                  onDoubleClick={() => setEditingDescription(true)}
                >
                  {form.description ?? "Add description here"}
                </p>
              )}
            </div>

            {/* Droppable area for form fields */}
            <div className="min-h-[20px] p-3 relative">
              {/* Show insertion indicator when dragging over empty canvas */}
              {formFields.length === 0 && activeId && isOver && (
                <div className="absolute inset-3 flex items-center">
                  <div className="h-[1px] bg-blue-400 rounded-full w-full transition-all duration-200" />
                </div>
              )}

              {formFields.length > 0 ? (
                <SortableContext
                  items={fieldIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
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
                        {/* Insertion indicator at the end */}
                        {index === formFields.length - 1 &&
                          activeId &&
                          overId === "form-canvas" &&
                          !formFields.find((f) => f.id === activeId) && (
                            <div className="h-[1px] bg-blue-400 rounded-full mx-4 transition-all duration-200" />
                          )}
                      </React.Fragment>
                    ))}
                  </div>
                </SortableContext>
              ) : (
                <></>
              )}
            </div>

            <div className="p-3 w-full">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger className="w-full">
                  <div className="bg-[#EDF6FF] w-full h-[52px] border-[#4670F9] border-1 border-dashed rounded-[3px] hover:cursor-pointer hover:bg-[#E1EFFF] transition-colors">
                    <span className="text-[#4670F9] text-[13px] flex items-center justify-center h-full">
                      +Add Components
                    </span>
                  </div>
                </PopoverTrigger>
                <PopoverPortal>
                  <PopoverContent
                    side="right"
                    className="mt-1 rounded-sm border-1 bg-white border-border-primary p-2 flex flex-col font-medium text-sm text-[#1C1D1F] gap-0.5 w-42"
                  >
                    {FormFieldsArray.map((field) => (
                      <div
                        onClick={() => addNewField(field.type)}
                        key={field.label}
                        className="flex flex-row p-1 gap-2 hover:bg-[#EDF6FF] hover:cursor-pointer rounded-sm"
                      >
                        <Image
                          src={field.iconPath}
                          alt={`${field.label}_icon`}
                          width={14}
                          height={14}
                        />
                        <span>{field.label}</span>
                      </div>
                    ))}
                  </PopoverContent>
                </PopoverPortal>
              </Popover>
            </div>

            <div className="flex flex-row py-6 px-3 gap-3 items-center">
              <Image
                src="/images/logo/logo(1).svg"
                alt="feedbird_logo"
                width={87}
                height={14}
                className="h-3.5"
              />
              <div></div>
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
  field: CanvasFormField;
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
        type="button"
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
      <FieldRenderWrapper type={field.type} config={field.config} />
    </div>
  );
}
