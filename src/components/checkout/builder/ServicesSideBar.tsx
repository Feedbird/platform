"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  CheckoutFolderBuilder,
  CheckoutServiceBuilder,
  SidebarContext,
} from "@/app/[workspaceId]/admin/services/checkout/_inner";
import ServiceFolderEditor from "./ServiceFolderEditor";
import { ChevronLeft } from "lucide-react";

type CheckoutBuilderSideBarProps = {
  isLoading: boolean;
  setCheckoutServices: React.Dispatch<
    React.SetStateAction<Map<string, CheckoutServiceBuilder[]>>
  >;
  setContext: React.Dispatch<React.SetStateAction<SidebarContext>>;
  services: Map<string, CheckoutServiceBuilder[]>;
  folders: CheckoutFolderBuilder[];
  setFolders: React.Dispatch<React.SetStateAction<CheckoutFolderBuilder[]>>;
};

export default function ServicesSideBar({
  isLoading,
  folders,
  setFolders,
  setContext,
  setCheckoutServices,
  services,
}: CheckoutBuilderSideBarProps) {
  return (
    <div className="border-border-primary border-l-1 w-[330px] bg-[#FAFAFA] h-full flex-shrink-0 flex flex-col overflow-hidden">
      <header className="border-border-primary items-center text-sm flex gap-1 border-b-1 w-full p-3 text-black font-medium">
        <ChevronLeft
          size={16}
          className="cursor-pointer"
          onClick={() => setContext({ service: null, mode: "base" })}
        />
        <span>Services</span>
      </header>
      <div className="p-2.5 flex flex-col flex-1 overflow-y-scroll">
        <p className="text-[#838488] text-sm mb-4">
          Select which services and add-ons you want available at this checkout
        </p>

        <div className="space-y-5 flex-1">
          {isLoading && (
            <div className="w-full h-1/2 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-buttonStroke border-t-transparent"></div>
            </div>
          )}
          {!isLoading &&
            folders.length &&
            folders.map((folder) => (
              <div
                key={`sidebar_${folder.service_folder_id}`}
                className="flex flex-col gap-2"
              >
                <ServiceFolderEditor
                  setContext={setContext}
                  setFolders={setFolders}
                  folder={folder}
                  services={services.get(folder.service_folder_id) ?? []}
                />
              </div>
            ))}
          {!isLoading && !folders.length && (
            <p className="text-[#838488] text-sm">
              No services found. Please create a service first.
            </p>
          )}
        </div>
      </div>
      <div className="border-border-primary border-t-1 w-full p-3 text-black font-medium">
        <Button
          disabled={isLoading}
          variant="default"
          className="w-full hover:cursor-pointer shadow-lg bg-[#4670F9] text-white text-sm rounded-sm"
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
