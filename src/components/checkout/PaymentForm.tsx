import { CreditCard } from "lucide-react";
import Image from "next/image";
import React from "react";

export default function PaymentForm() {
  return (
    <div className="w-full rounded-[8px] bg-white border border-[#E2E2E4] pb-6 flex flex-col">
      <div className="px-6 py-4 flex items-center gap-2 h-[60px]">
        <CreditCard />
        <span className="text-[#1C1D1F] text-sm font-medium">Card</span>
      </div>
      <div className="flex flex-col gap-6 px-6">
        <div className="flex items-center justify-between">
          <span className="text-[#1C1D1F] text-base font-medium">
            Credit or debit card
          </span>
          <Image
            src="/images/checkout/card-list.svg"
            alt="Card List"
            width={228}
            height={32}
          />
        </div>
      </div>
    </div>
  );
}
