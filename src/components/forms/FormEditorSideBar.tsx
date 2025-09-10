"use client";

import React from "react";
import Image from "next/image";
import { FormFieldsArray, FormFieldType } from "@/lib/forms/fields";
import { Button } from "../ui/button";
import { DraggableFieldType } from "./content/DraggableFieldType";
import { CanvasFormField } from "./FormCanvas";
import { formsApi } from "@/lib/api/api-service";
import { toast } from "sonner";

type FormEditorSideBarProps = {
  onAddField?: (fieldType: FormFieldType) => void;
  formFields: CanvasFormField[];
  formId: string;
};

export default function FormEditorSideBar({
  onAddField,
  formFields,
  formId,
}: FormEditorSideBarProps) {
  const [loading, isLoading] = React.useState(false);

  console.log(formFields);
  const updateFormFields = async () => {
    isLoading(true);
    try {
      await formsApi.updateFormFields(formId, formFields);
      toast.success("Form fields updated");
    } catch (e) {
      toast.error("Failed to update form fields. Please try again.");
      console.error("Error updating form fields:", e);
    } finally {
      isLoading(false);
    }
  };

  const fields = React.useMemo(
    () =>
      FormFieldsArray.map((field) => ({
        type: field.type,
        label: field.label,
        icon: (
          <Image
            src={field.iconPath}
            alt={`icon_${field.type}`}
            width={15}
            height={15}
          />
        ),
      })),
    []
  );

  return (
    <div className="border-border-primary border-l-1 w-[320px] bg-[#FAFAFA] h-full flex-shrink-0 flex flex-col">
      <header className="border-border-primary border-b-1 w-full p-3 text-black font-medium">
        Fields
      </header>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[#838488] text-sm mb-4">
          Double-click or drag and drop fields from the right column onto your
          form here.
        </p>

        <div className="space-y-6 flex-1">
          <div className="space-y-2">
            {fields.map((field) => (
              <DraggableFieldType
                key={field.type}
                {...field}
                onAddField={onAddField}
              />
            ))}
          </div>
        </div>
        <Button
          onClick={updateFormFields}
          disabled={loading}
          variant="default"
          className="w-full mt-4 hover:cursor-pointer shadow-lg bg-[#4670F9] text-white text-sm rounded-sm"
        >
          {loading && (
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
          )}
          Save Form
        </Button>
      </div>
    </div>
  );
}
