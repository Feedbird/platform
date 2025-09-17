import { CanvasFormField } from "@/components/forms/FormCanvas";
import React, { useContext } from "react";

interface FormEditorState {
  formFields: CanvasFormField[];
  originalFields: CanvasFormField[];
}

interface FormEditorContextType extends FormEditorState {
  setFormFields: React.Dispatch<React.SetStateAction<CanvasFormField[]>>;
  setOriginalFields: React.Dispatch<React.SetStateAction<CanvasFormField[]>>;
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

  return (
    <FormEditorContext.Provider
      value={{
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
