import FormEditorSideBar from "@/components/forms/FormEditorSideBar";
import React from "react";

export default function FormVisualizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-screen flex">
      <form className="flex-1 min-w-0 overflow-auto">{children}</form>
      <FormEditorSideBar />
    </div>
  );
}
