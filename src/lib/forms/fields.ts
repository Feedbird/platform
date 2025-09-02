import {
  FormFieldTypeConfiguration,
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
  config: FormFieldTypeConfiguration;
}

export const UIFormFieldDefaults: Record<FormFieldType, UIFormField> = {
  text: {
    type: "text",
    label: "Single line text",
    iconPath: "/images/forms/inputs/text.svg",
    config: getFieldTypeInitialConfiguration("text"),
  },
  textarea: {
    type: "textarea",
    label: "Long text",
    iconPath: "/images/forms/inputs/long-text.svg",
    config: getFieldTypeInitialConfiguration("textarea"),
  },
  checkbox: {
    type: "checkbox",
    label: "Checkbox",
    iconPath: "/images/forms/inputs/checkbox.svg",
    config: getFieldTypeInitialConfiguration("checkbox"),
  },
  // TODO Add correct icons for the rest of the field types
  option: {
    type: "option",
    label: "Option group",
    iconPath: "/images/forms/inputs/option.svg",
    config: getFieldTypeInitialConfiguration("option"),
  },
  dropdown: {
    type: "dropdown",
    label: "Dropdown menu",
    iconPath: "/images/forms/inputs/dropdown.svg",
    config: getFieldTypeInitialConfiguration("dropdown"),
  },
  attachment: {
    type: "attachment",
    label: "Attachment",
    iconPath: "/images/forms/inputs/attachment.svg",
    config: getFieldTypeInitialConfiguration("attachment"),
  },
  spreadsheet: {
    type: "spreadsheet",
    label: "Spreadsheet input",
    iconPath: "/images/forms/inputs/spreadsheet.svg",
    config: getFieldTypeInitialConfiguration("spreadsheet"),
  },
  "section-break": {
    type: "section-break",
    label: "Section break",
    iconPath: "/images/forms/inputs/section-break.svg",
    config: getFieldTypeInitialConfiguration("section-break"),
  },
  "page-break": {
    type: "page-break",
    label: "Page break",
    iconPath: "/images/forms/inputs/page-break.svg",
    config: getFieldTypeInitialConfiguration("page-break"),
  },
};

export const FormFieldsArray: UIFormField[] =
  Object.values(UIFormFieldDefaults);
