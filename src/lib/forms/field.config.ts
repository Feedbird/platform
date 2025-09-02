// import { FormFieldType } from "./fields";

import { FormFieldType } from "./fields";

export interface FieldTypeConfigEntitlements {
  title: boolean; //
  description: boolean; //
  placeholder: boolean; //
  isRequired: boolean; //
  allowMultipleSelection: boolean; //
  defaultOption: boolean; //
  optionItems: boolean;
  dropdownItems: boolean;
  helpText: boolean;
  spreadsheetColumns: boolean;
  allowedRows: boolean;
}

export type FieldTypeConfigOptionsKey = keyof FieldTypeConfigEntitlements;

// Helper function to create entitlements with only specified properties as true
function createEntitlements(
  enabledProperties: FieldTypeConfigOptionsKey[]
): FieldTypeConfigEntitlements {
  const allProperties: FieldTypeConfigEntitlements = {
    title: false,
    description: false,
    placeholder: false,
    isRequired: false,
    allowMultipleSelection: false,
    defaultOption: false,
    optionItems: false,
    dropdownItems: false,
    helpText: false,
    spreadsheetColumns: false,
    allowedRows: false,
  };

  // Set specified properties to true
  enabledProperties.forEach((prop) => {
    allProperties[prop] = true;
  });

  return allProperties;
}

type NativeType = "string" | "boolean" | "number";
type ComplexType = "selection" | "options" | "dropdown" | "spreadsheet";

interface FieldTypeFlagBaseDefinition {
  isOptional: boolean;
  isComplex: boolean;
  defaultValue?: any;
}

type ComplexObjectType = {
  order: number;
  value: string;
};

interface FieldTypeEntitlementGeneralDefinition
  extends FieldTypeFlagBaseDefinition {
  nativeType: NativeType | undefined;
  complexType: ComplexType | undefined;
}

interface FieldTypeComplexSetup
  extends Omit<FieldTypeEntitlementGeneralDefinition, "nativeType"> {
  isComplex: true;
  complexType: ComplexType;
}

type FieldTypeEntitlementNativeDefinition = Omit<
  FieldTypeEntitlementGeneralDefinition,
  "complexType"
> & {
  nativeType: NativeType;
  isComplex: false;
};

type FieldTypeEntitlementSelectionDefinition = FieldTypeComplexSetup & {
  complexType: "selection";
  selectionValues: string[];
};

type FieldTypeEntitlementOptionsDefinition = FieldTypeComplexSetup & {
  complexType: "options";
  optionValues: (ComplexObjectType & { image?: string })[];
  defaultValue: (ComplexObjectType & { image?: string })[];
};

type FieldTypeEntitlementDDDefinition = FieldTypeComplexSetup & {
  complexType: "dropdown";
  dropdownValues: ComplexObjectType[];
  defaultValue: ComplexObjectType[];
};

type FieldTypeEntitlementSpreadsheetDefinition = FieldTypeComplexSetup & {
  complexType: "spreadsheet";
  columns: ComplexObjectType[];
  defaultValue: ComplexObjectType[];
};

export type FieldTypeEntitlementDefinition =
  | FieldTypeEntitlementNativeDefinition
  | FieldTypeEntitlementSelectionDefinition
  | FieldTypeEntitlementDDDefinition
  | FieldTypeEntitlementOptionsDefinition
  | FieldTypeEntitlementSpreadsheetDefinition;

type NativeFieldKeys =
  | "title"
  | "description"
  | "placeholder"
  | "isRequired"
  | "allowMultipleSelection"
  | "allowedRows";

type SelectionFieldKeys = "defaultOption";
type OptionFieldKeys = "optionItems";
type DropdownFieldKeys = "dropdownItems";
type SpreadsheetFieldKeys = "spreadsheetColumns";

export type EntitlementsConfigMap = {
  [K in NativeFieldKeys]: FieldTypeEntitlementNativeDefinition;
} & {
  [K in SelectionFieldKeys]: FieldTypeEntitlementSelectionDefinition;
} & {
  [K in OptionFieldKeys]: FieldTypeEntitlementOptionsDefinition;
} & {
  [K in DropdownFieldKeys]: FieldTypeEntitlementDDDefinition;
} & {
  [K in SpreadsheetFieldKeys]: FieldTypeEntitlementSpreadsheetDefinition;
};

export const ENTITLEMENTS_FIELD_MAP = new Map<
  FormFieldType,
  FieldTypeConfigEntitlements
>([
  [
    "text",
    createEntitlements(["title", "description", "placeholder", "isRequired"]),
  ],
  [
    "textarea",
    createEntitlements(["title", "description", "placeholder", "isRequired"]),
  ],
  [
    "checkbox",
    createEntitlements(["title", "description", "placeholder", "isRequired"]),
  ],
  [
    "option",
    createEntitlements([
      "title",
      "description",
      "defaultOption",
      "optionItems",
      "isRequired",
      "allowMultipleSelection",
    ]),
  ],
  [
    "dropdown",
    createEntitlements([
      "title",
      "placeholder",
      "defaultOption",
      "dropdownItems",
      "helpText",
      "isRequired",
      "allowMultipleSelection",
    ]),
  ],
  [
    "attachment",
    createEntitlements(["title", "description", "placeholder", "isRequired"]),
  ],
  [
    "spreadsheet",
    createEntitlements([
      "title",
      "spreadsheetColumns",
      "allowedRows",
      "description",
      "isRequired",
    ]),
  ],
  ["section-break", createEntitlements(["title", "description"])],
  ["page-break", createEntitlements(["title", "description"])],
]);

export const ENTITLEMENTS_DEFINITIONS_MAP = new Map<
  FieldTypeConfigOptionsKey,
  FieldTypeEntitlementDefinition
>([
  [
    "title",
    {
      isComplex: false,
      nativeType: "string",
      isOptional: false,
    },
  ],
  [
    "description",
    {
      isComplex: false,
      nativeType: "string",
      isOptional: true,
    },
  ],
  [
    "placeholder",
    {
      isComplex: false,
      nativeType: "string",
      isOptional: false,
    },
  ],
  [
    "isRequired",
    {
      nativeType: "boolean",
      isComplex: false,
      isOptional: false,
      defaultValue: false,
    },
  ],
  [
    "allowMultipleSelection",
    {
      nativeType: "boolean",
      isComplex: false,
      isOptional: false,
      defaultValue: false,
    },
  ],
  [
    "defaultOption",
    {
      isComplex: true,
      complexType: "selection",
      selectionValues: [], // Editable in UI
      isOptional: false,
    },
  ],
  [
    "optionItems",
    {
      isComplex: true,
      complexType: "options",
      optionValues: [], // Editable in UI
      isOptional: false,
      defaultValue: [
        { value: "Option 1", order: 1 },
        { value: "Option 2", order: 2 },
      ],
    },
  ],
  [
    "dropdownItems",
    {
      isComplex: true,
      complexType: "dropdown",
      dropdownValues: [], // Editable in UI
      isOptional: false,
      defaultValue: [
        { value: "Label 1", order: 1 },
        { value: "Label 2", order: 2 },
      ],
    },
  ],
  [
    "spreadsheetColumns",
    {
      isComplex: true,
      complexType: "spreadsheet",
      columns: [], // Editable in UI
      isOptional: false,
      defaultValue: [
        {
          value: "Column 1",
          order: 1,
        },
        { value: "Column 2", order: 2 },
      ],
    },
  ],
]);

export type FormFieldTypeConfiguration = Record<
  FieldTypeConfigOptionsKey,
  FieldTypeEntitlementDefinition
>;

export function getFieldTypeInitialConfiguration(
  fieldType: FormFieldType
): FormFieldTypeConfiguration {
  const entitlements = ENTITLEMENTS_FIELD_MAP.get(fieldType);
  if (!entitlements) {
    throw new Error(`No entitlements found for field type: ${fieldType}`);
  }

  const mappedEntitlementDefs: Partial<
    Record<FieldTypeConfigOptionsKey, FieldTypeEntitlementDefinition>
  > = {};

  for (const [entitlement, isEnabled] of Object.entries(entitlements) as [
    FieldTypeConfigOptionsKey,
    boolean
  ][]) {
    if (isEnabled) {
      const definition = ENTITLEMENTS_DEFINITIONS_MAP.get(
        entitlement as FieldTypeConfigOptionsKey
      );
      if (definition) {
        mappedEntitlementDefs[entitlement as FieldTypeConfigOptionsKey] =
          definition;
      }
    }
  }

  return mappedEntitlementDefs as FormFieldTypeConfiguration;
}
