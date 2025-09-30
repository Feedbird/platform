"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function SettingsIndexRedirect() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  useEffect(() => {
    if (workspaceId) {
      router.replace(`/${workspaceId}/settings/workspace`);
    }
  }, [router, workspaceId]);

  return null;
}



