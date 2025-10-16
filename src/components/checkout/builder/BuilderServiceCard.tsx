import { CheckoutServiceBuilder } from "@/app/[workspaceId]/admin/services/checkout/_inner";
import Image from "next/image";
import React from "react";
import { mapPeriodicity } from "../ServiceCard";
import { Button } from "@/components/ui/button";

type Props = {
  serviceBuilder: CheckoutServiceBuilder;
};

export default function BuilderServiceCard({ serviceBuilder }: Props) {
  const service = serviceBuilder.service;
  const plans = service.service_plans ?? [];

  if (!serviceBuilder.is_active) return null;
  return (
    <div className="bg-white rounded-[8px] border-1 border-[#D3D3D3] p-5 flex flex-col gap-3 justify-between relative">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <Image
            src={`/images/checkout/icons/${service.internal_icon}.svg`}
            alt="service_icon"
            width={20}
            height={20}
          />
          <span className="text-black font-medium text-sm">{service.name}</span>
        </div>
        <p className="text-[#5C5E63] font-normal text-[13px]">
          {service.brief ?? "-"}
        </p>
      </div>
      <div className="flex flex-row justify-between items-center text-black">
        <div className="flex flex-row text-sm gap-1">
          {plans.length > 1 && <p>from</p>}
          <span className="font-medium">
            ${plans[0]?.price ?? "-"}/{mapPeriodicity(plans[0]?.period)}
          </span>
        </div>
        <Button
          variant="ghost"
          className={`text-[#4670F9] hover:cursor-pointer font-medium rounded-full h-10 ${
            service.service_plans && service.service_plans.length === 1
              ? "w-[100px]"
              : "w-[131px]"
          } px-4 py-2.5 bg-transparent border-1 border-[#4670F9] flex items-center justify-center`}
        >
          {service.service_plans && service.service_plans.length > 1
            ? "+ Select plan"
            : "+ Add"}
        </Button>
      </div>
    </div>
  );
}
