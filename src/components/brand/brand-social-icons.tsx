"use client";

import * as React from "react";
import { ChannelIcons } from "@/components/content/shared/content-post-ui";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { ManageSocialsDialog } from "@/components/social/manage-socials-dialog";
import { Platform, SocialPage } from "@/lib/social/platforms/platform-types";

export default function BrandSocialIcons() {
  const [isClient, setIsClient] = React.useState(false);
  const brand = useFeedbirdStore((s) => s.getActiveBrand());
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!brand || !isClient) {
    return null;
  }

  const pages: SocialPage[] = brand.socialPages ?? [];

  // If no connected pages, optionally show a simpler UI:
  if (!pages.length) {
    return (
      <div className="flex items-center gap-2 h-7.5">
        <Button variant="ghost" onClick={() => setDialogOpen(true)} className="text-sm font-semibold text-black cursor-pointer">
          Connect Social Page
        </Button>
        <ManageSocialsDialog
          brandId={brand.id}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    );
  }

  // If brand has pages, show overlapped icons + a "Manage" button
  return (
    <>
      <div className="flex items-center gap-2 h-7.5">
        <HoverCard openDelay={120}>
          <HoverCardTrigger asChild className='cursor-pointer p-0'>
            <div className="relative" onClick={() => setDialogOpen(true)}>
              <div className="flex items-center text-sm justify-center px-[8px] py-[4px] cursor-pointer">
                {/* Group pages by platform and show counts */}
                {Object.entries(
                  pages.reduce((acc, page) => {
                    acc[page.platform] = (acc[page.platform] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([platform, count], idx) => (
                  <div key={platform} className={
                    idx
                      ? "-ml-2 border border-white bg-white rounded-full"
                      : ""
                  }
                  style={{ zIndex: 7 - idx }}>
                    <ChannelIcons 
                      channels={[platform as Platform]} 
                      whiteBorder={true}
                      size={20}
                    />
                  </div>
                ))}
                <span className="text-xs font-semibold p-[3px] text-[#5C5E63] flex items-center justify-center bg-[#EEEFF2] w-[16px] h-[16px] rounded-full ml-[8px]">{pages.length}</span>
              </div>
            </div>
          </HoverCardTrigger>

          <HoverCardContent className="p-2 w-[220px]">
            <p className="text-sm font-semibold mb-2">Connected Pages</p>
            <ul className="space-y-1 text-xs">
              {pages.map((sp) => (
                <li key={sp.id} className="flex items-center gap-2">
                  <ChannelIcons channels={[sp.platform]} />
                  <div className="flex flex-col">
                    <span className="font-medium">{sp.name}</span>
                    {sp.connected && (
                      <span className="text-muted-foreground">
                        Connected
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </HoverCardContent>
        </HoverCard>
      </div>

      {/* Reusable dialog component */}
      <ManageSocialsDialog
        brandId={brand.id}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
