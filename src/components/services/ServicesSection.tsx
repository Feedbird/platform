import React from 'react';
import CountCard from './CountCard';
import ServicesTable from './ServicesTable';
import { Service } from '@/lib/supabase/interfaces';

type Props = {
  services: Service[];
  selectedTableTab: 'all' | 'active' | 'archived';
  handleTabSwitch: (tab: 'all' | 'active' | 'archived') => void;
};

export default function ServicesSection({
  services,
  selectedTableTab,
  handleTabSwitch,
}: Props) {
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-3 grid-rows-1 gap-3 px-3 py-4">
        <CountCard
          title="All"
          count={2}
          selected={selectedTableTab === 'all'}
          onClickAction={() => handleTabSwitch('all')}
        />
        <CountCard
          title="Active"
          count={0}
          selected={selectedTableTab === 'active'}
          onClickAction={() => handleTabSwitch('active')}
        />
        <CountCard
          title="Archived"
          count={0}
          selected={selectedTableTab === 'archived'}
          onClickAction={() => handleTabSwitch('archived')}
        />
      </div>
      <ServicesTable tableData={services} />
    </div>
  );
}
