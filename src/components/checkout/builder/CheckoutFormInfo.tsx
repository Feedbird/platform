"use client";
import { Input } from "@/components/ui/input";
import React from "react";
import { CheckoutFormInformation } from "@/app/[workspaceId]/admin/services/checkout/_inner";
import AdvancedTextArea from "@/components/ui/AdvancedTextArea";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { Check, Settings2 } from "lucide-react";
import { Divider } from "@mui/material";
import { Badge } from "@/components/ui/badge";
import ExpansibleCheckbox from "./ExpansibleCheckbox";
import { Button } from "@/components/ui/button";

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

  const DiscountComponent = () => {
    const [discountValue, setDiscountValue] = React.useState<string>(
      checkoutInfo.additionalDiscountValue?.toString() || ""
    );
    const [localError, setLocalError] = React.useState<string | null>(null);
    const [valueChanged, setValueChanged] = React.useState<boolean>(false);

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const numericValue = value.replace(/[^0-9.]/g, "");

      const parts = numericValue.split(".");
      const cleanValue =
        parts.length > 2
          ? parts[0] + "." + parts.slice(1).join("")
          : numericValue;

      setDiscountValue(cleanValue);
    };

    React.useEffect(() => {
      if (discountValue === checkoutInfo.additionalDiscountValue?.toString()) {
        setValueChanged(false);
      } else {
        setValueChanged(true);
      }
    }, [discountValue, checkoutInfo.additionalDiscountValue]);

    const validateAndSetDiscount = () => {
      const value = parseFloat(discountValue);
      if (Number.isNaN(value) || value < 0 || value > 1) {
        setLocalError("Please enter a valid number between 0 and 1.");
        return;
      }
      if (localError) setLocalError(null);
      setCheckoutInfo((prev) => ({
        ...prev,
        additionalDiscountValue: value,
      }));
    };

    return (
      <div className="p-2 flex flex-col gap-2">
        <div className="flex gap-4 items-center">
          <span className="text-black font-normal text-sm">
            Discount value:
          </span>
          <Input
            className="rounded-sm bg-white border-buttonStroke max-w-32"
            value={discountValue}
            onChange={handleDiscountChange}
            placeholder="0.25"
          />
          <Button
            variant="default"
            onClick={validateAndSetDiscount}
            className="bg-feedbird rounded-sm h-7 w-7 cursor-pointer"
            disabled={!discountValue.length || !valueChanged}
          >
            <Check color="white" />
          </Button>
        </div>
        <p className="text-black/70 text-xs">
          Provide a discount number between 0 and 1 where 1 is 100%. For
          example, if you want to provide a 25% discount, input 0.25.
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <span className="text-black py-3 font-semibold text-lg">
          {checkoutInfo.name.length ? checkoutInfo.name : "New checkout form"}
        </span>
        <Badge className=" rounded-full bg-buttonStroke text-black/60">
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
      <div className="flex flex-col gap-4 py-4">
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
        <div className="flex flex-col gap-1">
          <div className="flex gap-2 items-center">
            <Checkbox
              className="bg-white border-buttonStroke"
              defaultChecked={true}
            />
            <span className="text-black font-normal text-sm">
              Allow external users to access this checkout form
            </span>
          </div>
          <p className="pl-6 text-xs font-black/70">
            Mark this option off to only allow users already registered within
            your workspace to see and use this checkout form.
          </p>
        </div>
        <ExpansibleCheckbox
          status={checkoutInfo.additionalDiscount}
          statusHandler={() =>
            setCheckoutInfo((prev) => ({
              ...prev,
              additionalDiscount: !prev.additionalDiscount,
            }))
          }
          title="I want to provide an additional discount on this form"
          description="This will apply to all services within this checkout form. If you want to give discounts for specific services, do it on the service settings."
          ComponentWhenExtended={DiscountComponent}
        />
      </div>
    </div>
  );
}
