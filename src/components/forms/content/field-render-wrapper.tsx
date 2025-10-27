import React from "react";
import {
  AttachmentInput,
  CheckboxInput,
  DropdownInput,
  OptionInput,
  PageBreakInput,
  SectionBreakInput,
  SingleTextInput,
  SpreadSheetInput,
  TextAreaInput,
} from "./form-inputs";

type Props = {
  config: any;
  type: string;
  isPreview?: boolean;
  pageNumber?: number;
};

export default function FieldRenderWrapper({
  type,
  config,
  isPreview = false,
  pageNumber,
}: Props) {
  return (
    <div>
      {type === "text" && <SingleTextInput config={config} />}

      {type === "textarea" && <TextAreaInput config={config} />}

      {type === "dropdown" && <DropdownInput config={config} />}

      {type === "checkbox" && (
        <CheckboxInput config={config} isPreview={isPreview} />
      )}

      {type === "section-break" && <SectionBreakInput config={config} />}

      {type === "attachment" && (
        <AttachmentInput config={config} isPreview={isPreview} />
      )}

      {type === "spreadsheet" && (
        <SpreadSheetInput config={config} isPreview={isPreview} />
      )}

      {type === "option" && <OptionInput config={config} />}

      {type === "page-break" && (
        <PageBreakInput
          config={config}
          isPreview={isPreview}
          pageNumber={pageNumber ?? 1}
        />
      )}
    </div>
  );
}
