"use client";
import React, { Suspense } from "react";
import { SidebarTrigger } from "../ui/sidebar";
import { Button } from "../ui/button";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { useFormStore } from "@/lib/store/forms-store";
import { useForms } from "@/contexts/FormsContext";

export function FormsHeader() {
  return (
    <Suspense fallback={<header className="h-12" />}>
      <FormsHeaderContent />
    </Suspense>
  );
}

function FormsHeaderContent() {
  const [loading, isLoading] = React.useState(false);

  const router = useRouter();
  const { user, activeWorkspaceId } = useFeedbirdStore();
  const { createInitialForm } = useFormStore();
  const { activeForm, isEditing } = useForms();

  const handleInitialFormCreation = async () => {
    isLoading(true);
    try {
      if (!user || !activeWorkspaceId) {
        throw new Error("User or active workspace not found");
      }
      const newForm = await createInitialForm(user.email, activeWorkspaceId);
      router.push(`/forms/${newForm.id}`);
    } catch (e) {
      console.error("Error creating initial form:", e);
      throw new Error("Error creating initial form"); //! TODO Check toasts
    } finally {
      isLoading(false);
    }
  };

  return (
    <header
      className="relative
      h-[52px] flex justify-between w-full items-between border-b border-border-primary pl-4 pr-2.5 py-2.5 gap-4 bg-white
    "
    >
      <div className="flex flex-row gap-2 items-center">
        <SidebarTrigger className="cursor-pointer shrink-0" />
        <span className="font-semibold text-lg tracking-[-0.6px] truncate max-w-[200px] text-[#1C1D1F]">
          {isEditing && activeForm
            ? `Editing: ${activeForm.title || activeForm.id}`
            : "Forms"}
        </span>
      </div>
      <div className="flex flex-row gap-4">
        <div className="flex flex-row gap-2">
          {isEditing && activeForm && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Form ID:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {activeForm.id}
              </code>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="border border-border-button rounded-[6px] bg-main text-white px-[12px] py-[7px] gap-[4px] cursor-pointer text-sm font-medium"
            onClick={handleInitialFormCreation}
          >
            {loading ? "Creating..." : "+ New Form"}
          </Button>
        </div>
        <UserButton afterSignOutUrl="/landing" />
      </div>
    </header>
  );
}
