import {
  CheckoutFolderBuilder,
  CheckoutServiceBuilder,
} from "@/app/[workspaceId]/admin/services/checkout/_inner";
import { Switch } from "@/components/ui/switch";
import React from "react";
import ServiceSwitchCard from "./service-switch-card";

type Props = {
  folder: CheckoutFolderBuilder;
  services: CheckoutServiceBuilder[];
  setFolders: React.Dispatch<React.SetStateAction<CheckoutFolderBuilder[]>>;
  setServices: React.Dispatch<
    React.SetStateAction<Map<string, CheckoutServiceBuilder[]>>
  >;
};

export default function ServiceFolderEditor({
  folder,
  services,
  setFolders,
  setServices,
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
          isFolderActive={folder.is_activated}
          service={service.service}
        />
      ))}
    </div>
  );
}
