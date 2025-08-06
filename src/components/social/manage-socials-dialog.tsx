"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFeedbirdStore, Platform } from "@/lib/store/use-feedbird-store";
import { ChannelIcons } from "@/components/content/shared/content-post-ui";
import { cn } from "@/lib/utils";
import { useAsyncLoading } from "@/hooks/use-async-loading";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertTriangle, Link, MoreHorizontal, RefreshCw, Trash, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const PLATFORMS: Platform[] = [
  "facebook", "instagram", "linkedin", "pinterest", "youtube", "tiktok", "google"
];

// Platform-specific connect options
const PLATFORM_CONNECT_OPTIONS = {
  facebook: [{ title: "Add Facebook Page" }],
  instagram: [
    { title: "Add Instagram Professional Account" },
    { title: "Add Instagram Account via Facebook" }
  ],
  tiktok: [
    { title: "Add TikTok Business Account" },
    { title: "Add TikTok Account" }
  ],
  pinterest: [{ title: "Add Pinterest Account" }],
  google: [{ title: "Add Google Business Profile" }],
  linkedin: [
    { title: "Add LinkedIn Personal Profile" },
    { title: "Add LinkedIn Company Page" }
  ],
  youtube: [{ title: "Add YouTube Channel" }]
};

export function ManageSocialsDialog(props: {
  brandId: string; open: boolean; onOpenChange(o: boolean): void;
}) {
  const { brandId, open, onOpenChange } = props;
  const { executeWithLoading, isLoading } = useAsyncLoading();

  const brand = useFeedbirdStore(
    s => s.getActiveWorkspace()?.brand
  );

  const connectAccount    = useFeedbirdStore(s => s.connectSocialAccount);
  const stagePages        = useFeedbirdStore(s => s.stageSocialPages);
  const confirmPage       = useFeedbirdStore(s => s.confirmSocialPage);
  const disconnectPage    = useFeedbirdStore(s => s.disconnectSocialPage);
  const checkPageStatus   = useFeedbirdStore(s => s.checkPageStatus);

  const [activePlatform, setActivePlatform] = useState<Platform>("facebook");
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);

  /* ————————— Listen for popup messages ————————— */
  useEffect(() => {
    function handler(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.error) {
       toast.error("Authentication failed", { description: e.data.error });
       setConnectingPlatform(null);
       return;
      }
      
      const { platform, account, pages } = e.data;
      
      executeWithLoading(async () => {
        if (!account) {
          throw new Error("No account found. Please ensure you have the correct permissions.");
        }
        const localAccountId = connectAccount(brandId, platform, {
          name: account.name, accountId: account.accountId, authToken: account.authToken,
        });
        stagePages(brandId, platform, pages, localAccountId);
        if (platform === "instagram" && pages.length === 1) {
         await confirmPage(brandId, pages[0].id);
        }
        
        // Custom success/warning notifications
        if (pages && pages.length > 0) {
         toast.success("Account connected successfully!", {
           description: `Found and staged ${pages.length} new page(s).`
         });
        } else {
         let message = "Your account is connected, but no pages/boards were found.";
         if (platform === 'pinterest') {
           message = "Your Pinterest account is connected, but has no boards. Please create a board on Pinterest first."
         }
         toast.warning("Account connected", {
           description: message,
         });
        }
      }, `Connecting ${platform}...`).finally(() => {
        if (connectingPlatform) {
          setActivePlatform(connectingPlatform);
          setConnectingPlatform(null);
        }
      });
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [brandId, connectAccount, stagePages, confirmPage, executeWithLoading, connectingPlatform]);

  /* ————————— Handle popup closure ————————— */
  useEffect(() => {
    let popup: Window | null = null;
    let interval: NodeJS.Timeout | null = null;

    if (connectingPlatform) {
      const w = 600, h = 700;
      const left = window.screenX + (window.outerWidth  - w) / 2;
      const top  = window.screenY + (window.outerHeight - h) / 2;
      popup = window.open(`/api/oauth/${connectingPlatform}`, "_blank", `width=${w},height=${h},left=${left},top=${top}`);

      interval = setInterval(() => {
        if (popup?.closed) {
          setConnectingPlatform(null);
          if (interval) clearInterval(interval);
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connectingPlatform]);

  /* ————————— Helpers ————————— */
  function openPopup(p: Platform) {
    setConnectingPlatform(p);
  }

  const createApiHandler = (
    apiCall: (brandId: string, pageId: string) => Promise<any>,
    pageId: string,
    messages: { loading: string; success: string; error: string }
  ) => () => {
   return executeWithLoading(() => apiCall(brandId, pageId), messages);
  }

  const handleConfirmPage = (pageId: string) =>
   createApiHandler(confirmPage, pageId, {
     loading: "Connecting page...",
     success: "Page connected successfully!",
     error: "Failed to connect page."
   });

  const handleDisconnectPage = (pageId: string) =>
   createApiHandler(disconnectPage, pageId, {
     loading: "Disconnecting page...",
     success: "Page disconnected successfully!",
     error: "Failed to disconnect page."
   });

  const handleCheckPageStatus = (pageId: string) =>
   createApiHandler(checkPageStatus, pageId, {
     loading: "Checking page status...",
     success: "Page status updated.",
     error: "Failed to check page status."
   });
   
  if (!brand) return null;

  const pages = brand.socialPages;
  const [connected, pending] = [
    pages.filter(p => p.connected),
    pages.filter(p => !p.connected),
  ];

  /* ————————— Render ————————— */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-none sm:max-w-none flex flex-col p-0 pb-5", "gap-0 rounded-[12px] bg-white")}
                     style={{ width : "584px", height: "auto" }}>

        <DialogTitle className="sr-only">Connect Social Accounts</DialogTitle>
        <DialogHeader className="px-5 pt-5 mb-4 text-center">
          <h2 className="font-semibold text-black text-lg mb-2">Connect Socials</h2>
          <p className="text-sm text-[#5C5E63] font-normal">You can add more by clicking +add account below.</p>
        </DialogHeader>

        {/* ——— Platform Selection ——— */}
        <div className="flex justify-center gap-2 mb-6 px-5">
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => setActivePlatform(p)}
              disabled={isLoading}
              className={cn(
                "w-full flex flex-col items-center text-xs px-4 py-3 rounded-[6px] transition-all cursor-pointer",
                p === activePlatform 
                  ? "bg-[#EDF6FF] text-blue-600 border border-feedbird" 
                  : "border border-elementStroke"
              )}>
              <ChannelIcons channels={[p]} size={24} />
            </button>
          ))}
        </div>
        
        {/* ——— Scroll area ——— */}
        <div className="flex-1 overflow-auto py-6 bg-[#FBFBFB] px-5">
          {/* ——— Connect Options ——— */}
          <section>
            <div className="flex flex-row gap-2">
              {PLATFORM_CONNECT_OPTIONS[activePlatform].map((option, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-3 items-center justify-center px-4 py-6 rounded-[6px] border border-feedbird w-full"
                >
                 <ChannelIcons channels={[activePlatform]} size={32} />
                 <span className="text-base font-semibold text-black text-center">{option.title}</span>
                 <Button
                   onClick={() => openPopup(activePlatform)}
                   disabled={isLoading || !!connectingPlatform}
                   size="sm"
                   className="w-[150px] p-2 rounded-[6px] bg-white hover:bg-white cursor-pointer"
                   style={{
                     boxShadow: "0px 0px 0px 1px rgba(33, 33, 38, 0.05), 0px 1px 1px 0px rgba(0, 0, 0, 0.05), 0px 4px 6px 0px rgba(34, 42, 53, 0.04), 0px 24px 68px 0px rgba(47, 48, 55, 0.05), 0px 2px 3px 0px rgba(0, 0, 0, 0.04)"
                   }}
                 >
                   {connectingPlatform === activePlatform ? "Waiting..." : "+Connect"}
                 </Button>
                </div>
              ))}
            </div>
          </section>
          
          <div className="h-px bg-[#E6E4E2] my-6" />
          
          <div className="max-h-[300px] overflow-y-auto pr-2 -mr-2">
            {/* ——— Available Pages ——— */}
            {pending.length > 0 && (
              <section>
                <h3 className="text-sm font-medium mb-3">AVAILABLE SOCIALS</h3>
                <div className="flex flex-col gap-2">
                  {pending.map(pg => (
                    <div key={pg.id} 
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-[6px] border bg-white",
                        pg.status === "expired" ? "border-[#F19525]" : 
                        pg.status === "disconnected" ? "border-[#EC5050] bg-[#EC50501A]" :
                        "border-[#E6E4E2]"
                      )}>
                      <ChannelIcons channels={[pg.platform]} size={24} />
                      <div className="flex-1">
                        <div className="font-semibold text-black text-sm">{pg.name}</div>
                        <div className="flex text-sm gap-2">
                         <span className="text-[#5C5E63] first-letter:uppercase">{pg.platform}</span>
                         <span className="text-[#999B9E]">{format(new Date(), "d MMM, yyyy, HH:mm")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-[200px] justify-end">
                        {pg.status === "expired" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPopup(pg.platform)}
                            disabled={isLoading}
                            className="text-[#F19525] hover:text-[#F19525] border-none bg-white hover:bg-white cursor-pointer shadow-none text-xs font-semibold"
                          >
                            <RefreshCw className="w-3 h-3" />
                            RE-AUTHENTICATE
                          </Button>
                        ) : pg.status === "disconnected" ? (
                          <div className="flex flex-col items-end">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={handleCheckPageStatus(pg.id)}
                             disabled={isLoading}
                             className="text-[#EC5050] hover:text-[#EC5050] border-none bg-transparent hover:bg-transparent cursor-pointer shadow-none text-xs font-semibold"
                           >
                            <AlertTriangle className="w-3 h-3" />
                            CONNECTION ERROR
                           </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isLoading}
                            className="text-[#F19525] bg-transparent hover:bg-transparent border-none cursor-pointer shadow-none text-xs font-semibold"
                            onClick={handleConfirmPage(pg.id)}
                          >
                           <Link className="w-3 h-3" />
                           CONNECT
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ——— Connected Pages ——— */}
            <section>
              <h3 className="text-sm font-medium mb-3 mt-6">CONNECTED SOCIALS</h3>
              {connected.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {connected.map(pg => (
                    <div key={pg.id} 
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-[6px] border bg-white",
                        pg.status === "expired" || pg.status === "disconnected" ? "border-[#EC5050] bg-[#EC50501A]" : "border-[#E6E4E2]"
                      )}>
                      <ChannelIcons channels={[pg.platform]} size={24} />
                      <div className="flex-1">
                        <div className="font-semibold text-black text-sm">{pg.name}</div>
                        <div className="flex text-sm gap-2">
                         <span className="text-[#5C5E63] first-letter:uppercase">{pg.platform}</span>
                         <span className="text-[#999B9E]">{format(new Date(), "d MMM, yyyy, HH:mm")}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-3 w-[200px]">
                        {pg.status === "expired" || pg.status === "disconnected" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            onClick={handleCheckPageStatus(pg.id)}
                            className="text-[#F19525] hover:text-[#F19525] border-none bg-white hover:bg-white cursor-pointer shadow-none text-xs font-semibold"
                          >
                            <RefreshCw className="w-3 h-3" />
                            RE-AUTHENTICATE
                          </Button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 text-sm text-[#129E62] font-semibold">
                            <Check className="w-3 h-3" />
                            ACTIVE
                          </div>                           
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={handleDisconnectPage(pg.id)}
                              className="text-[#EC5050] hover:text-[#EC5050] border-none bg-transparent hover:bg-transparent cursor-pointer shadow-none text-xs font-semibold"
                            >
                              <Trash className="w-3 h-3 mr-2" />
                              DISCONNECT
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic text-center">
                  No pages connected yet
                </p>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* Helpers */
function Checkmark(props:React.SVGProps<SVGSVGElement>) {
  return <svg width="18" height="18" {...props} fill="currentColor" viewBox="0 0 16 16">
    <path d="M13.4853 2.51472c-.21-.21-.573-.21-.784 0L6 9.21647 3.29817 6.51472c-.21-.21-.574-.21-.784 0s-.21.574 0 .784l3.13175 3.13174c.19526.1953.51184.1953.7071 0L13.4853 3.29818c.21-.21.21-.573 0-.78346z"/>
  </svg>;
}
