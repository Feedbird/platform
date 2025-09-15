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

  // Get all available pages from the workspace
  const ws = useFeedbirdStore(s => s.getActiveWorkspace());
  const availablePages = (ws?.socialPages || []).filter((page: any) => page.connected) ?? [];

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
      <div className="w-full flex flex-col rounded-[6px] border border-[1px] border-[#EAECF0] gap-1 pb-1">
        {/* Connected Social Icons */}
        {vals.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap p-2 bg-[#F8F8F8] border-b" style={{borderColor:'#E6E4E2'}}>
            {vals.map((id) => {
              const pg = availablePages.find((p: any) => p.id === id);
              if (!pg) return null;
              return (
                <div key={id} className="relative">
                  <ChannelIcons channels={[pg.platform]} size={18} />
                  <button
                    className="absolute -top-1 -right-1 bg-[#5C5E63] rounded-full p-[1px] flex items-center justify-center cursor-pointer"
                    onClick={(e) => toggle(id, e as any)}
                  > 
                    <Plus className="w-[10px] h-[10px] rotate-45 text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Select Socials Label */}
        <div className="px-2 pt-1 pb-1 text-sm font-semibold text-black">
          Select Socials
        </div>

        {/* Social Pages List */}
        <div className="flex flex-col px-2">
          {availablePages.map((page: any) => (
            <Button
              key={page.id}
              variant="ghost"
              className={cn(
                "justify-start cursor-pointer p-0",
                "rounded-none",
                vals.includes(page.id)
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/50"
              )}
              size="sm"
              onClick={(e) => toggle(page.id, e)}
            >
              <div className="flex items-center space-x-2">
                {/* Placeholder spacing to align icons */}
                <span className="w-3 h-3" />
                <ChannelIcons channels={[page.platform]} whiteBorder={false} />
                <span className="text-sm font-medium">{page.name}</span>
              </div>
            </Button>
          ))}
        </div>

        {/* Separator */}
        <Separator className="mx-auto w-9/10" />

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
        <ManageSocialsDialog
          workspaceId={ws?.id || ''}
          open={showManageDialog}
          onOpenChange={setShowManageDialog}
        />
    </>
  );
}
