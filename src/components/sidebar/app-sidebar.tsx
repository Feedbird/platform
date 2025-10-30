/* components/layout/app-sidebar.tsx */
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
  useSidebar,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import WorkspaceSwitcher from '@/components/workspace/workspace-switcher';
import SocialShortcuts from '@/components/sidebar/social-shortcuts';
import { LoadingLink } from '@/components/layout/navigation-loader';
import { AddBoardModal } from '@/components/board/add-board-modal';
import { BoardRulesModal } from '@/components/board/board-rules-modal';
import { ColorAndIconDialog } from '@/components/board/color-and-icon-dialog';
import { RenameBoardDialog } from '@/components/board/rename-board-dialog';
import {
  NavLink as NavLinkType,
  BoardRules,
  NavLink,
  usePostStore,
  useUserStore,
  useWorkspaceStore,
} from '@/lib/store';
import { ManageSocialsDialog } from '@/components/social/manage-socials-dialog';
import { cn, getFullnameinitial } from '@/lib/utils';
import { useClerk } from '@clerk/nextjs';

import {
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Archive as ArchiveIcon,
  ArrowLeft,
} from 'lucide-react';
import {
  AnalyticsIcon,
  ApprovalsIcon,
  DashboardIcon,
  InboxOnIcon,
  InboxIcon,
} from '../ui/icons';
import { BoardInner } from '@/app/[workspaceId]/content/[board_id]/_inner';

/* --------------------------------------------------------------------- */
/*  NAV CONFIGS (static for now – you can pull these from the store)     */
/* --------------------------------------------------------------------- */

const getDefaultPlatformNav = (workspaceId?: string): NavLink[] => [
  {
    id: 'dashboard',
    label: 'Dashboard',
    image: <DashboardIcon size={18} color="#1C1D1F" />,
    selectedImage: <DashboardIcon size={18} color="#1C1D1F" />,
    href: workspaceId ? `/${workspaceId}/admin` : '/admin',
  },
  {
    id: 'messages',
    label: 'Inbox',
    image: <InboxIcon size={18} color="#1C1D1F" />,
    selectedImage: <InboxIcon size={18} color="#1C1D1F" />,
    href: workspaceId ? `/${workspaceId}/messages` : '/messages',
  },
  {
    id: 'approvals',
    label: 'Approvals',
    image: <ApprovalsIcon size={18} color="#1C1D1F" />,
    selectedImage: <ApprovalsIcon size={18} color="#1C1D1F" />,
    href: workspaceId ? `/${workspaceId}/approvals` : '/approvals',
  },
  {
    id: 'admin',
    label: 'Admin',
    image: <DashboardIcon size={18} color="#1C1D1F" />,
    selectedImage: <DashboardIcon size={18} color="#1C1D1F" />,
    href: workspaceId ? `/${workspaceId}/admin` : '/admin',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    image: <AnalyticsIcon size={18} color="#1C1D1F" />,
    selectedImage: <AnalyticsIcon size={18} color="#1C1D1F" />,
    href: workspaceId ? `/${workspaceId}/analytics` : '/analytics',
  },
];

/* --------------------------------------------------------------------- */
/*  BOARD-HELPERS                                                        */
/* --------------------------------------------------------------------- */

function useBoardCount(boardId: string): number | null {
  const count = usePostStore((s) => {
    const posts = s.getAllPosts();
    return posts.filter((p) => p.boardId === boardId).length;
  });
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
    { id: 'rename', label: 'Rename', icon: 'rename' },
    { id: 'share', label: 'Share', icon: 'share' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'color-icon', label: 'Color & Icon', icon: 'color-and-icon' },
    { id: 'favorites', label: 'Add to Favorites', icon: 'favorite' },
    { id: 'duplicate', label: 'Duplicate', icon: 'duplicate' },
    { id: 'archive', label: 'Archive', icon: 'archive' },
    { id: 'delete', label: 'Delete board', icon: 'delete' },
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
          className="hidden cursor-pointer rounded p-1 group-hover/row:inline-flex hover:bg-[#EAEBEC] focus:outline-none data-[state=open]:inline-flex"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4 text-black" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="flex w-40 flex-col rounded-[6px] border border-[1px] border-[#EAECF0] bg-white p-[4px]"
        style={{
          boxShadow:
            '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)',
        }}
        onEscapeKeyDown={() => setOpen(false)}
        onInteractOutside={() => setOpen(false)}
      >
        {menu.map(({ id, label, icon }) => (
          <React.Fragment key={id}>
            {id === 'delete' && (
              <DropdownMenuSeparator className="mx-auto w-[132px]" />
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleAction(id);
              }}
              className={cn(
                'text-primary-foreground flex cursor-pointer gap-2 px-[10px] py-[7px] text-sm font-medium',
                'h-[30px]',
                'hover:bg-[#F4F5F6]'
              )}
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
  boardColor,
}: {
  boardId: string;
  variant?: 'expanded' | 'collapsed';
  isActive?: boolean;
  boardColor?: string | null;
}) => {
  const count = useBoardCount(boardId);

  const styles = cn(
    'text-[10px] font-semibold flex justify-center items-center px-1 min-w-[20px] h-[20px] leading-none text-black'
  );

  if (count === null) {
    return null;
  }

  return <span className={styles}>{count}</span>;
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
  const unreadMsgCount = useUserStore((s) =>
    s.user?.unreadMsg ? s.user.unreadMsg.length : 0
  );
  const unreadNotificationCount = useUserStore((s) =>
    s.user?.unreadNotification ? s.user.unreadNotification.length : 0
  );
  const totalUnreadCount = unreadMsgCount + unreadNotificationCount;

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleBoardAction = React.useCallback(
    (action: string, item: NavLink) => {
      if (onBoardAction) {
        onBoardAction(action, item);
      } else {
        alert(`${action} → ${item.label}`); // fallback
      }
    },
    [onBoardAction]
  );

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
          let ImageComponent = nav.image;

          // Special handling for messages icon based on unread status
          if (nav.id === 'messages') {
            if (totalUnreadCount > 0) {
              ImageComponent = <InboxOnIcon size={18} color="#1C1D1F" />;
            } else {
              ImageComponent = <InboxIcon size={18} color="#1C1D1F" />;
            }
          }

          return (
            <SidebarMenuItem
              key={nav.id}
              className={isBoard ? 'group/row' : undefined}
            >
              <SidebarMenuButton
                asChild
                className={cn(
                  'group/row gap-[6px] p-[6px] text-sm font-semibold',
                  'cursor-pointer hover:bg-[#F4F5F6] focus:outline-none',
                  active ? 'bg-[#F4F5F6]' : ''
                )}
              >
                {nav.href ? (
                  <LoadingLink
                    href={nav.href}
                    className="flex w-full min-w-0 items-center gap-[6px] [&>svg]:size-4.5"
                    loadingText={`Loading ${nav.label}…`}
                  >
                    {nav.image &&
                      (isBoard ? (
                        <div
                          className={cn(
                            'flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-[3px] p-[3px]'
                          )}
                          style={
                            boardColor
                              ? { backgroundColor: boardColor }
                              : undefined
                          }
                        >
                          <img
                            src={nav.image as string}
                            alt={nav.label}
                            className="h-3 w-3"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        ImageComponent
                      ))}
                    <span
                      className={cn('truncate text-sm font-normal text-black')}
                    >
                      {nav.label}
                    </span>

                    {(nav.id === 'messages' || nav.id === 'admin-inbox') &&
                      totalUnreadCount > 0 && (
                        <span
                          className={cn(
                            'ml-auto flex h-[14px] w-[14px] items-center justify-center rounded-[4px] px-1 text-[10px] leading-none font-medium text-white',
                            'bg-[#FE4C28]'
                          )}
                        >
                          {totalUnreadCount}
                        </span>
                      )}

                    {isBoard && (
                      <div className="ml-auto flex items-center gap-1">
                        <BoardDropdownMenu
                          item={nav}
                          onAction={handleBoardAction}
                        />
                        <div
                          className={cn(
                            'flex items-center rounded font-normal'
                          )}
                        >
                          <BoardCount
                            boardId={nav.id}
                            isActive={!!active}
                            boardColor={boardColor}
                          />
                        </div>
                      </div>
                    )}
                  </LoadingLink>
                ) : (
                  <button
                    onClick={nav.onClick}
                    className="flex w-full min-w-0 cursor-pointer items-center gap-[6px] text-left focus:outline-none"
                  >
                    {ImageComponent && (
                      <div
                        className={cn(
                          'flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-[3px] p-[3px]'
                        )}
                        style={
                          isBoard && boardColor
                            ? { backgroundColor: boardColor }
                            : undefined
                        }
                      >
                        {ImageComponent}
                      </div>
                    )}
                    <span
                      className={cn('truncate text-sm font-normal text-black')}
                    >
                      {nav.label}
                    </span>
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
  const user = useUserStore((s) => s.user);
  const clearUser = useUserStore((s) => s.clearUser);
  const [isClient, setIsClient] = React.useState(false);
  const { signOut } = useClerk();
  const activeWorkspace = useWorkspaceStore((s) => s.getActiveWorkspace());
  const router = useRouter();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !user) {
    return null;
  }

  const fullName =
    `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
  const userInitials = getFullnameinitial(
    user.firstName || undefined,
    user.lastName || undefined,
    user.email || undefined
  );

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
              className="h-6 w-6 rounded-[3px] object-cover"
            />
          ) : (
            <div className="bg-main flex h-6 w-6 items-center justify-center rounded-[3px] text-sm font-medium text-white">
              {userInitials}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-black">{fullName}</p>
          <p className="text-grey truncate text-xs font-normal">{user.email}</p>
        </div>

        {/* Three-dot menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="cursor-pointer rounded p-1 hover:bg-gray-100 focus:outline-none">
              <MoreHorizontal className="h-3.5 w-3.5 text-[#5C5E63]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-elementStroke flex w-[150px] flex-col rounded-[8px] border bg-white p-0"
          >
            <DropdownMenuItem
              onClick={handleProfileSettings}
              className="flex cursor-pointer gap-2 rounded-sm px-3 py-2 text-sm font-medium text-black hover:bg-gray-50"
            >
              <img
                src="/images/settings/profile.svg"
                alt="Account"
                className="h-3.5 w-3.5"
              />
              <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleAccountBilling}
              className="flex cursor-pointer gap-2 rounded-sm px-3 py-2 text-sm font-medium text-black hover:bg-gray-50"
            >
              <img
                src="/images/settings/billing.svg"
                alt="Billing"
                className="h-3.5 w-3.5"
              />
              <span>Billing</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="text-elementStroke my-[0px]" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex cursor-pointer gap-2 rounded-sm px-3 py-2 text-sm font-medium text-black hover:bg-gray-50"
            >
              <img
                src="/images/sidebar/logout.svg"
                alt="Logout"
                className="h-3.5 w-3.5"
              />
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

  const { updateBoard, addBoard, removeBoard } = useWorkspaceStore();
  const activeWorkspace = useWorkspaceStore((s) => s.getActiveWorkspace());
  const [colorIconTarget, setColorIconTarget] =
    React.useState<NavLinkType | null>(null);
  const [renameTarget, setRenameTarget] = React.useState<NavLinkType | null>(
    null
  );
  const [isManageSocialsOpen, setIsManageSocialsOpen] = React.useState(false);

  const activeBrand = useWorkspaceStore((s) => s.getActiveBrand());

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const platformNav = React.useMemo(() => {
    return getDefaultPlatformNav(activeWorkspace?.id);
  }, [activeWorkspace]);
  const boardNav = useWorkspaceStore((s) => s.boardNav);

  /* open / collapse state for the two accordion groups */
  const [boardsOpen, setBoardsOpen] = React.useState(true);
  const [socialOpen, setSocialOpen] = React.useState(true);

  /* auto-expand boards if a board route is active */
  React.useEffect(() => {
    if (
      boardNav.some(
        (b) => b.href && pathname.includes(b.href.split('/').pop() || '')
      )
    ) {
      setBoardsOpen(true);
    }
  }, [pathname, boardNav]);

  /* auto-expand socials when in social routes */
  React.useEffect(() => {
    if (pathname.includes('/social/') || pathname.includes('/images/social/')) {
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
      const duplicatedBoard = useWorkspaceStore
        .getState()
        .workspaces.flatMap((w) => w.boards)
        .find((b) => b.id === item.id);

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
            description:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
          });
        });
    } else {
      alert(`${action} on ${item.label}`);
    }
  };

  const handleUpdateBoardColorAndIcon = (
    icon: React.ReactNode,
    color: string
  ) => {
    if (colorIconTarget) {
      updateBoard(colorIconTarget.id, { image: icon as string, color: color });

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
  const handleBoardDataReady = React.useCallback(
    (data: {
      name: string;
      description: string;
      icon: string | undefined;
      color: string | undefined;
      rules?: BoardRules;
    }) => {
      setPendingBoardData(data);
      setIsAddBoardModalOpen(false);
      setIsRulesModalOpen(true);
    },
    []
  );

  const handleUseTemplate = React.useCallback(
    (data: {
      name: string;
      description: string;
      icon: string | undefined;
      color: string | undefined;
      rules?: BoardRules;
    }) => {
      // Create board directly with template rules, bypassing the rules modal
      addBoard(data.name, data.description, data.icon, data.color, data.rules);
      setIsAddBoardModalOpen(false);
    },
    [addBoard]
  );

  const handleRulesSave = React.useCallback(
    (rules: BoardRules) => {
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
    },
    [pendingBoardData, addBoard]
  );

  const handleRulesBack = React.useCallback(() => {
    setIsRulesModalOpen(false);
    // Don't clear pendingBoardData - keep it so the add-board-modal can restore the form state
    setIsAddBoardModalOpen(true);
  }, []);

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-border-primary text-foreground gap-2 border-r bg-[#FAFAFA]"
    >
      {/* ---------------------------------------------------------------- */}
      {/*  HEADER                                                         */}
      {/* ---------------------------------------------------------------- */}
      <SidebarHeader className="border-border-primary border-b">
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
              className="flex cursor-pointer items-center gap-1"
            >
              <span className="flex h-4 w-4 items-center justify-center">
                <ArrowLeft className="h-4 w-4 text-black" />
              </span>
              <span className="text-sm font-medium text-black">
                Return to workspace
              </span>
            </Link>
            <SidebarGroup>
              <SidebarGroupLabel>
                <span className="text-xs font-medium tracking-wide text-[#75777C]">
                  WORKSPACE
                </span>
              </SidebarGroupLabel>
              <RenderNavItems
                items={[
                  {
                    id: 'ws-workspace',
                    label: 'Workspace',
                    image: '/images/settings/workspace.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/settings/workspace`
                      : '/settings/workspace',
                  },
                  {
                    id: 'ws-socials',
                    label: 'Socials',
                    image: '/images/settings/socials.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/settings/socials`
                      : '/settings/socials',
                  },
                  {
                    id: 'ws-billing',
                    label: 'Billing',
                    image: '/images/settings/billing.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/settings/billing`
                      : '/settings/billing',
                  },
                  {
                    id: 'ws-members',
                    label: 'Members',
                    image: '/images/settings/members.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/settings/members`
                      : '/settings/members',
                  },
                  {
                    id: 'ws-integrations',
                    label: 'Integrations',
                    image: '/images/settings/integrations.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/settings/integrations`
                      : '/settings/integrations',
                  },
                ]}
              />
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>
                <span className="text-xs font-medium tracking-wide text-[#75777C]">
                  ACCOUNT
                </span>
              </SidebarGroupLabel>
              <RenderNavItems
                items={[
                  {
                    id: 'acc-profile',
                    label: 'Profile',
                    image: '/images/settings/profile.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/settings/profile`
                      : '/settings/profile',
                  },
                  {
                    id: 'acc-notifications',
                    label: 'Notifications',
                    image: '/images/settings/notifications.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/settings/notifications`
                      : '/settings/notifications',
                  },
                ]}
              />
            </SidebarGroup>
          </>
        ) : pathname.includes('/admin') ? (
          <>
            <SidebarGroup>
              <RenderNavItems
                items={[
                  {
                    id: 'admin-home',
                    label: 'Home',
                    image: '/images/sidebar/home.svg',
                    href: activeWorkspace ? `/${activeWorkspace.id}` : '/',
                  },
                  {
                    id: 'admin-clients',
                    label: 'Clients',
                    image: '/images/sidebar/clients.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/admin/clients`
                      : '/admin/clients',
                  },
                  {
                    id: 'admin-team',
                    label: 'Team',
                    image: '/images/sidebar/team.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/admin/team`
                      : '/admin/team',
                  },
                ]}
              />
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>
                <span className="text-xs font-medium tracking-wide text-[#75777C]">
                  TOOLS & AUTOMATIONS
                </span>
              </SidebarGroupLabel>
              <RenderNavItems
                items={[
                  {
                    id: 'admin-inbox',
                    label: 'Inbox',
                    image: '/images/sidebar/messages.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/admin/inbox`
                      : '/admin/inbox',
                  },
                  {
                    id: 'admin-services',
                    label: 'Services',
                    image: '/images/sidebar/services.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/admin/services`
                      : '/admin/services',
                  },
                  {
                    id: 'admin-forms',
                    label: 'Forms',
                    image: '/images/sidebar/forms.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/admin/forms`
                      : '/admin/forms',
                  },
                  {
                    id: 'admin-automations',
                    label: 'Automations',
                    image: '/images/sidebar/automations.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/admin/automations`
                      : '/admin/automations',
                  },
                  {
                    id: 'admin-files',
                    label: 'Files',
                    image: '/images/sidebar/files.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/admin/files`
                      : '/admin/files',
                  },
                  {
                    id: 'admin-settings',
                    label: 'Settings',
                    image: '/images/sidebar/settings.svg',
                    href: activeWorkspace
                      ? `/${activeWorkspace.id}/admin/settings`
                      : '/admin/settings',
                  },
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
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-medium tracking-wide text-[#75777C] uppercase">
                      Boards
                    </span>
                    <button
                      onClick={() => setIsAddBoardModalOpen(!!activeWorkspace)}
                      className="cursor-pointer rounded hover:bg-gray-100"
                    >
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
                  <RenderNavItems
                    items={boardNav}
                    isBoard
                    onBoardAction={handleBoardAction}
                  />
                </div>
              </SidebarGroup>
            )}

            {/* -------------------- SOCIALS ------------------------------ */}
            {isClient && (
              <SidebarGroup>
                <SidebarGroupLabel>
                  <div className="flex w-full cursor-pointer items-center justify-between">
                    <div
                      className="flex items-center gap-1.5 text-[#75777C]"
                      onClick={() => setSocialOpen((o) => !o)}
                    >
                      {socialOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="text-xs font-medium tracking-wide uppercase">
                        Socials
                      </span>
                    </div>
                    <button
                      onClick={() => setIsManageSocialsOpen(true)}
                      className="cursor-pointer rounded hover:bg-gray-100"
                    >
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
        icon={colorIconTarget?.image as string}
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
