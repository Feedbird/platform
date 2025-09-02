"use client";
import FormEditorSideBar from "@/components/forms/FormEditorSideBar";
import FormCanvas, { FormField } from "@/components/forms/FormCanvas";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import React from "react";
import { useForms } from "@/contexts/FormsContext";

export default function FormVisualizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use the forms context to set edit mode
  const { setIsEditing } = useForms();

  // Form fields state - local to the form editor
  const [formFields, setFormFields] = React.useState<FormField[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);

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
    if (active.data.current?.type === "template" && over.id === "form-canvas") {
      console.log("✅ Adding new field from template");
      addNewField(active.id as string);
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

  const handleDragStart = (event: any) => {
    console.log("🚀 Drag started:", event.active.id);
    setActiveId(event.active.id as string);
  };

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      collisionDetection={closestCenter}
    >
      <div className="w-full h-full flex">
        <div className="flex-1 min-w-0 overflow-auto">
          <FormCanvas formFields={formFields} setFormFields={setFormFields} />
          {children}
        </div>
        <FormEditorSideBar />
      </div>

      <DragOverlay>
        {activeId && (
          <div className="bg-white border border-blue-300 rounded-lg p-3 shadow-lg opacity-90">
            <div className="flex items-center gap-2">
              <span className="font-medium">{activeId}</span>
              <span className="text-sm text-gray-500">field</span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
