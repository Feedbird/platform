import { Switch } from "@/components/ui/switch";
import { Service } from "@/lib/supabase/client";
import Image from "next/image";
import React from "react";

type Props = {
  foldersMap: Map<string, Service[]>;
  setFoldersMap: React.Dispatch<React.SetStateAction<Map<string, Service[]>>>;
};

export default function ServiceSwitchCards({
  foldersMap,
  setFoldersMap,
}: Props) {
  const folderNames = Array.from(foldersMap.keys());

  return (
    <div className="flex flex-col gap-2">
      {folderNames.map((folderName) => (
        <div
          key={`service-folder-${folderName}`}
          className="p-3 flex flex-col gap-2"
        >
          <div className="flex justify-between">
            <h4 className="text-sm font-medium mb-2">{folderName}</h4>
            <Switch className="data-[state=checked]:bg-[#4670F9] cursor-pointer" />
          </div>
          {Array.from(foldersMap.get(folderName) || []).map((service) => (
            <div
              key={`key-${service.id}`}
              className="border-1 border-buttonStroke shadow-sm rounded-sm p-2"
            >
              <div className="flex gap-1">
                <Image
                  src={`/images/checkout/icons/${service.internal_icon}.svg`}
                  alt="service_icon"
                  width={16}
                  height={16}
                />
                <span className="font-medium text-black text-sm">
                  {service.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
