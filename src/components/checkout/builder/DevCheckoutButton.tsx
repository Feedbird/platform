"use client";
import { Button } from "@/components/ui/button";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { useRouter } from "next/navigation";
import React from "react";

export default function DevCheckoutButton() {
  const router = useRouter();
  const { activeWorkspaceId } = useFeedbirdStore();
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
