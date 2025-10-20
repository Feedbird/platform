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
  parent: FormSubmissionData;
  setParent: React.Dispatch<React.SetStateAction<FormSubmissionData>>;
  fields: FormField[];
};

export default function InputRender({ fields, setParent, parent }: Props) {
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
              parentValue={parent[field.id]?.value || ""}
              key={`input-${field.type}-${idx}`}
              setParent={handleParenChange}
              field={field}
            />
          )}
          {field.type === "textarea" && (
            <LongTextControlled
              parentValue={parent[field.id]?.value || ""}
              key={`input-${field.type}-${idx}`}
              setParent={handleParenChange}
              field={field}
            />
          )}
          {field.type === "checkbox" && (
            <CheckboxControlled
              parentValue={parent[field.id]?.value || "no"}
              key={`input-${field.type}-${idx}`}
              setParent={handleParenChange}
              field={field}
            />
          )}
          {field.type === "dropdown" && (
            <DropdownControlled
              parentValue={parent[field.id]?.value || ""}
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
              parentValue={parent[field.id]?.value || []}
              key={`input-${field.type}-${idx}`}
              setParent={handleParenChange}
              field={field}
            />
          )}
          {field.type === "attachment" && (
            <AttachmentControlled
              parentValue={parent[field.id]?.value || ""}
              key={`input-${field.type}-${idx}`}
              setParent={handleParenChange}
              field={field}
            />
          )}
          {field.type === "spreadsheet" && (
            <SpreadSheetControlled
              parentValue={parent[field.id]?.value || []}
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
