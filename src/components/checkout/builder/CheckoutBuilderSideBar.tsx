"use client";

import React from "react";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { Button } from "@/components/ui/button";
import { Service } from "@/lib/supabase/client";
import ServiceSwitchCards from "./ServiceSwitchCards";

type CheckoutBuilderSideBarProps = {
  isLoading: boolean;
  setCheckoutServices: React.Dispatch<
    React.SetStateAction<Map<string, Service[]>>
  >;
  services: Map<string, Service[]>;
};

export default function CheckoutBuilderSideBar({
  isLoading,
  setCheckoutServices,
  services,
}: CheckoutBuilderSideBarProps) {
  const { activeWorkspaceId } = useFeedbirdStore();

  return (
    <div className="border-border-primary border-l-1 w-[320px] bg-[#FAFAFA] h-full flex-shrink-0 flex flex-col overflow-auto">
      <header className="border-border-primary border-b-1 w-full p-3 text-black font-medium">
        Services
      </header>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[#838488] text-sm mb-4">
          Select which services and add-ons you want available at this checkout
        </p>

        <div className="space-y-6 flex-1">
          {isLoading && (
            <div className="w-full h-1/2 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-buttonStroke border-t-transparent"></div>
            </div>
          )}
          {!isLoading && services.size && (
            <ServiceSwitchCards
              foldersMap={services}
              setFoldersMap={setCheckoutServices}
            />
          )}
          {!isLoading && !services.size && (
            <p className="text-[#838488] text-sm">
              No services found. Please create a service first.
            </p>
          )}
        </div>
        <Button
          disabled={isLoading}
          variant="default"
          className="w-full mt-4 hover:cursor-pointer shadow-lg bg-[#4670F9] text-white text-sm rounded-sm"
        >
          {/* {loading && (
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
          )} */}
          Testing Button
        </Button>
      </div>
    </div>
  );
}
