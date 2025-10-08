"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminFilesPage() {
  return (
    <div className="flex flex-col w-full h-full">
      <header className="h-[48px] flex items-center gap-2 border-b border-border-primary px-4 bg-white">
        <SidebarTrigger className="cursor-pointer shrink-0" />
        <h1 className="text-base font-semibold text-black">Files</h1>
      </header>
      <div className="p-4 text-sm text-[#5C5E63]">Files management coming soon.</div>
    </div>
  );
}


