"use client";
import { TableForm } from "@/components/forms/content/forms-table";
import React, { createContext, useContext, useState, ReactNode } from "react";

/**
 * There's no need to have forms globally available.
 * This context is specifically for managing state within the forms section,
 * including the forms list and the currently active form being edited.
 */
interface FormsContextType {
  // Current forms list
  forms: TableForm[];
  setForms: React.Dispatch<React.SetStateAction<TableForm[]>>;

  // Currently active/editing form
  activeForm: TableForm | null;
  setActiveForm: React.Dispatch<React.SetStateAction<TableForm | null>>;

  // Loading states
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // Edit mode state
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;

  isPreview: boolean;
  setIsPreview: React.Dispatch<React.SetStateAction<boolean>>;

  // Helper functions
  selectFormForEditing: (form: TableForm) => void;
}

const FormsContext = createContext<FormsContextType | undefined>(undefined);

export function FormsProvider({ children }: { children: ReactNode }) {
  const [forms, setForms] = useState<TableForm[]>([]);
  const [activeForm, setActiveForm] = useState<TableForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const selectFormForEditing = (form: TableForm) => {
    setActiveForm(form);
    setIsEditing(true);
  };

  return (
    <FormsContext.Provider
      value={{
        isPreview,
        setIsPreview,
        forms,
        setForms,
        activeForm,
        setActiveForm,
        loading,
        setLoading,
        isEditing,
        setIsEditing,
        selectFormForEditing,
      }}
    >
      {children}
    </FormsContext.Provider>
  );
}

export function useForms() {
  const context = useContext(FormsContext);
  if (context === undefined) {
    throw new Error("useForms must be used within a FormsProvider");
  }
  return context;
}
