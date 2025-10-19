import {
  CheckoutFolderBuilder,
  CheckoutServiceBuilder,
  SidebarContext,
} from "@/app/[workspaceId]/admin/services/checkout/_inner";
import { Switch } from "@/components/ui/switch";
import React from "react";
import ServiceSwitchCard from "./ServiceSwitchCard";

type Props = {
  folder: CheckoutFolderBuilder;
  services: CheckoutServiceBuilder[];
  setContext: React.Dispatch<React.SetStateAction<SidebarContext>>;
  setFolders: React.Dispatch<React.SetStateAction<CheckoutFolderBuilder[]>>;
};

export default function ServiceFolderEditor({
  folder,
  services,
  setContext,
  setFolders,
}: Props) {
  const handleToggleFolder = () => {
    setFolders((prev) =>
      prev.map((f) =>
        f.service_folder_id === folder.service_folder_id
          ? { ...f, is_activated: !f.is_activated }
          : f
      )
    );
  };
  return (
    <div
      key={`service-folder-${folder.name}`}
      className="p-3 flex flex-col gap-2"
    >
      <div className="flex justify-between">
        <h4 className="text-sm font-medium mb-2">{folder.name}</h4>
        <Switch
          className="data-[state=checked]:bg-[#4670F9] cursor-pointer"
          checked={folder.is_activated}
          onCheckedChange={handleToggleFolder}
        />
      </div>
      {services.map((service) => (
        <ServiceSwitchCard
          key={`${folder.service_folder_id}-${service.service_id}`}
          selectService={() => {
            if (folder.is_activated) {
              setContext({ service: service, mode: "service" });
            }
          }}
          isFolderActive={folder.is_activated}
          service={service.service}
        />
      ))}
    </div>
  );
}
