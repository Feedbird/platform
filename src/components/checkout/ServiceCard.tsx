import { Service } from "@/lib/supabase/client";
import React from "react";
import { Button } from "../ui/button";

type Props = {
  service: Service;
};

export default function ServiceCard({ service }: Props) {
  const plans = service.service_plans
    ? service.service_plans?.sort((a, b) => a.price - b.price)
    : [];

  const mapPeriodicity = (period: string | undefined | null) => {
    switch (period) {
      case "month":
        return "mo";
      case "year":
        return "yr";
      default:
        return "n/a";
    }
  };
  return (
    <div className="bg-white rounded-[8px] border-1 border-[#D3D3D3] p-5 flex flex-col w-[355px] gap-3 justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row">
          <span className="text-[#1C1D1F] font-medium text-sm">
            {service.name}
          </span>
        </div>
        <p className="text-[#5C5E63] font-normal text-[13px]">
          {service.brief ?? "-"}
        </p>
      </div>
      <div className="flex flex-row justify-between items-center text-[#1C1D1F]">
        <div className="flex flex-row text-sm gap-1">
          <p>from</p>
          <span className="font-medium">
            ${plans[0]?.price ?? "-"}/{mapPeriodicity(plans[0]?.period)}
          </span>
        </div>
        <Button
          variant="ghost"
          className="text-[#4670F9] hover:cursor-pointer font-medium rounded-full h-10 w-[131px] px-4 py-2.5 bg-transparent border-1 border-[#4670F9] flex items-center justify-center"
        >
          + Select plan
        </Button>
      </div>
    </div>
  );
}
