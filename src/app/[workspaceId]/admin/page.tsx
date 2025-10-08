"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminHomePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!workspaceId) return;
    router.replace(`/${workspaceId}/admin/clients`);
  }, [router, workspaceId]);

  return (
    <div className="flex flex-col w-full h-full">
      <header className="h-[48px] flex items-center gap-2 border-b border-border-primary px-4 bg-white">
        <SidebarTrigger className="cursor-pointer shrink-0" />
        <h1 className="text-base font-semibold text-black">Admin</h1>
      </header>
    </div>
  );
}


