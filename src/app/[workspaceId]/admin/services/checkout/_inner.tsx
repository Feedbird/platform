"use client";
import CheckoutBuilderSideBar from "@/components/checkout/builder/CheckoutBuilderSideBar";
import ServiceCard from "@/components/checkout/ServiceCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { servicesApi } from "@/lib/api/api-service";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { Service } from "@/lib/supabase/client";
import { Divider } from "@mui/material";
import React from "react";
import { toast } from "sonner";

export default function CheckoutBuilderClient() {
  const { activeWorkspaceId } = useFeedbirdStore();
  const [loading, isLoading] = React.useState(false);
  const [checkoutServices, setCheckoutServices] = React.useState<
    Map<string, Service[]>
  >(new Map());

  React.useEffect(() => {
    // Fetch services for the active workspace
    if (!activeWorkspaceId) return;
    isLoading(true);
    const fetchServices = async () => {
      try {
        const serviceList = await servicesApi.fetchServiceFolders(
          activeWorkspaceId
        );
        const serviceMap = new Map<string, Service[]>();
        serviceList.forEach((folder) => {
          serviceMap.set(folder.name, folder.services || []);
        });
        setCheckoutServices(serviceMap);
      } catch (e) {
        toast.error("Failed to load services. Please reload this page again.");
      } finally {
        isLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="w-full h-full flex bg-[#FBFBFB] overflow-hidden relative justify-between">
      <div className="flex-1 p-5 overflow-auto">
        {Array.from(checkoutServices.keys()).map((folderName) => {
          const services = checkoutServices.get(folderName);
          return (
            <div key={`service-folder-${folderName}`}>
              <Accordion type="single" collapsible defaultValue={folderName}>
                <AccordionItem value={folderName} className="border-b-0">
                  <AccordionTrigger className="h-12 cursor-pointer">
                    <h3 className="py-5 text-base font-medium text-[#1C1D1F]">
                      {folderName}
                    </h3>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {services?.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          isActivated={false}
                          selector={() => {}}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <Divider className="pt-5" />
            </div>
          );
        })}
      </div>
      <CheckoutBuilderSideBar
        services={checkoutServices}
        setCheckoutServices={setCheckoutServices}
        isLoading={loading}
      />
    </div>
  );
}
