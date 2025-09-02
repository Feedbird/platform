"use client";

import React from "react";
import Image from "next/image";
import { FormFieldsArray } from "@/lib/forms/fields";
import { Button } from "../ui/button";
import { DraggableFieldType } from "./content/DraggableFieldType";

export default function FormEditorSideBar() {
  const formFields = React.useMemo(
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
            {formFields.map((field) => (
              <DraggableFieldType key={field.type} {...field} />
            ))}
          </div>
        </div>
        <Button
          variant="default"
          className="w-full mt-4 shadow-lg bg-[#4670F9] text-white text-sm rounded-sm"
        >
          Save Form
        </Button>
      </div>
    </div>
  );
}
