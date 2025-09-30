import React from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type Props = {};

export default function CouponValidator({}: Props) {
  const [validationMode, activateValidation] = React.useState(false);
  const [coupon, setCoupon] = React.useState("");
  //! Change to coupon object
  const [validatedCoupon, setValidatedCoupon] = React.useState<string | null>(
    null
  );
  const [status, setStatus] = React.useState<
    "loading" | "error" | "success" | "none"
  >("none");

  return (
    <div>
      {!validationMode ? (
        <p
          onClick={() => activateValidation(true)}
          className="pt-[16px] text-[14px] font-normal text-[#1C1D1F] underline hover:cursor-pointer"
        >
          Got a coupon?
        </p>
      ) : (
        <div className="flex flex-col pt-4 gap-2">
          <label className="text-[#1C1D1F] font-normal text-sm">
            Enter coupon code
          </label>
          <div className="flex gap-2">
            <Input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="rounded-[6px]"
            />
            <Button
              variant="default"
              className="rounded-[6px] bg-[#F4F5F6] border-1 border-black/5 hover:cursor-pointer"
              disabled={coupon.length === 0}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
