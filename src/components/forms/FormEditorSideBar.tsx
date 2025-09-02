"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";

interface DraggableFieldTemplateProps {
  type: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}

function DraggableFieldTemplate({
  type,
  icon,
  label,
  description,
}: DraggableFieldTemplateProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: type,
      data: {
        type: "template",
        fieldType: type,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 border border-gray-200 rounded-lg cursor-grab hover:bg-gray-50 transition-colors ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm text-gray-900">{label}</div>
          <div className="text-xs text-gray-500 mt-1">{description}</div>
        </div>
      </div>
    </div>
  );
}

export default function FormEditorSideBar() {
  const textFields = React.useMemo(
    () => [
      {
        type: "Text",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        ),
        label: "Text Input",
        description: "Single line text input",
      },
      {
        type: "Textarea",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        ),
        label: "Textarea",
        description: "Multi-line text input",
      },
      {
        type: "Email",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
            />
          </svg>
        ),
        label: "Email Input",
        description: "Email validation input",
      },
    ],
    []
  );

  const selectionFields = React.useMemo(
    () => [
      {
        type: "Dropdown",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        ),
        label: "Dropdown",
        description: "Select from options",
      },
      {
        type: "Checkbox",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        label: "Checkbox",
        description: "Boolean selection",
      },
      {
        type: "Radio",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="3" />
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth={2}
              fill="none"
            />
          </svg>
        ),
        label: "Radio Group",
        description: "Single selection from group",
      },
    ],
    []
  );

  return (
    <div className="border-border-primary border-l-1 w-[320px] h-full flex-shrink-0">
      <header className="border-border-primary border-b-1 w-full p-3 text-black font-medium">
        Fields
      </header>
      <div className="p-4 flex flex-col gap-4">
        <p className="text-[#838488] text-[13px]">
          Drag and drop fields from here onto your form canvas.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Text Fields
            </h3>
            <div className="space-y-2">
              {textFields.map((field) => (
                <DraggableFieldTemplate key={field.type} {...field} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Selection Fields
            </h3>
            <div className="space-y-2">
              {selectionFields.map((field) => (
                <DraggableFieldTemplate key={field.type} {...field} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
