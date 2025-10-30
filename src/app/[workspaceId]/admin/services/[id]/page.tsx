'use client';
import ServicesHeader from '@/components/services/services-header';
import { DynamicIcon } from '@/components/shared/DynamicIcon';
import AdvancedTextArea from '@/components/ui/advanced-textarea';
import { Input } from '@/components/ui/input';
import { useServices } from '@/contexts/services/ServicesPageContext';
import { DEFAULT_ICON_SVG } from '@/lib/constants/default-icon';
import { useParams } from 'next/navigation';
import React from 'react';

export default function ServiceEditor() {
  const params = useParams();

  const { activeService, setActiveService } = useServices();

  if (!activeService) return null;

  return (
    <main className="min-h-screen w-full bg-[#FBFBFB]">
      <ServicesHeader />
      <div className="flex items-center justify-center p-6">
        <div className="border-elementStroke flex w-full max-w-[640px] flex-col gap-6 rounded-[8px] border-1 bg-white px-3 py-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex gap-2 text-sm font-medium">
                <span className="text-sm font-medium text-black">Name</span>
                <p className="text-grey text-sm font-normal">(Required)</p>
              </div>
              <p className="text-grey text-sm font-normal">
                Name of the product or service, visible to customers.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="border-buttonStroke flex aspect-square h-[36px] w-[36px] items-center justify-center rounded-[6px] border-1">
                <DynamicIcon
                  svg={activeService.icon?.svg ?? DEFAULT_ICON_SVG}
                  className="h-5 w-5 text-black"
                />
              </div>
              <Input
                onChange={(e) =>
                  setActiveService(() => ({
                    ...activeService,
                    name: e.target.value,
                  }))
                }
                value={activeService.name}
                className="rounded-[6px] text-black"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex gap-2 text-sm font-medium">
                <span className="text-sm font-medium text-black">
                  Description
                </span>
                <p className="text-grey text-sm font-normal">(Required)</p>
              </div>
              <p className="text-grey text-sm font-normal">
                Appears at checkout, on the customer portal, and in quotes.
              </p>
            </div>
            <AdvancedTextArea
              value={activeService.description ?? ''}
              setter={(val: string) =>
                setActiveService({
                  ...activeService,
                  description: val,
                })
              }
            />
          </div>
        </div>
      </div>
    </main>
  );
}
