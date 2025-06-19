"use client";
import * as React from "react";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChannelIcons } from "@/components/content/shared/content-post-ui";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { ManageSocialsDialog } from "@/components/social/manage-socials-dialog";
import { Separator } from "@/components/ui/separator";

export function ChannelsMultiSelectPopup({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const brand = useFeedbirdStore((s) => s.getActiveBrand());
  const [vals, setVals] = React.useState(value);
  const [showManageDialog, setShowManageDialog] = React.useState(false);

  // Get all available pages from the brand
  const availablePages = brand?.socialPages?.filter(
    (page) => page.connected
  ) ?? [];

  function toggle(pageId: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    let updated = [...vals];
    if (updated.includes(pageId)) {
      updated = updated.filter((x) => x !== pageId);
    } else {
      updated.push(pageId);
    }
    setVals(updated);
    onChange(updated);
  }

  return (
    <>
      <div className="p-[4px] w-full flex flex-col rounded-[6px] border border-[1px] border-[#EAECF0]">
        {/* Select Socials Label */}
        <div className="px-[12px] pt-[8px] pb-[4px] text-sm font-semibold text-black">
          Select Socials
        </div>

        {/* Social Pages List */}
        <div className="flex flex-col">
          {availablePages.map((page) => (
            <Button
              key={page.id}
              variant="ghost"
              className={cn(
                "justify-start",
                "cursor-pointer",
                vals.includes(page.id)
                  ? "bg-[#D7E9FF] text-black"
                  : "hover:bg-[#F4F5F6]"
              )}
              size="sm"
              onClick={(e) => toggle(page.id, e)}
            >
              <div className="flex items-center space-x-2">
                <ChannelIcons channels={[page.platform]} whiteBorder={false} />
                <span className="text-sm font-medium">{page.name}</span>
              </div>
            </Button>
          ))}
        </div>

        {/* Separator */}
        <Separator className="my-1 mx-auto w-9/10" />

        {/* Add Socials Button */}
        <Button
          variant="ghost"
          className="justify-start hover:bg-[#F4F5F6] cursor-pointer"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowManageDialog(true);
          }}
        >
          <div className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium text-black">Add Socials</span>
          </div>
        </Button>
      </div>

      {/* Manage Socials Dialog */}
      {brand && (
        <ManageSocialsDialog
          brandId={brand.id}
          open={showManageDialog}
          onOpenChange={setShowManageDialog}
        />
      )}
    </>
  );
}
