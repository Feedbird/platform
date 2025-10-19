import CheckoutBuilderSideBar from "@/components/checkout/builder/ServicesSideBar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import CheckoutBuilderClient from "./_inner";
import { UserButton } from "@clerk/nextjs";

export default function Checkout() {
  return (
    <div className="flex flex-col w-full h-full">
      <header className="h-[48px] flex items-center justify-between border-b border-border-primary px-4 bg-white">
        <div className="flex gap-2">
          <SidebarTrigger className="cursor-pointer shrink-0" />
          <h1 className="text-base font-semibold text-black">
            Checkout builder
          </h1>
        </div>
        <div className="flex">
          <UserButton afterSignOutUrl="/landing" />
        </div>
      </header>
      <CheckoutBuilderClient />
    </div>
  );
}
