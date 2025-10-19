"use client";
import BuilderServiceCard from "@/components/checkout/builder/BuilderServiceCard";
import ServicesSideBar from "@/components/checkout/builder/ServicesSideBar";
import CheckoutFormInfo from "@/components/checkout/builder/CheckoutFormInfo";
import { servicesApi } from "@/lib/api/api-service";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { Service } from "@/lib/supabase/client";
import React from "react";
import { toast } from "sonner";
import ServiceConfigSideBar from "@/components/checkout/builder/ServiceConfigSideBar";
import SideBar from "@/components/checkout/builder/SideBar";

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
  short_description_override?: string;
  description_override?: string;
  icon_override?: string;
  discount?: number;
};

export type CheckoutFormInformation = {
  name: string;
  description: string;
  formLink: string;
  showCouponField: boolean;
};

export type SidebarMode = "base" | "service" | "services";
export type SidebarContext = {
  mode: SidebarMode;
  service: CheckoutServiceBuilder | null;
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
  const [formInformation, setFormInformation] =
    React.useState<CheckoutFormInformation>({
      name: "",
      description: "",
      formLink: "https://feedbird.com/checkout/testing-checkout-link",
      showCouponField: true,
    });
  const [sidebarContext, setSideBarContext] = React.useState<SidebarContext>({
    mode: "services",
    service: null,
  });

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
      <div className="p-5 flex flex-col overflow-y-auto items-center w-full">
        <div className="w-full max-w-[1000px]">
          <CheckoutFormInfo
            setCheckoutInfo={setFormInformation}
            checkoutInfo={formInformation}
          />
          <div className="py-5">
            <span className="text-base text-black font-medium">Services</span>
          </div>
          {/* TODO Refactor this. Can be simplier in borders, etc. */}
          {checkoutFolders.filter((c) => c.is_activated).length ? (
            checkoutFolders.map((folder, index) => {
              const services = checkoutServices.get(folder.service_folder_id);

              if (folder.is_activated === false) return null;
              const currentIndex = checkoutFolders
                .filter((c) => c.is_activated)
                .indexOf(folder);
              return (
                <div
                  key={`service-folder-${folder.service_folder_id}`}
                  onClick={() =>
                    setSideBarContext({ service: null, mode: "services" })
                  }
                  className={`border-1 border-buttonStroke px-4 pb-5 pt-3 hover:cursor-pointer ${
                    currentIndex ===
                    checkoutFolders.filter((c) => c.is_activated).length - 1
                      ? "border-b-1 rounded-b-[6px]"
                      : "border-b-0"
                  } ${currentIndex === 0 ? "rounded-t-[6px]" : ""}`}
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="py-2 text-base font-medium text-[#1C1D1F]">
                      {folder.name}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {services?.map((service) => (
                        <BuilderServiceCard
                          key={service.service_id}
                          setContext={setSideBarContext}
                          serviceBuilder={service}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full h-[150px] justify-center items-center text-center flex flex-col gap-1 text-sm text-black">
              <p>You have no active services for this checkout form</p>
              <p>Please select one or more service folders</p>
            </div>
          )}
        </div>
      </div>
      <SideBar
        services={checkoutServices}
        context={sidebarContext}
        setContext={setSideBarContext}
        setCheckoutServices={setCheckoutServices}
        folders={checkoutFolders}
        setFolders={setCheckoutFolders}
        isLoading={loading}
      />
    </div>
  );
}
