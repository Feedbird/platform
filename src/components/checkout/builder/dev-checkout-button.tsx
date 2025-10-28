"use client";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import React from "react";
import { WorkspaceStore } from "@/lib/store/workspace-store";

export default function DevCheckoutButton() {
  const router = useRouter();
  const activeWorkspaceId = useWorkspaceStore((s: WorkspaceStore) => s.activeWorkspaceId);
  return (
    <Button
      variant="ghost"
      onClick={() =>
        router.push(`/${activeWorkspaceId}/admin/services/checkout`)
      }
      className="border-1 border-buttonStroke hover:cursor-pointer"
    >
      Go to Checkout
    </Button>
  );
}
