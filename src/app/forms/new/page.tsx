import FormSelectorCard from "@/components/forms/content/FormSelectorCard";
import { DynamicTitle } from "@/components/layout/dynamic-title";
import React, { Suspense } from "react";
import NewFormInner from "./_inner";

export default function CreateNewForm() {
  return (
    <>
      <DynamicTitle />
      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <NewFormInner />
      </Suspense>
    </>
  );
}
