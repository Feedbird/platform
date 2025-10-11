import CheckoutBuilderSideBar from "@/components/checkout/builder/CheckoutBuilderSideBar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import CheckoutBuilderClient from "./_inner";

export default function Checkout() {
  return (
    <div className="flex flex-col w-full h-full">
      <header className="h-[48px] flex items-center gap-2 border-b border-border-primary px-4 bg-white">
        <SidebarTrigger className="cursor-pointer shrink-0" />
        <h1 className="text-base font-semibold text-black">Checkout builder</h1>
      </header>
      <CheckoutBuilderClient />
    </div>
  );
}
