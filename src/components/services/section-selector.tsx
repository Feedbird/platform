import React from 'react';
import FeedbirdButton from '../shared/FeedbirdButton';
import {
  DownloadIcon,
  Ellipsis,
  ListFilterIcon,
  SearchIcon,
} from 'lucide-react';

type Props = {
  activeTab: 'services' | 'coupons';
  setTab: React.Dispatch<React.SetStateAction<'services' | 'coupons'>>;
};

export default function SectionSelector({ setTab, activeTab }: Props) {
  return (
    <div className="border-buttonStroke flex items-center justify-between border-b-1 px-3 py-2">
      <div className="flex">
        <span
          onClick={() => {
            if (activeTab !== 'services') {
              setTab('services');
            }
          }}
          className={`px-3 py-1.5 text-sm ${activeTab === 'services' ? 'text-main font-medium' : 'font-normal text-[#838488] hover:cursor-pointer hover:underline'}`}
        >
          Services
        </span>
        <span
          onClick={() => {
            if (activeTab !== 'coupons') {
              setTab('coupons');
            }
          }}
          className={`px-3 py-1.5 text-sm ${activeTab === 'coupons' ? 'text-main font-medium' : 'font-normal text-[#838488] hover:cursor-pointer hover:underline'}`}
        >
          Coupons
        </span>
      </div>
      <div className="flex items-center gap-2">
        <FeedbirdButton
          action={() => {}}
          text="Search"
          startComponent={<SearchIcon className="size-3.5" />}
          variation="secondary"
          customClassName="text-[13px] font-normal px-2 py-1 gap-1"
        />
        <FeedbirdButton
          action={() => {}}
          text="Filter"
          startComponent={<ListFilterIcon className="size-3.5" />}
          variation="secondary"
          customClassName="text-[13px] font-normal px-2 py-1 gap-1"
        />
        <FeedbirdButton
          action={() => {}}
          text=""
          startComponent={<Ellipsis className="size-3.5" color="#5C5E63" />}
          variation="secondary"
          customClassName="p-[5px]"
        />
      </div>
    </div>
  );
}
