/* components/ManageSocialsDialog.tsx
   (only lines that changed are commented)                                */

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
   import { AlertTriangle, Link, MoreHorizontal, MoreVertical, RefreshCw, Trash } from "lucide-react";
   import { format } from "date-fns";
   
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
     const { executeWithLoading } = useAsyncLoading();
   
     const brand = useFeedbirdStore(
       s => s.getActiveWorkspace()?.brands.find(b => b.id === brandId)
     );
   
     const connectAccount    = useFeedbirdStore(s => s.connectSocialAccount);
     const stagePages        = useFeedbirdStore(s => s.stageSocialPages);
     const confirmPage       = useFeedbirdStore(s => s.confirmSocialPage);
     const disconnectPage    = useFeedbirdStore(s => s.disconnectSocialPage);
     const checkPageStatus   = useFeedbirdStore(s => s.checkPageStatus);
   
     const [activePlatform, setActivePlatform] = useState<Platform>("facebook");
     const [loadingFor,      setLoadingFor]    = useState<Platform | null>(null);
   
     // Store the platform that initiated the popup
     const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);
   
     /* ————————— Listen for popup messages ————————— */
     useEffect(() => {
       function handler(e: MessageEvent) {
         if (e.origin !== window.location.origin) return;
         if (e.data?.error) {
          console.log("error", e.data.error);
          return alert(e.data.error);
         }
         const { platform, account, pages } = e.data;
         executeWithLoading(async () => {
           if (!account) {
            //  alert("No account found. Please make sure you have the correct permissions.");
             setLoadingFor(null);
             return;
           }
           const localAccountId = connectAccount(brandId, platform, {
             name: account.name, accountId: account.accountId, authToken: account.authToken,
           });

           stagePages(brandId, platform, pages, localAccountId);

           if (platform === "instagram" && pages.length === 1) {
            await confirmPage(brandId, pages[0].id);
           }
           setLoadingFor(null);
           // Restore the platform that initiated the connection
           if (connectingPlatform) {
             setActivePlatform(connectingPlatform);
             setConnectingPlatform(null);
           }
         }, `Connecting ${platform}...`, platform);
       }
       window.addEventListener("message", handler);
       return () => window.removeEventListener("message", handler);
     }, [brandId, connectAccount, stagePages, executeWithLoading, connectingPlatform]);
   
     /* ————————— Helpers ————————— */
     function openPopup(p: Platform) {
       setLoadingFor(p);
       setConnectingPlatform(p);
       const w = 600, h = 700;
       const left = window.screenX + (window.outerWidth  - w) / 2;
       const top  = window.screenY + (window.outerHeight - h) / 2;
       window.open(`/api/oauth/${p}`, "_blank",
         `width=${w},height=${h},left=${left},top=${top}`);
     }
   
     const handleConfirmPage = (pageId: string) =>
       executeWithLoading(
         () => Promise.resolve(confirmPage(brandId, pageId)),
         "Connecting page...",
         activePlatform
       );
   
     const handleDisconnectPage = (pageId: string) =>
       executeWithLoading(
         () => Promise.resolve(disconnectPage(brandId, pageId)),
         "Disconnecting page...",
         activePlatform
       );
   
     const handleCheckPageStatus = (pageId: string) =>
       executeWithLoading(
         () => Promise.resolve(checkPageStatus(brandId, pageId)),
         "Checking page status...",
         activePlatform
       );
   
     if (!brand) return null;
   
     const pages   = brand.socialPages.filter(pg => pg.platform === activePlatform);
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
                 className={cn(
                   "w-full flex flex-col items-center text-xs px-4 py-3 rounded-[6px] transition-all",
                   p === activePlatform 
                     ? "bg-[#EDF6FF] text-blue-600 border border-feedbird" 
                     : "border border-white"
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
                      disabled={loadingFor === activePlatform}
                      size="sm"
                      className="w-[150px] p-2 rounded-[6px] bg-white hover:bg-white cursor-pointer"
                      style={{
                        boxShadow: "0px 0px 0px 1px rgba(33, 33, 38, 0.05), 0px 1px 1px 0px rgba(0, 0, 0, 0.05), 0px 4px 6px 0px rgba(34, 42, 53, 0.04), 0px 24px 68px 0px rgba(47, 48, 55, 0.05), 0px 2px 3px 0px rgba(0, 0, 0, 0.04)"
                      }}
                    >
                      {loadingFor === activePlatform ? "Connecting..." : "+Connect"}
                    </Button>
                   </div>
                 ))}
               </div>
             </section>
             
             <div className="h-px bg-[#E6E4E2] my-6" />
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
                       <div className="flex items-center gap-3">
                         {pg.status === "expired" ? (
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => openPopup(pg.platform)}
                             className="text-[#F19525] hover:text-[#F19525] border-none bg-white hover:bg-white cursor-pointer shadow-none text-xs font-semibold"
                           >
                             <RefreshCw className="w-3 h-3" />
                             RE-AUTHENTICATE
                           </Button>
                         ) : pg.status === "disconnected" ? (
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleCheckPageStatus(pg.id)}
                             className="text-[#EC5050] hover:text-[#EC5050] border-none bg-transparent hover:bg-transparent cursor-pointer shadow-none text-xs font-semibold"
                           >
                            <AlertTriangle className="w-3 h-3" />
                            ERROR
                           </Button>
                         ) : (
                           <>
                             <Button
                               size="sm"
                               className="text-[#F19525] bg-transparent hover:bg-transparent border-none cursor-pointer shadow-none text-xs font-semibold"
                               onClick={() => handleConfirmPage(pg.id)}
                             >
                              <Link className="w-3 h-3" />
                              CONNECT
                             </Button>
                           </>
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
                       <div className="flex items-center justify-end gap-3">
                         {pg.status === "expired" || pg.status === "disconnected" ? (
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleCheckPageStatus(pg.id)}
                             className="text-[#F19525] hover:text-[#F19525] border-none bg-white hover:bg-white cursor-pointer shadow-none text-xs font-semibold"
                           >
                             <RefreshCw className="w-3 h-3" />
                             RE-AUTHENTICATE
                           </Button>
                         ) : (
                           <div className="flex items-center justify-end gap-1 text-sm text-[#129E62]">
                            <button
                              className="text-[#129E62] hover:text-[#129E62] border-none bg-white hover:bg-white shadow-none text-xs font-semibold p-0 flex items-center justify-center gap-1.5"
                            >
                              <Checkmark className="w-3 h-3" />
                              ACTIVE
                            </button>
                           </div>
                         )}
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                               <MoreHorizontal className="h-4 w-4" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem
                               onClick={() => handleDisconnectPage(pg.id)}
                               className="text-[#EC5050] hover:text-[#EC5050] border-none bg-transparent hover:bg-transparent cursor-pointer shadow-none text-xs font-semibold"
                             >
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
         </DialogContent>
       </Dialog>
     );
   }
   
   /* Helpers */
   function StatusLamp({ color, label }:{color:"red"|"yellow";label:string}) {
     return <div className={`text-xs text-${color}-600 text-center mt-1`}>{label}</div>;
   }
   function Checkmark(props:React.SVGProps<SVGSVGElement>) {
     return <svg width="18" height="18" {...props} fill="currentColor" viewBox="0 0 16 16">
       <path d="M13.4853 2.51472c-.21-.21-.573-.21-.784 0L6 9.21647 3.29817 6.51472c-.21-.21-.574-.21-.784 0s-.21.574 0 .784l3.13175 3.13174c.19526.1953.51184.1953.7071 0L13.4853 3.29818c.21-.21.21-.573 0-.78346z"/>
     </svg>;
   }
   