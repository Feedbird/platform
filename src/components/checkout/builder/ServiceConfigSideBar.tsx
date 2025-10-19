import {
  CheckoutServiceBuilder,
  SidebarContext,
} from "@/app/[workspaceId]/admin/services/checkout/_inner";
import { ChevronRight } from "lucide-react";
import React from "react";

type Props = {
  service?: CheckoutServiceBuilder;
  setContext: React.Dispatch<React.SetStateAction<SidebarContext>>;
};

export default function ServiceConfigSideBar({ service, setContext }: Props) {
  console.log(`RECEIVING:`, service);
  const [activeService, setActiveService] = React.useState<
    CheckoutServiceBuilder | undefined
  >(service);

  if (!activeService) return null;

  React.useEffect(() => {
    setActiveService(service);
  }, [service]);
  return (
    <div className="border-border-primary border-l-1 w-[330px] bg-[#FAFAFA] h-full flex-shrink-0 flex flex-col overflow-hidden">
      <header className="flex gap-1 border-border-primary items-center border-b-1 w-full p-3 text-black font-medium text-sm">
        <span
          className="opacity-80 hover:cursor-pointer"
          onClick={() => setContext({ service: null, mode: "services" })}
        >
          Services
        </span>
        <ChevronRight size={16} />
        <span>{activeService.service.name}</span>
      </header>
      <div className="p-2.5 flex flex-col flex-1 overflow-y-scroll"> </div>
    </div>
  );
}
