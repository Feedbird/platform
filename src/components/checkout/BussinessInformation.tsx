import { Divider } from "@mui/material";
import Image from "next/image";
import React from "react";

export default function BusinessInformation() {
  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="flex gap-2">
        <h3 className="bg-gradient-to-r from-[#2ED1F1] to-[#4670F9] bg-clip-text text-[20px] font-extrabold text-transparent">
          20,000+
        </h3>
        <span className="text-[20px] font-medium text-[#1C1D1F]">
          businesses trust Feedbird.
        </span>
      </div>
      <Divider className="bg-[#EAE9E9] opacity-30" />
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-2">
          <Image
            src="/images/checkout/check.svg"
            alt="check_icon"
            width={20}
            height={20}
          />
          <span className="text-[16px] text-[#060A13]">
            Dedicated account manager
          </span>
        </div>
        <div className="flex flex-row gap-2">
          <Image
            src="/images/checkout/check.svg"
            alt="check_icon"
            width={20}
            height={20}
          />
          <span className="text-[16px] text-[#060A13]">
            Onboarding & support calls
          </span>
        </div>
        <div className="flex flex-row gap-2">
          <Image
            src="/images/checkout/check.svg"
            alt="check_icon"
            width={20}
            height={20}
          />
          <span className="text-[16px] text-[#060A13]">
            High-quality content
          </span>
        </div>
        <div className="flex flex-row gap-2">
          <Image
            src="/images/checkout/check.svg"
            alt="check_icon"
            width={20}
            height={20}
          />
          <span className="text-[16px] text-[#060A13]">
            Made by real people - not AI
          </span>
        </div>
        <div className="flex flex-row gap-2">
          <Image
            src="/images/checkout/check.svg"
            alt="check_icon"
            width={20}
            height={20}
          />
          <span className="text-[16px] text-[#060A13]">
            80% more affordable than alternatives
          </span>
        </div>
      </div>
    </div>
  );
}
