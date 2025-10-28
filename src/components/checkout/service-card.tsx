import { Service, ServiceChannel, ServicePlan } from "@/lib/store/types";
import React from "react";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "../ui/select";
import Image from "next/image";
import { Check } from "lucide-react";
import { toast } from "sonner";
import MultiSelectDropdown from "./channel-select";

export type ServiceCardPlan = {
  plan: ServicePlan;
  channels: ServiceChannel[];
};

type Props = {
  service: Service;
  isActivated: boolean;
  selector: React.Dispatch<React.SetStateAction<Map<string, ServiceCardPlan>>>;
};

export const mapPeriodicity = (period: string | undefined | null) => {
  switch (period) {
    case "month":
      return "mo";
    case "year":
      return "yr";
    default:
      return "n/a";
  }
};

export default function ServiceCard({ service, selector, isActivated }: Props) {
  const [selectingMode, setSelectingMode] = React.useState(false);
  const [channelsSelected, setChannelsSelected] = React.useState<
    ServiceChannel[]
  >([]);
  const [planSelected, selectPlan] = React.useState<ServicePlan | null>(null);
  const [added, isAdded] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [ddOpen, isDDOpen] = React.useState(true);

  React.useEffect(() => {
    if (planSelected) {
      if (channelsSelected.length > 0) {
        const total =
          planSelected.price +
          channelsSelected
            .slice(1)
            .reduce((acc, channel) => acc + (channel.pricing || 0), 0);
        setTotal(total);
      } else {
        setTotal(planSelected.price);
      }
    }
  }, [planSelected, channelsSelected]);

  const plans = React.useMemo(
    () =>
      service.servicePlans
        ? service.servicePlans?.sort((a, b) => a.price - b.price)
        : [],
    [service.servicePlans]
  );

  const channels =
    service.socialChannels && service.channels?.length ? service.channels : [];

  const handleAdd = () => {
    if (!planSelected) {
      toast.error("Please select a plan first");
      return;
    }
    selector((prev) => {
      const newMap = new Map(prev);
      newMap.set(service.id, {
        plan: planSelected,
        channels: channelsSelected,
      });
      return newMap;
    });
    isAdded(true);
  };

  const handleRemove = () => {
    selector((prev) => {
      const newMap = new Map(prev);
      newMap.delete(service.id);
      return newMap;
    });
    isAdded(false);
    selectPlan(null);
    setSelectingMode(false);
  };

  React.useEffect(() => {
    if (!isActivated) {
      isAdded(false);
      selectPlan(null);
      setSelectingMode(false);
      setChannelsSelected([]);
    }
  }, [isActivated]);

  React.useEffect(() => {
    if (selectingMode) {
      isDDOpen(true);
    }
  }, [selectingMode]);

  React.useEffect(() => {
    if (added && planSelected) {
      selector((prev) => {
        const newMap = new Map(prev);
        newMap.set(service.id, {
          plan: planSelected,
          channels: channelsSelected,
        });
        return newMap;
      });
    }
  }, [channelsSelected]);

  const handleSelection = () => {
    if (service.servicePlans && service.servicePlans.length === 1) {
      isAdded(true);
      setSelectingMode(true);
      selectPlan(service.servicePlans![0]);
      selector((prev) => {
        const newMap = new Map(prev);
        newMap.set(service.id, {
          plan: service.servicePlans![0],
          channels: [],
        });
        return newMap;
      });
    } else {
      setSelectingMode(true);
    }
  };

  return (
    <div className="bg-white rounded-[8px] border-1 border-[#D3D3D3] p-5 flex flex-col gap-3 justify-between relative">
      {selectingMode && (
        <div className="absolute top-2 right-2" onClick={handleRemove}>
          <Image
            src="/images/forms/delete-red.svg"
            alt="Delete"
            width={14}
            height={14}
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <Image
            src={`/images/checkout/icons/${service.internalIcon}.svg`}
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
      {!selectingMode ? (
        <div className="flex flex-row justify-between items-center text-black">
          <div className="flex flex-row text-sm gap-1">
            <p>from</p>
            <span className="font-medium">
              ${plans[0]?.price ?? "-"}/{mapPeriodicity(plans[0]?.period)}
            </span>
          </div>
          <Button
            onClick={handleSelection}
            variant="ghost"
            className={`text-[#4670F9] hover:cursor-pointer font-medium rounded-full h-10 ${
              service.servicePlans && service.servicePlans.length === 1
                ? "w-[100px]"
                : "w-[131px]"
            } px-4 py-2.5 bg-transparent border-1 border-[#4670F9] flex items-center justify-center`}
          >
            {service.servicePlans && service.servicePlans.length > 1
              ? "+ Select plan"
              : "+ Add"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {service.servicePlans && service.servicePlans.length > 1 && (
            <div className="flex flex-col gap-1 text-black">
              <label className="font-medium text-sm">Plan</label>
              <Select
                open={ddOpen}
                onOpenChange={(open) => isDDOpen(open)}
                value={planSelected ? planSelected.id : undefined}
                onValueChange={(value) => {
                  const selected = plans.find((plan) => plan.id === value);
                  if (selected) {
                    selectPlan(selected);
                    isAdded(true);
                    selector((prev) => {
                      const newMap = new Map(prev);
                      newMap.set(service.id, {
                        plan: selected,
                        channels: channelsSelected,
                      });
                      return newMap;
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full rounded-[6px] border-1 border-[#D3D3D3] bg-white cursor-pointer text-black text-[13px]">
                  {planSelected
                    ? `${planSelected.quantity} ${planSelected.qtyIndicator} - $${planSelected.price}/${planSelected.period}`
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
                        className="text-black text-[13px] font-medium p-1 hover:cursor-pointer hover:bg-[#F3F3F3] rounded-[4px]"
                      >
                        {plan.quantity} {plan.qtyIndicator} - ${plan.price}/
                        {mapPeriodicity(plan.period)}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>
          )}
          {channels.length > 0 && (
            <div className="flex flex-col gap-1 text-black">
              <label className="font-medium text-sm">Social channels</label>
              <MultiSelectDropdown
                channels={channels}
                channelsSelected={channelsSelected}
                selectChannels={setChannelsSelected}
              />
            </div>
          )}
          <div className="flex flex-row items-center justify-between">
            <span className="text-black font-medium text-sm">
              {planSelected
                ? `$${total}/${mapPeriodicity(planSelected.period)}`
                : ""}
            </span>
            {added ? (
              <div className="bg-[#0A8550] rounded-full flex flex-row items-center py-2.5 px-4 gap-1">
                <Check width={16} height={16} color="white" />
                <span className="text-white font-medium text-sm">Added</span>
              </div>
            ) : (
              <Button
                onClick={handleAdd}
                variant="default"
                className="text-white bg-[#4670F9] hover:cursor-pointer font-medium rounded-full h-10 w-[100px] px-4 py-2.5 border-1 flex items-center justify-center"
              >
                + Add
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
