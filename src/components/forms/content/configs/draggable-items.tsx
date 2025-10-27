import { ComplexObjectType } from "@/lib/forms/field.config";
import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import React from "react";
import ItemCard from "./item-card";
import OptionItemCard from "./option-item-card";

export interface DraggableItemType extends ComplexObjectType {
  image?: string;
}

type Props = {
  items: DraggableItemType[];
  isOptionConfig?: boolean;
  addText: string;
  handleItemDeletion: (order: number) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleSingleItemValueChange: (
    order: number,
    val: string,
    image?: string
  ) => void;
  handleCreateItem: () => void;
};

export default function DraggableItems({
  items,
  addText,
  isOptionConfig = false,
  handleItemDeletion,
  handleDragEnd,
  handleSingleItemValueChange,
  handleCreateItem,
}: Props) {
  const itemsIds = items.map((item) => item.value);

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[#5C5E63] text-sm font-normal ">Items</label>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={itemsIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {items.map((item, index) => {
              if (isOptionConfig) {
                return (
                  <OptionItemCard
                    key={item.order + 1}
                    value={item.value}
                    image={item.image}
                    setValue={handleSingleItemValueChange}
                    order={index}
                    handleDelete={handleItemDeletion}
                  />
                );
              }
              return (
                <ItemCard
                  handleDelete={handleItemDeletion}
                  key={item.order + 1}
                  order={index}
                  setValue={handleSingleItemValueChange}
                  value={item.value}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
      <span
        className="text-[#4670F9] font-medium text-sm mt-1 hover:underline cursor-pointer"
        onClick={handleCreateItem}
      >
        {addText}
      </span>
    </div>
  );
}
