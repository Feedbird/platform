"use client";
import FormEditorSideBar from "@/components/forms/FormEditorSideBar";
import FormCanvas, { FormField } from "@/components/forms/FormCanvas";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  pointerWithin,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import React from "react";
import { useForms } from "@/contexts/FormsContext";
import ServiceSelector from "@/components/forms/content/ServiceSelector";
import { Form } from "@/lib/supabase/client";
import {
  FormFieldsArray,
  FormFieldType,
  UIFormFieldDefaults,
} from "@/lib/forms/fields";
import { BaseContent } from "@/components/forms/content/DraggableFieldType";
import Image from "next/image";
import { useParams } from "next/navigation";
import { formsApi } from "@/lib/api/api-service";
import Loading from "./loading";
import FormTypeConfig from "@/components/forms/content/FormTypeConfig";

type SelectedField = {
  id: string;
  type: string;
  config: any;
};

export default function FormInnerVisualizer() {
  const { setIsEditing, setActiveForm } = useForms();
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = React.useState<Form | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Form fields state - local to the form editor
  const [formFields, setFormFields] = React.useState<FormField[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null); // For drag operations
  const [overId, setOverId] = React.useState<string | null>(null);
  const [selectedField, setSelectedField] =
    React.useState<SelectedField | null>(null); // For field settings/editing

  const fieldDefs = React.useMemo(() => UIFormFieldDefaults, []);

  const updateFieldConfig = (fieldId: string, newConfig: any) => {
    setFormFields((prevFields) =>
      prevFields.map((field) =>
        field.id === fieldId ? { ...field, config: newConfig } : field
      )
    );
  };

  const retrieveForm = async (formId: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await formsApi.getFormById(formId);
      setForm(data);
      // Convert Form to TableForm and update the FormsContext with the active form
      const tableForm = {
        ...data,
        services: data.services || [],
        submissions_count: 0, // Default values for table-specific properties
        fields_count: 0,
      };
      setActiveForm(tableForm);
    } catch (err) {
      console.error("Error fetching form:", err);
      setError(err instanceof Error ? err.message : "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (formId) {
      retrieveForm(formId);
    }
  }, [formId]);
  // Set edit mode when this layout mounts
  React.useEffect(() => {
    setIsEditing(true);
    return () => {
      // Clean up edit mode and active form when leaving
      setIsEditing(false);
      setActiveForm(null);
    };
  }, [setIsEditing, setActiveForm]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    // Check if dragging from sidebar (template) to form area
    if (active.data.current?.type === "template") {
      if (over.id === "form-canvas") {
        addNewField(active.id as FormFieldType);
      } else if (formFields.find((f) => f.id === over.id)) {
        // Dropping over an existing field - insert before it
        const targetIndex = formFields.findIndex((f) => f.id === over.id);
        addNewFieldAtPosition(active.id as FormFieldType, targetIndex);
      }
    }

    // Handle field reordering within the form
    if (active.id !== over.id && formFields.find((f) => f.id === active.id)) {
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

  const addNewField = (fieldType: FormFieldType) => {
    const fieldDef = fieldDefs[fieldType];

    const newField: FormField = {
      id: crypto.randomUUID(),
      type: fieldType.toLowerCase(),
      position: formFields.length,
      config: UIFormFieldDefaults[fieldType].config,
    };

    setFormFields((prev) => {
      const updated = [...prev, newField];
      return updated;
    });
  };

  const addNewFieldAtPosition = (
    fieldType: FormFieldType,
    insertIndex: number
  ) => {
    const fieldDef = fieldDefs[fieldType];

    const newField: FormField = {
      id: crypto.randomUUID(),
      type: fieldType.toLowerCase(),
      position: insertIndex,
      config: UIFormFieldDefaults[fieldType].config,
    };

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
    activeTemplateField?.label ||
    activePlacedField?.config.title.value ||
    "Field";

  if (loading) {
    return <Loading />;
  }

  if (error || !form) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Form</h2>
          <p className="text-gray-600">{error || "Form not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      collisionDetection={pointerWithin}
    >
      <div className="w-full h-full flex bg-[#FBFBFB] overflow-hidden relative">
        <div className="flex-1 min-w-0 overflow-auto relative pb-10">
          <ServiceSelector formServices={form.services || []} />
          <FormCanvas
            formFields={formFields}
            setFormFields={setFormFields}
            form={form}
            activeId={activeId}
            overId={overId}
            selectedFieldId={selectedField?.id || null}
            onFieldSelect={(
              val: { id: string; type: string; config: any } | null
            ) => {
              setSelectedField(val);
            }}
          />
        </div>
        <FormEditorSideBar onAddField={addNewField} />
        <FormTypeConfig
          fieldId={selectedField?.id || ""}
          updateFieldConfig={updateFieldConfig}
          setVisible={setSelectedField}
          isVisible={selectedField !== null}
          config={selectedField?.config}
        />
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
