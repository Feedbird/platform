import { Input } from "@/components/ui/input";
import { useSortable } from "@dnd-kit/sortable";
import Image from "next/image";
import React from "react";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  value: string;
  order: number;
  image?: string;
  setValue: (order: number, value: string, image?: string) => void;
  handleDelete: (order: number) => void;
};

export default function OptionItemCard({
  value,
  order,
  image,
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

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleOptionFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, create a local preview URL
      const previewUrl = URL.createObjectURL(file);
      setValue(order, value, previewUrl);

      // TODO: Implement actual upload using the useImageUploader hook
    }
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
      {image ? (
        <div className="w-20 h-20 aspect-square rounded-sm border-1 border-[#D3D3D3] p-0 relative">
          <Image
            src={image}
            alt="option_image"
            width={100}
            height={100}
            className="w-full h-full object-cover object-top"
          />
          <Image
            src="/images/forms/delete-red.svg"
            alt="remove_image"
            width={15}
            onClick={() => setValue(order, value, "")}
            height={15}
            className="absolute top-1 right-1 hover:cursor-pointer"
          />
        </div>
      ) : (
        <div
          onClick={handleOptionFileClick}
          className="hover:cursor-pointer border-1 w-9 aspect-square border-[#D3D3D3] rounded-[6px] flex items-center justify-center"
        >
          <Image
            src="/images/forms/plus-blue.svg"
            alt="add_image_icon"
            width={16}
            height={16}
          />
        </div>
      )}
      <Input
        value={value}
        onChange={(e) => setValue(order, e.target.value)}
        className="bg-white rounded-[6px]"
      />
      <Image
        src="/images/boards/delete.svg"
        alt="delete_icon"
        className="hover:cursor-pointer"
        onClick={() => handleDelete(order)}
        width={16}
        height={16}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
