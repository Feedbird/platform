"use client";
import { Input } from "@/components/ui/input";
import React from "react";
import { CheckoutFormInformation } from "@/app/[workspaceId]/admin/services/checkout/_inner";
import AdvancedTextArea from "@/components/ui/AdvancedTextArea";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { Settings2 } from "lucide-react";

type Props = {
  checkoutInfo: CheckoutFormInformation;
  setCheckoutInfo: React.Dispatch<
    React.SetStateAction<CheckoutFormInformation>
  >;
};

export default function CheckoutFormInfo({
  checkoutInfo,
  setCheckoutInfo,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-black font-medium text-sm">Name</span>
        <Input className="rounded-sm bg-white border-buttonStroke" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-black font-medium text-sm">Form information</span>
        <AdvancedTextArea value="" setter={() => {}} />
      </div>
      <div className="flex gap-2 items-center">
        <Checkbox className="bg-white border-buttonStroke" />
        <span className="text-black font-normal text-sm">
          Activate coupons for this checkout form
        </span>
        <Settings2 width={16} height={16} className="hover:cursor-pointer" />
      </div>
    </div>
  );
}
