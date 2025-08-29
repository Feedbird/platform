import { Card } from "@/components/ui/card";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import React from "react";

type InputCardProps = {
  id: string | number;
  label: string;
  icon: string;
};

export default function InputCard({ id, label, icon }: InputCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`py-2 px-2.5 shadow-md rounded-sm flex flex-row justify-between items-center cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? "opacity-50 z-50" : ""
      }`}
    >
      <div className="flex flex-row gap-2">
        <Image
          src="/images/forms/dragdots.svg"
          alt="draggable_icon"
          width={10}
          height={10}
        />
        <Image src={icon} alt={`${icon}_image`} width={14} height={14} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Image
        src="/images/forms/plus.svg"
        alt="plus_icon"
        width={16}
        height={16}
      />
    </Card>
  );
}
