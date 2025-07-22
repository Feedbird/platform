/* components/layout/app-header.tsx */
'use client'

import { Suspense, useState } from 'react'
import Image                  from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronsUpDown,
  Table,
  CalendarDays,
  Plus,
  ChevronDown,
  Edit3,
  Settings,
  FileText,
  Save,
  X,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
} from 'lucide-react'

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SidebarTrigger }     from '@/components/ui/sidebar'
import { Button }             from '@/components/ui/button'
import BrandSwitcher          from '@/components/brand/brand-switcher'
import BrandSocialIcons       from '@/components/brand/brand-social-icons'
import NotificationBell       from '@/components/notifications/notification-bell'
import BrandKitDrawer         from '@/components/brand/brand-kit-drawer'
import UploadProgressInline from "@/components/content/post-table/UploadProgressInline";

import { useFeedbirdStore }   from '@/lib/store/use-feedbird-store'
import Link                   from 'next/link'
import { cn }                 from '@/lib/utils'

export function AppHeader() {
  return (
    <Suspense fallback={<header className="h-12" />}>
      <HeaderInner />
    </Suspense>
  )
}

/* ------------------------------------------------------------------ */

function HeaderInner() {
  const router        = useRouter()
  const pathname      = usePathname()
  const searchParams  = useSearchParams()

  /* boards from centralized store */
  const boardNav      = useFeedbirdStore(s => s.boardNav)
  const activeBoard   = boardNav.find(b => b.href && pathname.startsWith(b.href))
  /* ------------------------------------------------------------ */
  const [drawer, setDrawer] = useState(false)
  const [boardPopoverOpen, setBoardPopoverOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [boardName, setBoardName] = useState(activeBoard?.label || '')
  const [boardDescription, setBoardDescription] = useState('')
  const [guideScript, setGuideScript] = useState('')
  
  // Collapsible states
  const [nameOpen, setNameOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  /* view switcher (table | calendar | grid) --------------------------- */
  const inContent = pathname.startsWith('/content/')
                 || pathname.startsWith('/approvals')
  const view      = searchParams.get('view') === 'calendar' ? 'calendar' : 
                   searchParams.get('view') === 'grid' ? 'grid' : 'table'
  const setView   = (v:'table'|'calendar'|'grid') => {
    const p = new URLSearchParams(searchParams)
    p.set('view', v)
    router.replace(`${pathname}?${p.toString()}`)
  }

  const handleSaveName = () => {
    // TODO: Implement board name save logic
    setEditingName(false)
  }

  const handleCancelEdit = () => {
    setBoardName(activeBoard?.label || '')
    setEditingName(false)
  }

  /* ------------------------------------------------------------ */
  return (
    <header className="relative
      h-[48px] flex justify-center border-b border-border-primary pl-[16px] pr-[10px] py-[9px] gap-4 bg-white
    ">
      {/* sidebar trigger */}
      <SidebarTrigger className="cursor-pointer shrink-0" />

      {/* board popover */}
      {boardNav.length > 0 && (
        <Popover open={boardPopoverOpen} onOpenChange={setBoardPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              className="
                flex items-center gap-2
                rounded
                text-sm font-semibold
                focus:outline-none
                cursor-pointer
                text-black
              "
            >
              {activeBoard?.image && (
                <div 
                  className={cn(
                    "w-6 h-6 rounded flex items-center justify-center",
                    // Apply board color as background to icon container when active
                    activeBoard?.color ? "" : "bg-transparent"
                  )}
                  style={activeBoard?.color ? { backgroundColor: activeBoard.color } : undefined}
                >
                  <img
                    src={activeBoard?.image}  
                    alt={activeBoard?.label}
                    className={cn(
                      "w-4 h-4",
                      // Make icon white when board is active and has a colored background
                      activeBoard?.color && "filter brightness-0 invert"
                    )}
                    loading="lazy"
                  />
                </div>
              )}
              <span className="font-semibold text-lg tracking-[-0.6px]">{activeBoard?.label ?? 'Select board'}</span>
              <ChevronDown className="size-4 opacity-60" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            className="w-80 p-0"
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  {activeBoard?.image && (
                    <Image
                      src={activeBoard.image}
                      alt={activeBoard.label}
                      width={32}
                      height={32}
                      className="shrink-0"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      Board Settings
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Manage your board configuration
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-96 overflow-y-auto">
                {/* Board Name Section */}
                <Collapsible open={nameOpen} onOpenChange={setNameOpen}>
                  <CollapsibleTrigger className="w-full p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Edit3 className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-sm">Board Name</span>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-gray-400 transition-transform",
                        nameOpen && "rotate-180"
                      )} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4">
                      {editingName ? (
                        <div className="space-y-3">
                          <Input
                            value={boardName}
                            onChange={(e) => setBoardName(e.target.value)}
                            placeholder="Enter board name"
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveName}
                              className="flex-1 text-sm font-medium bg-white border border-border-button shadow-none cursor-pointer px-[8px] py-[7px] rounded-[6px]"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="flex-1 text-sm font-medium bg-white border border-border-button shadow-none cursor-pointer px-[8px] py-[7px] rounded-[6px]"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Current name: <span className="font-medium">{activeBoard?.label}</span></p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingName(true)}
                            className="text-sm font-medium bg-white border border-border-button shadow-none cursor-pointer px-[8px] py-[7px] rounded-[6px]"
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Edit Name
                          </Button>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Settings Section */}
                <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <CollapsibleTrigger className="w-full p-4 hover:bg-gray-50 transition-colors border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Settings className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-sm">Settings</span>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-gray-400 transition-transform",
                        settingsOpen && "rotate-180"
                      )} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4">
                      {/* Description */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-2 block">
                          Description
                        </label>
                        <Textarea
                          value={boardDescription}
                          onChange={(e) => setBoardDescription(e.target.value)}
                          placeholder="Add a description for this board..."
                          className="text-sm resize-none"
                          rows={3}
                        />
                      </div>

                      {/* Social Links */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-2 block">
                          Social Links
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-pink-500" />
                            <Input placeholder="Instagram URL" className="text-sm h-8" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Facebook className="h-4 w-4 text-blue-600" />
                            <Input placeholder="Facebook URL" className="text-sm h-8" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4 text-blue-700" />
                            <Input placeholder="LinkedIn URL" className="text-sm h-8" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Youtube className="h-4 w-4 text-red-600" />
                            <Input placeholder="YouTube URL" className="text-sm h-8" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Twitter className="h-4 w-4 text-blue-400" />
                            <Input placeholder="Twitter URL" className="text-sm h-8" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Base Guide Script Section */}
                <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
                  <CollapsibleTrigger className="w-full p-4 hover:bg-gray-50 transition-colors border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-sm">Base Guide Script</span>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-gray-400 transition-transform",
                        guideOpen && "rotate-180"
                      )} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-2 block">
                          Content Guidelines
                        </label>
                        <Textarea
                          value={guideScript}
                          onChange={(e) => setGuideScript(e.target.value)}
                          placeholder="Add your base guide script for content creation..."
                          className="text-sm resize-none"
                          rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This script will be used as a reference for content creators
                        </p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 text-sm font-medium bg-white border border-border-button shadow-none cursor-pointer px-[8px] py-[7px] rounded-[6px]"
                  >
                    Save Changes
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setBoardPopoverOpen(false)}
                    className="text-sm font-medium bg-white border border-border-button shadow-none cursor-pointer px-[8px] py-[7px] rounded-[6px]"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* view-switcher (only on content pages) ------------------ */}
      {inContent && (
        <div className="flex items-center gap-[4px] p-[2px] bg-[#F4F5F6] rounded-[6px] h-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('table')}
            className={cn(
              'px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px] cursor-pointer',
              view === 'table'
                ? 'bg-white shadow'
                : ''
            )}
          >
            <Image src="/images/icons/header-table.svg" alt="Table" width={14} height={14} />
            Table
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('calendar')}
            className={cn(
              'px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px] cursor-pointer',
              view === 'calendar'
                ? 'bg-white shadow'
                : ''
            )}
          >
            <Image src="/images/icons/header-calendar.svg" alt="Calendar" width={14} height={14} />
            Calendar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('grid')}
            className={cn(
              'px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px] cursor-pointer',
              view === 'grid'
                ? 'bg-white shadow'
                : ''
            )}
          >
            <Image src="/images/icons/header-grid.svg" alt="Calendar" width={14} height={14} />
            Grid
          </Button>
        </div>
      )}

      {/* right section ----------------------------------------- */}
      <div className="ml-auto flex items-center gap-[8px]">
        <BrandSwitcher />
        <BrandSocialIcons />
        <Button variant="ghost" size="sm" className="border border-border-button rounded-[6px] text-black px-[8px] py-[7px] gap-[4px] cursor-pointer text-sm font-medium">
          <Image src="/images/header/user-plus.svg" alt="Share" width={16} height={16} />
          Share
        </Button>
      </div>

      {/* centered upload progress */}
      <UploadProgressInline className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" />

      <BrandKitDrawer open={drawer} onOpenChange={setDrawer} />
    </header>
  )
}
