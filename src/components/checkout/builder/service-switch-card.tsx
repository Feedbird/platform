import { Service } from '@/lib/store/types';
import Image from 'next/image';
import React from 'react';

type Props = {
  service: Service;
  isFolderActive: boolean;
};

export default function ServiceSwitchCard({ service, isFolderActive }: Props) {
  return (
    <div className="border-buttonStroke rounded-sm border-1 p-2 shadow-sm">
      <div
        className={`flex gap-1 ${
          !isFolderActive
            ? 'cursor-not-allowed opacity-50'
            : 'border-buttonStroke cursor-pointer opacity-100'
        }`}
      >
        <Image
          src={service.icon ? service.icon.svg : '/images/icons/default.svg'}
          alt="service_icon"
          width={16}
          height={16}
        />
        <span className="text-sm font-medium text-black">{service.name}</span>
      </div>
    </div>
  );
}
