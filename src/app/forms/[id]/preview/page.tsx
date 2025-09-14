"use client";
import FieldRenderWrapper from "@/components/forms/content/FieldRenderWrapper";
import { useFormEditor } from "@/contexts/FormEditorContext";
import { useForms } from "@/contexts/FormsContext";
import { Divider } from "@mui/material";
import { useParams } from "next/navigation";
import React from "react";

export default function Page() {
  const params = useParams();
  const { activeForm } = useForms();
  const { formFields } = useFormEditor();

  console.log(`Previewing form ID: ${params.id}`, activeForm);

  return (
    <div className="h-full overflow-auto">
      <div className="w-full h-9 bg-[#EDF6FF] grid items-center justify-center border-1 border-[#EAE9E9]">
        <span className="text-[#133495] font-medium text-sm">
          This is a preview
        </span>
      </div>
      <div className="h-full flex justify-center p-5">
        <div className="w-full max-w-[900px] flex flex-col gap-5">
          <div className="flex flex-col p-3 gap-2 px-6 py-3">
            <span className="font-semibold text-[18px] text-[#1C1D1F]">
              Onboarding Questionnaire
            </span>
            <div className="flex flex-row gap-3 text-sm text-[#5C5E63] font-normal">
              <p>Social media Posts Post</p>
              <Divider orientation="vertical" />
              <p>Quantity: 10 posts - $99/mo</p>
            </div>
          </div>
          <div className="rounded-[8px] border-1 border-[#EAE9E9] p-8 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <span className="text-[24px] font-semibold text-[#1C1D1F]">
                {activeForm?.title}
              </span>
              <p className="font-normal text-[#5C5E63] text-sm">
                {activeForm?.description}
              </p>
            </div>
            <div className="flex flex-col gap-6">
              {formFields.map((field) => (
                <FieldRenderWrapper
                  key={field.id}
                  type={field.type}
                  config={field.config}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
