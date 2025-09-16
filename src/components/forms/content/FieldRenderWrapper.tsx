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
} from "./FormInputs";

type Props = {
  config: any;
  type: string;
  isPreview?: boolean;
};

export default function FieldRenderWrapper({
  type,
  config,
  isPreview = false,
}: Props) {
  return (
    <div>
      {type === "text" && <SingleTextInput config={config} />}

      {type === "textarea" && <TextAreaInput config={config} />}

      {type === "dropdown" && <DropdownInput config={config} />}

      {type === "checkbox" && <CheckboxInput config={config} />}

      {type === "section-break" && <SectionBreakInput config={config} />}
      {type === "attachment" && <AttachmentInput config={config} />}

      {type === "spreadsheet" && <SpreadSheetInput config={config} />}

      {type === "option" && <OptionInput config={config} />}

      {type === "page-break" && (
        <PageBreakInput config={config} isPreview={isPreview} />
      )}
    </div>
  );
}
