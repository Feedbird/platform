import { CreditCard } from "lucide-react";
import { Elements, PaymentElement } from "@stripe/react-stripe-js";
import Image from "next/image";
import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import StripeFormPage from "./StripeForm";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function PaymentForm() {
  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
  );

  return (
    <div className="w-full rounded-[8px] bg-white border border-[#E2E2E4] pb-6 flex flex-col">
      <div className="px-6 py-4 flex items-center gap-2 h-[60px]">
        <CreditCard />
        <span className="text-black text-sm font-medium">Card</span>
      </div>
      <div className="flex flex-col gap-6 px-6">
        <div className="flex items-center justify-between">
          <span className="text-black text-base font-medium">
            Credit or debit card
          </span>
          <Image
            src="/images/checkout/card-list.svg"
            alt="Card List"
            width={228}
            height={32}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-black text-[13px] font-medium">
              First name
            </label>
            <Input className="border-[#e6e6e6] border-1 shadow-sm shadow-gray-50 h-11" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-black text-[13px] font-medium">
              Last name
            </label>
            <Input className="border-[#e6e6e6] border-1 shadow-sm shadow-gray-50 h-11" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-black text-[13px] font-medium">
              Company name
            </label>
            <Input className="border-[#e6e6e6] border-1 shadow-sm shadow-gray-50 h-11" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-black text-[13px] font-medium">
              Company Number/VAT
            </label>
            <Input className="border-[#e6e6e6] border-1 shadow-sm shadow-gray-50 h-11" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-black text-[13px] font-medium">Address</label>
          <Input className="border-[#e6e6e6] border-1 shadow-sm shadow-gray-50 h-11" />
        </div>
        <Elements stripe={stripePromise}>
          <StripeFormPage />
        </Elements>
        <div className="flex gap-6">
          <Button
            variant="default"
            className="bg-[#4670F9] rounded-[6px] border-1 border-black/10 text-white font-medium text-sm h-10 hover:cursor-pointer"
          >
            Complete purchase
          </Button>
          <div className="flex items-center gap-3">
            <Image
              src="/images/checkout/protected-black.svg"
              alt="protected_purchase"
              width={24}
              height={24}
            />
            <span className="font-medium text-black text-xs">
              You're 100% backed by our 30-day money-back guarantee.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
