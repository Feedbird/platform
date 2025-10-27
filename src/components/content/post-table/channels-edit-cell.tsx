"use client";

import * as React from "react";
import { useWorkspaceStore, useSocialStore } from "@/lib/store";
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
import { cn } from "@/lib/utils";
import { 
  ChevronDown as ChevronDownIcon, 
  Plus, 
  CheckIcon, 
  XIcon, 
  RefreshCw, 
  Link2
} from "lucide-react";
import { ChannelsMultiSelectPopup } from "./channels-multi-select-popup";
import { ChannelIcons } from "@/components/content/shared/content-post-ui";
import { Badge } from "@/components/ui/badge";
import { Platform, SocialPage } from "@/lib/social/platforms/platform-types";

/**
 * ChannelsEditCell is updated to store and display selected page IDs, 
 * rather than just platform strings. The "value" prop is an array of 
 * page IDs that belongs to the post => post.pages.
 */
interface ChannelsEditCellProps {
  /** An array of page IDs, e.g. ["fbpage123", "igpage456"] */
  value: string[];
  /** Optionally used for showing how many pages are connected overall */
  getPageCounts: () => Record<Platform, number>;
  /** Called when the user changes page selections */
  onChange: (value: string[]) => void;
  /** Row index for fill-drag */
  rowIndex: number;
  /** Start fill-drag */
  onFillStart?: (value: string[], startRowIndex: number) => void;
  isFocused?: boolean;
  isEditing?: boolean;
  enterEdit?: () => void;
  exitEdit?: () => void;
}

export const ChannelsEditCell = React.memo(function ChannelsEditCell({
  value,
  getPageCounts,
  onChange,
  rowIndex,
  onFillStart,
  isFocused,
  isEditing,
  enterEdit,
  exitEdit,
}: ChannelsEditCellProps) {
  const [open, setOpen] = React.useState(false);
  const brand = useWorkspaceStore((s) => s.getActiveBrand());
  const ws = useWorkspaceStore((s) => s.getActiveWorkspace());
  const checkPageStatus = useSocialStore((s) => s.checkPageStatus);

  // Local state to hold selected page IDs while user is editing
  const [selectedPages, setSelectedPages] = React.useState<string[]>(value);

  React.useEffect(() => {
    setSelectedPages(value);
  }, [value]);

  React.useEffect(() => {
    if (isEditing) {
      // If the cell enters "edit" state, open the popover
      setOpen(true);
    }
  }, [isEditing]);

  // Called whenever user picks/unpicks pages in the multi-select
  const handleTempChange = (v: string[]) => {
    setSelectedPages(v);
  };

  // Commit final selection to parent
  const commitAndClose = () => {
    onChange(selectedPages);
    setOpen(false);
  };

  // Handle page reconnection
  const handleReconnectPage = async (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!ws && !brand) return;
    
    try {
      await checkPageStatus(brand?.id || '', pageId);
    } catch (error) {
      console.error("Failed to reconnect page:", error);
    }
  };

  // Find the page objects from workspace.socialPages
  const selectedPageDetails: SocialPage[] =
    (ws?.socialPages || []).filter((page: SocialPage) => selectedPages.includes(page.id)) ?? [];

  // For the small "cluster" icon display, we group pages by .platform
  const platformCounts = selectedPageDetails.reduce(
    (acc, pg) => {
      acc[pg.platform] = (acc[pg.platform] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Helper function to get status display text
  const getStatusText = (page: SocialPage) => {
    if (!page.connected) return "Error";
    switch (page.status) {
      case "active":
        return "Connected";
      case "expired":
        return "Re-authenticate";
      case "pending":
        return "Pending";
      case "disconnected":
        return "Error";
      default:
        return "Connected";
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (page: SocialPage) => {
    if (!page.connected || page.status === "disconnected") {
      return <XIcon className="w-4 h-4 text-red-500" />;
    }
    switch (page.status) {
      case "active":
        return <CheckIcon className="w-4 h-4 text-green-500" />;
      case "expired":
        return (
          <button
            onClick={(e) => handleReconnectPage(page.id, e)}
            className="p-0 h-auto bg-transparent border-none hover:bg-gray-100 rounded"
          >
            <RefreshCw className="w-4 h-4 text-orange-500 hover:text-orange-600" />
          </button>
        );
      case "pending":
        return <RefreshCw className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckIcon className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        // If user closes the popover, commit changes
        if (!o) {
          commitAndClose();
        }
        // If user re-opens it, we enter edit mode
        if (o) {
          enterEdit?.();
        } else {
          exitEdit?.();
        }
      }}
    >
      <HoverCard openDelay={120}>
        <HoverCardTrigger asChild>
          <PopoverTrigger asChild>
            <div
              className={cn(
                "group/cell cursor-pointer inline-flex items-center w-full h-full overflow-hidden px-[8px] py-[6px]",
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
                <div className={cn(
                  open ? "flex" : "hidden group-hover/cell:flex",
                  "flex-row items-center gap-1 rounded-[4px] bg-white border border-elementStroke",
                  )} style={{
                    padding: "3px 6px 3px 4px",
                  }}>
                    <div className="flex flex-row items-center justify-center w-3.5 h-3.5 rounded-[2px] bg-[#E5EEFF]">
                      <Link2 className={cn(
                        "w-2.5 h-2.5 text-main",
                      )}/>
                    </div>
                   <span className="text-xs text-black font-medium">Add socials</span>
                </div>
              )}

              {/* Show a small chevron if cell is focused and has channels */}
              {isFocused && selectedPageDetails.length > 0 && (
                <ChevronDownIcon
                  className="ml-1 h-4 w-4 text-muted-foreground flex-shrink-0"
                />
              )}

              {/* Fill-handle */}
              {isFocused && !isEditing && (
                <div
                  className="absolute w-[8px] h-[8px] bg-[#FFF] cursor-crosshair"
                  style={{
                    right: "-3px",
                    bottom: "-3px",
                    border: "1px solid #125AFF",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onFillStart?.(selectedPages, rowIndex);
                  }}
                />
              )}
            </div>
          </PopoverTrigger>
        </HoverCardTrigger>

        {/* The hover card that appears on mouseover */}
        {
          !isFocused && (
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
                          {getStatusText(page)}
                        </span>
                      </div>
                      <div className="ml-auto">
                        {getStatusIcon(page)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </HoverCardContent>
          )
        }
      </HoverCard>

      {/* The popover for actually picking pages */}
      <PopoverContent
        className="p-0 w-full"
        align="center"
        side="bottom"
        sideOffset={6}
      >
        <ChannelsMultiSelectPopup
          // This component should show a list of workspace.socialPages
          // and let the user pick which ones are selected
          value={selectedPages}
          onChange={handleTempChange}
        />
      </PopoverContent>
    </Popover>
  );
});
