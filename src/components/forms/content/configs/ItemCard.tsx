import { Input } from "@/components/ui/input";
import { useSortable } from "@dnd-kit/sortable";
import Image from "next/image";
import React from "react";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  value: string;
  order: number;
  setValue: (order: number, value: string) => void;
  handleDelete: (order: number) => void;
};

export default function ItemCard({
  value,
  order,
  setValue,
  handleDelete,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-row items-center gap-1 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <Image
        src="/images/forms/dragdots.svg"
        alt="drag_icon"
        className="hover:cursor-grab cursor-grab"
        width={16}
        height={16}
        {...attributes}
        {...listeners}
      />
      <Input
        value={value}
        onChange={(e) => setValue(order, e.target.value)}
        className="bg-white rounded-[6px]"
      />
      <Image
        src="/images/boards/delete.svg"
        alt="delete_icon"
        onClick={() => handleDelete(order)}
        width={16}
        height={16}
      />
    </div>
  );
}
