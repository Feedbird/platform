"use client";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import InputCard from "./content/InputCard";
import React from "react";
import { FormFieldsArray } from "@/lib/forms/fields";

export default function FormEditorSideBar() {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  const storedFields = React.useMemo(() => FormFieldsArray, []);

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    console.log("🚀 Started dragging field template:", event.active.id);
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    console.log("🚀 Dropped field template:", event);
    const { active, over } = event;

    if (over) {
      // This is where you'd handle dropping the field template onto a form builder area
      console.log(
        `🚀 Would create new ${active.id} field at position:`,
        over.id
      );
      // Example: addFieldToForm(active.id, over.id);
    }

    setActiveId(null);
  }, []);

  return (
    <div className="border-border-primary border-l-1 w-[320px] h-full flex-shrink-0">
      <header className="border-border-primary border-b-1 w-full p-3 text-black font-medium">
        Fields
      </header>
      <div className="p-4 flex flex-col gap-4">
        <p className="text-[#838488] text-[13px]">
          Double-click or drag and drop fields from the right column onto your
          form here.
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 gap-2">
            {storedFields.map((field, idx) => (
              <InputCard
                key={idx}
                id={field.label}
                label={field.label}
                icon={field.iconPath}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
