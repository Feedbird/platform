"use client";
import { FormsProvider } from "@/contexts/FormsContext";
import { FormsHeader } from "@/components/forms/FormsHeader";

export default function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FormsProvider>
      <div className="h-screen flex flex-col w-full">
        <FormsHeader />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </FormsProvider>
  );
}
