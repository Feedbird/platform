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
import { MapPin, AtSign, Image as ImageIcon, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------ */
/* Types + helpers                                               */
/* ------------------------------------------------------------ */
export type PostSettings = {
  location   : boolean; // "Add location tag"
  tagAccounts: boolean; // "Tag accounts"
  thumbnail  : boolean; // "Adjust video thumbnail"
};

const DEFAULT_VAL: PostSettings = {
  location: false,
  tagAccounts: false,
  thumbnail: false,
};

const LABELS: Record<keyof PostSettings, string> = {
  location   : "Location Tag",
  tagAccounts: "Tag Accounts",
  thumbnail  : "Custom Thumbnail",
};

const ICONS: Record<keyof PostSettings, React.ReactNode> = {
  location   : <Image src={`/images/settings/map.svg`} alt="Location" width={16} height={16} />,
  tagAccounts: <Image src={`/images/settings/at-sign.svg`} alt="Tag Accounts" width={16} height={16} />,
  thumbnail  : <Image src={`/images/settings/image.svg`} alt="Thumbnail" width={16} height={16} />,
};

/* colour helper */
const iconClass = (active: boolean) =>
  cn(
     active ? "text-[#4D3AF1]" /* brand purple when ON  */
            : "text-[#737C8B]"); /* grey when OFF  */

/* ------------------------------------------------------------ */
/* Main cell                                                    */
/* ------------------------------------------------------------ */
export function SettingsEditCell({
  value,
  onChange,
}: {
  value    : Partial<PostSettings>;         // may be partial / undefined
  onChange : (v: PostSettings) => void;
}) {
  /** local (mutable) copy while inside the pop-over */
  const [settings, setSettings] = React.useState<PostSettings>({
    ...DEFAULT_VAL,
    ...value,
  });

  /* for opening the editor pop-over */
  const [open, setOpen] = React.useState<boolean>(false);

  /* when the pop-over closes → commit to parent */
  const handleClose = () => {
    setOpen(false);
    onChange(settings);
  };

  /** quick toggle inside the editor */
  const toggle = (key: keyof PostSettings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  /** ---------------------------------------------------------------- */
  return (
    <Popover open={open} onOpenChange={(o) => !o ? handleClose() : setOpen(true)}>
      <HoverCard openDelay={120}>
        {/*  ONE trigger div that  ➜  opens pop-over on click,
            and acts as hover-trigger for the details card      */}
        <HoverCardTrigger asChild>
          <PopoverTrigger asChild>
            <div
              className="cursor-pointer inline-flex items-center w-full h-full overflow-hidden px-[8px] py-[6px]"
              onClick={() => setOpen(true)}
            >
              <div className="flex items-center flex-nowrap min-w-0">
                <div className="flex-shrink-0 flex items-center gap-[6px]">
                  <TooltipProvider>
                    {(Object.keys(ICONS) as (keyof PostSettings)[]).map((k) => (
                      <Tooltip key={k}>
                        <TooltipTrigger asChild>
                          <span className="border border-border-button rounded-[6px] p-[6px] text-[#737C8B]">{React.cloneElement(ICONS[k] as any, {
                            className: iconClass(settings[k]),
                          })}</span>
                        </TooltipTrigger>
                        {/* subtle dark tooltip – tweak colours in tailwind config if desired */}
                        <TooltipContent
                          side="top"
                          className="bg-[#151515] text-white border-none text-xs "
                        >
                          {LABELS[k]}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </PopoverTrigger>
        </HoverCardTrigger>

        {/* ---------------------------------------------------------- */}
        {/* 💬  Hover-only card with a tiny summary                    */}
        <HoverCardContent className="p-2 w-[220px]">
          <p className="text-sm font-semibold mb-1">Post settings</p>
          <ul className="space-y-1 text-xs">
            {(Object.keys(LABELS) as (keyof PostSettings)[]).map((k) => (
              <li key={k} className="flex items-center gap-2">
                {React.cloneElement(ICONS[k] as any, {
                  className: iconClass(settings[k]),
                })}
                <span>{LABELS[k]}</span>
                <span className={cn(
                  "ml-auto font-semibold",
                  settings[k] ? "text-green-600" : "text-red-500"
                )}>
                  {settings[k] ? "ON" : "OFF"}
                </span>
              </li>
            ))}
          </ul>
        </HoverCardContent>
      </HoverCard>

      {/* ---------------------------------------------------------- */}
      {/* ✔  Click-to-edit pop-over                                 */}
      {open && (
        <PopoverContent
          className="p-3 w-56 space-y-2"
          align="center"
          side="bottom"
          sideOffset={6}
        >
          <p className="text-sm font-semibold">Edit settings</p>

          {(Object.keys(LABELS) as (keyof PostSettings)[]).map((k) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={settings[k]}
                onCheckedChange={() => toggle(k)}
              />
              {React.cloneElement(ICONS[k] as any, {
                className: "h-4 w-4 text-muted-foreground",
              })}
              <span className="text-sm">{LABELS[k]}</span>
            </label>
          ))}
        </PopoverContent>
      )}
    </Popover>
  );
}
