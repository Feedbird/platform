'use client';
import { ChevronLeftIcon, ChevronRightIcon, Columns2Icon } from 'lucide-react';
import React from 'react';
import FeedbirdButton from '../shared/FeedbirdButton';
import { SidebarTrigger } from '../ui/sidebar';
import { servicesApi } from '@/lib/api/api-service';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useServices } from '@/contexts/services/ServicesPageContext';

export default function ServicesHeader() {
  const { activeWorkspaceId, activeService, setActiveService } = useServices();
  const router = useRouter();
  const handleCreateService = async () => {
    try {
      const newService = await servicesApi.createDraftService(
        activeWorkspaceId!
      );

      router.push(`/${activeWorkspaceId}/admin/services/${newService.data}`);
      // Redirect to the new service editor page
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <header className="border-buttonStroke flex justify-between border-b-1 bg-white px-3 py-2.5">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        {activeService ? (
          <div className="flex items-center gap-2">
            <span
              className="text-darkGrey cursor-pointer text-sm font-normal"
              onClick={() => {
                setActiveService(null);
                router.push(`/${activeWorkspaceId}/admin/services`);
              }}
            >
              Services
            </span>
            <ChevronRightIcon size={14} color="#838488" />
            <span className="text-sm font-medium text-black">
              {activeService.name}
            </span>
          </div>
        ) : (
          <span className="text-base font-semibold text-black">Services</span>
        )}
      </div>
      {activeService ? (
        <FeedbirdButton
          text="Save"
          action={() => {}}
          variation="primary"
          customClassName="text-[13px] font-medium px-[14px]"
        />
      ) : (
        <div className="flex gap-2">
          <FeedbirdButton
            text="Analyze"
            startComponent={<ChevronLeftIcon size={14} />}
            variation="secondary"
            action={() => {}}
          />
          <FeedbirdButton
            text="+New Service"
            action={handleCreateService}
            variation="primary"
          />
        </div>
      )}
    </header>
  );
}
