import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { mapPeriodicity, ServiceCardPlan } from "./ServiceCard";
import { ServiceFolder } from "@/lib/store/types";
import { Divider } from "@mui/material";
import Image from "next/image";

type Props = {
  selectedPlans: Map<string, ServiceCardPlan>;
  setSelectedPlans: React.Dispatch<
    React.SetStateAction<Map<string, ServiceCardPlan>>
  >;
  serviceFolders: ServiceFolder[];
};

const calculateYearlyTotal = (
  monthlyTotal: number,
  applyDiscount: boolean = true
) => {
  return Math.floor(monthlyTotal * 12 * (applyDiscount ? 0.9 : 1)); // 10% discount for yearly billing
};

export default function BillingTabs({
  selectedPlans,
  serviceFolders,
  setSelectedPlans,
}: Props) {
  const [total, setTotal] = React.useState(0);

  React.useEffect(() => {
    let total = 0;
    selectedPlans.forEach((container, serviceId) => {
      const service = serviceFolders
        .flatMap((folder) => folder.services || [])
        .find((s) => s.id === serviceId);

      if (service) {
        total += container.plan.price;
      }
      if (container.channels) {
        total += container.channels
          .slice(1)
          .reduce((acc, channel) => acc + channel.pricing, 0);
      }
    });
    setTotal(total);
  }, [selectedPlans]);

  return (
    <Tabs className="flex w-full flex-col gap-6" defaultValue="monthly">
      <TabsList
        defaultChecked
        defaultValue={"monthly"}
        className="h-11 w-full rounded-[6px] bg-[#F4F5F6] p-1"
      >
        <TabsTrigger
          value="monthly"
          className="hover:cursor-pointer data-[state=active]:rounded-[6px]"
        >
          Billed monthly
        </TabsTrigger>
        <TabsTrigger
          value="yearly"
          className="flex flex-row hover:cursor-pointer data-[state=active]:rounded-[6px]"
        >
          <span>Billed yearly</span>
          <div className="flex items-center justify-center rounded-full bg-[#03985C] px-1.5 py-[2px] text-[10px] font-medium text-white">
            SAVE 10%
          </div>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="monthly" className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          {selectedPlans.size > 0 &&
            Array.from(selectedPlans.keys()).map((serviceId) => {
              const container = selectedPlans.get(serviceId);
              const service = serviceFolders
                .flatMap((folder) => folder.services || [])
                .find((s) => s.id === serviceId);
              if (!service || !container || !container.plan) return null;
              return (
                <div
                  key={`${service.name}-${container.plan.id}`}
                  className="flex flex-col gap-2"
                >
                  <div className="flex flex-row gap-2">
                    <Image
                      width={20}
                      height={20}
                      alt={`${service.name}_icon`}
                      src={`/images/checkout/icons/${service.internal_icon}.svg`}
                    />
                    <h3 className="text-base font-medium text-black">
                      {service.name}
                    </h3>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-row justify-between text-sm">
                      <div className="flex flex-col font-normal">
                        <span className="text-black">
                          {container.plan.quantity}{" "}
                          {container.plan.qty_indicator}
                        </span>
                      </div>

                      <span className="text-sm font-medium text-black">
                        USD ${container.plan.price}/
                        {mapPeriodicity(container.plan.period)}
                      </span>
                    </div>
                    {container.channels &&
                      container.channels.map((channel, idx) => (
                        <div
                          className="w-full flex justify-between text-xs"
                          key={channel.id}
                        >
                          <span>
                            {channel.social_channel
                              .slice(0, 1)
                              .toLocaleUpperCase() +
                              channel.social_channel.slice(1)}
                          </span>
                          <p>
                            {idx === 0
                              ? "FREE"
                              : `USD $${channel.pricing}/${mapPeriodicity(
                                  container.plan.period
                                )}`}
                          </p>
                        </div>
                      ))}
                  </div>
                  <span
                    className="cursor-pointer text-xs font-normal text-[#5C5E63] underline"
                    onClick={() => {
                      setSelectedPlans((prev) => {
                        const newMap = new Map(prev);
                        newMap.delete(service.id);
                        return newMap;
                      });
                    }}
                  >
                    Remove
                  </span>
                </div>
              );
            })}
        </div>
        <div className="flex flex-col">
          <Divider className="h-[1px] bg-[#E2E2E4]" />
          <div className="flex justify-between pt-6 text-black">
            <p className="text-[14px] font-medium">Total</p>
            <span className="text-[18px] font-semibold">USD ${total}/mo</span>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="yearly" className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          {selectedPlans.size > 0 &&
            Array.from(selectedPlans.keys()).map((serviceId) => {
              const container = selectedPlans.get(serviceId);
              const service = serviceFolders
                .flatMap((folder) => folder.services || [])
                .find((s) => s.id === serviceId);
              if (!service || !container || !container.plan) return null;
              return (
                <div
                  key={`${service.name}-${container.plan.id}`}
                  className="flex flex-col gap-2"
                >
                  <div className="flex flex-row gap-2">
                    <Image
                      width={20}
                      height={20}
                      alt={`${service.name}_icon`}
                      src={`/images/checkout/icons/${service.internal_icon}.svg`}
                    />
                    <h3 className="text-base font-medium text-black">
                      {service.name}
                    </h3>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-row justify-between text-sm">
                      <div className="flex flex-col font-normal">
                        <span className="text-black">
                          {container.plan.quantity}{" "}
                          {container.plan.qty_indicator}
                        </span>
                      </div>

                      <span className="text-sm font-medium text-black">
                        USD ${calculateYearlyTotal(container.plan.price, false)}
                        /yr
                      </span>
                    </div>
                    {container.channels &&
                      container.channels.map((channel, idx) => (
                        <div
                          className="w-full flex justify-between text-xs"
                          key={channel.id}
                        >
                          <span>
                            {channel.social_channel
                              .slice(0, 1)
                              .toLocaleUpperCase() +
                              channel.social_channel.slice(1)}
                          </span>
                          <p>
                            {idx === 0
                              ? "FREE"
                              : `USD $${calculateYearlyTotal(
                                  channel.pricing,
                                  false
                                )}/yr`}
                          </p>
                        </div>
                      ))}
                  </div>
                  <span
                    className="cursor-pointer text-xs font-normal text-[#5C5E63] underline"
                    onClick={() => {
                      setSelectedPlans((prev) => {
                        const newMap = new Map(prev);
                        newMap.delete(service.id);
                        return newMap;
                      });
                    }}
                  >
                    Remove
                  </span>
                </div>
              );
            })}
          {total > 0 && (
            <div className="flex justify-between">
              <h3 className="text-base font-medium text-[#03985C]">
                Yearly discount
              </h3>
              <span className="text-sm font-medium text-[#03985C]">
                USD -${Math.floor(calculateYearlyTotal(total, false) * 0.1)}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <Divider className="h-[1px] bg-[#E2E2E4]" />
          <div className="flex justify-between pt-6 text-black">
            <p className="text-[14px] font-medium">Total</p>
            <span className="text-[18px] font-semibold">
              USD ${calculateYearlyTotal(total)}/yr
            </span>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
