import { Service } from "@/lib/supabase/client";
import Image from "next/image";
import React from "react";

type Props = {
  service: Service;
  isFolderActive: boolean;
};

export default function ServiceSwitchCard({ service, isFolderActive }: Props) {
  return (
    <div className="border-1 border-buttonStroke shadow-sm rounded-sm p-2">
      <div
        className={`flex gap-1 ${
          !isFolderActive
            ? "opacity-50 cursor-not-allowed"
            : "border-buttonStroke opacity-100 cursor-pointer"
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
