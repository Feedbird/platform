'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { DynamicTitle } from '@/components/layout/dynamic-title'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, formatTimeAgo } from '@/lib/utils'
import Image from 'next/image'

import {
    ChevronDown,
    ChevronLeft,
    Plus,
    MessageSquare,
    Filter,
    Search,
    X,
    Smile,
} from 'lucide-react'

import MessagesPane from '@/components/messages/messages-pane'
import NotificationsPane from '@/components/messages/notifications-pane'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getFullnameinitial } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { workspaceHelperApi } from '@/lib/api/api-service'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { IconAndColorPicker } from '@/components/board/icon-and-color-picker'
import { useMessageStore, useWorkspaceStore } from '@/lib/store'
import { WorkspaceStore } from '@/lib/store/workspace-store'
import { MessageStore } from '@/lib/store/message-store'
import { Workspace } from '@/lib/store/types'

type Tab = 'messages' | 'notifications'

type Channel = {
    id: string
    name: string
    description: string
    createdAt: Date
    icon?: string
    color?: string
}

const EMPTY_CHANNELS: any[] = []

export default function MessagesPage() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const addChannel = useMessageStore((s: MessageStore) => s.addChannel)
    const activeWorkspaceId = useWorkspaceStore((s: WorkspaceStore) => s.activeWorkspaceId)
    

    const [leftPaneMode, setLeftPaneMode] = useState<'sidebar' | 'create' | 'members'>('sidebar')
    const [newIcon, setNewIcon] = useState<string>('')
    const [newIconColor, setNewIconColor] = useState<string>('#FFFFFF')
    const [newName, setNewName] = useState<string>('')
    const [newDescription, setNewDescription] = useState<string>('')
    const [allMemberEmails, setAllMemberEmails] = useState<string[]>([])
    const [memberProfiles, setMemberProfiles] = useState<Record<string, { first_name?: string; image_url?: string }>>({})
    const [selectedMemberEmails, setSelectedMemberEmails] = useState<string[]>([])
    const [iconPickerOpen, setIconPickerOpen] = useState(false)

    // Workspace members loaded on first load (or when workspace changes)
    const [workspaceUsers, setWorkspaceUsers] = useState<{ email: string; first_name?: string; image_url?: string }[]>([])
    const [workspaceCreatorEmail, setWorkspaceCreatorEmail] = useState<string | undefined>(undefined)
    useEffect(() => {
        if (!activeWorkspaceId) return
        ;(async () => {
            try {
                const res = await workspaceHelperApi.getWorkspaceMembers(activeWorkspaceId)
                setWorkspaceUsers(res.users || [])
                setWorkspaceCreatorEmail((res as any).creator_email)
            } catch (e) {
                setWorkspaceUsers([])
                setWorkspaceCreatorEmail(undefined)
            }
        })()
    }, [activeWorkspaceId])

    useEffect(() => {
        if (leftPaneMode !== 'members') return
        const users = workspaceUsers || []
        const emails = users.map(u => u.email)
        const profiles: Record<string, { first_name?: string; image_url?: string }> = {}
        for (const u of users) {
            profiles[u.email] = { first_name: u.first_name, image_url: u.image_url }
        }
        setAllMemberEmails(emails)
        setMemberProfiles(profiles)
    }, [leftPaneMode, workspaceUsers])

    const resetChannelWizard = () => {
        setNewIcon('')
        setNewIconColor('#FFFFFF')
        setNewName('')
        setNewDescription('')
        setAllMemberEmails([])
        setSelectedMemberEmails([])
    }

    const getDisplayName = (email: string) => memberProfiles[email]?.first_name || email

    const toggleSelected = (email: string) => {
        setSelectedMemberEmails((prev) =>
            prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
        )
    }

    const removeSelected = (email: string) => {
        setSelectedMemberEmails((prev) => prev.filter((e) => e !== email))
    }

    const handleCreateChannel = async () => {
        if (!newName.trim()) return
        try {
            const channelId = await addChannel(newName.trim(), newDescription.trim() || undefined, newIcon.trim() || undefined, selectedMemberEmails, newIconColor)
            // Navigate to newly created channel
            if (channelId) setChannel(channelId)
            setLeftPaneMode('sidebar')
            resetChannelWizard()
        } catch (err) {
            // swallow; could add toast
        }
    }

    const tab: Tab = searchParams.get('tab') === 'notifications' ? 'notifications' : 'messages'
    const setTab = (next: Tab) => {
        const p = new URLSearchParams(searchParams)
        p.set('tab', next)
        router.replace(`${pathname}?${p.toString()}`)
    }

    // Persist selected channel in the URL (e.g., ?channel=chan-1)
    const selectedChannelId = searchParams.get('channel') ?? 'all'
    const setChannel = (next: string) => {
        const p = new URLSearchParams(searchParams)
        p.set('channel', next)
        router.replace(`${pathname}?${p.toString()}`)
    }

    const rawChannels = useWorkspaceStore((s: WorkspaceStore) => {
        const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId)
        return (ws as Workspace)?.channels ?? EMPTY_CHANNELS
    }) as any[]
    const channels: Channel[] = useMemo(() => {
        return (rawChannels || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description || '',
            createdAt: c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt),
            icon: c.icon,
            color: c.color,
        }))
    }, [rawChannels])

    const selectedChannel = useMemo<Channel>(() => {
        if (selectedChannelId === 'all') {
            return {
                id: 'all',
                name: 'All Messages',
                description: 'All messages from every channel will appear in this chat.',
                createdAt: new Date(),
            }
        }
        const found = channels.find(c => c.id === selectedChannelId)
        return (
            found ?? {
                id: selectedChannelId,
                name: selectedChannelId,
                description: 'Channel details are not available.',
                createdAt: new Date(),
            }
        )
    }, [channels, selectedChannelId])

    // Build members list for message panel based on selection
    const membersForPanel = useMemo(() => {
        // All messages: show all workspace users
        if (selectedChannelId === 'all') {
            return (workspaceUsers || []).map((u) => ({
                email: u.email,
                name: u.first_name || u.email,
                role: u.email === workspaceCreatorEmail ? 'admin' : 'member',
                imageUrl: u.image_url,
            }))
        }
        // Specific channel: filter users by channel.members
        const raw = rawChannels.find((c: any) => c.id === selectedChannelId)
        const channelMembers: string[] = Array.isArray(raw?.members) ? raw.members as string[] : []
        if (!channelMembers.length) return []
        const byEmail = new Map((workspaceUsers || []).map(u => [u.email, u]))
        const list = channelMembers.map((email) => {
            const u = byEmail.get(email)
            return {
                email,
                name: u?.first_name || email,
                role: email === workspaceCreatorEmail ? 'admin' : 'member',
                imageUrl: u?.image_url,
            }
        })
        return list
    }, [selectedChannelId, rawChannels, workspaceUsers])

    return (
        <>
            <DynamicTitle />
            <Suspense fallback={null}>
                <div className="flex w-full h-full bg-[#FAFAFA]">
                    {/* Left Sidebar (channels) or create flow */}
                    <div className="flex flex-col shrink-0 border-r border-border-primary bg-white">
                        {leftPaneMode === 'sidebar' && (
                            <>
                                {/* Topbar */}
                                <div className="flex items-center justify-between px-4 py-2">
                                    <div className="flex items-center gap-2">
                                        <SidebarTrigger className="cursor-pointer shrink-0" />
                                        <span className="text-base font-semibold text-black">Messages</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Button variant="ghost" size="icon" className="size-7">
                                            <Image
                                                src="/images/icons/table-toolbar-filter.svg"
                                                alt="Filter"
                                                width={18}
                                                height={18}
                                            />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="size-7">
                                            <Image
                                                src="/images/icons/search.svg"
                                                alt="Filter"
                                                width={18}
                                                height={18}
                                            />
                                        </Button>
                                    </div>
                                </div>

                                {/* View switcher */}
                                <div className="px-3 py-0.5 mb-2">
                                    <div className="flex items-center gap-[4px] p-[2px] bg-[#F4F5F6] rounded-[6px] h-full">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setTab('messages')}
                                            className={cn(
                                                'px-[8px] text-black rounded-[6px] font-medium text-sm h-[24px] w-[130px] cursor-pointer',
                                                tab === 'messages'
                                                    ? 'bg-white shadow'
                                                    : ''
                                            )}
                                        >
                                            Messages
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setTab('notifications')}
                                            className={cn(
                                                'px-[8px] text-black rounded-[6px] font-medium text-sm h-[24px] w-[130px] cursor-pointer',
                                                tab === 'notifications'
                                                    ? 'bg-white shadow'
                                                    : ''
                                            )}
                                        >
                                            Notifications
                                        </Button>
                                    </div>
                                </div>

                                {/* Channels header */}
                                <div className="flex items-center justify-between px-3">
                                    <div className="flex items-center gap-1.5 text-gray-700">
                                        <ChevronDown className="w-4 h-4" />
                                        <span className="text-xs font-medium tracking-wide">Channels</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="size-7" onClick={() => setLeftPaneMode('create')}>
                                        <Image
                                            src={`/images/sidebar/plus.svg`}
                                            alt="board plus"
                                            width={18}
                                            height={18}
                                        />
                                    </Button>
                                </div>

                                {/* Channel list */}
                                <div className="flex-1 overflow-auto">
                                    <div className="py-1 px-2">
                                        <button
                                            key={'all'}
                                            onClick={() => setChannel('all')}
                                            className={cn(
                                                'w-full flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-gray-50',
                                                selectedChannelId === 'all' && 'bg-gray-50'
                                            )}
                                        >
                                            <div 
                                                className={cn(
                                                    "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                                                )}
                                                style={selectedChannelId === 'all' ? { backgroundColor: "#125AFF" } : undefined}
                                            >
                                                <img
                                                    src="/images/icons/messages.svg"
                                                    alt={'all'}
                                                    className={cn(
                                                    "w-3.5 h-3.5",
                                                    selectedChannelId === 'all' && "filter brightness-0 invert"
                                                    )}
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 flex items-center justify-between">
                                                <span className="text-sm text-black truncate">All Messages</span>
                                                <span className="text-xs text-grey whitespace-nowrap ml-2">
                                                    {formatTimeAgo(new Date(Date.now() - 1000 * 60 * 5))}
                                                </span>
                                            </div>
                                        </button>
                                        <div className="pl-7">
                                            {channels.map((c) => {
                                                const active = selectedChannelId === c.id
                                                return (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => setChannel(c.id)}
                                                        className={cn(
                                                            'w-full flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-gray-50',
                                                            active && 'bg-gray-50'
                                                        )}
                                                    >
                                                        <div 
                                                            className={cn(
                                                                "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                                                            )}
                                                            style={active && c.color ? { backgroundColor: c.color } : undefined}
                                                        >
                                                            <img
                                                                src={c.icon || '/images/boards/icons/icon-2.svg'}
                                                                alt={c.name}
                                                                className={cn(
                                                                    "w-3.5 h-3.5",
                                                                    active && c.color && "filter brightness-0 invert"
                                                                )}
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex items-center justify-between">
                                                            <span className="text-sm text-black truncate">{c.name}</span>
                                                            <span className="text-xs text-grey whitespace-nowrap ml-2">
                                                                {formatTimeAgo(c.createdAt)}
                                                            </span>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {leftPaneMode === 'create' && (
                            <div className="flex flex-col h-full">
                                {/* Title bar */}
                                <div className="flex items-center gap-2 px-3 py-2">
                                    <Button variant="ghost" size="icon" className="size-7" onClick={() => { setLeftPaneMode('sidebar'); resetChannelWizard() }}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-base font-semibold text-black">New Channel</span>
                                </div>

                                {/* Form styled like add-board-modal */}
                                <div className="p-4 space-y-4">
                                    {/* Icon only */}
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm font-medium text-black">Icon</p>
                                        <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                                            <PopoverTrigger asChild>
                                                <button
                                                    className="focus:outline-none rounded-[6px] flex items-center justify-center w-9 h-9 hover:bg-gray-50 transition-colors cursor-pointer"
                                                    style={{ boxShadow: '0px 1px 2px -1px rgba(7,10,22,0.02)', border: '1px solid #D3D3D3', background: '#FFFFFF' }}
                                                >
                                                    {newIcon ? (
                                                        <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: newIconColor || 'transparent' }}>
                                                            <img src={newIcon} alt="Channel Icon" className={cn('w-3.5 h-3.5 m-0.5 transition-all', newIconColor && newIconColor !== '#FFFFFF' && 'filter brightness-0 invert')} />
                                                        </div>
                                                    ) : (
                                                        <Smile className="w-4 h-4 text-black" />
                                                    )}
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-0 w-60" side="right" align="center">
                                                <IconAndColorPicker
                                                    selectedIcon={newIcon || undefined}
                                                    onSelectIcon={setNewIcon}
                                                    selectedColor={newIconColor}
                                                    onSelectColor={setNewIconColor}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Name only */}
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm font-medium text-black">Name</p>
                                        <Input
                                            placeholder="e.g. General, Marketing, Design"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="px-3 py-2 flex gap-2 rounded-[6px] border border-[#D3D3D3] text-black font-medium text-sm placeholder:text-[#5C5E63]"
                                            style={{ boxShadow: '0px 1px 2px -1px rgba(7,10,22,0.02)' }}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm font-medium text-black">Description <span className="font-normal text-[#838488]">(Optional)</span></p>
                                        <Textarea
                                            placeholder=""
                                            value={newDescription}
                                            onChange={(e) => setNewDescription(e.target.value)}
                                            className="px-3 py-2 gap-2 rounded-[6px] border border-[#D3D3D3] text-black font-medium text-sm placeholder:text-[#5C5E63] w-[260px] max-h-[200px]"
                                            style={{ boxShadow: '0px 1px 2px -1px rgba(7,10,22,0.02)' }}
                                        />
                                    </div>
                                </div>

                                {/* Continue button */}
                                <div className="mt-auto px-4 pb-6">
                                    <Button className="w-[260px] h-7.5 rounded-md bg-main text-white font-medium text-sm" disabled={!newName.trim()} onClick={() => setLeftPaneMode('members')}>Continue</Button>
                                </div>
                            </div>
                        )}

                        {leftPaneMode === 'members' && (
                            <div className="flex flex-col h-full">
                                {/* Title bar */}
                                <div className="flex items-center gap-2 px-3 py-2">
                                    <Button variant="ghost" size="icon" className="size-7" onClick={() => setLeftPaneMode('create')}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-base font-semibold text-black">Add Members</span>
                                </div>

                                {/* Multi input (chips) */}
                                <div className="p-4">
                                    <div className="h-15 w-[260px] border rounded-md px-2 py-1.5 flex flex-wrap gap-1 overflow-y-auto overflow-x-hidden">
                                        {selectedMemberEmails.map((email) => (
                                            <div key={email} className="flex items-center h-5 gap-1 px-[3px] rounded-full bg-[#F4F5F6]">
                                                <Avatar className="w-3.5 h-3.5">
                                                    <AvatarImage src={memberProfiles[email]?.image_url} alt={email} />
                                                    <AvatarFallback className="text-[9px]">{getFullnameinitial(undefined, undefined, getDisplayName(email))}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-black max-w-[120px] truncate">{getDisplayName(email)}</span>
                                                <button onClick={() => removeSelected(email)} className="text-grey hover:text-black">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Members list */}
                                <div className="px-4 pb-2 text-xs text-grey">{selectedMemberEmails.length} Selected</div>
                                <ScrollArea className="flex-1">
                                    <div className="px-4 pb-3 space-y-2">
                                        {allMemberEmails.map((email) => {
                                            const checked = selectedMemberEmails.includes(email)
                                            return (
                                                <div key={email} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Avatar className="w-6 h-6">
                                                            <AvatarImage src={memberProfiles[email]?.image_url} alt={email} />
                                                            <AvatarFallback className="text-[10px] font-medium">{getFullnameinitial(undefined, undefined, getDisplayName(email))}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="text-xs text-black font-medium truncate">{getDisplayName(email)}</div>
                                                    </div>
                                                    <Checkbox checked={checked} onCheckedChange={() => toggleSelected(email)} />
                                                </div>
                                            )
                                        })}
                                        {allMemberEmails.length === 0 && (
                                            <div className="text-xs text-grey">No members found.</div>
                                        )}
                                    </div>
                                </ScrollArea>

                                {/* Continue button */}
                                <div className="mt-auto px-4 pb-6">
                                    <Button className="w-[260px] h-7.5 rounded-md bg-main text-white font-medium text-sm" onClick={handleCreateChannel} disabled={!newName.trim()}>Continue</Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main content area */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                        {tab === 'notifications' ? (
                            <NotificationsPane />
                        ) : (
                            <MessagesPane channelName={selectedChannel.name} channelDescription={selectedChannel.description} members={membersForPanel} />
                        )}
                    </div>
                </div>
            </Suspense>
        </>
    )
}
