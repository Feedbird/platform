// file: app/brand-social/page.tsx
"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";

function BrandSocialCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const platform = searchParams.get("platform");
  const accessToken = searchParams.get("access_token");
  const error = searchParams.get("error");
  // We'll assume you always have some active brand, or you store it in session, etc.
  const brandId = useFeedbirdStore((s) => s.activeBrandId);
  const connectAccount = useFeedbirdStore((s) => s.connectSocialAccount);
  const stagePages = useFeedbirdStore((s) => s.stageSocialPages);

  useEffect(() => {
    if (error) {
      // If user canceled or something, just redirect or show error
      alert("Error connecting Facebook: " + error);
      const activeWorkspace = useFeedbirdStore.getState().getActiveWorkspace();
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
          accountId: "fb_user", // Placeholder, should be real user id
          authToken: accessToken
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
          authToken: accessToken,
          connected: false,
          status: "pending",
          entityType: "page"
        }
      ], localAccountId);
      // Then redirect to brand or somewhere
      const activeWorkspace = useFeedbirdStore.getState().getActiveWorkspace();
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
