import { CheckoutServiceBuilder } from '@/app/[workspaceId]/admin/services/checkout/_inner';
import Image from 'next/image';
import React from 'react';
import { Button } from '@/components/ui/button';
import { mapPeriodicity } from '@/lib/utils/transformers';

type Props = {
  serviceBuilder: CheckoutServiceBuilder;
};

export default function BuilderServiceCard({ serviceBuilder }: Props) {
  const service = serviceBuilder.service;
  const plans = service.service_plans ?? [];

  if (!serviceBuilder.is_active) return null;
  return (
    <div className="relative flex flex-col justify-between gap-3 rounded-[8px] border-1 border-[#D3D3D3] bg-white p-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <Image
            src={service.icon ? service.icon.svg : '/images/icons/default.svg'}
            alt="service_icon"
            width={20}
            height={20}
          />
          <span className="text-sm font-medium text-black">{service.name}</span>
        </div>
        <p className="text-[13px] font-normal text-[#5C5E63]">
          {service.brief ?? '-'}
        </p>
      </div>
      <div className="flex flex-row items-center justify-between text-black">
        <div className="flex flex-row gap-1 text-sm">
          {plans.length > 1 && <p>from</p>}
          <span className="font-medium">
            ${plans[0]?.price ?? '-'}/{mapPeriodicity(plans[0]?.billing_period)}
          </span>
        </div>
        <Button
          variant="ghost"
          className={`h-10 rounded-full font-medium text-[#4670F9] hover:cursor-pointer ${
            service.service_plans && service.service_plans.length === 1
              ? 'w-[100px]'
              : 'w-[131px]'
          } flex items-center justify-center border-1 border-[#4670F9] bg-transparent px-4 py-2.5`}
        >
          {service.service_plans && service.service_plans.length > 1
            ? '+ Select plan'
            : '+ Add'}
        </Button>
      </div>
    </div>
  );
}
