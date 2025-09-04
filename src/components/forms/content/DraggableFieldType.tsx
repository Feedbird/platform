import { Card } from "@/components/ui/card";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import React from "react";

type DraggableFieldTypeProps = {
  type: string;
  label: string;
  icon: React.ReactNode;
  onAddField?: (fieldType: string) => void;
};

export function BaseContent({
  icon,
  label,
  onAddField,
  type,
}: Omit<DraggableFieldTypeProps, "type"> & {
  onAddField?: (fieldType: string) => void;
  type?: string;
}) {
  return (
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
      <div
        onClick={(e) => {
          console.log("Plus icon clicked!", { type, onAddField: !!onAddField });
          e.stopPropagation(); // Prevent event bubbling
          e.preventDefault(); // Prevent default behavior
          if (onAddField && type) {
            console.log("Calling onAddField with type:", type);
            onAddField(type);
          } else {
            console.log("Missing onAddField or type:", {
              onAddField: !!onAddField,
              type,
            });
          }
        }}
        onPointerDown={(e) => {
          e.stopPropagation(); // Prevent drag from starting
        }}
        onMouseDown={(e) => {
          e.stopPropagation(); // Prevent drag from starting
        }}
        className="cursor-pointer hover:opacity-70 transition-opacity"
      >
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

export function DraggableFieldType({
  type,
  label,
  icon,
  onAddField,
}: DraggableFieldTypeProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: type, data: { type: "template", fieldType: type } });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`py-2 px-2.5 border border-gray-200 rounded-sm shadow-none cursor-grab hover:bg-gray-50 transition-colors ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <BaseContent
        icon={icon}
        label={label}
        onAddField={onAddField}
        type={type}
      />
    </Card>
  );
}
