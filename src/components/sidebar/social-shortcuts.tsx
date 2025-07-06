/* components/sidebar/social-shortcuts.tsx */
"use client";

import * as React from 'react';
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * This component:
 *  - Lists all connected pages from the active brand
 *  - Renders a Link to /social/[pageId]
 * 
 * We do *not* call syncPostHistory here anymore.
 * The actual fetch is done in /social/[pageId]/page.tsx.
 */
export default function SocialShortcuts() {
  const pathname = usePathname();
  const brand = useFeedbirdStore((s) => s.getActiveBrand());
  const { state } = useSidebar();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Get all connected pages from brand
  const pages = brand?.socialPages?.filter((p) => p.connected) ?? [];
  
  // On the server, and on the first client render, return null to match server-rendered HTML.
  if (!isClient || !pages.length) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      {pages.map((page) => {
        const active = pathname.includes(page.id);
        const content = (
          <SidebarMenuButton
            asChild
            className={cn(
              active && "bg-[#D7E9FF]",
              "gap-[6px] p-[6px] text-black text-sm font-medium"
            )}
          >
            <Link
              href={`/social/${page.id}`}
              className="flex items-center gap-2"
            >
              <Image
                src={`/images/platforms/${page.platform}.svg`}
                alt={page.name}
                width={18}
                height={18}
              />
              <span className="font-semibold truncate text-black">
                {page.name}
              </span>
            </Link>
          </SidebarMenuButton>
        );

        return (
          <SidebarMenuItem key={page.id}>
            {state === 'collapsed' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  {content}
                </TooltipTrigger>
                <TooltipContent
                  side="right" 
                  className="flex items-center gap-2 bg-popover text-popover-foreground shadow-md [&>svg]:hidden [&>div]:hidden"
                >
                  <Image
                    src={`/images/platforms/${page.platform}.svg`}
                    alt={page.name}
                    width={16}
                    height={16}
                  />
                  <span className="text-sm font-semibold">{page.name}</span>
                </TooltipContent>
              </Tooltip>
            ) : (
              content
            )}
          </SidebarMenuItem>
        );
      })}
    </TooltipProvider>
  );
}