"use client";
import { FormsProvider } from "@/contexts/forms-context";
import { FormsHeader } from "@/components/forms/forms-header";
import { useEffect } from "react";
import { useWorkspaceStore, useFormStore } from "@/lib/store";

export default function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchServices } = useFormStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  useEffect(() => {
    fetchServices(activeWorkspaceId!);
  }, [fetchServices]);
  return (
    <FormsProvider>
      <div className="h-screen flex flex-col w-full">
        <FormsHeader />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </FormsProvider>
  );
}
