import { Service } from "@/lib/supabase/client";
import Image from "next/image";
import React from "react";

type Props = {
  service: Service;
  selectService: () => void;
  isFolderActive: boolean;
};

export default function ServiceSwitchCard({
  service,
  selectService,
  isFolderActive,
}: Props) {
  return (
    <div
      onClick={() => selectService()}
      className={`border-1 border-buttonStroke shadow-sm rounded-sm p-2 ${
        !isFolderActive ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div
        className={`flex gap-1 ${
          !isFolderActive ? "opacity-50" : "border-buttonStroke opacity-100"
        }`}
      >
        <Image
          src={`/images/checkout/icons/${service.internal_icon}.svg`}
          alt="service_icon"
          width={16}
          height={16}
        />
        <span className="font-medium text-black text-sm">{service.name}</span>
      </div>
    </div>
  );
}
