// file: app/brand-social/page.tsx
"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWorkspaceStore, useSocialStore } from "@/lib/store";
import { WorkspaceStore } from "@/lib/store/workspace-store";
import { SocialStore } from "@/lib/store/social-store";

function BrandSocialCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const platform = searchParams.get("platform");
  const accessToken = searchParams.get("access_token");
  const error = searchParams.get("error");
  // We'll assume you always have some active brand, or you store it in session, etc.
  const brandId = useWorkspaceStore((s: WorkspaceStore) => s.activeBrandId);
  const connectAccount = useSocialStore((s: SocialStore) => s.connectSocialAccount);
  const stagePages = useSocialStore((s: SocialStore) => s.stageSocialPages);

  useEffect(() => {
    if (error) {
      // If user canceled or something, just redirect or show error
      alert("Error connecting Facebook: " + error);
      const activeWorkspace = useWorkspaceStore((s: WorkspaceStore) => s.getActiveWorkspace());
      if (activeWorkspace) {
        router.replace(`/${activeWorkspace.id}`);
      } else {
        router.replace("/");
      }
      return;
    }
    if (platform === "facebook" && accessToken && brandId) {
      // Connect the account first
      const localAccountId = connectAccount(
        brandId,
        "facebook",
        {
          name: "My FB Account",
          accountId: "fb_user" // Placeholder, should be real user id
        }
      );
      // Stage a placeholder page (should be replaced with real FB page info)
      stagePages(brandId, "facebook", [
        {
          id: "temp-" + Date.now(),
          pageId: "pending_page_id",
          name: "My FB Page",
          platform: "facebook",
          accountId: localAccountId,
          connected: false,
          status: "pending",
          entityType: "page"
        }
      ], localAccountId);
      // Then redirect to brand or somewhere
      const activeWorkspace = useWorkspaceStore((s: WorkspaceStore) => s.getActiveWorkspace());
      if (activeWorkspace) {
        router.replace(`/${activeWorkspace.id}/brands`);
      } else {
        router.replace("/brands");
      } 
    }
  }, [platform, accessToken, brandId, connectAccount, stagePages, router, error]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium">Connecting Facebook…</h2>
      <p>Please wait while we finalize the connection.</p>
    </div>
  );
}

export default function BrandSocialCallbackPage() {
  return (
    <Suspense>
      <BrandSocialCallbackInner />
    </Suspense>
  );
}
