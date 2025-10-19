import {
  CheckoutFolderBuilder,
  CheckoutServiceBuilder,
  SidebarContext,
} from "@/app/[workspaceId]/admin/services/checkout/_inner";
import React from "react";
import ServicesSideBar from "./ServicesSideBar";
import ServiceConfigSideBar from "./ServiceConfigSideBar";

type Props = {
  isLoading: boolean;
  setCheckoutServices: React.Dispatch<
    React.SetStateAction<Map<string, CheckoutServiceBuilder[]>>
  >;
  context: SidebarContext;
  setContext: React.Dispatch<React.SetStateAction<SidebarContext>>;
  services: Map<string, CheckoutServiceBuilder[]>;
  folders: CheckoutFolderBuilder[];
  setFolders: React.Dispatch<React.SetStateAction<CheckoutFolderBuilder[]>>;
};

export default function SideBar({
  isLoading,
  folders,
  setFolders,
  setContext,
  context,
  setCheckoutServices,
  services,
}: Props) {
  switch (context.mode) {
    case "base":
      return null;
    case "services":
      return (
        <ServicesSideBar
          setContext={setContext}
          isLoading={isLoading}
          services={services}
          setCheckoutServices={setCheckoutServices}
          folders={folders}
          setFolders={setFolders}
        />
      );
    case "service":
      return (
        <ServiceConfigSideBar
          setContext={setContext}
          service={context.service ?? undefined}
        />
      );
  }
}
