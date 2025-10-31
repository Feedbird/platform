'use client';
import ServicesHeader from '@/components/services/services-header';
import { DynamicIcon } from '@/components/shared/DynamicIcon';
import FeedbirdButton from '@/components/shared/FeedbirdButton';
import { Loading } from '@/components/shared/loadings';
import AdvancedTextArea from '@/components/ui/advanced-textarea';
import { Checkbox } from '@/components/ui/checkbox';
import ImageUpload from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { useServices } from '@/contexts/services/ServicesPageContext';
import { servicesApi } from '@/lib/api/api-service';
import { DEFAULT_ICON_SVG } from '@/lib/constants/default-icon';
import { useMutation } from '@tanstack/react-query';
import { CalendarSyncIcon, CopyPlusIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { toast } from 'sonner';

export default function ServiceEditor() {
  const params = useParams();

  const { activeService, setActiveService } = useServices();
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const router = useRouter();

  // Fetch service on mount
  useEffect(() => {
    const fetchActiveService = async () => {
      const service = await servicesApi.fetchServiceById(params.id as string);
      setActiveService(service.data);
    };
    if (!activeService) {
      fetchActiveService();
    }
  }, [params.id, activeService, setActiveService]);

  const mutation = useMutation({
    mutationFn: async (isDraft: boolean) => {
      if (!activeService) return;
      const payload = {
        name: activeService.name,
        description: activeService.description,
        is_recurring: activeService.is_recurring,
      };
      return servicesApi.updateServiceById(activeService.id, isDraft, payload);
    },
  });

  // Handle mutation success/error
  useEffect(() => {
    if (mutation.isSuccess) {
      toast.success('Service saved successfully');
      setActiveService(null);
      router.back();
    } else if (mutation.isError) {
      toast.error('Error saving service. Please try again.');
    }
  }, [mutation.isSuccess, mutation.isError, setActiveService, router]);

  if (!activeService) {
    return <Loading entity="services" />;
  }

  return (
    <main className="min-h-screen w-full bg-[#FBFBFB]">
      <ServicesHeader />
      <div className="flex flex-col items-center justify-center p-6">
        <div className="border-elementStroke flex w-full max-w-[640px] flex-col gap-6 rounded-t-[8px] border-1 bg-white px-3 py-4">
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
                  svg={activeService?.icon?.svg ?? DEFAULT_ICON_SVG}
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
          <div className="flex flex-col gap-2">
            <div className="flex w-full justify-between">
              <div className="flex items-center gap-2 text-sm">
                <label className="font-medium text-black">Upload Image</label>
                <p className="text-grey font-normal">(Optional)</p>
              </div>
            </div>
            <ImageUpload image={imageFile} imageHandler={setImageFile} />
          </div>
          <div
            className={`grid grid-cols-2 grid-rows-1 gap-4 hover:cursor-pointer`}
          >
            <div
              className={`flex gap-3 border-1 p-3 ${activeService.is_recurring ? 'border-main bg-[#EDF6FF]' : 'border-buttonStroke hover:bg-[#EDF6FF]'} items-center justify-between rounded-[4px]`}
              onClick={() => {
                if (!activeService.is_recurring) {
                  setActiveService({
                    ...activeService,
                    is_recurring: true,
                  });
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`${activeService.is_recurring ? 'bg-main' : 'bg-[#EDF6FF]'} flex h-8 w-8 items-center justify-center rounded-[4px]`}
                >
                  <CalendarSyncIcon
                    size={18}
                    color={activeService.is_recurring ? 'white' : '#4670F9'}
                  />
                </div>
                <div className="flex flex-col text-sm">
                  <span className="font-medium text-black">Recurring</span>
                  <p className="text-grey font-normal">Change an ongoing fee</p>
                </div>
              </div>
              <div className="flex items-center">
                <Checkbox
                  checked={activeService.is_recurring}
                  className={`size-5 rounded-full bg-white`}
                />
              </div>
            </div>
            <div
              className={`flex gap-3 border-1 p-3 ${!activeService.is_recurring ? 'border-main bg-[#EDF6FF]' : 'border-buttonStroke hover:bg-[#EDF6FF]'} items-center justify-between rounded-[4px]`}
              onClick={() => {
                if (activeService.is_recurring) {
                  setActiveService({
                    ...activeService,
                    is_recurring: false,
                  });
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`${!activeService.is_recurring ? 'bg-main' : 'bg-[#EDF6FF]'} flex h-8 w-8 items-center justify-center rounded-[4px]`}
                >
                  <CopyPlusIcon
                    size={18}
                    color={!activeService.is_recurring ? 'white' : '#4670F9'}
                  />
                </div>
                <div className="flex flex-col text-sm">
                  <span className="font-medium text-black">One-off</span>
                  <p className="text-grey font-normal">Change an one-off fee</p>
                </div>
              </div>
              <div className="flex items-center">
                <Checkbox
                  checked={!activeService.is_recurring}
                  className={`size-5 rounded-full bg-white`}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="border-elementStroke flex w-full max-w-[640px] justify-between gap-6 rounded-b-[8px] border-1 border-t-0 bg-white px-3 py-4">
          <FeedbirdButton
            variation="secondary"
            text="Save as draft"
            isLoading={mutation.isPending}
            customClassName="p-2 px-3"
            action={() => mutation.mutate(true)}
          />
          <FeedbirdButton
            variation="primary"
            text="Save"
            isLoading={mutation.isPending}
            action={() => mutation.mutate(false)}
            customClassName="p-2 px-3"
          />
        </div>
      </div>
    </main>
  );
}
