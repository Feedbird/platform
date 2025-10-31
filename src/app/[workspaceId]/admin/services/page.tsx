'use client';

import React, { useEffect } from 'react';
import ServicesHeader from '@/components/services/services-header';
import SectionSelector from '@/components/services/section-selector';
import ServicesSection from '@/components/services/services-selection';
import { useQuery } from '@tanstack/react-query';
import { servicesApi } from '@/lib/api/api-service';
import { useWorkspaceStore } from '@/lib/store';
import { useServices } from '@/contexts/services/ServicesPageContext';

type SelectedTableTab = 'all' | 'active' | 'archived';

export default function AdminServicesPage() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const { setActiveService, activeService } = useServices();
  const [selectedTableTab, setSelectedTableTab] =
    React.useState<SelectedTableTab>('all');
  const [sectionTab, setSectionTab] = React.useState<'services' | 'coupons'>(
    'services'
  );

  const { data: servicesResponse } = useQuery({
    queryKey: ['services', activeWorkspaceId],
    queryFn: () => servicesApi.fetchAllServices(activeWorkspaceId!),
  });

  const handleTabSwitch = (tab: SelectedTableTab) => {
    if (tab === selectedTableTab) return;
    setSelectedTableTab(tab);
  };

  useEffect(() => {
    if (activeService) {
      setActiveService(null);
    }
  }, [activeService]);
  return (
    <main className="flex h-full w-full flex-col">
      <ServicesHeader />
      <SectionSelector setTab={setSectionTab} activeTab={sectionTab} />
      {sectionTab === 'services' && (
        <ServicesSection
          services={servicesResponse?.data ?? []}
          selectedTableTab={selectedTableTab}
          handleTabSwitch={handleTabSwitch}
        />
      )}
    </main>
  );
}
