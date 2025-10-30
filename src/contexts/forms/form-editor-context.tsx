import { CanvasFormField } from "@/components/forms/form-canvas";
import { Form } from "@/lib/store/types";
import React, { useContext } from "react";

interface FormEditorState {
  formFields: CanvasFormField[];
  originalFields: CanvasFormField[];
  originalForm: Form | null;
  filesToUpload: { path: string; file: File }[];
}

interface FormEditorContextType extends FormEditorState {
  setFormFields: React.Dispatch<React.SetStateAction<CanvasFormField[]>>;
  setOriginalFields: React.Dispatch<React.SetStateAction<CanvasFormField[]>>;
  setFilesToUpload: React.Dispatch<
    React.SetStateAction<{ path: string; file: File }[]>
  >;
  setOriginalForm: React.Dispatch<React.SetStateAction<Form | null>>;
}

const FormEditorContext = React.createContext<
  FormEditorContextType | undefined
>(undefined);

export function FormEditorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [formFields, setFormFields] = React.useState<CanvasFormField[]>([]);
  const [originalFields, setOriginalFields] = React.useState<CanvasFormField[]>(
    []
  );
  const [originalForm, setOriginalForm] = React.useState<Form | null>(null);
  const [filesToUpload, setFilesToUpload] = React.useState<
    { path: string; file: File }[]
  >([]);

  return (
    <FormEditorContext.Provider
      value={{
        originalForm,
        setOriginalForm,
        filesToUpload,
        setFilesToUpload,
        originalFields,
        setOriginalFields,
        formFields,
        setFormFields,
      }}
    >
      {children}
    </FormEditorContext.Provider>
  );
}

export function useFormEditor() {
  const context = useContext(FormEditorContext);
  if (context === undefined) {
    throw new Error("useFormEditor must be used within a FormEditorProvider");
  }
  return context;
}
