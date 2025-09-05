"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronUp, ChevronDown, X, MessageCircle,
  Clock, Maximize2, Minimize2, Paperclip,
  MoreHorizontal, CircleChevronDown,
  CalendarIcon,
  SquareCheckBig,
  CircleArrowOutDownRight,
  ChartBar
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useStoreWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { getSuggestedSlots } from "@/lib/scheduling/getSuggestedSlots";
import { Post, Block, BoardGroupData, GroupComment } from "@/lib/store/use-feedbird-store";
import { Platform } from "@/lib/social/platforms/platform-types";

/* sub-components (cloned or adapted) */
import { BlocksViewer } from "@/components/post/blocks-viewer";
import { CaptionEditor } from "@/components/post/caption-editor";
import { CommentsPanel } from "@/components/post/comments-panel";
import { ActivityPanel } from "@/components/post/activity-panel";
import { ContentModal } from "@/components/content/content-modal/content-modal";
import ScheduleDialog from "@/components/post/schedule-dialog";
import { VersionPanel } from "./version-panel";
import { AnalyticsPanel } from "./analytics-panel";

/* simpler inline "clones" for status, channels, format, date */
import { InlineStatusEditor, InlineDateEditor, ApproveCell } from "./inlines";
import { PublishDateCell, UpdateDateCell } from "@/components/content/post-table/DateCell";
import { Lock, Unlock, AlertCircle } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChannelsMultiSelectPopup } from "@/components/content/post-table/ChannelsMultiSelectPopup";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { 
  ChevronDown as ChevronDownIcon, 
  Plus
} from "lucide-react";
import { ChannelIcons } from "@/components/content/shared/content-post-ui";
import { FormatSelectPopup } from "@/components/content/post-table/FormatSelectPopup";
import { FormatBadge } from "@/components/content/shared/content-post-ui";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogHeader } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, AtSign, Image as ImageIcon } from "lucide-react";

/* shared UI bits */
import { StatusChip } from "@/components/content/shared/content-post-ui";
import { Span } from "next/dist/trace";
import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime";
import { TikTokSettingsPanel } from './tiktok-settings';
import type { TikTokSettings } from '@/lib/social/platforms/platform-types';

// Wrapper component to convert between platform names and page IDs
function PlatformsEditor({ post }: { post: Post }) {
  const updatePost = useFeedbirdStore((s) => s.updatePost);
  const brand = useFeedbirdStore((s) => s.getActiveBrand());
  const [open, setOpen] = React.useState(false);
  
  // Convert platform names to page IDs
  const platformToPageIds = (platforms: Platform[]): string[] => {
    if (!brand?.socialPages) return [];
    return brand.socialPages
      .filter(page => page.connected && platforms.includes(page.platform))
      .map(page => page.id);
  };
  
  // Convert page IDs to platform names
  const pageIdsToPlatforms = (pageIds: string[]): Platform[] => {
    if (!brand?.socialPages) return [];
    return brand.socialPages
      .filter(page => pageIds.includes(page.id))
      .map(page => page.platform);
  };
  
  // Local state to hold selected page IDs while user is editing
  const [selectedPages, setSelectedPages] = React.useState<string[]>(platformToPageIds(post.platforms));

  React.useEffect(() => {
    setSelectedPages(platformToPageIds(post.platforms));
  }, [post.platforms, brand?.socialPages]);

  // Called whenever user picks/unpicks pages in the multi-select
  const handleTempChange = (v: string[]) => {
    setSelectedPages(v);
  };

  // Commit final selection to parent
  const commitAndClose = () => {
    const platforms = pageIdsToPlatforms(selectedPages);
    updatePost(post.id, { platforms });
    setOpen(false);
  };

  // Find the page objects from brand.socialPages
  const selectedPageDetails = brand?.socialPages?.filter((page) => selectedPages.includes(page.id)) ?? [];

  // For the small "cluster" icon display, we group pages by .platform
  const platformCounts = selectedPageDetails.reduce(
    (acc, pg) => {
      acc[pg.platform] = (acc[pg.platform] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        // If user closes the popover, commit changes
        if (!o) {
          commitAndClose();
        }
        setOpen(o);
      }}
    >
      <HoverCard openDelay={120}>
        <HoverCardTrigger asChild>
          <PopoverTrigger asChild>
            <div
              className={cn(
                "pt-2 cursor-pointer inline-flex items-center w-full h-full overflow-hidden",
                "hover:opacity-90"
              )}
            >
              <div className="flex items-center flex-nowrap min-w-0">
                {/* Show cluster of icons by platform */}
                {Object.entries(platformCounts).map(([platform, count], idx) => (
                  <div
                    key={platform}
                    className={cn(
                      "flex-shrink-0",
                      idx > 0 && "-ml-2"
                    )}
                  >
                    <ChannelIcons
                      channels={[platform as Platform]}
                      counts={count}
                      size={24}
                    />
                  </div>
                ))}
              </div>

              {/* Show + icon with circular border when no channels selected */}
              {selectedPageDetails.length === 0 && (
                <div className="flex flex-row items-center p-1 rounded-sm border border-buttonStroke">
                  <Plus className="w-4.5 h-4.5 text-darkGrey" />
                </div>
              )}

              {/* Show a small chevron if popover is open and has channels */}
              {open && selectedPageDetails.length > 0 && (
                <ChevronDownIcon
                  className="ml-1 h-4 w-4 text-muted-foreground flex-shrink-0"
                />
              )}
            </div>
          </PopoverTrigger>
        </HoverCardTrigger>

        {/* The hover card that appears on mouseover */}
        <HoverCardContent className="p-2 w-auto">
          <p className="text-sm font-semibold mb-1">Connected Channels</p>

          {selectedPageDetails.length === 0 ? (
            <p className="text-sm text-muted-foreground">None connected.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {selectedPageDetails.map((page) => (
                <li key={page.id} className="flex items-center gap-2">
                  <ChannelIcons channels={[page.platform]} />
                  <div className="flex flex-col">
                    <span className="font-semibold truncate">{page.name}</span>
                    <span className="text-[#999B9E]">
                      {page.connected ? "Connected" : "Error"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </HoverCardContent>
      </HoverCard>

      {/* The popover for actually picking pages */}
      <PopoverContent
        className="p-0 w-full"
        align="center"
        side="bottom"
        sideOffset={6}
      >
        <ChannelsMultiSelectPopup
          value={selectedPages}
          onChange={handleTempChange}
        />
      </PopoverContent>
    </Popover>
  );
}

// Format editor component using the same style as FormatEditCell
function FormatEditor({ post }: { post: Post }) {
  const updatePost = useFeedbirdStore((s) => s.updatePost);
  const [open, setOpen] = React.useState(false);
  const hasValue = Boolean(post.format);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
      }}
    >
      <PopoverTrigger asChild>
        <div
          className={cn(
            "pt-2 cursor-pointer inline-flex items-center w-full h-full overflow-hidden",
            "hover:opacity-90"
          )}
        >
          <div className="flex items-center flex-nowrap min-w-0">
            {hasValue ? (
              <div className="flex-shrink-0">
                <FormatBadge kind={post.format} widthFull={false} />
              </div>
            ) : (
              <div className="flex flex-row items-center p-1 rounded-sm border border-buttonStroke">
                <Plus className="w-4.5 h-4.5 text-darkGrey" />
              </div>
            )}
          </div>

          {/* show chevron only when open and has value */}
          {open && hasValue && (
            <ChevronDownIcon
              className="ml-1 h-4 w-4 text-muted-foreground flex-shrink-0"
            />
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-auto"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <FormatSelectPopup
          value={post.format}
          onChange={(newVal) => {
            updatePost(post.id, { format: newVal });
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

// Settings editor component using the same style as SettingsCell
function SettingsEditor({ post }: { post: Post }) {
  const updatePost = useFeedbirdStore((s) => s.updatePost);
  const brand = useFeedbirdStore((s) => s.getActiveBrand());
  const [open, setOpen] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);

  // Get the first TikTok page ID if TikTok is selected
  const tiktokPageId = React.useMemo(() => {
    if (!post.platforms.includes('tiktok') || !brand?.socialPages) return null;
    const tiktokPage = brand.socialPages.find(page => 
      page.platform === 'tiktok' && page.connected
    );
    return tiktokPage?.id || null;
  }, [post.platforms, brand?.socialPages]);

  // Default TikTok settings
  const defaultTikTokSettings: TikTokSettings = {
    privacyLevel: 'SELF_ONLY',
    disableDuet: false,
    disableStitch: false,
    disableComment: false,
    
    // Commercial Content Disclosure (OFF by default as required by TikTok)
    commercialContentToggle: false,
    brandContentToggle: false,
    brandOrganicToggle: false,
    
    // Content Settings
    autoAddMusic: false,
    isAigc: false,
  };

  // Local state for all settings
  const [local, setLocal] = React.useState({
    locationTags: post.settings?.locationTags ?? [],
    taggedAccounts: post.settings?.taggedAccounts ?? [],
    thumbnail: post.settings?.thumbnail ?? false,
    tiktok: post.settings?.tiktok ?? defaultTikTokSettings,
  });

  // TikTok validation state
  const [tiktokValidation, setTiktokValidation] = React.useState(true);

  // Helper booleans for UI
  const activeFlags = {
    location: local.locationTags.length > 0,
    tagAccounts: local.taggedAccounts.length > 0,
    thumbnail: local.thumbnail,
    tiktok: post.platforms.includes('tiktok'),
  };

  const LABELS = {
    location: "Location Tag",
    tagAccounts: "Tag Accounts", 
    thumbnail: "Custom Thumbnail",
    tiktok: "TikTok Settings",
  };

  const ICONS = {
    location: <Image src={`/images/settings/map.svg`} alt="Location" width={16} height={16} />,
    tagAccounts: <Image src={`/images/settings/at-sign.svg`} alt="Tag Accounts" width={16} height={16} />,
    thumbnail: <Image src={`/images/settings/image.svg`} alt="Thumbnail" width={16} height={16} />,
    tiktok: <Image src={`/images/platforms/tiktok.svg`} alt="TikTok" width={16} height={16} />,
  };

  const iconClass = (active: boolean) =>
    cn(active ? "text-[#4D3AF1]" : "text-[#737C8B]");

  function toggleFlag(k: keyof typeof activeFlags) {
    setLocal(prev => {
      switch(k) {
        case 'thumbnail':
          return { ...prev, thumbnail: !prev.thumbnail };
        case 'location':
          return { ...prev, locationTags: [] };
        case 'tagAccounts':
          return { ...prev, taggedAccounts: [] };
        case 'tiktok':
          // TikTok settings are managed by platform selection, not toggleable here
          return prev;
      }
    });
  }

  const commitChanges = () => {
    updatePost(post.id, { settings: local });
    setOpen(false);
  };

  return (
    <HoverCard openDelay={120}>
      <HoverCardTrigger asChild>
        <Popover
          open={open}
          onOpenChange={(o) => {
            if (!o) {
              commitChanges();
            }
            setOpen(o);
          }}
        >
          <PopoverTrigger asChild>
            <div
              className={cn(
                "pt-2 cursor-pointer inline-flex items-center w-full h-full overflow-hidden",
                "hover:opacity-90"
              )}
            >
              <div className="flex items-center gap-[8px]">
                <TooltipProvider>
                  {(Object.keys(ICONS) as (keyof typeof ICONS)[])
                    .filter(k => k !== 'tiktok' || post.platforms.includes('tiktok'))
                    .map((k) => (
                    <Tooltip key={k}>
                      <TooltipTrigger asChild>
                        <span className="h-6 w-6 flex items-center justify-center cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10">{React.cloneElement(ICONS[k] as any, {
                          className: iconClass(activeFlags[k]),
                        })}</span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-[#151515] text-white border-none text-xs">
                        {LABELS[k]}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
                {open && (
                  <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </PopoverTrigger>

          <PopoverContent className="pt-[8px] py-[12px] px-[12px] w-50" align="center" side="bottom" sideOffset={6}>
            <p className="text-base font-semibold mb-[6px]">Settings</p>
            {(Object.keys(LABELS) as (keyof typeof LABELS)[])
              .filter(k => k !== 'tiktok' || post.platforms.includes('tiktok'))
              .map((k) => (
              <label key={k} className="flex items-center justify-between py-[8px] gap-2 cursor-pointer">
                <div className="flex items-center gap-2">
                  {React.cloneElement(ICONS[k] as any, { className: iconClass(activeFlags[k]) })}
                  <span className="text-sm font-medium leading-[16px]">{LABELS[k]}</span>
                </div>
                <Checkbox 
                  checked={activeFlags[k]} 
                  onCheckedChange={() => k !== 'tiktok' && toggleFlag(k)}
                  disabled={k === 'tiktok'}
                  className={cn(
                    "h-4 w-4 rounded-none border border-[#D0D5DD] transition-colors duration-150 ease-in-out rounded-[3px]",
                    "hover:border-[#2183FF]",
                    "data-[state=checked]:bg-[#2183FF]",
                    "data-[state=checked]:border-[#2183FF]",
                    "data-[state=checked]:text-white"
                  )}
                />
              </label>
            ))}

            <Button
              variant="outline"
              className="w-full rounded-[6px] px-[16px] py-[6px] text-sm mt-[4px] font-semibold border border-[#D3D3D3]"
              onClick={() => {
                setModalOpen(true);
                setOpen(false);
              }}
            >
              Open Settings
            </Button>
          </PopoverContent>
        </Popover>
      </HoverCardTrigger>

        <HoverCardContent className="p-2 w-[220px]">
         <p className="text-sm font-semibold mb-1">Post settings</p>
         <div className="flex items-center gap-2">
           {(Object.keys(ICONS) as (keyof typeof ICONS)[])
             .filter(k => k !== 'tiktok' || post.platforms.includes('tiktok'))
             .map((k) => (
             <div key={k} className="flex items-center gap-1">
               {React.cloneElement(ICONS[k] as any, { className: iconClass(activeFlags[k]) })}
               <span className={cn("text-xs font-semibold", activeFlags[k] ? "text-green-600" : "text-red-500")}>
                 {activeFlags[k] ? "ON" : "OFF"}
               </span>
             </div>
           ))}
         </div>
       </HoverCardContent>

      {/* Settings Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[512px] max-h-[80vh] p-4 flex flex-col gap-6 rounded-[12px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-black">Settings</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue={post.platforms.includes('tiktok') ? 'tiktok' : 'location'} className="w-full mt-0 flex flex-col gap-6 flex-1 min-h-0">
            <TabsList className="flex p-[2px] items-center gap-1 rounded-[6px] bg-[#F4F5F6] w-full">
              {post.platforms.includes('tiktok') && (
                <TabsTrigger value="tiktok" className="flex flex-1 items-center justify-center gap-[6px] p-2 rounded-[6px] text-sm text-black font-medium">
                  {ICONS.tiktok} TikTok
                </TabsTrigger>
              )}
              <TabsTrigger value="location" className="flex flex-1 items-center justify-center gap-[6px] p-2 rounded-[6px] text-sm text-black font-medium">
                {ICONS.location} Location
              </TabsTrigger>
              <TabsTrigger value="tags" className="flex flex-1 items-center justify-center gap-[6px] p-2 rounded-[6px] text-sm text-black font-medium">
                {ICONS.tagAccounts} Tags
              </TabsTrigger>
              <TabsTrigger value="thumb" className="flex flex-1 items-center justify-center gap-[6px] p-2 rounded-[6px] text-sm text-black font-medium">
                {ICONS.thumbnail} Thumbnail
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
              {/* TikTok Tab */}
              {post.platforms.includes('tiktok') && (
                <TabsContent value="tiktok" className="space-y-4 m-0 h-full">
                  <TikTokSettingsPanel
                    pageId={tiktokPageId}
                    settings={local.tiktok}
                    onChange={(tiktokSettings) => 
                      setLocal(prev => ({ ...prev, tiktok: tiktokSettings }))
                    }
                    onValidationChange={(isValid) => {
                      setTiktokValidation(isValid);
                    }}
                  />
                </TabsContent>
              )}

              {/* Location Tab */}
              <TabsContent value="location" className="space-y-3 m-0 h-full">
              <label className="flex items-center gap-2 text-sm font-medium text-black">Location</label>
              <Input
                placeholder="Example: San Francisco, CA"
                onKeyDown={(e)=>{
                  if(e.key==='Enter'){
                    e.preventDefault();
                    const val=(e.target as HTMLInputElement).value.trim();
                    if(val && !local.locationTags.includes(val))
                      setLocal(p => ({ ...p, locationTags: [...p.locationTags, val] }));
                    (e.target as HTMLInputElement).value='';
                  }
                }}
              />
              {local.locationTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {local.locationTags.map(loc => (
                    <span key={loc} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#E6F1FF] text-xs text-[#125AFF] font-medium shadow-sm">
                      {loc}<X className="h-3 w-3 cursor-pointer" onClick={()=>setLocal(p=>({...p, locationTags: p.locationTags.filter(l=>l!==loc)}))} />
                    </span>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tags Tab */}
            <TabsContent value="tags" className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">Tag accounts</label>
              <Input
                placeholder="Type username and press Enter"
                onKeyDown={(e)=>{
                  if(e.key==='Enter'){
                    e.preventDefault();
                    const val=(e.target as HTMLInputElement).value.trim();
                    if(val && !local.taggedAccounts.includes(val)) setLocal(p=>({ ...p, taggedAccounts: [...p.taggedAccounts, val] }));
                    (e.target as HTMLInputElement).value='';
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                {local.taggedAccounts.map(t=> (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#E6F1FF] text-xs text-[#125AFF] font-medium shadow-sm">@{t}<X className="h-3 w-3 cursor-pointer" onClick={()=>setLocal(p=>({ ...p, taggedAccounts: p.taggedAccounts.filter(x=>x!==t) }))} /></span>
                ))}
              </div>
            </TabsContent>

              {/* Thumbnail Tab */}
              <TabsContent value="thumb" className="space-y-3 text-sm text-muted-foreground m-0 h-full">
                <div className="flex items-center gap-2">Custom thumbnail feature coming soon.</div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-between gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={()=>setModalOpen(false)}
              className="flex h-9 px-4 justify-center items-center gap-2 rounded-[6px] border border-[#D3D3D3] text-sm font-semibold text-black"
            >
              Close
            </Button>
            <Button
              onClick={()=>{
                const updatedSettings = {
                  locationTags: local.locationTags,
                  taggedAccounts: local.taggedAccounts,
                  thumbnail: local.thumbnail,
                  ...(post.platforms.includes('tiktok') && { tiktok: local.tiktok })
                };
                updatePost(post.id, { settings: updatedSettings });
                setModalOpen(false);
              }}
              disabled={post.platforms.includes('tiktok') && !tiktokValidation}
              className="flex px-4 justify-center items-center gap-2 rounded-[6px] bg-[#125AFF] text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </Button>
          </div>
          
          {/* TikTok validation error message - positioned below buttons */}
          {post.platforms.includes('tiktok') && !tiktokValidation && (
            <div className="flex items-center gap-2 text-xs text-red-600 mt-2">
              <AlertCircle className="h-3 w-3" />
              <span>
                {local.tiktok.commercialContentToggle && !local.tiktok.brandContentToggle && !local.tiktok.brandOrganicToggle 
                  ? "Commercial content requires at least one brand option selected."
                  : local.tiktok.brandContentToggle && local.tiktok.privacyLevel === 'SELF_ONLY'
                  ? "Branded content cannot be set to private. Please change privacy settings."
                  : "TikTok settings validation failed. Please check your configuration."
                }
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </HoverCard>
  );
}

// Hashtags editor component using the same style as CaptionEditor
function HashtagsEditor({ post }: { post: Post }) {
  const updatePost = useFeedbirdStore((s) => s.updatePost);
  const [currentPlatform, setCurrentPlatform] = React.useState<Platform>(
    post.platforms[0] || "instagram"
  );
  
  // Initialize hashtags data structure if it doesn't exist
  const hashtags = post.hashtags || {
    synced: true,
    default: "",
    perPlatform: {}
  };
  
  const isSynced = hashtags.synced;

  // Toggle sync/unsync
  const handleToggleSync = () => {
    if (isSynced) {
      // from synced => unsynced
      const perPlatform: Record<string, string> = {};
      post.platforms.forEach(platform => {
        perPlatform[platform] = hashtags.default || "";
      });
      const newHashtags = {
        synced: false,
        default: hashtags.default,
        perPlatform: perPlatform
      };
      updatePost(post.id, { hashtags: newHashtags });
    } else {
      // unsynced => synced
      const newHashtags = {
        synced: true,
        default: hashtags.default || "",
        perPlatform: {}
      };
      updatePost(post.id, { hashtags: newHashtags });
    }
  };

  // Handle changes in synced mode
  const handleSyncedChange = (val: string) => {
    const updated = {
      ...hashtags,
      default: val,
    };
    updatePost(post.id, { hashtags: updated });
  };

  // Handle changes in unsynced mode
  const handleUnsyncedChange = (platform: Platform, val: string) => {
    const updated = {
      ...hashtags,
      perPlatform: {
        ...hashtags.perPlatform,
        [platform]: val,
      }
    };
    updatePost(post.id, { hashtags: updated });
  };

  return (
    <div className="flex flex-col p-3 rounded-md border border-buttonStroke gap-2">
      {/* heading: icon + label + lock toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Image src="/images/columns/caption.svg" alt="hashtags" width={16} height={16} />
          <span className="text-sm font-medium text-black">Hashtags</span>
          {!isSynced && (
            <Select
              value={currentPlatform}
              onValueChange={(v) => setCurrentPlatform(v as Platform)}
            >
              <SelectTrigger className="w-28 text-sm border-none shadow-none p-0 text-black">
                <SelectValue placeholder="Pick platform" />
              </SelectTrigger>
              <SelectContent>
                {post.platforms.map(platform => (
                  <SelectItem
                    key={platform}
                    value={platform}
                    className="flex items-center gap-2 text-black"
                  >
                    <ChannelIcons channels={[platform]} />
                    <span className="text-sm capitalize">{platform}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {/* lock/unlock toggle */}
        <button
          onClick={handleToggleSync}
          className="flex items-center gap-1 text-sm font-medium text-black border border-buttonStroke px-2 py-1 rounded-sm"
        >
          {isSynced ? (
            <>
              <Lock size={14} />
              Synced
            </>
          ) : (
            <>
              <Unlock size={14} />
              Unsynced
            </>
          )}
        </button>
      </div>

      {isSynced ? (
        // single text area
        <textarea
          className="w-full text-sm focus:outline-none text-black"
          value={hashtags.default}
          onChange={(e) => handleSyncedChange(e.target.value)}
          placeholder="Add hashtags here..."
        />
      ) : (
        // unsynced => show platform dropdown with icon + label
        <div className="flex flex-col gap-2">
          {/* text area for chosen platform */}
          <textarea
            className="w-full text-sm focus:outline-none text-black"
            value={hashtags.perPlatform?.[currentPlatform] ?? ""}
            onChange={(e) => handleUnsyncedChange(currentPlatform, e.target.value)}
            placeholder="Add hashtags here..."
          />
        </div>
      )}
    </div>
  );
}

export function PostRecordModal({ selectedPost, open, onClose }:{
  selectedPost: Post;
  open: boolean;
  onClose(): void;
}) {
  const { updatePost, brand, activeWorkspace } = useStoreWithEqualityFn(
    useFeedbirdStore,
    (s) => ({
      updatePost: s.updatePost,
      brand: s.getActiveBrand(),
      activeWorkspace: s.getActiveWorkspace(),
    }),
    shallow
  );
  const activeBoard = activeWorkspace?.boards.find(b => b.id === selectedPost.board_id);
  const posts = activeBoard?.posts;
  const post = posts?.find(p => p.id === selectedPost.id);
  /* local states */
  const [pane, setPane] = useState<"version"|"activity"|"analytics">("activity");
  const [expanded, setExpanded] = useState(true);
  const [slots, setSlots] = useState<ReturnType<typeof getSuggestedSlots>|null>(null);
  const [activeBlock, setActiveBlock] = useState<Block|null>(null);
  const [previewBlock, setPreviewBlock] = useState<{block: Block, versionId: string}|null>(null);
  const [allowCommenting, setAllowCommenting] = useState(false);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);

  if (!post) {
    // Post might not be available yet if things are loading.
    return null;
  }

  // Get group data for the current post's month
  const groupData = activeBoard?.groupData?.find((gd: BoardGroupData) => gd.month === post.month) as BoardGroupData | undefined;
  const groupPosts = posts?.filter(p => p.month === post.month);
  const boardRules = activeBoard?.rules;

  // Helper function to format time ago
  function timeAgo(date: Date | string) {
    const now = new Date();
    const d = typeof date === "string" ? new Date(date) : date;
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  // actions
  const approve = () => {
    // Define which statuses allow approval actions
    const allowedStatusesForApproval = [
      "Pending Approval",
      "Revised", 
      "Needs Revisions",
      "Approved"
    ];
    
    // Only approve if the status allows it
    if (allowedStatusesForApproval.includes(post.status)) {
      updatePost(post.id, { status: "Approved" });
      setSlots(getSuggestedSlots(post, posts || []));
    }
  };
  const requestChange = () => {
    // Define which statuses allow revision actions
    const allowedStatusesForRevision = [
      "Pending Approval",
      "Revised", 
      "Needs Revisions",
      "Approved"
    ];
    
    // Only request changes if the status allows it
    if (allowedStatusesForRevision.includes(post.status)) {
      updatePost(post.id, { status: "Needs Revisions" });
      // Enable commenting when requesting changes
      setAllowCommenting(true);
    }
  };

  const handlePreviewVersion = (block: Block, versionId: string) => {
    console.log('Preview version:', versionId);
    console.log('block:', block);
    setPreviewBlock({ block, versionId });
  };

  // Display date as: May 18, 2025   11:44
  // with date part in black, time part in grey
  const dateDisplay = post.publish_date
    ? (() => {
        const dateObj = post.publish_date;
        const datePart = dateObj.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const timePart = dateObj.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        return (
          <span>
            <span className="text-black pr-1">{datePart}</span>
            <span className="text-grey">{"  "}{timePart}</span>
          </span>
        );
      })()
    : <span className="text-grey">Unscheduled</span>;

  function switchPost(dir:"prev"|"next"){
    // ...
  }

  const cKey = post.comments.length;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className={cn(
            "max-w-none sm:max-w-none flex flex-col p-0 border-0 overflow-hidden",
            '[&>button:last-child]:hidden',
            'gap-0',
            expanded ? "rounded-none" : "rounded-2xl"
          )}
          style={
            expanded
              ? { width: "100vw", height: "100vh" }
              : { width: "60vw", height: "90vh" }
          }
        >
          <DialogTitle className="sr-only">Post details</DialogTitle>

          {/* body */}
          <div className="flex flex-1 overflow-hidden">
            {/* main side */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* main header */}
              <header className="h-12 flex items-center justify-between border-b px-4 bg-white border-elementStroke">
                {/* left: up/down => brand => vertical bar => status */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10" onClick={onClose}>
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="w-0 h-2.5 outline outline-1 outline-offset-[-0.50px] outline-gray-100"></div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10" onClick={()=>switchPost("prev")}>
                        <ChevronUp className="w-4 h-4 text-black" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10" onClick={()=>switchPost("next")}>
                        <ChevronDown className="w-4 h-4 text-black" width={24} height={24}/>
                      </Button>
                    </div>
                    {/* Group Information Display */}
                    {groupPosts && groupPosts.length > 0 && (
                      <>
                      <span className="text-base font-medium text-black">
                        Month {post.month}
                      </span>
                      
                      {/* Count */}
                      <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-[#F2F4F7] text-[#475467] text-xs leading-none text-center text-nowrap">
                        {groupPosts.length}
                      </span>

                      <div className="w-0 h-2.5 outline outline-1 outline-offset-[-0.50px] outline-gray-100"></div>
                      
                      {/* Status */}
                      <StatusChip 
                        status={groupPosts.every(p => p.status === "Approved") ? "Approved" : "Pending Approval"} 
                        widthFull={false} 
                      />
                        
                      {/* Revision Rules */}
                      {boardRules?.revisionRules && boardRules.firstMonth && (
                        <>
                          {boardRules.firstMonth === -1 ? (
                            <div className="px-2 py-[2px] bg-White rounded border-1 outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-1 overflow-hidden">
                              <img
                                src="/images/boards/unlimited.svg"
                                alt="Unlimited Revisions"
                                className="w-4 h-4"
                              />
                              <span className="text-xs font-medium">Unlimited Revisions</span>
                            </div>
                          ) : boardRules.firstMonth > 0 ? (
                            <div className="px-2 py-[2px] bg-White rounded border-1 outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-1 overflow-hidden">
                              <CircleArrowOutDownRight className="w-4 h-4 text-[#2183FF]" />
                              <span className="text-xs font-medium">
                                {boardRules.firstMonth} Revision Round{boardRules.firstMonth > 1 ? "s" : ""}
                              </span>
                            </div>
                          ) : null}
                        </>
                      )}

                      {/* Group Comments/Review Button */}
                      {(() => {
                        const groupComments: GroupComment[] = groupData?.comments || [];
                        let unreadedCount = 0;
                        let totalCount = 0;
                        let latestUnreaded: GroupComment | null = null;

                        totalCount = groupComments.length;
                        const email = useFeedbirdStore.getState().user?.email;
                        const unreaded = groupComments.filter((c: GroupComment) => !c.resolved && (!email || !(c.readBy || []).includes(email)));
                        unreadedCount = unreaded.length;
                        if (unreadedCount > 0) {
                          latestUnreaded = unreaded
                            .sort((a: GroupComment, b: GroupComment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                        }

                        if (unreadedCount > 0 && latestUnreaded) {
                          return (
                            <div className="flex items-center gap-1 pl-2 pr-1 py-[2px] bg-white rounded border-1 outline outline-1 outline-offset-[-1px] outline-main">
                              <img
                                src="/images/boards/message-notification-active.svg"
                                alt="Unresolved Group Comment"
                                className="w-4 h-4"
                              />
                              <span className="text-xs font-medium text-main">
                                {latestUnreaded.author} left group comments {timeAgo(latestUnreaded.createdAt)}
                              </span>
                              <button
                                className="px-1 py-[1px] h-4 rounded bg-main text-white text-xs font-semibold flex items-center justify-center"
                                style={{ border: "1px solid #2183FF" }}
                                type="button"
                                onClick={() => {
                                  // TODO: Implement group feedback functionality
                                  toast.info("Group feedback functionality coming soon");
                                }}
                              >
                                Review
                              </button>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center gap-1 pl-2 pr-1 py-[2px] bg-white rounded border-1 outline outline-1 outline-offset-[-1px] outline-main">
                              <img
                                src="/images/icons/message-notification.svg"
                                alt="Group Comments"
                                className="w-4 h-4"
                              />
                              <span className="text-xs font-medium">
                                Group Comments:
                              </span>
                              <span className="text-xs font-medium text-grey">
                                {totalCount}
                              </span>
                              <button
                                className="px-1 py-[1px] h-4 rounded bg-main text-white text-xs font-semibold flex items-center justify-center"
                                style={{ border: "1px solid #2183FF" }}
                                type="button"
                                onClick={() => {
                                  // TODO: Implement group feedback functionality
                                  toast.info("Group feedback functionality coming soon");
                                }}
                              >
                                Comment
                              </button>
                            </div>
                          );
                        }
                      })()}
                      </>
                    )}
                  </div>

                </div>

                {/* right: date => expand => attach => ... */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-darkGrey"/>
                    <span className="text-sm text-black">{dateDisplay}</span>
                  </div>
                  {/* right-side toggle button */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10"
                    onClick={() => setRightSidebarVisible(!rightSidebarVisible)}
                  >
                    <Image
                      src="/images/icons/header-right.svg"
                      alt="Toggle sidebar"
                      width={16}
                      height={16}
                    />
                  </Button>
                </div>
              </header>

              {/* main body */}
              <div className="flex-1 overflow-auto px-4 py-6 bg-white">
                                 {/* First row: Status, Socials, Format, Settings */}
                 <div className="flex gap-2 pb-4">

                   {/* SOCIALS */}
                   <div className="flex-1 flex flex-col p-3 rounded-md border border-buttonStroke">
                     <div className="flex items-center gap-1 text-sm font-medium">
                       <Image src={`/images/columns/socials.svg`} alt="channels" width={16} height={16} />
                       <span className="text-sm font-medium text-black">Socials</span>
                     </div>
                     <PlatformsEditor post={post}/>
                   </div>

                   {/* FORMAT */}
                   <div className="flex-1 flex flex-col p-3 rounded-md border border-buttonStroke">
                     <div className="flex items-center gap-1 text-sm font-medium">
                       <Image src={`/images/columns/format.svg`} alt="format" width={16} height={16} />
                       <span className="text-sm font-medium text-black">Format</span>
                     </div>
                     <FormatEditor post={post}/>
                   </div>

                   {/* SETTINGS */}
                   <div className="flex-1 flex flex-col p-3 rounded-md border border-buttonStroke">
                     <div className="flex items-center gap-1 text-sm font-medium">
                       <Image src={`/images/columns/settings.svg`} alt="settings" width={16} height={16} />
                       <span className="text-sm font-medium text-black">Settings</span>
                     </div>
                     <SettingsEditor post={post}/>
                   </div>
                 </div>

                {/* Second row: Blocks viewer */}
                <div className="pb-4">
                  <BlocksViewer blocks={post.blocks} onExpandBlock={(b)=>setActiveBlock(b)}/>
                </div>

                                 {/* Third row: Caption editor and hashtags */}
                 <div className="flex gap-3 pb-4">
                   {/* Caption editor */}
                   <div className="flex-1">
                     <CaptionEditor
                       post={post}
                       onChange={cap=> updatePost(post.id, { caption:{...post.caption,...cap} })}
                     />
                   </div>
                   
                   {/* Hashtags */}
                   <div className="flex-1">
                     <HashtagsEditor post={post}/>
                   </div>
                 </div>

                
              </div>
            </div>

            {/* right sidebar */}
            {rightSidebarVisible && (
              <motion.aside key={pane} className="w-[360px] shrink-0 flex h-full flex-col border-l border-elementStroke bg-white">
              {/* sidebar header */}
              <header className="h-12 flex items-center border-b px-4 bg-white border-elementStroke">
                <div className="flex w-full items-center gap-2 justify-between">
                  <div className="flex items-center gap-1 p-[2px] bg-[#F7F7F7] rounded-[6px] h-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPane('activity')}
                      className={cn(
                        'px-2 gap-1.5 text-grey rounded-[6px] h-[24px] cursor-pointer has-[>svg]:!px-2',
                        pane === 'activity' ? 'bg-white shadow' : ''
                      )}
                    >
                      <Image
                        src="/images/boards/message.svg"
                        alt="Filter"
                        width={16}
                        height={16}
                      />
                      <span className="text-sm font-medium text-black">Activity</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPane('version')}
                      className={cn(
                        'px-2 gap-1.5 text-grey rounded-[6px] h-[24px] cursor-pointer has-[>svg]:!px-2',
                        pane === 'version' ? 'bg-white shadow' : ''
                      )}
                    >
                      <Image
                        src="/images/boards/clock.svg"
                        alt="Filter"
                        width={16}
                        height={16}
                      />
                      <span className="text-sm font-medium text-black">Version</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPane('analytics')}
                      className={cn(
                        'px-2 text-grey rounded-[6px] h-[24px] cursor-pointer has-[>svg]:!px-2',
                        pane === 'analytics' ? 'bg-white shadow' : ''
                      )}
                    >
                      <Image
                        src="/images/boards/analytics.svg"
                        alt="Analytics"
                        width={16}
                        height={16}
                      />
                      <span className="text-sm font-medium text-black">Analytics</span>
                    </Button>
                  </div>
                
                  <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer rounded-sm border border-buttonStroke hover:bg-grey/10">
                    <MoreHorizontal size={18}/>
                  </Button>
                </div>
              </header>

              {/* sidebar body */}
              <div className="flex-1 overflow-auto">
                {pane==="version"
                  ? <VersionPanel post={post} onPreviewVersion={handlePreviewVersion} />
                  : pane==="analytics"
                  ? <AnalyticsPanel post={post} />
                  : <ActivityPanel key={cKey} post={post} showHeader allowCommenting={allowCommenting} onSwitchToVersion={() => setPane('version')}/>
                }
              </div>
            </motion.aside>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* block expand modal */}
      {activeBlock && (
        <ContentModal
          postId={post.id}
          block={activeBlock}
          onClose={()=>setActiveBlock(null)}
        />
      )}

      {/* version preview modal */}
      {previewBlock && (
        <ContentModal
          postId={post.id}
          block={previewBlock.block}
          initialVersionId={previewBlock.versionId}
          onClose={()=>setPreviewBlock(null)}
        />
      )}

      {/* schedule */}
      {slots && (
        <ScheduleDialog
          open={true}
          slots={slots}
          onClose={()=>setSlots(null)}
          onConfirm={(date)=>{
            toast.success(`Scheduled: ${date.toLocaleString()}`);
            setSlots(null);
          }}
        />
      )}
    </>
  );
}
