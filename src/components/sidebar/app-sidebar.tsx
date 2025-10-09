/* components/layout/app-sidebar.tsx */
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { cn, getFullnameinitial } from "@/lib/utils";
import { useClerk } from '@clerk/nextjs'

import {
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  // icons for the board-menu:
  Archive as ArchiveIcon,
  // icons for user profile:
  ArrowLeft,
} from "lucide-react";

/* --------------------------------------------------------------------- */
/*  NAV CONFIGS (static for now – you can pull these from the store)     */
/* --------------------------------------------------------------------- */

const getDefaultPlatformNav = (workspaceId?: string): NavLink[] => [
  {
    id: "messages",
    label: "Inbox",
    image: "/images/sidebar/messages.svg",
    selectedImage: "/images/sidebar/messages-active.svg",
    href: workspaceId ? `/${workspaceId}/messages` : "/messages",
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
    href: workspaceId ? `/${workspaceId}/approvals` : "/approvals",
  },
  {
    id: "admin",
    label: "Admin",
    image: "/images/sidebar/forms.svg",
    href: workspaceId ? `/${workspaceId}/admin` : "/admin",
  },
  {
    id: "analytics",
    label: "Analytics",
    image: "/images/sidebar/analytics.svg",
    selectedImage: "/images/sidebar/analytics-active.svg",
    href: workspaceId ? `/${workspaceId}/analytics` : "/analytics",
  },
  // {
  //   id: "settings",
  //   label: "Settings",
  //   image: "/images/sidebar/settings.svg",
  //   href: "/settings",
  // },
];

/* --------------------------------------------------------------------- */
/*  BOARD-HELPERS                                                        */
/* --------------------------------------------------------------------- */

function useBoardCount(board_id: string): number | null {
  const count = useFeedbirdStore((s) => {
    const posts = s.getAllPosts();
    return posts.filter((p) => p.board_id === board_id).length;
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
    { id: "delete", label: "Delete board", icon: "delete" },
  ];

  const handleAction = (actionId: string) => {
    onAction(actionId, item);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          /* render in layout only on row hover or when menu is open */
          className="hidden group-hover/row:inline-flex data-[state=open]:inline-flex
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
              onClick={(e) => { e.stopPropagation(); handleAction(id); }}
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
  board_id,
  variant = 'expanded',
  isActive = false,
  boardColor
}: {
  board_id: string;
  variant?: 'expanded' | 'collapsed';
  isActive?: boolean;
  boardColor?: string | null;
}) => {
  const count = useBoardCount(board_id);

  const styles = cn(
    "text-[10px] font-semibold flex justify-center items-center px-1 min-w-[20px] h-[20px] leading-none text-black",
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
  const { state, hoverReveal } = useSidebar();
  const [isClient, setIsClient] = React.useState(false);
  const unreadMsgCount = useFeedbirdStore(s => (s.user?.unread_msg ? s.user.unread_msg.length : 0));
  const unreadNotificationCount = useFeedbirdStore(s => (s.user?.unread_notification ? s.user.unread_notification.length : 0));

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
          let active = false;
          if (nav.href) {
            if (nav.id === 'admin-home') {
              // Admin Home should only be active on exact workspace root
              active = pathname === nav.href;
            } else if (nav.href.includes('/content/')) {
              // For content routes, check if the pathname contains the board route segment
              active = pathname.includes(nav.href.split('/').pop() || '');
            } else {
              // For other routes, check if pathname starts with the href
              active = pathname.startsWith(nav.href);
            }
          }

          /* ----------------------------------------------------------- */
          /*  GET BOARD DATA FOR COLOR STYLING                           */
          /* ----------------------------------------------------------- */
          const boardColor = isBoard ? nav.color : null;

          /* ----------------------------------------------------------- */
          /*  ICON SELECTION                                            */
          /*  Use the original image and apply color styling instead    */
          /* ----------------------------------------------------------- */
          let imageSrc = nav.image;

          // Special handling for messages icon based on unread status
          if (nav.id === 'messages') {
            if (unreadMsgCount > 0 || unreadNotificationCount > 0) {
              imageSrc = "/images/sidebar/messages-on.svg";
            } else {
              imageSrc = "/images/sidebar/messages.svg";
            }
          }


          return (
            <SidebarMenuItem key={nav.id} className={isBoard ? "group/row" : undefined}>
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
                          "w-4.5 h-4.5 rounded-[3px] p-[3px] flex items-center justify-center flex-shrink-0",
                        )}
                        style={isBoard && boardColor ? { backgroundColor: boardColor } : undefined}
                      >
                        <img
                          src={imageSrc}
                          alt={nav.label}
                          className="w-3 h-3"
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
                          )}
                        >
                          <BoardCount board_id={nav.id} isActive={!!active} boardColor={boardColor} />
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
                          "w-4.5 h-4.5 rounded-[3px] p-[3px] flex items-center justify-center flex-shrink-0",
                        )}
                        style={isBoard && boardColor ? { backgroundColor: boardColor } : undefined}
                      >
                        <img
                          src={imageSrc}
                          alt={nav.label}
                          className="w-3 h-3"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <span className={cn("text-sm font-normal truncate text-black")}>{nav.label}</span>
                  </button>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </TooltipProvider>
  );
});

/* --------------------------------------------------------------------- */
/*  USER PROFILE COMPONENT                                               */
/* --------------------------------------------------------------------- */

function UserProfileSection() {
  const { state, hoverReveal } = useSidebar();
  const user = useFeedbirdStore(s => s.user);
  const clearUser = useFeedbirdStore(s => s.clearUser)
  const [isClient, setIsClient] = React.useState(false);
  const { signOut } = useClerk()
  const activeWorkspace = useFeedbirdStore(s => s.getActiveWorkspace());
  const router = useRouter();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !user) {
    return null;
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
  const userInitials = getFullnameinitial(user.firstName || undefined, user.lastName || undefined, user.email || undefined);

  const handleLogout = async () => {
    try {
      clearUser();
      await signOut({ redirectUrl: '/landing' });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleProfileSettings = () => {
    const base = activeWorkspace ? `/${activeWorkspace.id}` : '';
    router.push(`${base}/settings/profile`);
  };

  const handleAccountBilling = () => {
    const base = activeWorkspace ? `/${activeWorkspace.id}` : '';
    router.push(`${base}/settings/billing`);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex items-center gap-2">
        {/* User Avatar */}
        <div className="relative">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={fullName}
              className="w-6 h-6 rounded-[3px] object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-[3px] bg-main flex items-center justify-center text-white text-sm font-medium">
              {userInitials}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-black truncate">{fullName}</p>
          <p className="text-xs text-grey font-normal truncate">{user.email}</p>
        </div>

        {/* Three-dot menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-gray-100 rounded cursor-pointer focus:outline-none">
              <MoreHorizontal className="w-3.5 h-3.5 text-[#5C5E63]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[150px] flex flex-col p-0 rounded-[8px] border border-elementStroke bg-white"
          >
            <DropdownMenuItem
              onClick={handleProfileSettings}
              className="flex px-3 py-2 gap-2 font-medium text-sm text-black cursor-pointer hover:bg-gray-50 rounded-sm"
            >
              <img src="/images/settings/profile.svg" alt="Account" className="w-3.5 h-3.5" />
              <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleAccountBilling}
              className="flex px-3 py-2 gap-2 font-medium text-sm text-black cursor-pointer hover:bg-gray-50 rounded-sm"
            >
              <img src="/images/settings/billing.svg" alt="Billing" className="w-3.5 h-3.5" />
              <span>Billing</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-[0px] text-elementStroke" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex px-3 py-2 gap-2 font-medium text-sm text-black cursor-pointer hover:bg-gray-50 rounded-sm"
            >
              <img src="/images/sidebar/logout.svg" alt="Logout" className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}

/* --------------------------------------------------------------------- */
/*  MAIN SIDEBAR COMPONENT                                               */
/* --------------------------------------------------------------------- */

export function AppSidebar() {
  const pathname = usePathname();
  const { state, hoverReveal } = useSidebar();
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

  const platformNav = React.useMemo(() => {
    return getDefaultPlatformNav(activeWorkspace?.id);
  }, [activeWorkspace]);
  const boardNav = useFeedbirdStore(s => s.boardNav);

  /* open / collapse state for the two accordion groups */
  const [boardsOpen, setBoardsOpen] = React.useState(true);
  const [socialOpen, setSocialOpen] = React.useState(true);

  /* auto-expand boards if a board route is active */
  React.useEffect(() => {
    if (boardNav.some((b) => b.href && pathname.includes(b.href.split('/').pop() || ''))) {
      setBoardsOpen(true);
    }
  }, [pathname, boardNav]);

  /* auto-expand socials when in social routes */
  React.useEffect(() => {
    if (pathname.includes("/social/") || pathname.includes("/images/social/")) {
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
      collapsible="offcanvas"
      className="border-r border-border-primary text-foreground gap-2 bg-[#FAFAFA]"
    >
      {/* ---------------------------------------------------------------- */}
      {/*  HEADER                                                         */}
      {/* ---------------------------------------------------------------- */}
      <SidebarHeader className="border-b border-border-primary">
        <WorkspaceSwitcher />
      </SidebarHeader>

      {/* ---------------------------------------------------------------- */}
      {/*  CONTENT                                                        */}
      {/* ---------------------------------------------------------------- */}
      <SidebarContent>
        {pathname.includes('/settings') ? (
          <>
            <Link
              href={activeWorkspace ? `/${activeWorkspace.id}` : '/'}
              className="flex items-center gap-1 cursor-pointer"
            >
              <span className="flex items-center justify-center w-4 h-4">
                <ArrowLeft className="w-4 h-4 text-black" />
              </span>
              <span className="text-sm text-black font-medium">Return to workspace</span>
            </Link>
            <SidebarGroup>
              <SidebarGroupLabel>
                <span className="text-xs font-medium text-[#75777C] tracking-wide">WORKSPACE</span>
              </SidebarGroupLabel>
              <RenderNavItems
                items={[
                  { id: 'ws-workspace', label: 'Workspace', image: '/images/settings/workspace.svg', href: activeWorkspace ? `/${activeWorkspace.id}/settings/workspace` : '/settings/workspace' },
                  { id: 'ws-socials', label: 'Socials', image: '/images/settings/socials.svg', href: activeWorkspace ? `/${activeWorkspace.id}/settings/socials` : '/settings/socials' },
                  { id: 'ws-billing', label: 'Billing', image: '/images/settings/billing.svg', href: activeWorkspace ? `/${activeWorkspace.id}/settings/billing` : '/settings/billing' },
                  { id: 'ws-members', label: 'Members', image: '/images/settings/members.svg', href: activeWorkspace ? `/${activeWorkspace.id}/settings/members` : '/settings/members' },
                  { id: 'ws-integrations', label: 'Integrations', image: '/images/settings/integrations.svg', href: activeWorkspace ? `/${activeWorkspace.id}/settings/integrations` : '/settings/integrations' },
                ]}
              />
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>
                <span className="text-xs font-medium text-[#75777C] tracking-wide">ACCOUNT</span>
              </SidebarGroupLabel>
              <RenderNavItems
                items={[
                  { id: 'acc-profile', label: 'Profile', image: '/images/settings/profile.svg', href: activeWorkspace ? `/${activeWorkspace.id}/settings/profile` : '/settings/profile' },
                  { id: 'acc-notifications', label: 'Notifications', image: '/images/settings/notifications.svg', href: activeWorkspace ? `/${activeWorkspace.id}/settings/notifications` : '/settings/notifications' },
                ]}
              />
            </SidebarGroup>
          </>
        ) : pathname.includes('/admin') ? (
          <>
            <SidebarGroup>
              <RenderNavItems
                items={[
                  { id: 'admin-home', label: 'Home', image: '/images/sidebar/home.svg', href: activeWorkspace ? `/${activeWorkspace.id}` : '/' },
                  { id: 'admin-clients', label: 'Clients', image: '/images/sidebar/clients.svg', href: activeWorkspace ? `/${activeWorkspace.id}/admin/clients` : '/admin/clients' },
                  { id: 'admin-team', label: 'Team', image: '/images/sidebar/team.svg', href: activeWorkspace ? `/${activeWorkspace.id}/admin/team` : '/admin/team' },
                ]}
              />
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>
                <span className="text-xs font-medium text-[#75777C] tracking-wide">TOOLS & AUTOMATIONS</span>
              </SidebarGroupLabel>
              <RenderNavItems
                items={[
                  { id: 'admin-inbox', label: 'Inbox', image: '/images/sidebar/messages.svg', href: activeWorkspace ? `/${activeWorkspace.id}/admin/inbox` : '/admin/inbox' },
                  { id: 'admin-services', label: 'Services', image: '/images/sidebar/services.svg', href: activeWorkspace ? `/${activeWorkspace.id}/admin/services` : '/admin/services' },
                  { id: 'admin-forms', label: 'Forms', image: '/images/sidebar/forms.svg', href: activeWorkspace ? `/${activeWorkspace.id}/admin/forms` : '/admin/forms' },
                  { id: 'admin-automations', label: 'Automations', image: '/images/sidebar/automations.svg', href: activeWorkspace ? `/${activeWorkspace.id}/admin/automations` : '/admin/automations' },
                  { id: 'admin-files', label: 'Files', image: '/images/sidebar/files.svg', href: activeWorkspace ? `/${activeWorkspace.id}/admin/files` : '/admin/files' },
                  { id: 'admin-settings', label: 'Settings', image: '/images/sidebar/settings.svg', href: activeWorkspace ? `/${activeWorkspace.id}/admin/settings` : '/admin/settings' },
                ]}
              />
            </SidebarGroup>
          </>
        ) : (
          <>
            {/* -------------------- PLATFORM LINKS ----------------------- */}
            <SidebarGroup>
              <RenderNavItems items={platformNav} isBoard={false} />
            </SidebarGroup>

            {/* -------------------- BOARDS ------------------------------- */}
            {isClient && (
              <SidebarGroup>
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

                <div className="mt-1">
                  <RenderNavItems items={boardNav} isBoard onBoardAction={handleBoardAction} />
                </div>
              </SidebarGroup>
            )}

            {/* -------------------- SOCIALS ------------------------------ */}
            {isClient && (
              <SidebarGroup>
                <SidebarGroupLabel>
                  <div className="flex items-center justify-between w-full cursor-pointer">
                    <div
                      className="flex items-center text-[#75777C] gap-1.5"
                      onClick={() => setSocialOpen((o) => !o)}
                    >
                      {socialOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span className="text-xs font-medium tracking-wide">Socials</span>
                    </div>
                    <button onClick={() => setIsManageSocialsOpen(true)} className="hover:bg-gray-100 rounded cursor-pointer">
                      <Image
                        src={`/images/sidebar/plus.svg`}
                        alt="social plus"
                        width={18}
                        height={18}
                      />
                    </button>
                  </div>
                </SidebarGroupLabel>

                {socialOpen && (
                  <SidebarMenu className="mt-1">
                    <SocialShortcuts />
                  </SidebarMenu>
                )}
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="px-2.5 py-3">
        <UserProfileSection />
      </SidebarFooter>

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

      {activeWorkspace && (
        <ManageSocialsDialog
          workspaceId={activeWorkspace.id}
          open={isManageSocialsOpen}
          onOpenChange={setIsManageSocialsOpen}
        />
      )}
    </Sidebar>
  );
}
