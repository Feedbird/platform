import React from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { checkoutApi } from "@/lib/api/api-service";
import { CheckIcon, XIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import { Coupon } from "@/lib/supabase/client";

type Props = {};

export default function CouponValidator({}: Props) {
  const [validationMode, activateValidation] = React.useState(false);
  const [coupon, setCoupon] = React.useState("");
  const [validatedCoupon, setValidatedCoupon] = React.useState<Coupon | null>(
    null
  );
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<
    "loading" | "error" | "success" | "none"
  >("none");

  const handleValidateCoupon = async () => {
    setStatus("loading");
    try {
      const response = await checkoutApi.verifyCoupon(coupon);
      if (response?.coupon) {
        setValidatedCoupon(response.coupon);
        setStatus("success");
        setCoupon("");
      }
    } catch (e) {
      setStatus("error");
      setCouponError((e as Error).message);
      setCoupon("");
    } finally {
      activateValidation(false);
    }
  };

  return (
    <div>
      {!validationMode ? (
        validatedCoupon ? (
          <div className="pt-4">
            <div className="flex gap-2 items-center">
              <div className="flex gap-1">
                <CheckIcon color="#03985C" width={16} height={16} />
                <span className="text-[#03985C] text-sm font-normal">
                  Coupon code applied:
                </span>
              </div>
              <Badge className="bg-[#EAE9E9] text-[#5C5E63] text-sm flex gap-2 rounded-full">
                <label>{validatedCoupon.code}</label>
                <div
                  className="hover:cursor-pointer hover:bg-gray-300 rounded-full z-10"
                  onClick={() => setValidatedCoupon(null)}
                >
                  <XIcon width={14} height={14} />
                </div>
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p
              onClick={() => activateValidation(true)}
              className="pt-[16px] text-[14px] font-normal text-[#1C1D1F] underline hover:cursor-pointer"
            >
              Got a coupon?
            </p>
            {status === "error" && couponError && (
              <span className="text-red-500 text-sm">{couponError}</span>
            )}
          </div>
        )
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
              onClick={handleValidateCoupon}
              className="rounded-[6px] bg-[#F4F5F6] border-1 border-black/5 hover:cursor-pointer"
              disabled={coupon.length === 0 || status === "loading"}
            >
              {status === "loading" ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
              ) : (
                "Apply"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
