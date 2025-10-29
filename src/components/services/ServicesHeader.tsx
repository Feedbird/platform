import { ChevronLeftIcon, ChevronRightIcon, Columns2Icon } from 'lucide-react';
import React from 'react';
import FeedbirdButton from '../shared/FeedbirdButton';
import { SidebarTrigger } from '../ui/sidebar';

type Props = {
  selectedServiceTitle?: string;
};

export default function ServicesHeader({ selectedServiceTitle }: Props) {
  return (
    <header className="border-buttonStroke flex justify-between border-b-1 bg-white px-3 py-2.5">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        {selectedServiceTitle ? (
          <div className="flex items-center gap-2">
            <span className="text-darkGrey text-sm font-normal">Services</span>
            <ChevronRightIcon size={14} color="#838488" />
            <span className="text-sm font-medium text-black">
              {selectedServiceTitle}
            </span>
          </div>
        ) : (
          <span className="text-base font-semibold text-black">Services</span>
        )}
      </div>
      {selectedServiceTitle ? (
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
            action={() => {}}
            variation="primary"
          />
        </div>
      )}
    </header>
  );
}
