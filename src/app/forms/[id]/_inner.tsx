"use client";

import { Input } from "@/components/ui/input";
import { Form } from "@/lib/supabase/client";
import Image from "next/image";
import React from "react";

type FormInnerVisualizerProps = {
  form: Form;
};

export default function FormInnerVisualizer({
  form,
}: FormInnerVisualizerProps) {
  return (
    <div className="w-full rounded-lg border-border-primary border-1">
      <div className="w-full h-[160px] bg-[#F4F5F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/images/forms/image-plus.svg"
            width={16}
            height={16}
            alt="add-image-icon"
          />
          <div className="flex flex-col text-center">
            <span className="text-sm underline hover:cursor-pointer text-black font-medium">
              +Add Cover
            </span>
            <p className="text-sm text-gray-500">Optimal dimensions 920x160</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-6 gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-2 p-3">
            <h2 className="text-[#1C1D1F] font-semibold text-3xl">
              {form.title}
            </h2>
            <p className="text-[13px] text-[#5C5E63] font-normal">
              {form.description ?? "Add description here"}
            </p>
          </div>
          <div className="flex flex-col p-3 gap-2">
            <div>
              <span className="text-[#1C1D1F] text-sm">Your company name</span>
              <p className="text-[#5C5E63] text-[13px]">
                Giving this project a title will help you find it later.
              </p>
            </div>
            <Input className="border-[#D3D3D3] border-1 rounded-[6px] px-3 py-1.5" />
          </div>
        </div>

        <div className="p-3 w-full h-[60px]">
          <div className="bg-[#EDF6FF] w-full h-full border-[#4670F9] border-1 border-dashed">
            <span className="text-[#4670F9] text-[13px] flex items-center justify-center h-full">
              +Add Components
            </span>
          </div>
        </div>
        <div className="flex flex-row py-6 px-3 gap-3 items-center">
          <Image
            src="/images/logo/logo.png"
            alt="feedbird_logo"
            width={87}
            height={14}
            className="h-3.5"
          />
          <span className="text-xs text-gray-500 h-4">
            Do not submit passwords through this form. Report malicious form
          </span>
        </div>
      </div>
    </div>
  );
}
