/* components/layout/app-sidebar.tsx */
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import WorkspaceSwitcher from "@/components/workspace/workspace-switcher";
import SocialShortcuts from "@/components/sidebar/social-shortcuts";
import { LoadingLink } from "@/components/layout/navigation-loader";
import { AddBoardModal } from "@/components/board/add-board-modal";
import { BoardRulesModal } from "@/components/board/board-rules-modal";
import { ColorAndIconDialog } from "@/components/board/color-and-icon-dialog";
import { RenameBoardDialog } from "@/components/board/rename-board-dialog";
import { NavLink as NavLinkType, BoardRules } from "@/lib/store/use-feedbird-store";
import { ManageSocialsDialog } from "@/components/social/manage-socials-dialog";

import {
  useFeedbirdStore,
  NavLink,
} from "@/lib/store/use-feedbird-store";
import { cn } from "@/lib/utils";

import {
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  // icons for the board-menu:
  Pencil,
  Share2,
  Settings,
  Palette,
  Star,
  Copy,
  Archive as ArchiveIcon,
  Trash2,
} from "lucide-react";
import { BorderAll, BorderColor } from "@mui/icons-material";

/* --------------------------------------------------------------------- */
/*  NAV CONFIGS (static for now – you can pull these from the store)     */
/* --------------------------------------------------------------------- */

const defaultPlatformNav: NavLink[] = [
  {
    id: "messages",
    label: "Messages",
    image: "/images/sidebar/messages-on.svg",
    selectedImage: "/images/sidebar/messages-on-active.svg",
    href: "/messages",
  },
  // {
  //   id: "notifications",
  //   label: "Notifications",
  //   image: "/images/sidebar/notifications-on.svg",
  //   selectedImage: "/images/sidebar/notifications-on-active.svg",
  //   href: "/notifications",
  // },
  {
    id: "approvals",
    label: "Approvals",
    image: "/images/sidebar/approvals.svg",
    selectedImage: "/images/sidebar/approvals-active.svg",
    href: "/approvals",
  },
  // {
  //   id: "brands",
  //   label: "Brands",
  //   image: "/images/sidebar/brands.svg",
  //   href: "/brands",
  // },
  {
    id: "analytics",
    label: "Analytics",
    image: "/images/sidebar/analytics.svg",
    selectedImage: "/images/sidebar/analytics-active.svg",
    href: "/analytics",
  },
  // {
  //   id: "settings",
  //   label: "Settings",
  //   image: "/images/sidebar/settings.svg",
  //   href: "/settings",
  // },
];

const defaultBoardNav: NavLink[] = [
  {
    id: "static-posts",
    label: "Static Posts",
    image: "/images/boards/static-posts.svg",
    href: "/content/static-posts",
  },
  {
    id: "short-form-videos",
    label: "Short-Form Videos",
    image: "/images/boards/short-form-videos.svg",
    href: "/content/short-form-videos",
  },
  {
    id: "email-design",
    label: "Email Design",
    image: "/images/boards/email-design.svg",
    href: "/content/email-design",
  },
];

/* --------------------------------------------------------------------- */
/*  BOARD-HELPERS                                                        */
/* --------------------------------------------------------------------- */

function useBoardCount(boardId: string): number | null {
  const count = useFeedbirdStore((s) => {
    const posts = s.getAllPosts();
    return posts.filter((p) => p.boardId === boardId).length;
  });

  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // On the server, return null to prevent rendering.
    return null;
  }
  
  return count;
}

function BoardDropdownMenu({
  item,
  onAction,
}: {
  item: NavLink;
  onAction: (action: string, item: NavLink) => void;
}) {
  const [open, setOpen] = React.useState(false);
  
  const menu = [
    { id: "rename", label: "Rename", icon: "rename" },
    { id: "share", label: "Share", icon: "share" },
    { id: "settings", label: "Settings", icon: "settings" },
    { id: "color-icon", label: "Color & Icon", icon: "color-and-icon" },
    { id: "favorites", label: "Add to Favorites", icon: "favorite" },
    { id: "duplicate", label: "Duplicate", icon: "duplicate" },
    { id: "archive", label: "Archive", icon: "archive" },
    { id: "delete", label: "Delete board", icon: "delete"},
  ];

  const handleAction = (actionId: string) => {
    onAction(actionId, item);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          /* visible only when THIS row is hovered (group/row) */
          className="opacity-0 group-hover/row:opacity-100 data-[state=open]:opacity-100 transition-opacity
                     p-1 hover:bg-[#EAEBEC] rounded cursor-pointer
                     focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4 text-black" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-40 flex flex-col p-[4px] rounded-[6px] border border-[1px] border-[#EAECF0] bg-white"
        style={{
          boxShadow: "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
        }}
        onEscapeKeyDown={() => setOpen(false)}
        onInteractOutside={() => setOpen(false)}
      >
        {menu.map(({ id, label, icon }) => (
          <React.Fragment key={id}>
            {id === "delete" && <DropdownMenuSeparator className="mx-auto w-[132px]" />}
            <DropdownMenuItem
              onClick={(e) => {e.stopPropagation(); handleAction(id);}}
              className={
                cn("flex px-[10px] py-[7px] gap-2 font-medium text-sm text-primary-foreground cursor-pointer",
                  "h-[30px]",
                  "hover:bg-[#F4F5F6]"
                )
              }
            >
              <Image
                src={`/images/boards/${icon}.svg`}
                alt={icon}
                width={14}
                height={14}
              />
              <span>{label}</span>
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const BoardCount = ({ 
  boardId, 
  variant = 'expanded',
  isActive = false,
  boardColor
}: { 
  boardId: string; 
  variant?: 'expanded' | 'collapsed';
  isActive?: boolean;
  boardColor?: string | null;
}) => {
  const count = useBoardCount(boardId);

  const styles = cn(
    "text-[10px] font-semibold flex justify-center items-center px-1 min-w-[20px] h-[20px] leading-none",
    isActive && boardColor ? "text-white" : "text-black"
  );

  if (count === null) {
    return null;
  }

  return (
    <span className={styles}>
      {count}
    </span>
  );
};

/* -------- main component -------------------------------------------- */

export const RenderNavItems = React.memo(function RenderNavItems({
  items,
  isBoard = false,
  onBoardAction,
}: {
  items: NavLink[];
  isBoard?: boolean;
  onBoardAction?: (action: string, item: NavLink) => void;
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const [isClient, setIsClient] = React.useState(false);
  const getActiveWorkspace = useFeedbirdStore(s => s.getActiveWorkspace);
  const activeWorkspace = React.useMemo(() => getActiveWorkspace(), [getActiveWorkspace]);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleBoardAction = React.useCallback((action: string, item: NavLink) => {
    if (onBoardAction) {
      onBoardAction(action, item);
    } else {
      alert(`${action} → ${item.label}`); // fallback
    }
  }, [onBoardAction]);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarMenu>
        {items.map((nav) => {
          const active = nav.href && pathname.startsWith(nav.href);

          /* ----------------------------------------------------------- */
          /*  GET BOARD DATA FOR COLOR STYLING                           */
          /* ----------------------------------------------------------- */
          const boardColor = isBoard ? nav.color : null;

          /* ----------------------------------------------------------- */
          /*  ICON SELECTION                                            */
          /*  Use the original image and apply color styling instead    */
          /* ----------------------------------------------------------- */
          const imageSrc = nav.image;

          // Create separate content for expanded and collapsed states
          const ExpandedContent = (
            <SidebarMenuButton
              asChild
              className={cn(
                "group/row gap-[6px] p-[6px] text-sm font-semibold",
                "cursor-pointer focus:outline-none hover:bg-[#F4F5F6]",
                active ? "bg-[#F4F5F6]" : "",
              )}
            >
              {nav.href ? (
                <LoadingLink
                  href={nav.href}
                  className="flex items-center gap-[6px] w-full min-w-0"
                  loadingText={`Loading ${nav.label}…`}
                >
                  {imageSrc && (
                    <div 
                      className={cn(
                        "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                      )}
                      style={active && isBoard && boardColor ? { backgroundColor: boardColor } : undefined}
                    >
                      <img
                        src={imageSrc}
                        alt={nav.label}
                        className={cn(
                          "w-3.5 h-3.5",
                          // Make icon white when board is active and has a colored background
                          active && isBoard && boardColor && "filter brightness-0 invert"
                        )}
                        loading="lazy"
                      />
                    </div>
                  )}
                  <span className={cn("text-sm font-normal truncate text-black")}>{nav.label}</span>

                  {isBoard && (
                    <div className="flex items-center gap-1 ml-auto">
                      <BoardDropdownMenu
                        item={nav}
                        onAction={handleBoardAction}
                      />
                      <div
                        className={cn(
                          "flex items-center rounded font-normal",
                          active && boardColor ? "text-white" : "text-black"
                        )}
                        style={
                          active && boardColor
                            ? { backgroundColor: boardColor }
                            : undefined
                        }
                      >
                        <BoardCount boardId={nav.id} isActive={!!active} boardColor={boardColor} />
                      </div>
                    </div>
                  )}
                </LoadingLink>
              ) : (
                <button
                  onClick={nav.onClick}
                  className="flex items-center gap-[6px] w-full text-left cursor-pointer focus:outline-none min-w-0"
                >
                  {imageSrc && (
                    <div 
                    className={cn(
                      "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                    )}
                    style={active && isBoard && boardColor ? { backgroundColor: boardColor } : undefined}
                  >
                    <img
                      src={imageSrc}
                      alt={nav.label}
                      className={cn(
                        "w-3.5 h-3.5",
                        // Make icon white when board is active and has a colored background
                        active && isBoard && boardColor && "filter brightness-0 invert"
                      )}
                      loading="lazy"
                    />
                  </div>
                  )}
                  <span className={cn("text-sm font-normal truncate text-black")}>{nav.label}</span>
                </button>
              )}
            </SidebarMenuButton>
          );

          // Create collapsed content that only shows the icon
          const CollapsedContent = (
            <SidebarMenuButton
              asChild
              className={cn(
                "group/row p-[6px] text-sm font-semibold",
                "cursor-pointer focus:outline-none",
                "font-normal text-black"
              )}
            >
              {nav.href ? (
                <LoadingLink
                  href={nav.href}
                  className="flex items-center justify-center w-full"
                  loadingText={`Loading ${nav.label}…`}
                >
                  {imageSrc && (
                    <div 
                      className={cn(
                        "w-5 h-5 rounded flex items-center justify-center",
                      )}
                      style={active && isBoard && boardColor ? { backgroundColor: boardColor } : undefined}
                    >
                      <img
                        src={imageSrc}
                        alt={nav.label}
                        className={cn(
                          "w-3.5 h-3.5",
                          // Make icon white when board is active and has a colored background
                          active && isBoard && boardColor && "filter brightness-0 invert"
                        )}
                        loading="lazy"
                      />
                    </div>
                  )}
                </LoadingLink>
              ) : (
                <button
                  onClick={nav.onClick}
                  className="flex items-center justify-center w-full cursor-pointer focus:outline-none"
                >
                  {imageSrc && (
                    <div 
                    className={cn(
                      "w-5 h-5 rounded flex items-center justify-center",
                    )}
                    style={active && isBoard && boardColor ? { backgroundColor: boardColor } : undefined}
                  >
                    <img
                      src={imageSrc}
                      alt={nav.label}
                      className={cn(
                        "w-3.5 h-3.5",
                        // Make icon white when board is active and has a colored background
                        active && isBoard && boardColor && "filter brightness-0 invert"
                      )}
                      loading="lazy"
                    />
                  </div>
                  )}
                </button>
              )}
            </SidebarMenuButton>
          );

          return (
            <SidebarMenuItem key={nav.id} className={isBoard ? "group/row" : undefined}>
              {!isClient || state !== 'collapsed' ? (
                ExpandedContent
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>{CollapsedContent}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2 bg-popover text-popover-foreground shadow-md">
                    {imageSrc && (
                      <div 
                        className={cn(
                          "w-5 h-5 rounded flex items-center justify-center",
                        )}
                        style={active && isBoard && boardColor ? { backgroundColor: boardColor } : undefined}
                      >
                        <img 
                          src={imageSrc} 
                          alt={nav.label} 
                          className={cn(
                            "w-3.5 h-3.5",
                            // Make icon white when board is active and has a colored background
                            active && isBoard && boardColor && "filter brightness-0 invert"
                          )} 
                        />
                      </div>
                    )}
                    <span className={cn("text-sm font-medium truncate font-normal text-black")}>{nav.label}</span>
                    {isBoard && 
                      <div
                        className={cn(
                          "flex items-center rounded font-normal",
                          active && boardColor ? "text-white" : "text-black"
                        )}
                        style={
                          active && boardColor
                            ? { backgroundColor: boardColor }
                            : undefined
                        }
                      >
                        <BoardCount boardId={nav.id} isActive={!!active} boardColor={boardColor} />
                      </div>}
                  </TooltipContent>
                </Tooltip>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </TooltipProvider>
  );
});

/* --------------------------------------------------------------------- */
/*  MAIN SIDEBAR COMPONENT                                               */
/* --------------------------------------------------------------------- */

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const [isClient, setIsClient] = React.useState(false);
  const [isAddBoardModalOpen, setIsAddBoardModalOpen] = React.useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = React.useState(false);
  const [pendingBoardData, setPendingBoardData] = React.useState<{
    name: string;
    description: string;
    icon: string | undefined;
    color: string | undefined;
    rules?: BoardRules;
  } | null>(null);

  const { updateBoard, addBoard, removeBoard } = useFeedbirdStore();
  const activeWorkspace = useFeedbirdStore(s => s.getActiveWorkspace());
  const [colorIconTarget, setColorIconTarget] = React.useState<NavLinkType | null>(null);
  const [renameTarget, setRenameTarget] = React.useState<NavLinkType | null>(null);
  const [isManageSocialsOpen, setIsManageSocialsOpen] = React.useState(false);

  const activeBrand = useFeedbirdStore((s) => s.getActiveBrand());

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const platformNav = React.useMemo(() => defaultPlatformNav, []);
  const boardNav    = useFeedbirdStore(s => s.boardNav);

  /* open / collapse state for the two accordion groups */
  const [boardsOpen, setBoardsOpen] = React.useState(true);
  const [socialOpen, setSocialOpen] = React.useState(true);

  /* auto-expand boards if a board route is active */
  React.useEffect(() => {
    if (boardNav.some((b) => b.href && pathname.startsWith(b.href))) {
      setBoardsOpen(true);
    }
  }, [pathname, boardNav]);

  /* auto-expand socials when in social routes */
  React.useEffect(() => {
    if (pathname.startsWith("/social/") || pathname.startsWith("/images/social/")) {
      setSocialOpen(true);
    }
  }, [pathname]);

  const handleBoardAction = (action: string, item: NavLinkType) => {
    if (action === 'color-icon') {
      setColorIconTarget(item);
    } else if (action === 'rename') {
      setRenameTarget(item);
    } else if (action === 'share') {
      // TODO: Implement share functionality
      alert(`Share board: ${item.label}`);
    } else if (action === 'settings') {
      // TODO: Navigate to board settings or open settings modal
      alert(`Open settings for: ${item.label}`);
    } else if (action === 'favorites') {
      // TODO: Add to favorites functionality
      alert(`Add ${item.label} to favorites`);
    } else if (action === 'duplicate') {
      const duplicatedBoard = useFeedbirdStore.getState().workspaces
        .flatMap(w => w.boards)
        .find(b => b.id === item.id);
      
      if (duplicatedBoard) {
        const newName = `${duplicatedBoard.name} (Copy)`;
        addBoard(
          newName,
          duplicatedBoard.description,
          duplicatedBoard.image,
          duplicatedBoard.color,
          duplicatedBoard.rules
        );
      }
    } else if (action === 'archive') {
      // TODO: Implement archive functionality
      alert(`Archive board: ${item.label}`);
    } else if (action === 'delete') {
      removeBoard(item.id)
        .then(() => {
          toast.success(`Board "${item.label}" deleted successfully`);
        })
        .catch((error) => {
          console.error('Failed to delete board:', error);
          toast.error('Failed to delete board', {
            description: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
        });
    } else {
      alert(`${action} on ${item.label}`);
    }
  };

  const handleUpdateBoardColorAndIcon = (icon: string, color: string) => {
    if (colorIconTarget) {
      updateBoard(colorIconTarget.id, { image: icon, color: color });
      
      setColorIconTarget(null); // Clear the target after updating
    }
  };

  const handleRenameBoard = (newName: string) => {
    if (renameTarget) {
      updateBoard(renameTarget.id, { name: newName });
      setRenameTarget(null); // Clear the target after updating
    }
  };

  // Handle board creation flow
  const handleBoardDataReady = React.useCallback((data: {
    name: string;
    description: string;
    icon: string | undefined;
    color: string | undefined;
    rules?: BoardRules;
  }) => {
    setPendingBoardData(data);
    setIsAddBoardModalOpen(false);
    setIsRulesModalOpen(true);
  }, []);

  const handleUseTemplate = React.useCallback((data: {
    name: string;
    description: string;
    icon: string | undefined;
    color: string | undefined;
    rules?: BoardRules;
  }) => {
    // Create board directly with template rules, bypassing the rules modal
    addBoard(
      data.name,
      data.description,
      data.icon,
      data.color,
      data.rules
    );
    setIsAddBoardModalOpen(false);
  }, [addBoard]);

  const handleRulesSave = React.useCallback((rules: BoardRules) => {
    if (pendingBoardData) {
      addBoard(
        pendingBoardData.name,
        pendingBoardData.description,
        pendingBoardData.icon,
        pendingBoardData.color,
        rules
      );
      setPendingBoardData(null); // Clear the data after board is created
      setIsRulesModalOpen(false);
    }
  }, [pendingBoardData, addBoard]);

  const handleRulesBack = React.useCallback(() => {
    setIsRulesModalOpen(false);
    // Don't clear pendingBoardData - keep it so the add-board-modal can restore the form state
    setIsAddBoardModalOpen(true);
  }, []);

  return (
    <Sidebar
      collapsible="icon"
          className="border-r border-border-primary text-foreground gap-2 bg-[#FAFAFA]"
    >
      {/* ---------------------------------------------------------------- */}
      {/*  HEADER                                                         */}
      {/* ---------------------------------------------------------------- */}
      <SidebarHeader className={state !== "collapsed" ? "border-b border-border-primary" : undefined}>
        <WorkspaceSwitcher />
      </SidebarHeader>

      {/* ---------------------------------------------------------------- */}
      {/*  CONTENT                                                        */}
      {/* ---------------------------------------------------------------- */}
      <SidebarContent>

        {/* -------------------- PLATFORM LINKS ----------------------- */}
        <SidebarGroup>
          <RenderNavItems items={platformNav} isBoard={false} />
        </SidebarGroup>

        {/* -------------------- BOARDS ------------------------------- */}
        {isClient && (
        <SidebarGroup>
          {state === 'collapsed' ? (
            <div className="px-1 py-1">
              <SidebarSeparator className="bg-gray-200" />
            </div>
          ) : (
            <SidebarGroupLabel>
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-medium text-[#75777C] tracking-wide">Boards</span>
                <button onClick={() => setIsAddBoardModalOpen(!!activeWorkspace)} className="hover:bg-gray-100 rounded cursor-pointer  ">
                  <Image
                    src={`/images/sidebar/plus.svg`}
                    alt="board plus"
                    width={18}
                    height={18}
                  />
                </button>
              </div>
            </SidebarGroupLabel>
          )}

          <div className="mt-1">
            <RenderNavItems items={boardNav} isBoard onBoardAction={handleBoardAction} />
          </div>
        </SidebarGroup>
        )}

        {/* -------------------- SOCIALS ------------------------------ */}
        {isClient && (
        <SidebarGroup>
          {state === 'collapsed' ? (
            <div className="px-1 py-1">
              <SidebarSeparator className="bg-gray-200" />
            </div>
          ) : (
            <SidebarGroupLabel>
              <div className="flex items-center justify-between w-full cursor-pointer">
                <div
                  className="flex items-center text-[#75777C] gap-1.5"
                  onClick={() => setSocialOpen((o) => !o)}
                >
                  {socialOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="text-xs font-medium tracking-wide">Socials</span>
                </div>
                <button onClick={() => setIsManageSocialsOpen(!!activeBrand)} className="hover:bg-gray-100 rounded">
                  <Image
                    src={`/images/sidebar/plus.svg`}
                    alt="social plus"
                    width={18}
                    height={18}
                  />
                </button>
              </div>
            </SidebarGroupLabel>
          )}

          {socialOpen && (
            <SidebarMenu className="mt-1">
              <SocialShortcuts />
            </SidebarMenu>
          )}
        </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>{/* Optional footer items */}</SidebarFooter>

      <AddBoardModal 
        isOpen={isAddBoardModalOpen} 
        onClose={() => setIsAddBoardModalOpen(false)}
        onBoardDataReady={handleBoardDataReady}
        onUseTemplate={handleUseTemplate}
        pendingBoardData={pendingBoardData}
      />
      <ColorAndIconDialog
        isOpen={!!colorIconTarget}
        onClose={() => setColorIconTarget(null)}
        icon={colorIconTarget?.image}
        color={colorIconTarget?.color}
        onSave={handleUpdateBoardColorAndIcon}
      />

      <RenameBoardDialog
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        currentName={renameTarget?.label || ''}
        onRename={handleRenameBoard}
      />

      <BoardRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        onBack={handleRulesBack}
        onSave={handleRulesSave}
        initialRules={pendingBoardData?.rules}
      />

      {activeBrand && (
        <ManageSocialsDialog
          brandId={activeBrand.id}
          open={isManageSocialsOpen}
          onOpenChange={setIsManageSocialsOpen}
        />
      )}
    </Sidebar>
  );
}
