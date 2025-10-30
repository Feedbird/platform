import React from 'react';
import CountCard from './count-card';
import ServicesTable from './services-table';
import { Service } from '@/lib/store/types';

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
          count={services.length}
          selected={selectedTableTab === 'all'}
          onClickAction={() => handleTabSwitch('all')}
        />
        <CountCard
          title="Active"
          count={services.filter((s) => s.status === 1).length}
          selected={selectedTableTab === 'active'}
          onClickAction={() => handleTabSwitch('active')}
        />
        <CountCard
          title="Archived"
          count={services.filter((s) => s.status === 0).length}
          selected={selectedTableTab === 'archived'}
          onClickAction={() => handleTabSwitch('archived')}
        />
      </div>
      <ServicesTable tableData={services} />
    </div>
  );
}
