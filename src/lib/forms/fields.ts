import {
  FieldTypeEntitlements,
  getFieldTypeInitialConfiguration,
} from "./field.config";

export type FormFieldType =
  | "text"
  | "textarea"
  | "checkbox"
  | "option"
  | "dropdown"
  | "attachment"
  | "spreadsheet"
  | "section-break"
  | "page-break";

export interface UIFormField {
  type: FormFieldType;
  label: string;
  iconPath: string;
  config: FieldTypeEntitlements;
}

export const UIFormFieldDefaults: Record<FormFieldType, UIFormField> = {
  text: {
    type: "text",
    label: "Single line text",
    iconPath: "/images/forms/inputs/text.svg",
    config: getFieldTypeInitialConfiguration("text", "Single line text"),
  },
  textarea: {
    type: "textarea",
    label: "Long text",
    iconPath: "/images/forms/inputs/long-text.svg",
    config: getFieldTypeInitialConfiguration("textarea", "Long text"),
  },
  checkbox: {
    type: "checkbox",
    label: "Checkbox",
    iconPath: "/images/forms/inputs/checkbox.svg",
    config: getFieldTypeInitialConfiguration("checkbox", "Checkbox"),
  },
  // TODO Add correct icons for the rest of the field types
  option: {
    type: "option",
    label: "Option group",
    iconPath: "/images/forms/inputs/option.svg",
    config: getFieldTypeInitialConfiguration("option", "Option group"),
  },
  dropdown: {
    type: "dropdown",
    label: "Dropdown menu",
    iconPath: "/images/forms/inputs/dropdown.svg",
    config: getFieldTypeInitialConfiguration("dropdown", "Dropdown menu"),
  },
  attachment: {
    type: "attachment",
    label: "Attachment",
    iconPath: "/images/forms/inputs/attachment.svg",
    config: getFieldTypeInitialConfiguration("attachment", "Attachment"),
  },
  spreadsheet: {
    type: "spreadsheet",
    label: "Spreadsheet input",
    iconPath: "/images/forms/inputs/spreadsheet.svg",
    config: getFieldTypeInitialConfiguration(
      "spreadsheet",
      "Spreadsheet input"
    ),
  },
  "section-break": {
    type: "section-break",
    label: "Section break",
    iconPath: "/images/forms/inputs/section-break.svg",
    config: getFieldTypeInitialConfiguration("section-break", "Section break"),
  },
  "page-break": {
    type: "page-break",
    label: "Page break",
    iconPath: "/images/forms/inputs/page-break.svg",
    config: getFieldTypeInitialConfiguration("page-break", "Page break"),
  },
};

export const FormFieldsArray: UIFormField[] =
  Object.values(UIFormFieldDefaults);
