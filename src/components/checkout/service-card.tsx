import { Service, ServiceChannel, ServicePlan } from '@/lib/store/types';
import React from 'react';
import { Button } from '../ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '../ui/select';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import MultiSelectDropdown from './channel-select';
import { mapPeriodicity } from '@/lib/utils/transformers';

export type ServiceCardPlan = {
  plan: ServicePlan;
  channels: ServiceChannel[];
};

type Props = {
  service: Service;
  isActivated: boolean;
  selector: React.Dispatch<React.SetStateAction<Map<string, ServiceCardPlan>>>;
};

export default function ServiceCard({ service, selector, isActivated }: Props) {
  const [selectingMode, setSelectingMode] = React.useState(false);
  const [channelsSelected, setChannelsSelected] = React.useState<
    ServiceChannel[]
  >([]);
  const [planSelected, selectPlan] = React.useState<ServicePlan | null>(null);
  const [added, isAdded] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [ddOpen, isDDOpen] = React.useState(true);

  React.useEffect(() => {
    if (planSelected) {
      if (channelsSelected.length > 0) {
        const total =
          planSelected.price +
          channelsSelected
            .slice(1)
            .reduce((acc, channel) => acc + (channel.pricing || 0), 0);
        setTotal(total);
      } else {
        setTotal(planSelected.price);
      }
    }
  }, [planSelected, channelsSelected]);

  const plans = React.useMemo(
    () =>
      service.service_plans
        ? service.service_plans?.sort((a, b) => a.price - b.price)
        : [],
    [service.service_plans]
  );

  const channels =
    service.social_channels && service.channels?.length ? service.channels : [];

  const handleAdd = () => {
    if (!planSelected) {
      toast.error('Please select a plan first');
      return;
    }
    selector((prev) => {
      const newMap = new Map(prev);
      newMap.set(service.id, {
        plan: planSelected,
        channels: channelsSelected,
      });
      return newMap;
    });
    isAdded(true);
  };

  const handleRemove = () => {
    selector((prev) => {
      const newMap = new Map(prev);
      newMap.delete(service.id);
      return newMap;
    });
    isAdded(false);
    selectPlan(null);
    setSelectingMode(false);
  };

  React.useEffect(() => {
    if (!isActivated) {
      isAdded(false);
      selectPlan(null);
      setSelectingMode(false);
      setChannelsSelected([]);
    }
  }, [isActivated]);

  React.useEffect(() => {
    if (selectingMode) {
      isDDOpen(true);
    }
  }, [selectingMode]);

  React.useEffect(() => {
    if (added && planSelected) {
      selector((prev) => {
        const newMap = new Map(prev);
        newMap.set(service.id, {
          plan: planSelected,
          channels: channelsSelected,
        });
        return newMap;
      });
    }
  }, [channelsSelected]);

  const handleSelection = () => {
    if (service.service_plans && service.service_plans.length === 1) {
      isAdded(true);
      setSelectingMode(true);
      selectPlan(service.service_plans![0]);
      selector((prev) => {
        const newMap = new Map(prev);
        newMap.set(service.id, {
          plan: service.service_plans![0],
          channels: [],
        });
        return newMap;
      });
    } else {
      setSelectingMode(true);
    }
  };

  if (service.name === 'Instagram Growth') {
    console.log(service);
  }

  return (
    <div className="relative flex flex-col justify-between gap-3 rounded-[8px] border-1 border-[#D3D3D3] bg-white p-5">
      {selectingMode && (
        <div className="absolute top-2 right-2" onClick={handleRemove}>
          <Image
            src="/images/forms/delete-red.svg"
            alt="Delete"
            width={14}
            height={14}
          />
        </div>
      )}
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
      {!selectingMode ? (
        <div className="flex flex-row items-center justify-between text-black">
          <div className="flex flex-row gap-1 text-sm">
            <p>from</p>
            <span className="font-medium">
              ${plans[0]?.price ?? '-'}/
              {mapPeriodicity(plans[0]?.billing_period)}
            </span>
          </div>
          <Button
            onClick={handleSelection}
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
      ) : (
        <div className="flex flex-col gap-3">
          {service.service_plans && service.service_plans.length > 1 && (
            <div className="flex flex-col gap-1 text-black">
              <label className="text-sm font-medium">Plan</label>
              <Select
                open={ddOpen}
                onOpenChange={(open) => isDDOpen(open)}
                value={planSelected ? planSelected.id : undefined}
                onValueChange={(value) => {
                  const selected = plans.find((plan) => plan.id === value);
                  if (selected) {
                    selectPlan(selected);
                    isAdded(true);
                    selector((prev) => {
                      const newMap = new Map(prev);
                      newMap.set(service.id, {
                        plan: selected,
                        channels: channelsSelected,
                      });
                      return newMap;
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full cursor-pointer rounded-[6px] border-1 border-[#D3D3D3] bg-white text-[13px] text-black">
                  {planSelected
                    ? `${planSelected.value} - $${planSelected.price}/${mapPeriodicity(planSelected.billing_period)}`
                    : 'Select a plan'}
                </SelectTrigger>
                <SelectContent>
                  <div className="flex flex-col gap-1">
                    {plans.map((plan, index) => (
                      <SelectItem
                        value={plan.id}
                        key={`plan_${index}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectPlan(plan);
                        }}
                        className="rounded-[4px] p-1 text-[13px] font-medium text-black hover:cursor-pointer hover:bg-[#F3F3F3]"
                      >
                        {plan.value} - ${plan.price}/
                        {mapPeriodicity(plan.billing_period)}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>
          )}
          {channels.length > 0 && (
            <div className="flex flex-col gap-1 text-black">
              <label className="text-sm font-medium">Social channels</label>
              <MultiSelectDropdown
                channels={channels}
                channelsSelected={channelsSelected}
                selectChannels={setChannelsSelected}
              />
            </div>
          )}
          <div className="flex flex-row items-center justify-between">
            <span className="text-sm font-medium text-black">
              {planSelected
                ? `$${total}/${mapPeriodicity(planSelected.billing_period)}`
                : ''}
            </span>
            {added ? (
              <div className="flex flex-row items-center gap-1 rounded-full bg-[#0A8550] px-4 py-2.5">
                <Check width={16} height={16} color="white" />
                <span className="text-sm font-medium text-white">Added</span>
              </div>
            ) : (
              <Button
                onClick={handleAdd}
                variant="default"
                className="flex h-10 w-[100px] items-center justify-center rounded-full border-1 bg-[#4670F9] px-4 py-2.5 font-medium text-white hover:cursor-pointer"
              >
                + Add
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
