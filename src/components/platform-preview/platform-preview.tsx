'use client'

import * as React from 'react'
import { ChevronRight, ChevronsUpDown, LayoutGrid, CalendarIcon, FolderOpen, GripVertical, Filter, MoreHorizontal, ArrowUpFromLine, ArrowDownToLine } from 'lucide-react'
import { Status } from '@/lib/store/use-feedbird-store'
import { statusConfig } from '@/components/content/shared/content-post-ui'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Image from 'next/image'

function NameBar({
  name,
  className = "h-1.5 bg-backgroundHover rounded-[100px]",
  style = {}
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`w-auto ${className}`}
      style={{
        width: `${name.length * 8}px`, // Approximate width based on character count
        ...style
      }}
    />
  );
}

function StatusChip({
  status,
  widthFull = false,
}: {
  status: Status;
  widthFull?: boolean;
}) {
  const config = statusConfig[status] || {
    icon: "/images/status/draft.svg",
    bgColor: "#F1F4F9",
    borderColor: "rgba(28, 29, 31, 0.05)",
    textColor: "#1C1D1F"
  };

  return (
    <div
      style={{
        display: "inline-flex",
        padding: "2px 6px 2px 3px",
        alignItems: "center",
        gap: "4px",
        width: widthFull ? "100%" : "auto",
        borderRadius: "4px",
        border: `1px solid ${config.borderColor}`,
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
      className="text-xs font-semibold whitespace-nowrap tracking-[-0.24px]"
    >
      <Image
        className='w-[16px] h-[16px]'
        src={config.icon}
        alt={status}
        width={16}
        height={16}
      />
      <span className="text-transparent select-none">{status}</span>
    </div>
  );
}

function MockSidebar({ logo, isNameInputFocused, workspaceName }: { logo?: string | null; isNameInputFocused?: boolean; workspaceName?: string }) {
  return (
    <aside className="h-full w-[256px] flex-none border-r border-border-primary bg-[#FAFAFA] text-foreground flex flex-col relative rounded-tl-lg">
      {/* Original Workspace switcher */}
      <div className="h-12 border-b border-border-primary px-3 flex items-center">
        <div className="w-full select-none flex items-center gap-2 bg-transparent cursor-default focus:outline-none focus:ring-0 p-0">
          <div className="size-8 rounded bg-[#B5B5FF] flex items-center justify-center overflow-hidden">
            {logo ? (
              <Image
                src={logo}
                alt="Workspace logo"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold uppercase text-[#5555A3]">
                {workspaceName ? workspaceName.charAt(0).toUpperCase() : 'W'}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="truncate font-semibold text-sm text-black">
              {workspaceName && workspaceName.length > 20 
                ? `${workspaceName.substring(0, 20)}...` 
                : workspaceName || 'Workspace'
              }
            </span>
          </div>
          <ChevronsUpDown className="size-4 text-darkGrey" />
        </div>
      </div>

      {/* Expanded copy of workspace switcher */}
        <div 
          className={`absolute top-0 left-0 w-[255px] z-50 transform origin-bottom-right bg-[#FAFAFA] rounded-lg shadow-lg px-3 py-2 transition-all duration-500 ${
            isNameInputFocused 
              ? 'opacity-100 scale-x-[1.2] scale-y-[1.2] pointer-events-auto' 
              : 'opacity-0 scale-x-[1] scale-y-[1] pointer-events-none'
          }`}
          style={{
            background: isNameInputFocused 
              ? 'linear-gradient(white, white) padding-box, linear-gradient(white, white) border-box'
              : 'linear-gradient(white, white) padding-box, linear-gradient(white, white) border-box',
            border: isNameInputFocused ? '1px solid #3b82f6' : '0px solid transparent',
            boxShadow: isNameInputFocused 
              ? '0 0 0 5px rgba(59, 130, 246, 0.5), 0 0 0 1px #3b82f6'
              : '0 0 0 0px rgba(59, 130, 246, 0.5), 0 0 0 0px #3b82f6',
            transition: 'all 500ms ease-in-out',
            backgroundClip: 'padding-box, border-box'
          }}
        >
          <div className="w-full select-none flex items-center gap-2 bg-transparent cursor-default focus:outline-none focus:ring-0 p-0">
            <div className="size-8 rounded bg-[#B5B5FF] flex items-center justify-center overflow-hidden">
              {logo ? (
                <Image
                  src={logo}
                  alt="Workspace logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold uppercase text-[#5C5E63]">
                  {workspaceName ? workspaceName.charAt(0).toUpperCase() : 'W'}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="truncate font-semibold text-sm text-black">
              {workspaceName && workspaceName.length > 20 
                ? `${workspaceName.substring(0, 20)}...` 
                : workspaceName || 'Workspace'
              }
            </span>
            </div>
            <ChevronsUpDown className="size-4 text-black" />
          </div>
        </div>
      {/* Platform nav */}
      <nav className="px-2 py-2 space-y-1">
        {[
          { name: 'Inbox', icon: '/images/preview/messages-on.svg'},
          { name: 'Approvals', icon: '/images/preview/approvals.svg'},
          { name: 'Analytics', icon: '/images/preview/analytics.svg'}
        ].map((platform, idx) => (
          <div key={idx} className="flex items-center justify-between px-2 py-1.5 rounded cursor-default">
            <div className="flex items-center gap-1.5">
              <img src={platform.icon} alt={platform.name} className="w-4.5 h-4.5" />
              <NameBar name={platform.name} />
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-2 px-4 py-2 flex items-center justify-between w-full">
        <span className="text-xs font-medium text-[#75777C] tracking-wide">Boards</span>
        <Image
          src={`/images/preview/plus.svg`}
          alt="board plus"
          width={18}
          height={18}
        />
      </div>
      {/* Board nav */}
      <div className="px-2 space-y-1 overflow-auto">
        {[
          { name: 'Static Posts', icon: '/images/preview/static-post.svg', count: 9, selected: true, color: '#7262F8' },
          { name: 'Short-Form Videos', icon: '/images/preview/short-form-video.svg', count: 5, selected: false, color: '#45568F' },
          { name: 'Email Design', icon: '/images/preview/email-design.svg', count: 3, selected: false, color: '#F56858' },
          { name: 'Static Ads', icon: '/images/preview/static-ads.svg', count: 10, selected: false, color: '#9A9A9A' },
          { name: 'Image User Plus', icon: '/images/preview/image-user-plus.svg', count: 5, selected: false, color: '#656667' },
          { name: 'Google Ads', icon: '/images/preview/google-ads.svg', count: 3, selected: false, color: '#4E9BF8' },
          { name: 'Meta Ads', icon: '/images/preview/meta-ads.svg', count: 1, selected: false, color: '#0280F8' },
          { name: 'Blog Posts', icon: '/images/preview/blog-posts.svg', count: 4, selected: false, color: '#7A7E82' }
        ].map((board, idx) => (
          <div key={idx} className={`flex items-center justify-between px-2 py-1.5 rounded cursor-default ${board.selected ? 'bg-[#F4F5F6]' : ''}`}>
            <div className="flex items-center gap-2">
              <div
                className="w-4.5 h-4.5 rounded flex items-center justify-center flex-shrink-0"
                style={board.color ? { backgroundColor: board.color } : undefined}
              >
                <img
                  src={board.icon}
                  alt={board.name}
                  className={`w-3 h-3 ${board.selected && board.color ? 'filter brightness-0 invert' : ''}`}
                />
              </div>
              <NameBar
                name={board.name}
                className={board.selected ? "h-1.5 bg-[#E9EBED] rounded-[100px]" : "h-1.5 bg-backgroundHover rounded-[100px]"}
              />
            </div>
            <div
              className='text-[10px] font-medium flex justify-center items-center px-1 min-w-[20px] h-[20px] leading-none'
            >
              {board.count}
            </div>
          </div>
        ))}
      </div>

      {/* Social nav */}
      <div className="mt-2 px-4 py-2 flex items-center justify-between w-full">
        <span className="text-xs font-medium text-[#75777C] tracking-wide">Socials</span>
        <Image
          src={`/images/preview/plus.svg`}
          alt="social plus"
          width={18}
          height={18}
        />
      </div>
      <div className="px-2 space-y-1 overflow-auto">
        {[
          { name: 'Facebook Page', platform: 'facebook', count: 3 },
          { name: 'Instagram Account', platform: 'instagram', count: 2 },
          { name: 'TikTok Profile', platform: 'tiktok', count: 1 }
        ].map((social, idx) => (
          <div key={idx} className="flex items-center justify-between px-2 py-1.5 rounded cursor-default">
            <div className="flex items-center gap-2">
              <img
                src={`/images/platforms/${social.platform}.svg`}
                alt={social.name}
                className="w-[18px] h-[18px]"
              />
              <NameBar name={social.name} />
            </div>
            <div
              className='text-[10px] font-medium flex justify-center items-center px-1 min-w-[20px] h-[20px] leading-none'
            >
              {social.count}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function MockHeader() {
  // Mock active board data
  const activeBoard = {
    image: '/images/preview/static-post.svg',
    label: 'Static Posts',
    color: '#7262F8'
  }

  return (
    <header className="h-12 border-b border-border-primary flex items-center justify-between px-3 bg-white">
      <div className="flex items-center gap-4">
        {/* Sidebar trigger */}
        <div className='p-1.5'>
          <Image
            src="/images/icons/header-left.svg"
            alt="Filter"
            width={18}
            height={18}
          />
        </div>
        {/* Board name → open AddBoardModal prefilled */}
        <div
          className="flex items-center gap-2 rounded text-sm font-semibold focus:outline-none text-black"
        >
          {activeBoard?.image && (
            <div
              className={cn(
                "w-4.5 h-4.5 rounded flex items-center justify-center",
                activeBoard?.color ? "" : "bg-transparent"
              )}
              style={activeBoard?.color ? { backgroundColor: activeBoard.color } : undefined}
            >
              <img
                src={activeBoard?.image}
                alt={activeBoard?.label}
                className={cn(
                  "w-3 h-3",
                  activeBoard?.color && "filter brightness-0 invert"
                )}
                loading="lazy"
              />
            </div>
          )}
          <NameBar
            name={activeBoard?.label ?? 'Select board'}
            className="h-1.5 bg-backgroundHover rounded-[100px]"
          />
        </div>

        {/* View-switcher */}
        <div className="flex items-center gap-[4px] p-[2px] bg-[#F4F5F6] rounded-[6px] h-full">
          <div
            className='flex items-center px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px] bg-white shadow'
          >
            <Image src="/images/icons/header-table.svg" alt="Table" width={14} height={14} />
            <NameBar
              name={'Table'}
              className="h-1.5 bg-backgroundHover rounded-[100px]"
            />

          </div>
          <div
            className='flex items-center px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px]'
          >
            <Image src="/images/icons/header-calendar.svg" alt="Calendar" width={14} height={14} />
            <NameBar
              name={'Calendar'}
              className="h-1.5 bg-gray-200 rounded-[100px]"
            />
          </div>
          <div
            className='flex items-center px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px]'
          >
            <Image src="/images/icons/header-grid.svg" alt="Grid" width={14} height={14} />
            <NameBar
              name={'Grid'}
              className="h-1.5 bg-gray-200 rounded-[100px]"
            />
          </div>
        </div>
      </div>
    </header>
  )
}

function MockTopBar() {
  return (
    <div className="flex flex-wrap items-center justify-between border-b border-border-primary">
      <div className="flex gap-[6px] relative pl-[14px]">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 p-2 bg-white">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-2 py-[3px] h-[22px] text-sm font-medium bg-white"
            >
              <img src="/images/icons/table-toolbar-filter.svg" alt="Filter" width={12} height={12} />
              <NameBar name="Filter" className="h-1.5 bg-backgroundHover rounded-[100px]" />
            </div>

            <div
              className="flex items-center gap-2 px-2 py-[3px] h-[22px] text-sm font-medium bg-white"
            >
              <img src="/images/icons/table-toolbar-group.svg" alt="Group" width={12} height={12} />
              <NameBar name="Group" className="h-1.5 bg-backgroundHover rounded-[100px]" />
            </div>

            <div
              className="flex items-center gap-2 px-2 py-[3px] h-[22px] text-sm font-medium bg-white"
            >
              <img src="/images/icons/table-toolbar-sort.svg" alt="Sort" width={12} height={12} />
              <NameBar name="Sort" className="h-1.5 bg-backgroundHover rounded-[100px]" />
            </div>

            <div
              className="flex items-center gap-2 px-2 py-[3px] h-[22px] text-sm font-medium bg-white"
            >
              <img src="/images/icons/table-toolbar-row-height.svg" alt="Height" width={12} height={12} />
              <NameBar name="Height" className="h-1.5 bg-backgroundHover rounded-[100px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type MockPost = {
  caption: string
  status: any
  platforms: string[]
  format: 'image' | 'video'
  postTime: string
  updatedAt: string
  blocks: string[]
  captionLines: number
  captionLineLengths: number[]
}

const MOCK_POSTS: MockPost[] = [
  { 
    caption: 'Welcome to FeedBird preview', 
    status: 'Draft', 
    platforms: ['IG', 'FB'], 
    format: 'image', 
    postTime: '-', 
    updatedAt: '1m ago', 
    blocks: ['/images/preview/image0.png'],
    captionLines: 1,
    captionLineLengths: [25]
  },
  { 
    caption: 'Spring launch announcement\nNew features coming soon!', 
    status: 'Pending Approval', 
    platforms: ['IG'], 
    format: 'video', 
    postTime: 'Mar 18, 10:00', 
    updatedAt: '2h ago', 
    blocks: ['/images/preview/image1.png'],
    captionLines: 2,
    captionLineLengths: [25, 22]
  },
  { 
    caption: 'Customer spotlight: Sarah\nAmazing results with our platform\n#success #customer', 
    status: 'Approved', 
    platforms: ['FB'], 
    format: 'image', 
    postTime: 'Mar 21, 14:00', 
    updatedAt: 'yesterday', 
    blocks: ['/images/preview/image2.png', '/images/preview/image3.png', '/images/preview/image4.png'],
    captionLines: 3,
    captionLineLengths: [25, 30, 20]
  },
  { 
    caption: 'Content needs improvement\nPlease revise the messaging', 
    status: 'Needs Revisions', 
    platforms: ['IG', 'FB'], 
    format: 'image', 
    postTime: 'Mar 22, 09:00', 
    updatedAt: '3h ago', 
    blocks: ['/images/preview/image5.png'],
    captionLines: 2,
    captionLineLengths: [26, 25]
  },
  { 
    caption: 'Updated marketing campaign\nNew creative direction\nBetter engagement expected', 
    status: 'Revised', 
    platforms: ['IG'], 
    format: 'video', 
    postTime: 'Mar 23, 15:30', 
    updatedAt: '5h ago', 
    blocks: ['/images/preview/image6.png'],
    captionLines: 3,
    captionLineLengths: [28, 24, 28]
  },
  { 
    caption: 'Scheduled product launch\nBig announcement coming soon!', 
    status: 'Scheduled', 
    platforms: ['FB'], 
    format: 'image', 
    postTime: 'Mar 24, 11:15', 
    updatedAt: '1d ago', 
    blocks: ['/images/preview/image7.png'],
    captionLines: 2,
    captionLineLengths: [26, 27]
  },
  { 
    caption: 'Currently publishing post\nLive updates in progress', 
    status: 'Publishing', 
    platforms: ['TW', 'LI'], 
    format: 'image', 
    postTime: 'Mar 25, 08:45', 
    updatedAt: '2d ago', 
    blocks: ['/images/preview/image0.png'],
    captionLines: 2,
    captionLineLengths: [25, 26]
  },
  { 
    caption: 'Successfully published content\nGreat engagement so far!\nThanks for the support', 
    status: 'Published', 
    platforms: ['IG', 'FB'], 
    format: 'video', 
    postTime: 'Mar 26, 16:20', 
    updatedAt: '3d ago', 
    blocks: ['/images/preview/image4.png', '/images/preview/image5.png', '/images/preview/image6.png'],
    captionLines: 3,
    captionLineLengths: [30, 25, 22]
  },
  { 
    caption: 'Failed to publish update\nTechnical issues resolved\nRetrying now...', 
    status: 'Failed Publishing', 
    platforms: ['FB', 'LI'], 
    format: 'image', 
    postTime: 'Mar 27, 13:00', 
    updatedAt: '4d ago', 
    blocks: ['/images/preview/image7.png'],
    captionLines: 3,
    captionLineLengths: [24, 25, 15]
  },
]

// Using shared StatusChip

function MockPostTable() {
  return (
    <div className="w-full h-full">
      <div className="w-full">
        <div className="sticky top-0 z-10 bg-white border-b border-[#E6E7EB]">
          <div className="grid grid-cols-[24px_80px_160px_140px_minmax(0,1fr)] items-center text-xs text-[#5C5E63] font-semibold bg-[#FBFBFB]">
            <div className="p-2 h-8 border-r border-[#E6E7EB]" />
            <div className="p-2 text-center border-r border-[#E6E7EB]">
              <div className="w-4 h-4 border border-elementStroke rounded-[3px] bg-white"></div>
            </div>
            <div className="p-2 border-r border-[#E6E7EB] gap-1.5 flex items-center">
              <img src="/images/columns/status.svg" alt="status" width={14} height={14} />
              <NameBar name="Status" className="h-1.5 bg-backgroundHover rounded-[100px]" />
            </div>
            <div className="p-2 border-r border-[#E6E7EB] gap-1.5 flex items-center">
              <img src="/images/columns/preview.svg" alt="preview" width={14} height={14} />
              <NameBar name="Preview" className="h-1.5 bg-backgroundHover rounded-[100px]" />
            </div>
            <div className="p-2 gap-1.5 flex items-center">
              <img src="/images/columns/caption.svg" alt="caption" width={14} height={14} />
              <NameBar name="Caption" className="h-1.5 bg-backgroundHover rounded-[100px]" />
            </div>
          </div>
        </div>
        <div className="divide-y divide-[#F0F1F3]">
          {MOCK_POSTS.map((p, i) => (
            <div key={i} className="grid grid-cols-[24px_80px_160px_140px_minmax(0,1fr)] items-center text-sm">
              {/* Drag handle */}
              <div className="flex h-full items-center justify-center border-r border-[#E6E7EB]">

              </div>
              {/* Row index */}
              <div className="h-full flex items-center text-[#5C5E63] border-r border-[#E6E7EB]">
                <div className="flex-1 flex items-center justify-start gap-2 pl-2">
                  <span className="text-[12px] text-[#475467] w-4 text-center">
                    {i + 1}
                  </span>
                  <div className="relative w-[22px] h-[22px] transition-opacity active:opacity-60">
                    <Image
                      src="/images/platforms/comment.svg"
                      alt="comments"
                      width={22}
                      height={22}
                    />
                    <span className="absolute inset-0 flex items-center justify-center mt-[-2px] text-[10px] text-[#125AFF] leading-none font-semibold">
                    </span>
                  </div>
                </div>
              </div>
              {/* Status */}
              <div className="h-full flex items-center border-r border-[#E6E7EB] pl-2">
                <StatusChip status={p.status} />
              </div>
              {/* Preview */}
              <div className="flex py-1 px-2 h-18 items-center gap-1 border-r border-[#E6E7EB] overflow-hidden">
                {p.blocks.map((src, k) => (
                  <div key={k} className="w-12 h-12 rounded-[2px] border border-[#D0D5DD] bg-gray-50 flex-shrink-0 overflow-hidden">
                    <Image
                      src={src}
                      alt="Preview image"
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover"
                    />
                  </div>
                ))}
              </div>
                {/* Caption */}
                <div className="flex flex-col gap-2.5 px-2 py-1.5">
                  {Array.from({ length: p.captionLines }, (_, lineIndex) => (
                    <NameBar 
                      key={lineIndex}
                      name={p.caption.split('\n')[lineIndex] || ''} 
                      className="h-1.5 bg-backgroundHover rounded-[100px]" 
                    />
                  ))}
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PlatformPreview({ logo, isNameInputFocused, workspaceName }: { logo?: string | null; isNameInputFocused?: boolean; workspaceName?: string } = {}) {
  return (
    <div className="h-full overflow-visible relative">
        <div className="flex h-full bg-white text-foreground rounded-tl-lg">
          <MockSidebar logo={logo} isNameInputFocused={isNameInputFocused} workspaceName={workspaceName} />
          <div className="flex-1 flex flex-col">
            <MockHeader />
            <MockTopBar />
            <main className="flex h-[calc(100%-96px)] bg-background">
              <MockPostTable />
            </main>
          </div>
        </div>
      </div>
  )
}

