import { servicesApi } from "@/lib/api/api-service";
import { ServiceFolder } from "@/lib/store/types";
import React from "react";
import { toast } from "sonner";
import FolderAccordion from "./folder-accordion";
import PaymentForm from "./payment-form";
import { ServiceCardPlan } from "./service-card";

type Props = {
  workspaceId: string | null;
  serviceFolders: ServiceFolder[];
  selectedPlans: Map<string, ServiceCardPlan>;
  setSelectedPlans: React.Dispatch<
    React.SetStateAction<Map<string, ServiceCardPlan>>
  >;
  setServiceFolders: React.Dispatch<React.SetStateAction<ServiceFolder[]>>;
};

export default function ServiceSection({
  workspaceId,
  serviceFolders,
  selectedPlans,
  setServiceFolders,
  setSelectedPlans,
}: Props) {
  const [loading, isLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const fetchServiceFolders = async () => {
      isLoading(true);
      try {
        if (!workspaceId) return;
        const data = await servicesApi.fetchServiceFolders(workspaceId);
        setServiceFolders(data);
      } catch (error) {
        toast.error("An error occurred while fetching service folders");
      } finally {
        isLoading(false);
      }
    };
    fetchServiceFolders();
  }, [workspaceId]);
  return (
    <>
      <div className="mt-10">
        <h2 className="pb-3 text-[20px] font-medium text-[#1C1D1F]">
          2. Select services
        </h2>
        {loading && (
          <div className="flex h-full min-h-[400px] w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Loading services...</span>
          </div>
        )}
        {!loading && !workspaceId && (
          <div className="flex h-full min-h-[150] w-full items-center justify-center">
            <span className="text-gray-600">
              Fill your email to see your available services
            </span>
          </div>
        )}
        {!loading && workspaceId && serviceFolders.length === 0 && (
          <div className="flex h-full min-h-[400px] w-full items-center justify-center">
            <span className="text-gray-600">No services available</span>
          </div>
        )}
        {serviceFolders &&
          serviceFolders.map((folder, index) => (
            <FolderAccordion
              key={index}
              folder={folder}
              index={index}
              selectedPlans={selectedPlans}
              setSelectedPlans={setSelectedPlans}
            />
          ))}
      </div>
      <div className="flex flex-col gap-6 pt-8">
        <h2 className="pb-3 text-[20px] font-medium text-[#1C1D1F]">
          2. Payment method
        </h2>
        <PaymentForm />
      </div>
    </>
  );
}
