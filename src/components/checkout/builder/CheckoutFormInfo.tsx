"use client";
import { Input } from "@/components/ui/input";
import React from "react";
import { CheckoutFormInformation } from "@/app/[workspaceId]/admin/services/checkout/_inner";
import AdvancedTextArea from "@/components/ui/AdvancedTextArea";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { Settings2 } from "lucide-react";
import { Divider } from "@mui/material";
import { Badge } from "@/components/ui/badge";

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
  const handleCouponToggle = () => {
    setCheckoutInfo((prev) => ({
      ...prev,
      showCouponField: !prev.showCouponField,
    }));
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <span className="text-black py-3 font-semibold text-lg">
          {checkoutInfo.name.length ? checkoutInfo.name : "New checkout form"}
        </span>
        <Badge className=" rounded-full bg-buttonStroke text-black/40">
          checkout
        </Badge>
      </div>
      <Divider />
      <div className="flex flex-col gap-2">
        <span className="text-black font-medium text-sm">Name</span>
        <Input className="rounded-sm bg-white border-buttonStroke" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-black font-medium text-sm">Form information</span>
        <AdvancedTextArea value="" setter={() => {}} />
      </div>
      <div className="flex gap-2 items-center">
        <div
          className="flex gap-2 hover:cursor-pointer items-center"
          onClick={handleCouponToggle}
        >
          <Checkbox
            className="bg-white border-buttonStroke"
            checked={checkoutInfo.showCouponField}
          />
          <span className="text-black font-normal text-sm">
            Activate coupons for this checkout form
          </span>
        </div>
        <Settings2 width={16} height={16} className="hover:cursor-pointer" />
      </div>
    </div>
  );
}
