"use client";

import FormSelectorCard from "@/components/forms/content/FormSelectorCard";
import { useFormStore } from "@/lib/store/forms-store";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { useRouter } from "next/navigation";
import React from "react";

export default function NewFormInner() {
  const router = useRouter();
  const { createInitialForm } = useFormStore();
  const { user, activeWorkspaceId } = useFeedbirdStore();

  const handleNewForm = async () => {
    if (!user?.email || !activeWorkspaceId) {
      console.error("User email & active workspace is not available.");
      return;
    }
    try {
      const form = await createInitialForm(user.email, activeWorkspaceId);
      router.push(`/forms/${form.id}`);
    } catch (error) {
      console.error("Error creating new form:", error);
    }
  };

  return (
    <div className="w-full h-full relative items-center flex">
      <div className="flex flex-col md:flex-row w-full justify-center gap-8 p-10">
        <FormSelectorCard text="Select template" />
        <FormSelectorCard onClick={handleNewForm} text="Build form" />
      </div>
    </div>
  );
}
