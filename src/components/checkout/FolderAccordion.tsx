import { ServiceFolder } from "@/lib/supabase/interfaces";
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import ServiceCard, { ServiceCardPlan } from "./ServiceCard";
import { Divider } from "@mui/material";

type Props = {
  index: number;
  folder: ServiceFolder;
  selectedPlans: Map<string, ServiceCardPlan>;
  setSelectedPlans: React.Dispatch<
    React.SetStateAction<Map<string, ServiceCardPlan>>
  >;
};

export default function FolderAccordion({
  index,
  folder,
  selectedPlans,
  setSelectedPlans,
}: Props) {
  return (
    <div key={`service-folder-${index}`}>
      <Accordion type="single" collapsible defaultValue={folder.name}>
        <AccordionItem value={folder.name} className="border-b-0">
          <AccordionTrigger className="h-12 cursor-pointer">
            <h3 className="py-5 text-base font-medium text-[#1C1D1F]">
              {folder.name}
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {folder.services?.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isActivated={selectedPlans.has(service.id)}
                  selector={setSelectedPlans}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Divider className="pt-5" />
    </div>
  );
}
