"use client";
import BuilderServiceCard from "@/components/checkout/builder/BuilderServiceCard";
import CheckoutBuilderSideBar from "@/components/checkout/builder/CheckoutBuilderSideBar";
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

export type CheckoutFolderBuilder = {
  name: string;
  is_activated: boolean;
  service_folder_id: string;
  description?: string | null;
  show_tooltip: boolean;
};

export type CheckoutServiceBuilder = {
  service_id: string;
  is_active: boolean;
  service: Service;
  title_override?: string;
  description_override?: string;
  icon_override?: string;
  discount?: number;
};

export default function CheckoutBuilderClient() {
  const { activeWorkspaceId } = useFeedbirdStore();
  const [loading, isLoading] = React.useState(false);
  const [checkoutServices, setCheckoutServices] = React.useState<
    Map<string, CheckoutServiceBuilder[]>
  >(new Map());
  const [checkoutFolders, setCheckoutFolders] = React.useState<
    CheckoutFolderBuilder[]
  >([]);

  React.useEffect(() => {
    if (!activeWorkspaceId) return;
    isLoading(true);
    const fetchServices = async () => {
      try {
        const serviceList = await servicesApi.fetchServiceFolders(
          activeWorkspaceId
        );

        const serviceMap = new Map<string, CheckoutServiceBuilder[]>();
        const folderList: CheckoutFolderBuilder[] = [];
        serviceList.forEach((folder) => {
          const mappedFolder: CheckoutFolderBuilder = {
            name: folder.name,
            service_folder_id: folder.id,
            is_activated: true,
            description: folder.description || "",
            show_tooltip: false,
          };
          folderList.push(mappedFolder);

          const services: CheckoutServiceBuilder[] = (
            folder.services ?? ([] as Service[])
          ).map((service) => ({
            service_id: service.id,
            is_active: true,
            title_override: "",
            service,
            description_override: "",
            icon_override: "",
            discount: 0,
          }));
          serviceMap.set(folder.id, services);
        });

        setCheckoutServices(serviceMap);
        setCheckoutFolders(folderList);
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
        {checkoutFolders.map((folder) => {
          const services = checkoutServices.get(folder.service_folder_id);

          if (folder.is_activated === false) return null;
          return (
            <div key={`service-folder-${folder.service_folder_id}`}>
              <Accordion type="single" collapsible defaultValue={folder.name}>
                <AccordionItem value={folder.name} className="border-b-0">
                  <AccordionTrigger className="h-12 cursor-pointer">
                    <h3 className="py-5 text-base font-medium text-[#1C1D1F]">
                      {folder.name}
                    </h3>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {services?.map((service) => (
                        <BuilderServiceCard
                          key={service.service_id}
                          serviceBuilder={service}
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
        folders={checkoutFolders}
        setFolders={setCheckoutFolders}
        isLoading={loading}
      />
    </div>
  );
}
