"use client";
import React, { useState, useEffect } from "react";
import { MultiSelect, SelectOption } from "@/components/ui/multi-select";

// TODO: Replace with actual API service
// import { servicesApi } from "@/lib/api/services-api";

interface ServicesMultiSelectProps {
  workspaceId: string;
  selectedServices: string[];
  onSelectionChange: (serviceIds: string[]) => void;
  className?: string;
  placeholder?: string;
}

// Dummy data - replace with actual API call
const DUMMY_SERVICES: SelectOption[] = [
  { id: "1", name: "Social Media Posts", value: "social-media-posts" },
  { id: "2", name: "Instagram Growth", value: "instagram-growth" },
  { id: "3", name: "Short-Form Videos", value: "short-form-videos" },
  { id: "4", name: "Blog Post", value: "blog-post" },
  { id: "5", name: "Static Ads", value: "static-ads" },
  { id: "6", name: "Email Design", value: "email-design" },
  { id: "7", name: "SEO Backlinks", value: "seo-backlinks" },
  { id: "8", name: "Meta Ads Management", value: "meta-ads-management" },
  { id: "9", name: "Video Ads", value: "video-ads" },
  { id: "10", name: "UGC Videos", value: "ugc-videos" },
];

export function ServicesMultiSelect({
  workspaceId,
  selectedServices,
  onSelectionChange,
  className = "",
  placeholder = "Select services...",
}: ServicesMultiSelectProps) {
  const [services, setServices] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const { data } = await servicesApi.getServicesByWorkspace(workspaceId);
        // const formattedServices = data.map(service => ({
        //   id: service.id,
        //   name: service.name,
        //   value: service.id
        // }));
        // setServices(formattedServices);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setServices(DUMMY_SERVICES);
      } catch (error) {
        console.error("Failed to fetch services:", error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchServices();
    }
  }, [workspaceId]);

  return (
    <MultiSelect
      options={services}
      selectedValues={selectedServices}
      onSelectionChange={onSelectionChange}
      placeholder={placeholder}
      className={className}
      loading={loading}
      searchable={true}
      maxDisplayTags={2}
    />
  );
}
