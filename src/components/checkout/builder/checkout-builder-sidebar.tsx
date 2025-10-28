"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  CheckoutFolderBuilder,
  CheckoutServiceBuilder,
} from "@/app/[workspaceId]/admin/services/checkout/_inner";
import ServiceFolderEditor from "./service-folder-editor";

type CheckoutBuilderSideBarProps = {
  isLoading: boolean;
  setCheckoutServices: React.Dispatch<
    React.SetStateAction<Map<string, CheckoutServiceBuilder[]>>
  >;
  services: Map<string, CheckoutServiceBuilder[]>;
  folders: CheckoutFolderBuilder[];
  setFolders: React.Dispatch<React.SetStateAction<CheckoutFolderBuilder[]>>;
};

export default function CheckoutBuilderSideBar({
  isLoading,
  folders,
  setFolders,
  setCheckoutServices,
  services,
}: CheckoutBuilderSideBarProps) {
  return (
    <div className="border-border-primary border-l-1 w-[350px] bg-[#FAFAFA] h-full flex-shrink-0 flex flex-col overflow-hidden">
      <header className="border-border-primary border-b-1 w-full p-3 text-black font-medium">
        Services
      </header>
      <div className="p-4 flex flex-col flex-1 overflow-y-scroll">
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
                  setFolders={setFolders}
                  setServices={setCheckoutServices}
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
