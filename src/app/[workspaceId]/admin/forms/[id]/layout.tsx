"use client";
import { FormEditorProvider } from "@/contexts/form-editor-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <FormEditorProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </FormEditorProvider>
  );
}
