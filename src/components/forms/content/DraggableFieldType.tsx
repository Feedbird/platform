import { Card } from "@/components/ui/card";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import React from "react";

type DraggableFieldTypeProps = {
  type: string;
  label: string;
  icon: React.ReactNode;
};

export function BaseContent({
  icon,
  label,
}: Omit<DraggableFieldTypeProps, "type">) {
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
      <Image
        src="/images/forms/plus.svg"
        alt="plus_icon"
        width={16}
        height={16}
      />
    </div>
  );
}

export function DraggableFieldType({
  type,
  label,
  icon,
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
      <BaseContent icon={icon} label={label} />
    </Card>
  );
}
