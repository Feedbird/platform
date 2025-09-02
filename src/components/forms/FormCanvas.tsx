"use client";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React from "react";

export interface FormField {
  id: string;
  type: string;
  label: string;
  position: number;
  config?: any;
}

interface FormCanvasProps {
  formFields: FormField[];
  setFormFields: React.Dispatch<React.SetStateAction<FormField[]>>;
}

export default function FormCanvas({
  formFields,
  setFormFields,
}: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "form-canvas",
    data: {
      type: "form-area",
    },
  });

  const fieldIds = formFields.map((f) => f.id);

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[600px] p-6 transition-colors ${
        isOver
          ? "bg-blue-50 border-2 border-blue-300 border-dashed"
          : "bg-gray-50"
      }`}
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Form Preview</h1>
            <div className="text-sm text-gray-500">
              {formFields.length} field{formFields.length !== 1 ? "s" : ""}{" "}
              added
            </div>
          </div>

          {formFields.length === 0 ? (
            <div className="border-2 border-gray-300 border-dashed rounded-lg p-12 text-center">
              <div className="text-gray-400 mb-2">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">
                Drag fields from the sidebar to start building your form
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Fields will appear here as interactive form elements
              </p>
            </div>
          ) : (
            <SortableContext
              items={fieldIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {formFields.map((field) => (
                  <SimpleFormField
                    key={field.id}
                    field={field}
                    onDelete={(fieldId) => {
                      setFormFields((prev) =>
                        prev.filter((f) => f.id !== fieldId)
                      );
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple field renderer for now
function SimpleFormField({
  field,
  onDelete,
}: {
  field: FormField;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group border border-gray-200 rounded-lg p-4 bg-white hover:border-blue-300 relative ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
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
