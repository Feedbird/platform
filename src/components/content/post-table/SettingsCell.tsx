"use client";

import * as React from "react";
import Image from "next/image";
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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, AtSign, Image as ImageIcon, X } from "lucide-react";

/* ------------------------------------------------------------ */
/* Types & helpers                                               */
/* ------------------------------------------------------------ */
// Flag mapping for icons only
type SettingFlags = {
  location   : boolean;
  tagAccounts: boolean;
  thumbnail  : boolean;
};

const DEFAULT_FLAGS: SettingFlags = {
  location: false,
  tagAccounts: false,
  thumbnail: false,
};

const LABELS: Record<keyof SettingFlags, string> = {
  location   : "Location Tag",
  tagAccounts: "Tag Accounts",
  thumbnail  : "Custom Thumbnail",
};

const ICONS: Record<keyof SettingFlags, React.ReactNode> = {
  location   : <Image src={`/images/settings/map.svg`} alt="Location" width={16} height={16} />,
  tagAccounts: <Image src={`/images/settings/at-sign.svg`} alt="Tag Accounts" width={16} height={16} />,
  thumbnail  : <Image src={`/images/settings/image.svg`} alt="Thumbnail" width={16} height={16} />,
};

const iconClass = (active: boolean) =>
  cn(active ? "text-[#4D3AF1]" : "text-[#737C8B]");

/* ------------------------------------------------------------ */
/* Component                                                     */
/* ------------------------------------------------------------ */
interface Props {
  value: Partial<SettingsData> | undefined;
  onChange: (v: SettingsData) => void;
  isFocused?: boolean;
  isEditing?: boolean;
  enterEdit?: () => void;
  exitEdit?: () => void;
}

interface SettingsData {
  locationTags: string[];
  taggedAccounts: string[];
  thumbnail: boolean;
}

export function SettingsEditCell({
  value,
  onChange,
  isFocused,
  isEditing,
  enterEdit,
  exitEdit,
}: Props) {
  const initial = React.useMemo<SettingsData>(() => ({
    locationTags: value?.locationTags ?? [],
    taggedAccounts: value?.taggedAccounts ?? [],
    thumbnail: value?.thumbnail ?? false,
  }), [value]);

  const [local, setLocal] = React.useState<SettingsData>(initial);

  /* Helper booleans for UI */
  const activeFlags: SettingFlags = {
    location: local.locationTags.length > 0,
    tagAccounts: local.taggedAccounts.length > 0,
    thumbnail: local.thumbnail,
  } as const;

  type FlagKey = keyof typeof activeFlags;

  function toggleFlag(k: FlagKey) {
    setLocal(prev => {
      switch(k) {
        case 'thumbnail':
          return { ...prev, thumbnail: !prev.thumbnail };
        case 'location':
          return { ...prev, locationTags: [] };
        case 'tagAccounts':
          return { ...prev, taggedAccounts: [] };
      }
    });
  }

  /* -------------------------------- popover control ------------------------------ */
  const open = !!isEditing; // controlled by FocusProvider

  /* ------------------------------- Modal state ------------------------------- */
  const [modalOpen, setModalOpen] = React.useState(false);

  /* -------------------------------------------------------------------------- */
  /* JSX                                                                        */
  /* -------------------------------------------------------------------------- */
  return (
    <HoverCard openDelay={120} open={isFocused ? false : undefined}>
      {/* TRIGGER: entire cell  */}
      <HoverCardTrigger asChild>
        <Popover
          open={open}
          onOpenChange={(o) => {
            if (o) enterEdit?.();
            else {
              onChange(local);
              exitEdit?.();
            }
          }}
        >
          {/* Clickable cell */}
          <PopoverTrigger asChild>
            <div className="cursor-pointer inline-flex items-center w-full h-full overflow-hidden px-[8px] py-[6px]">
              <div className="flex items-center gap-[8px]">
                <TooltipProvider>
                  {(Object.keys(ICONS) as (keyof SettingFlags)[]).map((k) => (
                    <Tooltip key={k}>
                      <TooltipTrigger asChild>
                        <span>{React.cloneElement(ICONS[k] as any, {
                          className: iconClass(activeFlags[k as FlagKey]),
                        })}</span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-[#151515] text-white border-none text-xs">
                        {LABELS[k as keyof SettingFlags]}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
                {isFocused && !isEditing && (
                  <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </PopoverTrigger>

          {/* DROPDOWN EDITOR */}
          <PopoverContent className="pt-[8px] py-[12px] px-[12px] w-50" align="center" side="bottom" sideOffset={6}>
            <p className="text-base font-semibold mb-[6px]">Settings</p>
            {(Object.keys(LABELS) as (keyof SettingFlags)[]).map((k) => (
              <label key={k} className="flex items-center justify-between py-[8px] gap-2 cursor-pointer">
                <div className="flex items-center gap-2">
                  {React.cloneElement(ICONS[k as keyof SettingFlags] as any, { className: iconClass(activeFlags[k as FlagKey]) })}
                  <span className="text-sm font-medium leading-[16px]">{LABELS[k as keyof SettingFlags]}</span>
                </div>
                <Checkbox 
                  checked={activeFlags[k as FlagKey]} 
                  onCheckedChange={() => toggleFlag(k as FlagKey)}
                  className={cn(
                    // base
                    "h-4 w-4 rounded-none border border-[#D0D5DD] transition-colors duration-150 ease-in-out rounded-[3px]",
                    "hover:border-[#2183FF]",                             // Airtable blue on hover
                    // when it's checked
                    "data-[state=checked]:bg-[#2183FF]",                 // Airtable blue fill
                    "data-[state=checked]:border-[#2183FF]",             // Airtable blue stroke
                    "data-[state=checked]:text-white"                    // << this makes the ✓ white
                  )}
                />
              </label>
            ))}

            <Button
              variant="outline"
              className="w-full rounded-[6px] px-[16px] py-[6px] text-sm mt-[4px] font-semibold border border-[#D3D3D3]"
              onClick={() => {
                setModalOpen(true);
                exitEdit?.();
              }}
            >
              Open Settings
            </Button>
          </PopoverContent>
        </Popover>
      </HoverCardTrigger>

      {/* SUMMARY CARD (shows only when not focused) */}
      <HoverCardContent className="p-2 w-[220px]">
        <p className="text-sm font-semibold mb-1">Post settings</p>
        <ul className="space-y-1 text-xs">
          {(Object.keys(LABELS) as (keyof SettingFlags)[]).map((k) => (
            <li key={k} className="flex items-center gap-2">
              {React.cloneElement(ICONS[k as keyof SettingFlags] as any, { className: iconClass(activeFlags[k as FlagKey]) })}
              <span>{LABELS[k as keyof SettingFlags]}</span>
              <span className={cn("ml-auto font-semibold", activeFlags[k as FlagKey] ? "text-green-600" : "text-red-500")}>{activeFlags[k as FlagKey] ? "ON" : "OFF"}</span>
            </li>
          ))}
        </ul>
      </HoverCardContent>

      {/* Settings Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[512px] p-4 flex flex-col gap-6 rounded-[12px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-black">Settings</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="location" className="w-full mt-0 flex flex-col gap-6">
            <TabsList className="flex p-[2px] items-center gap-1 rounded-[6px] bg-[#F4F5F6] w-full">
              <TabsTrigger value="location" className="flex flex-1 items-center justify-center gap-[6px] p-2 rounded-[6px] text-sm text-black font-medium">
                {ICONS.location} Location Tag
              </TabsTrigger>
              <TabsTrigger value="tags" className="flex flex-1 items-center justify-center gap-[6px] p-2 rounded-[6px] text-sm text-black font-medium">
                {ICONS.tagAccounts}
                Tag Accounts
              </TabsTrigger>
              <TabsTrigger value="thumb" className="flex flex-1 items-center justify-center gap-[6px] p-2 rounded-[6px] text-sm text-black font-medium">
                {ICONS.thumbnail}
                Custom Thumbnail
              </TabsTrigger>
            </TabsList>

            {/* Location Tab */}
            <TabsContent value="location" className="space-y-3">
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
            <TabsContent value="thumb" className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">Custom thumbnail feature coming soon.</div>
            </TabsContent>
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
                const updated: SettingsData = { ...local };
                onChange(updated);
                setModalOpen(false);
              }}
              className="flex px-4 justify-center items-center gap-2 rounded-[6px] bg-[#125AFF] text-white font-semibold text-sm"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </HoverCard>
  );
}
