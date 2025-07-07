/* components/layout/app-sidebar.tsx */
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

/* --------------------------------------------------------------------- */
/*  NAV CONFIGS (static for now – you can pull these from the store)     */
/* --------------------------------------------------------------------- */

const defaultPlatformNav: NavLink[] = [
  {
    id: "notifications",
    label: "Notifications",
    image: "/images/sidebar/notifications-on.svg",
    href: "/notifications",
  },
  {
    id: "approvals",
    label: "Approvals",
    image: "/images/sidebar/approvals.svg",
    href: "/approvals",
  },
  {
    id: "brands",
    label: "Brands",
    image: "/images/sidebar/brands.svg",
    href: "/brands",
  },
  {
    id: "analytics",
    label: "Analytics",
    image: "/images/sidebar/analytics.svg",
    href: "/analytics",
  },
  {
    id: "settings",
    label: "Settings",
    image: "/images/sidebar/settings.svg",
    href: "/settings",
  },
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

const boardFormatMap: Record<string, string[]> = {
  "static-posts": ["static-image", "carousel"],
  "short-form-videos": ["video"],
  "email-design": ["story"],
};

function useBoardCount(boardId: string): number | null {
  const count = useFeedbirdStore((s) => {
    const posts = s.getActivePosts();
    const formats = boardFormatMap[boardId] ?? [];
    return posts.filter((p) => formats.includes(p.format)).length;
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          /* visible only when THIS row is hovered (group/row) */
          className="opacity-0 group-hover/row:opacity-100 data-[state=open]:opacity-100 transition-opacity
                     p-1 hover:bg-[#EAEBEC] rounded cursor-pointer
                     focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4 text-[#5C5E63]" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40 flex flex-col p-[4px] rounded-[6px] border border-[1px] border-[#EAECF0] bg-white"
        style={{
          boxShadow: "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
        }}>
        {menu.map(({ id, label, icon }) => (
          <React.Fragment key={id}>
            {id === "delete" && <DropdownMenuSeparator className="mx-auto w-[132px]" />}
            <DropdownMenuItem
              onClick={(e) => {e.stopPropagation(); onAction(id, item)}}
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

const BoardCount = ({ boardId, variant = 'expanded' }: { boardId: string; variant?: 'expanded' | 'collapsed' }) => {
  const count = useBoardCount(boardId);

  const styles = {
    expanded: "text-xs text-[#5C5E63] flex justify-center items-center w-4 h-4 p-[3px]",
    collapsed: "text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded ml-1"
  };

  if (count === null) {
    return null;
  }

  return (
    <span className={styles[variant]}>
      {count}
    </span>
  );
};

/* -------- main component -------------------------------------------- */

export const RenderNavItems = React.memo(function RenderNavItems({
  items,
  isBoard = false,
}: {
  items: NavLink[];
  isBoard?: boolean;
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleBoardAction = React.useCallback((action: string, item: NavLink) => {
    alert(`${action} → ${item.label}`); // replace with real logic
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarMenu>
        {items.map((nav) => {
          const active = nav.href && pathname.startsWith(nav.href);

          /* ----------------------------------------------------------- */
          /*  ICON SELECTION                                            */
          /*  For board items, swap in a "-selected" icon when active   */
          /* ----------------------------------------------------------- */
          let imageSrc = nav.image;
          if (isBoard && nav.image) {
            if (active) {
              // Insert "-selected" before the .svg extension
              imageSrc = nav.image.replace(/\.svg$/, "-selected.svg");
            }
          }

          const RowContent = (
            <SidebarMenuButton
              asChild
              className={cn(
                active && "bg-[#D7E9FF]",
                "group/row gap-[6px] p-[6px] text-black text-sm font-semibold",
                "cursor-pointer focus:outline-none",
                "hover:bg-[#F4F5F6]"
              )}
            >
              {nav.href ? (
                <LoadingLink
                  href={nav.href}
                  className="flex items-center gap-[6px] w-full"
                  loadingText={`Loading ${nav.label}…`}
                >
                  {imageSrc && (
                    <img
                      src={imageSrc}
                      alt={nav.label}
                      className="w-[18px] h-[18px]"
                      loading="lazy"
                    />
                  )}
                  <span className="flex-1 truncate">{nav.label}</span>

                  {isBoard && (
                    <div className="flex items-center gap-1 ml-auto">
                      <BoardDropdownMenu
                        item={nav}
                        onAction={handleBoardAction}
                      />
                      <BoardCount boardId={nav.id} />
                    </div>
                  )}
                </LoadingLink>
              ) : (
                <button
                  onClick={nav.onClick}
                  className="flex items-center gap-[6px] w-full text-left cursor-pointer focus:outline-none"
                >
                  {imageSrc && (
                    <img
                      src={imageSrc}
                      alt={nav.label}
                      className={`${isBoard ? "w-[18px] h-[18px]" : "w-[16px] h-[16px]"}`}
                      loading="lazy"
                    />
                  )}
                  <span className="flex-1">{nav.label}</span>
                </button>
              )}
            </SidebarMenuButton>
          );

          return (
            <SidebarMenuItem key={nav.id} className={isBoard ? "group/row" : undefined}>
              {!isClient || state !== 'collapsed' ? (
                RowContent
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>{RowContent}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2 bg-popover text-popover-foreground shadow-md [&>svg]:hidden [&>div]:hidden">
                    {imageSrc && (
                      <img src={imageSrc} alt={nav.label} className="w-4 h-4" />
                    )}
                    <span className="text-sm font-semibold">{nav.label}</span>
                    {isBoard && <BoardCount boardId={nav.id} variant="collapsed" />}
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

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const platformNav = React.useMemo(() => defaultPlatformNav, []);
  const boardNav    = React.useMemo(() => defaultBoardNav, []);

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

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border-primary text-foreground gap-2 w-[260px] bg-[#FBFBFB]"
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
          <SidebarGroupLabel>
            <div className="flex items-center justify-between w-full cursor-pointer pr-1.5">
              <div
                className="flex items-center text-[#75777C] gap-1.5"
                onClick={() => setBoardsOpen((o) => !o)}
              >
                {boardsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="text-[10px] font-semibold tracking-wide">BOARDS</span>
              </div>
              <button onClick={() => alert("Add board")} className="p-1 hover:bg-gray-100 rounded">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </SidebarGroupLabel>

          {boardsOpen && (
            <div className="mt-1">
              <RenderNavItems items={boardNav} isBoard />
            </div>
          )}
        </SidebarGroup>
        )}

        {/* -------------------- SOCIALS ------------------------------ */}
        {isClient && (
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center justify-between w-full cursor-pointer pr-1.5">
              <div
                className="flex items-center text-[#75777C] gap-1.5"
                onClick={() => setSocialOpen((o) => !o)}
              >
                {socialOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="text-[10px] font-semibold tracking-wide">SOCIALS</span>
              </div>
              <button onClick={() => alert("Add social")} className="p-1 hover:bg-gray-100 rounded">
                <Plus className="w-4 h-4" />
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
      </SidebarContent>

      <SidebarFooter>{/* Optional footer items */}</SidebarFooter>
    </Sidebar>
  );
}
