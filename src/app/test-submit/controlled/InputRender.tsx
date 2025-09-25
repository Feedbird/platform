import { FormField } from "@/lib/supabase/client";
import React from "react";
import {
  AttachmentControlled,
  CheckboxControlled,
  DropdownControlled,
  LongTextControlled,
  OptionsControlled,
  SingleTextControlled,
  SpreadSheetControlled,
} from "./ControlledInputs";
import { FormSubmissionData } from "../_inner";
import { SectionBreakInput } from "@/components/forms/content/FormInputs";

type Props = {
  setParent: React.Dispatch<React.SetStateAction<FormSubmissionData>>;
  fields: FormField[];
};

export default function InputRender({ fields, setParent }: Props) {
  const handleParenChange = (
    value: string | string[] | File,
    field: FormField
  ) => {
    setParent((prev) => ({ ...prev, [field.id]: { type: field.type, value } }));
  };
  return (
    <div className="flex flex-col gap-8">
      {fields.map((field, idx) => (
        <div key={`divider-${field.id}-${idx}`}>
          {field.type === "text" && (
            <SingleTextControlled
              key={`input-${field.type}-${idx}`}
              setParent={handleParenChange}
              field={field}
            />
          )}
          {field.type === "textarea" && (
            <LongTextControlled
              key={`input-${field.type}-${idx}`}
              setParent={handleParenChange}
              field={field}
            />
          )}
          {field.type === "checkbox" && (
            <CheckboxControlled
              key={`input-${field.type}-${idx}`}
              setParent={handleParenChange}
              field={field}
            />
          )}
          {field.type === "dropdown" && (
            <DropdownControlled
              key={`input-${field.type}-${idx}`}
              setParent={handleParenChange}
              field={field}
            />
          )}
          {field.type === "section-break" && (
            <SectionBreakInput
              key={`input-${field.type}-${idx}`}
              config={field.config}
            />
          )}
          {field.type === "option" && (
            <OptionsControlled
              key={`input-${field.type}-${idx}`}
              setParent={handleParenChange}
              field={field}
            />
          )}
          {field.type === "attachment" && (
            <AttachmentControlled
              key={`input-${field.type}-${idx}`}
              setParent={handleParenChange}
              field={field}
            />
          )}
          {field.type === "spreadsheet" && (
            <SpreadSheetControlled
              key={`input-${field.type}-${idx}`}
              setParent={handleParenChange}
              field={field}
            />
          )}
        </div>
      ))}
    </div>
  );
}
