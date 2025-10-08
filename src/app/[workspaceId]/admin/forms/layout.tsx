"use client";
import { FormsProvider } from "@/contexts/FormsContext";
import { FormsHeader } from "@/components/forms/FormsHeader";
import { useFormStore } from "@/lib/store/forms-store";
import { useEffect } from "react";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";

export default function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchServices } = useFormStore();
  const { activeWorkspaceId } = useFeedbirdStore();
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
