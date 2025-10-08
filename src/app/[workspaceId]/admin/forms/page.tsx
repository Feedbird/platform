import { DynamicTitle } from "@/components/layout/dynamic-title";
import React, { Suspense } from "react";
import FormsInner from "./_inner";

export default function FormsPage() {
  return (
    <>
      <DynamicTitle />
      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <FormsInner />
      </Suspense>
    </>
  );
}
