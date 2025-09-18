/* components/workspace/workspace-switcher.tsx */
'use client'

import * as React from 'react'
import Image from 'next/image'
import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  ChevronsUpDown,
  Check,
  Trash2,
  Plus,
  UserPlus,
  Settings,
  Search,
  LogOut,
} from 'lucide-react'
import { toast } from 'sonner'
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store'
import { useLoading } from '@/lib/providers/loading-provider'
import { useClerk } from '@clerk/nextjs'
import { WorkspaceModal } from '@/components/workspace/workspace-modal'
import { InviteMembersModal } from '@/components/workspace/invite-members-modal'
import { useMounted } from '@/hooks/use-mounted'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner"
import { useUser } from '@clerk/nextjs';

import { storeApi, inviteApi, userApi } from '@/lib/api/api-service'

export default function WorkspaceSwitcher() {
  const isMounted = useMounted()
  const { signOut } = useClerk()
  const router = useRouter()
  
  /* -------- store -------- */
  const workspaces     = useFeedbirdStore(s => s.workspaces)
  const activeId       = useFeedbirdStore(s => s.activeWorkspaceId)
  const addWorkspace   = useFeedbirdStore(s => s.addWorkspace)
  const addBrand       = useFeedbirdStore(s => s.addBrand)
  const removeWs       = useFeedbirdStore(s => s.removeWorkspace)
  const setActive      = useFeedbirdStore(s => s.setActiveWorkspace)
  const clearUser      = useFeedbirdStore(s => s.clearUser)
  const user           = useFeedbirdStore(s => s.user)
  const active         = workspaces.find(w => w.id === activeId)

  const { show, hide } = useLoading()
  const { isMobile }   = useSidebar() // still available if you need it

  /* -------- local state -------- */
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  const [search,     setSearch]     = useState('')

  const filtered = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(search.toLowerCase())
  )

  /* -------- helpers -------- */

  const select = (id: string) => {
    show()
    startTransition(() => {
      setActive(id)
      // Navigate to the new workspace URL
      const currentPath = window.location.pathname
      let newPath = `/${id}`
      
      // If we're on a content route, preserve the board ID
      if (currentPath.includes('/content/')) {
        const pathParts = currentPath.split('/')
        const contentIndex = pathParts.findIndex(part => part === 'content')
        if (contentIndex !== -1 && pathParts[contentIndex + 1]) {
          const board_id = pathParts[contentIndex + 1]
          // Check if this board exists in the new workspace
          const newWorkspace = workspaces.find(w => w.id === id)
          if (newWorkspace?.boards.some(b => b.id === board_id)) {
            newPath = `/${id}/content/${board_id}`
          }
        }
      }
      
      // Use router to navigate
      router.push(newPath)
    })
    setTimeout(hide, 600)
  }

  const handleAdd = async (name: string, logo: string | null, additionalData?: {
    selectedBoards: string[]
    boardRules: any
    inviteEmails: string[]
    setAsDefault?: boolean
  }): Promise<string> => {
    const userEmail = user?.email || 'demo@example.com'

    const wsId = await addWorkspace(name, userEmail, logo ?? '')
    // Resolve Clerk organization ID for the newly created workspace
    const orgId = useFeedbirdStore.getState().workspaces.find(w => w.id === wsId)?.clerk_organization_id

    // Handle additional data (boards, rules, invitations)
    if (additionalData) {
      const { selectedBoards, boardRules, inviteEmails, setAsDefault } = additionalData

      // 2) Create boards for selected templates with given rules
      try {
        const store = useFeedbirdStore.getState()
        const templates = store.boardTemplates
        const toCreate = templates.filter(t => selectedBoards.includes(t.id))
        for (const t of toCreate) {
          await (storeApi as any).createBoardAndUpdateStore(
            wsId,
            t.name,
            t.description,
            t.image,
            t.color,
            { ...(t.rules || {}), ...(boardRules || {}) }
          )
        }
      } catch (e) {
        console.error('Failed to create template boards:', e)
      }

      // 3) Send invites (workspace-wide)
      try {
        const emails = (inviteEmails || []).map(e => e.trim()).filter(Boolean)
        if (emails.length) {
          await Promise.all(
            emails.map(email =>
              inviteApi.inviteClient({
                email,
                workspaceId: wsId,
                actorId: user?.id,
                organizationId: orgId,
                first_name: user?.firstName,
              })
            )
          )
        }
      } catch (e) {
        console.error('Failed sending invites:', e)
      }

      // 4) Persist default board rules if requested
      try {
        if (setAsDefault && user?.email) {
          await userApi.updateUser({ email: user.email }, { default_board_rules: boardRules })
          // Update store copy
          useFeedbirdStore.setState(s => ({
            user: s.user ? ({ ...s.user, default_board_rules: boardRules } as any) : s.user
          }))
        }
      } catch (e) {
        console.error('Failed to update default board rules:', e)
      }
    }

    // ensure workspace selected
    select(wsId)

    toast.success(`Workspace "${name}" created`)

    return wsId
  }

  if (!isMounted) {
    return null
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map(word => word[0]!)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  /* -------- render -------- */
  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            {/* trigger ------------------------------------------------ */}
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="
                  w-full select-none
                  flex items-center gap-2
                  group-data-[collapsible=icon]:justify-center
                  group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:mx-auto
                  bg-transparent hover:bg-transparent
                  cursor-pointer
                  focus:outline-none focus:ring-0
                  p-0
                "
              >
                {active?.logo
                  ? <Image src={active.logo} alt={active.name} width={24} height={24}
                           className="rounded object-contain"/>
                  : (
                      <div className="size-8 rounded bg-[#B5B5FF] flex items-center justify-center">
                        <span className="text-xs font-semibold uppercase text-[#5C5E63]">
                          {active?.name ? getInitials(active.name) : ""}
                        </span>
                      </div>
                    )
                }
                <span className="truncate font-semibold text-sm text-black group-data-[collapsible=icon]:hidden">
                  {active?.name ?? (workspaces.length === 0 ? 'No workspaces' : 'Select workspace')}
                </span>
                <ChevronsUpDown className="size-4 text-black group-data-[collapsible=icon]:hidden"/>
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            {/* dropdown --------------------------------------------- */}
            <DropdownMenuContent
              side="bottom"
              align="start"
              sideOffset={4}
              className="min-w-[260px] rounded-[6px] border border-[1px] border-[#D3D3D3] pt-[8px] pb-[0px] px-[0px] bg-white"
              style={{
                boxShadow: "0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)",
              }}
            >
              {/* top actions */}
              <DropdownMenuItem
                onSelect={e => { e.preventDefault(); setMenuOpen(false); setTimeout(() => setInviteOpen(true), 0); }}
                className="flex items-center gap-[6px] px-[12px] py-[8px] cursor-pointer hover:bg-[#F4F5F6] text-sm font-medium text-black"
              >
                <UserPlus className="size-4 text-black"/>
                Invite members
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={e => { e.preventDefault(); toast.info('Workspace settings (coming soon)') }}
                className="flex items-center gap-[6px] px-[12px] py-[8px] cursor-pointer hover:bg-[#F4F5F6] text-sm font-medium text-black"
              >
                <Settings className="size-4 text-black"/>
                Workspace settings
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mt-[8px] my-[0px]"/>

              {/* search */}
              <div className="bg-sidebar">
                <div className="px-[12px] py-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-[#5C5E63]"/>
                    <input
                      type="text"
                      placeholder="Search workspaces"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      onKeyDown={e => e.stopPropagation()}
                      className="
                        w-full pl-8 pr-2 py-[8px] text-sm font-medium rounded-[6px]
                        border border-[#D3D3D3] bg-background text-[#5C5E63]
                        focus:outline-none focus:ring-0
                      "
                    />
                  </div>
                </div>

                {/* label */}
                <DropdownMenuLabel className="px-[12px] py-[8px] text-xs font-medium text-[#75777C]">
                  {filtered.length === 0 ? 'Your Workspaces' : `Workspaces (${filtered.length})`}
                </DropdownMenuLabel>

                {/* show max 3 items then scroll */}
                <div className="max-h-[120px] overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="px-[12px] py-[8px] text-sm text-[#5C5E63]">
                      {search ? 'No workspaces found' : 'No workspaces yet'}
                    </div>
                  ) : (
                    filtered.map(ws => (
                    <DropdownMenuItem
                      key={ws.id}
                      onSelect={e => {
                        if ((e.target as HTMLElement).closest('.delete-workspace')) return
                        select(ws.id)
                      }}
                      className="
                        flex items-center gap-[6px] px-[12px] py-[8px] cursor-pointer hover:bg-[#F4F5F6] text-sm font-semibold text-black
                      "
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {ws.logo
                          ? <Image src={ws.logo} alt={ws.name} width={24} height={24}
                                  className="rounded object-contain flex-shrink-0"/>
                          : (
                              <div className="size-6 rounded bg-[#B5B5FF] flex-shrink-0 flex items-center justify-center">
                                <span className="text-[10px] font-semibold uppercase text-[#5C5E63]">
                                  {getInitials(ws.name)}
                                </span>
                              </div>
                            )
                         }
                        <span className="truncate">{ws.name}</span>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {ws.id === activeId && <Check className="size-4 text-black"/>}

                        {workspaces.length > 1 && (
                          <button
                            className="
                              delete-workspace size-4 text-muted-foreground
                              hover:text-foreground cursor-pointer
                              focus:outline-none
                            "
                            onClick={e => {
                              e.stopPropagation()
                              removeWs(ws.id)
                              toast.success(`Workspace “${ws.name}” deleted`)
                              if (ws.id === activeId) {
                                const fallback = workspaces.find(w => w.id !== ws.id)
                                select(fallback ? fallback.id : '')
                              }
                            }}
                          >
                            <Trash2 className="size-4 text-black"/>
                          </button>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                  )}
                </div>

                {/* create new */}
                <DropdownMenuItem
                  onSelect={e => {
                    e.preventDefault()
                    setMenuOpen(false)
                    setTimeout(() => setDialogOpen(true), 0)
                  }}
                  className="flex items-center gap-[6px] px-[12px] py-[8px] cursor-pointer hover:bg-[#F4F5F6] text-sm font-semibold text-black"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-[24px] h-[24px] flex items-center justify-center p-[5px] rounded border border-[1px] border-[#1C1D1F1D]">
                      <Plus className="size-3.5 text-black"/>
                    </div>
                    Create new workspace
                  </div>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="my-[0px]"/>

              {/* sign out */}
              <DropdownMenuItem
                onSelect={async (e) => { 
                  e.preventDefault();
                  try {
                    clearUser();
                    await signOut({ redirectUrl: '/landing' });
                  } catch (error) {
                    console.error('Sign out error:', error);
                  }
                }}
                className="flex items-center gap-[6px] px-[12px] py-[12px] cursor-pointer hover:bg-[#F4F5F6] text-sm font-semibold text-black"
              >
                <LogOut className="size-3.5 text-black"/>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* modal */}
      <WorkspaceModal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAdd}
      />

      <InviteMembersModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />

    </>
  )
}
