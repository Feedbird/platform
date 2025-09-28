import { Service, ServicePlan } from "@/lib/supabase/client";
import React from "react";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "../ui/select";

type Props = {
  service: Service;
};

export default function ServiceCard({ service }: Props) {
  const [selectingMode, setSelectingMode] = React.useState(false);
  const [planSelected, selectPlan] = React.useState<ServicePlan | null>(null);

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
      {!selectingMode ? (
        <div className="flex flex-row justify-between items-center text-[#1C1D1F]">
          <div className="flex flex-row text-sm gap-1">
            <p>from</p>
            <span className="font-medium">
              ${plans[0]?.price ?? "-"}/{mapPeriodicity(plans[0]?.period)}
            </span>
          </div>
          <Button
            onClick={() => setSelectingMode(true)}
            variant="ghost"
            className="text-[#4670F9] hover:cursor-pointer font-medium rounded-full h-10 w-[131px] px-4 py-2.5 bg-transparent border-1 border-[#4670F9] flex items-center justify-center"
          >
            + Select plan
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-[#1C1D1F]">
            <label className="font-medium text-sm">Plan</label>
            <Select
              value={planSelected ? planSelected.id : undefined}
              onValueChange={(value) => {
                const selected = plans.find((plan) => plan.id === value);
                if (selected) {
                  selectPlan(selected);
                }
              }}
            >
              <SelectTrigger className="w-full rounded-[6px] border-1 border-[#D3D3D3] bg-white cursor-pointer text-[#1C1D1F] text-[13px]">
                {planSelected
                  ? `${planSelected.quantity} ${planSelected.qty_indicator} - $${planSelected.price}/${planSelected.period}`
                  : "Select a plan"}
              </SelectTrigger>
              <SelectContent>
                <div className="flex flex-col gap-1">
                  {plans.map((plan, index) => (
                    <SelectItem
                      value={plan.id}
                      key={`plan_${index}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectPlan(plan);
                      }}
                      className="text-[#1C1D1F] text-[13px] font-medium p-1 hover:cursor-pointer hover:bg-[#F3F3F3] rounded-[4px]"
                    >
                      {plan.quantity} {plan.qty_indicator} - ${plan.price}/
                      {mapPeriodicity(plan.period)}
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>
          {service.social_channels && service.channels?.length && <></>}
          <div className="flex flex-row items-center justify-between">
            <span className="text-[#1C1D1F] font-medium text-sm">
              {planSelected
                ? `$${planSelected.price}/${mapPeriodicity(
                    planSelected.period
                  )}`
                : ""}
            </span>
            <Button
              variant="default"
              className="text-white bg-[#4670F9] hover:cursor-pointer font-medium rounded-full h-10 w-[100px] px-4 py-2.5 border-1 flex items-center justify-center"
            >
              + Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
