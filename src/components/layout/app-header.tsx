/* components/layout/app-header.tsx */
'use client'

import { Suspense, useState, useEffect, useMemo } from 'react'
import Image                  from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'

// removed board popover & related UI
import { SidebarTrigger }     from '@/components/ui/sidebar'
import { Button }             from '@/components/ui/button'
import BrandSwitcher          from '@/components/brand/brand-switcher'
import BrandSocialIcons       from '@/components/brand/brand-social-icons'
import NotificationBell       from '@/components/notifications/notification-bell'
import BrandKitDrawer         from '@/components/brand/brand-kit-drawer'
import BrandDialog            from '@/components/brand/brand-dialog'
import BrandDetailsSidebar    from '@/components/brand/brand-details-sidebar'
import UploadTray from "@/components/layout/upload-tray";
import { AddBoardModal } from '@/components/board/add-board-modal'
import { BoardRulesModal } from '@/components/board/board-rules-modal'

import { useFeedbirdStore }   from '@/lib/store/use-feedbird-store'
import Link                   from 'next/link'
import { cn, truncateText }   from '@/lib/utils'

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
  const activeBoard   = boardNav.find(b => b.href && (
    // For workspace-scoped routes, check if the pathname contains the route
    b.href.includes('/content/') ? pathname.includes(b.href.split('/').pop() || '') :
    // For other routes, check if pathname starts with the href
    pathname.startsWith(b.href)
  ))
  const brand         = useFeedbirdStore(s => s.getActiveBrand())
  const activeWorkspace = useFeedbirdStore(s => s.getActiveWorkspace())
  
  // Client-side hydration state
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  /* ------------------------------------------------------------ */
  const [drawer, setDrawer] = useState(false)
  const [isAddBoardModalOpen, setIsAddBoardModalOpen] = useState(false)
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false)
  const [pendingBoardData, setPendingBoardData] = useState<{
    name: string;
    description: string;
    icon: string | undefined;
    color: string | undefined;
    rules?: any;
  } | null>(null)
  const [brandDialogOpen, setBrandDialogOpen] = useState(false)
  const [brandDetailsSidebarOpen, setBrandDetailsSidebarOpen] = useState(false)
  const [brandEditDialogOpen, setBrandEditDialogOpen] = useState(false)
  
  // current board data for modal prefill
  const currentBoard = useMemo(() => {
    if (!activeWorkspace || !activeBoard?.id) return undefined
    return activeWorkspace.boards.find(b => b.id === activeBoard.id)
  }, [activeWorkspace, activeBoard?.id])
  const updateBoard = useFeedbirdStore(s => s.updateBoard)
  const addBoard = useFeedbirdStore(s => s.addBoard)

  /* view switcher (table | calendar | grid) --------------------------- */
  const inContent = pathname.includes('/content/')
                 || pathname.includes('/approvals')
  const view      = searchParams.get('view') === 'calendar' ? 'calendar' : 
                   searchParams.get('view') === 'grid' ? 'grid' : 'table'
  const setView   = (v:'table'|'calendar'|'grid') => {
    const p = new URLSearchParams(searchParams)
    p.set('view', v)
    router.replace(`${pathname}?${p.toString()}`)
  }

  // no-op handlers removed

  /* ------------------------------------------------------------ */
  return (
    <header className="relative
      h-[48px] flex justify-center border-b border-border-primary pl-4 pr-2.5 py-2.5 gap-4 bg-white
    ">
      {/* sidebar trigger */}
      <SidebarTrigger className="cursor-pointer shrink-0" />

      {/* board name → open AddBoardModal prefilled */}
        <button
          className="flex items-center gap-2 rounded text-sm font-semibold focus:outline-none cursor-pointer text-black"
          onClick={() => setIsAddBoardModalOpen(true)}
        >
          {activeBoard?.image && (
            <div
              className={cn(
                "w-6 h-6 rounded flex items-center justify-center",
                activeBoard?.color ? "" : "bg-transparent"
              )}
              style={activeBoard?.color ? { backgroundColor: activeBoard.color } : undefined}
            >
              <img
                src={activeBoard?.image}
                alt={activeBoard?.label}
                className={cn(
                  "w-4 h-4",
                  activeBoard?.color && "filter brightness-0 invert"
                )}
                loading="lazy"
              />
            </div>
          )}
          <span className="font-semibold text-lg tracking-[-0.6px] truncate max-w-[200px]">
            {activeBoard?.label ?? 'Select board'}
          </span>
        </button>

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
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center border border-border-button rounded-[4px]">
          {/* <BrandSwitcher /> */}
          {activeWorkspace?.logo ? (
            <img
              src={activeWorkspace.logo}
              alt={activeWorkspace.name}
              className="w-8 h-8 rounded-[4px] object-cover"
            />
          ) : (
            <span className="text-sm font-medium w-8 h-8 bg-[#B5B5FF] text-[#43439F] flex items-center justify-center rounded-[4px]">
              {activeWorkspace?.name?.charAt(0)?.toUpperCase() || 'W'}
            </span>
          )}
          {isClient && activeWorkspace ? (
            brand ? (
              <>
                <span 
                  className="text-sm font-medium text-black px-[8px] py-[5px] cursor-pointer hover:text-primary"
                  onClick={() => setBrandDetailsSidebarOpen(true)}
                >
                  {truncateText(brand.name, 10)}
                </span>
                <div className="w-0 h-2.5 outline outline-1 outline-offset-[-0.50px] outline-gray-100"></div>
                <BrandSocialIcons />
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="px-[8px] py-[5px] cursor-pointer"
                onClick={() => setBrandDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )
          ) : null}
        </div>
        <Button variant="ghost" size="sm" className="rounded-[6px] bg-main hover:bg-main/80 text-white hover:text-white px-[8px] py-[7px] gap-[4px] cursor-pointer text-sm font-medium">
          <Image src="/images/header/user-plus.svg" alt="Share" width={16} height={16} />
          Share
        </Button>
      </div>

      {/* centered upload progress */}

      <BrandKitDrawer open={drawer} onOpenChange={setDrawer} />
      <BrandDialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen} />
      <BrandDetailsSidebar 
        open={brandDetailsSidebarOpen} 
        onOpenChange={setBrandDetailsSidebarOpen}
        onEditClick={() => {
          setBrandDetailsSidebarOpen(false)
          setBrandEditDialogOpen(true)
        }}
      />
      <BrandDialog 
        open={brandEditDialogOpen} 
        onOpenChange={setBrandEditDialogOpen}
        mode="edit"
      />

      {/* AddBoardModal for editing current board meta or creating new board */}
      <AddBoardModal
        isOpen={isAddBoardModalOpen}
        onClose={() => setIsAddBoardModalOpen(false)}
        pendingBoardData={currentBoard ? {
          name: currentBoard.name,
          description: currentBoard.description ?? '',
          icon: currentBoard.image,
          color: currentBoard.color,
          rules: currentBoard.rules,
        } : undefined}
        onBoardDataReady={(data) => {
          setPendingBoardData(data)
          setIsAddBoardModalOpen(false)
          setIsRulesModalOpen(true)
        }}
        onUseTemplate={async (data) => {
          if (currentBoard) {
            // Update existing board with template data
            updateBoard(currentBoard.id, {
              name: data.name,
              description: data.description,
              image: data.icon,
              color: data.color,
              rules: data.rules,
            })
          } else {
            // Create new board using template data
            try {
              await addBoard(
                data.name,
                data.description,
                data.icon,
                data.color,
                data.rules
              )
            } catch (error) {
              console.error('Failed to create board from template:', error)
              // TODO: Add user-friendly error handling/toast notification
            }
          }
          setIsAddBoardModalOpen(false)
        }}
      />

      {isRulesModalOpen && (
        <BoardRulesModal
          isOpen={isRulesModalOpen}
          onClose={() => setIsRulesModalOpen(false)}
          onBack={() => {
            setIsRulesModalOpen(false)
            setIsAddBoardModalOpen(true)
          }}
          onSave={async (rules) => {
            if (pendingBoardData) {
              if (currentBoard) {
                // Update existing board
                updateBoard(currentBoard.id, {
                  name: pendingBoardData.name,
                  description: pendingBoardData.description,
                  image: pendingBoardData.icon,
                  color: pendingBoardData.color,
                  rules,
                })
              } else {
                // Create new board
                try {
                  await addBoard(
                    pendingBoardData.name,
                    pendingBoardData.description,
                    pendingBoardData.icon,
                    pendingBoardData.color,
                    rules
                  )
                } catch (error) {
                  console.error('Failed to create board:', error)
                  // TODO: Add user-friendly error handling/toast notification
                }
              }
            } else if (currentBoard) {
              // Update existing board with only rules
              updateBoard(currentBoard.id, { rules })
            }
            setPendingBoardData(null)
            setIsRulesModalOpen(false)
          }}
          initialRules={currentBoard?.rules}
          primaryLabel="Save"
        />
      )}
      {/* Global bottom-right upload tray */}
      <UploadTray />
    </header>
  )
}
