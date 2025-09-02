"use client";
import FormEditorSideBar from "@/components/forms/FormEditorSideBar";
import FormCanvas, { FormField } from "@/components/forms/FormCanvas";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  closestCenter,
  pointerWithin,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import React from "react";
import { useForms } from "@/contexts/FormsContext";
import ServiceSelector from "@/components/forms/content/ServiceSelector";
import { Form } from "@/lib/supabase/client";
import { FormFieldsArray, UIFormFieldDefaults } from "@/lib/forms/fields";
import {
  BaseContent,
  DraggableFieldType,
} from "@/components/forms/content/DraggableFieldType";
import Image from "next/image";

type FormInnerVisualizerProps = {
  form: Form;
};

export default function FormInnerVisualizer({
  form,
}: FormInnerVisualizerProps) {
  const { setIsEditing } = useForms();

  // Form fields state - local to the form editor
  const [formFields, setFormFields] = React.useState<FormField[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  // Set edit mode when this layout mounts
  React.useEffect(() => {
    setIsEditing(true);
    return () => {
      // Clean up edit mode when leaving
      setIsEditing(false);
    };
  }, [setIsEditing]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log("🚀 Drag ended:", {
      activeId: active.id,
      overId: over?.id,
      activeData: active.data.current,
      overData: over?.data.current,
      currentFieldsCount: formFields.length,
    });

    if (!over) {
      console.log("❌ No drop target found");
      setActiveId(null);
      return;
    }

    // Check if dragging from sidebar (template) to form area
    if (active.data.current?.type === "template") {
      if (over.id === "form-canvas") {
        console.log("✅ Adding new field from template to end");
        addNewField(active.id as string);
      } else if (formFields.find((f) => f.id === over.id)) {
        // Dropping over an existing field - insert before it
        console.log("✅ Adding new field from template at position");
        const targetIndex = formFields.findIndex((f) => f.id === over.id);
        addNewFieldAtPosition(active.id as string, targetIndex);
      }
    }

    // Handle field reordering within the form
    if (active.id !== over.id && formFields.find((f) => f.id === active.id)) {
      console.log("🔄 Reordering existing fields");
      setFormFields((fields) => {
        const oldIndex = fields.findIndex((f) => f.id === active.id);
        const newIndex = fields.findIndex((f) => f.id === over.id);

        const newFields = arrayMove(fields, oldIndex, newIndex);
        // Update order values
        return newFields.map((field, index) => ({
          ...field,
          order: index,
        }));
      });
    }

    setActiveId(null);
    setOverId(null);
  };

  const addNewField = (fieldType: string) => {
    // Generate a more unique ID using timestamp and random number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const newField: FormField = {
      id: `field_${fieldType}_${timestamp}_${random}`,
      type: fieldType.toLowerCase(),
      label: `New ${fieldType} Field`,
      position: formFields.length,
    };

    console.log("🎯 Creating field:", newField);
    console.log("📊 Current form fields count:", formFields.length);
    setFormFields((prev) => {
      const updated = [...prev, newField];
      console.log("📊 Updated form fields count:", updated.length);
      return updated;
    });
  };

  const addNewFieldAtPosition = (fieldType: string, insertIndex: number) => {
    // Generate a more unique ID using timestamp and random number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const newField: FormField = {
      id: `field_${fieldType}_${timestamp}_${random}`,
      type: fieldType.toLowerCase(),
      label: `New ${fieldType} Field`,
      position: insertIndex,
    };

    console.log("🎯 Creating field at position:", insertIndex, newField);
    setFormFields((prev) => {
      const updated = [...prev];
      updated.splice(insertIndex, 0, newField);
      // Update positions for all fields
      return updated.map((field, index) => ({
        ...field,
        position: index,
      }));
    });
  };

  const handleDragStart = (event: any) => {
    console.log("🚀 Drag started:", event.active.id);
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string | null);
  };

  // Find active field - could be a template or an already placed field
  const activeTemplateField = FormFieldsArray.find(
    (f) => f.type.toLowerCase() === activeId
  );

  const activePlacedField = formFields.find((f) => f.id === activeId);
  const activePlacedFieldTemplate = activePlacedField
    ? FormFieldsArray.find(
        (f) => f.type.toLowerCase() === activePlacedField.type
      )
    : null;

  const displayField = activeTemplateField || activePlacedFieldTemplate;
  const displayLabel =
    activeTemplateField?.label || activePlacedField?.label || "Field";

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      collisionDetection={pointerWithin}
    >
      <div className="w-full h-full flex bg-[#FBFBFB]">
        <div className="flex-1 min-w-0 overflow-auto">
          <ServiceSelector />
          <FormCanvas
            formFields={formFields}
            setFormFields={setFormFields}
            form={form}
            activeId={activeId}
            overId={overId}
          />
        </div>
        <FormEditorSideBar />
      </div>

      <DragOverlay>
        {activeId && displayField && (
          <div className="py-2 transform -rotate-1 px-2.5 border border-gray-200 rounded-sm shadow-none cursor-grab hover:bg-gray-50 transition-colors">
            <BaseContent
              icon={
                <Image
                  src={displayField.iconPath}
                  alt={`icon_${displayLabel}`}
                  width={15}
                  height={15}
                />
              }
              label={displayLabel}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
