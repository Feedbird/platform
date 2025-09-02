"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import Image from "next/image";
import { FormFieldsArray } from "@/lib/forms/fields";

interface DraggableFieldTemplateProps {
  type: string;
  icon: React.ReactNode;
  label: string;
}

function DraggableFieldTemplate({
  type,
  icon,
  label,
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
      className={`py-2 px-2.5 border border-gray-200 rounded-lg cursor-grab hover:bg-gray-50 transition-colors ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="flex items-center gap-3 justify-center">
        <Image
          src="/images/forms/dragdots.svg"
          alt="draggable_item"
          width={13}
          height={13}
        />
        <div className="flex-shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm text-gray-900">{label}</div>
        </div>
        <Image
          src="/images/forms/plus.svg"
          alt="plus_icon"
          width={16}
          height={16}
        />
      </div>
    </div>
  );
}

export default function FormEditorSideBar() {
  const formFields = React.useMemo(
    () =>
      FormFieldsArray.map((field) => ({
        type: field.type,
        label: field.label,
        icon: (
          <Image
            src={field.iconPath}
            alt={`icon_${field.type}`}
            width={15}
            height={15}
          />
        ),
      })),
    []
  );

  return (
    <div className="border-border-primary border-l-1 w-[320px] bg-[#FAFAFA] h-full flex-shrink-0">
      <header className="border-border-primary border-b-1 w-full p-3 text-black font-medium">
        Fields
      </header>
      <div className="p-4 flex flex-col gap-4">
        <p className="text-[#838488] text-[13px]">
          Double-click or drag and drop fields from the right column onto your
          form here.
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            {formFields.map((field) => (
              <DraggableFieldTemplate key={field.type} {...field} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
