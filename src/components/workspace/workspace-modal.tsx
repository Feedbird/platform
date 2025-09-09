'use client'

import * as React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, ImageIcon, ChevronRight, ChevronLeft, CalendarIcon, FolderOpen, Columns2, ChevronDown, ChevronUp, ListPlus, Film, EditIcon, Rows4, Rows3, Rows2, RectangleHorizontal, Maximize2, User, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store'
import { cn } from '@/lib/utils'
import { ROW_HEIGHT_CONFIG, RowHeightType } from '@/lib/utils'

/* ---------------------------------------------------------------------
   Multi-step modal to create workspace
   4 Steps: workspace basics, board selection, board rules, invite clients
--------------------------------------------------------------------- */

interface WorkspaceModalProps {
  open: boolean
  onClose: () => void
  onAdd: (name: string, logo: string | null, additionalData?: {
    selectedBoards: string[]
    boardRules: any
    inviteEmails: string[]
  }) => void
}

interface WorkspaceFormData {
  name: string
  logo: string | null
  selectedBoards: string[]
  boardRules: any
  inviteEmails: string[]
}

const STEPS = [
  { id: 1, title: 'Create your workspace', description: 'Set icon and name' },
  { id: 2, title: 'Select boards', description: 'Choose template boards' },
  { id: 3, title: 'Board rules', description: 'Configure board settings' },
  { id: 4, title: 'Invite your clients', description: 'Add team members' }
]

export interface BoardRules {
  autoSchedule: boolean;
  revisionRules: boolean;
  approvalDeadline: boolean;
  groupBy: string | null;
  sortBy: string | null;
  rowHeight: RowHeightType;
  firstMonth?: number; // -1 represents "Unlimited"
  ongoingMonth?: number; // -1 represents "Unlimited"
  approvalDays?: number; // 7,14,30,60,custom
  approvalCustom?: string;
}

const GROUP_OPTIONS = [
  {
    id: "status",
    label: "Status",
    icon: <FolderOpen className="mr-1 h-3 w-3" />,
  },
  {
    id: "month",
    label: "Month",
    icon: <CalendarIcon className="mr-1 h-3 w-3" />,
  },
  {
    id: "platforms",
    label: "Socials",
    icon: <ListPlus className="mr-1 h-3 w-3" />,
  },
  {
    id: "format",
    label: "Format",
    icon: <Film className="mr-1 h-3 w-3" />,
  },
] as const;

const SORT_OPTIONS = [
  {
    id: "status",
    label: "Status",
    icon: <FolderOpen className="mr-1 h-3 w-3" />,
  },
  {
    id: "caption",
    label: "Caption",
    icon: <EditIcon className="mr-1 h-3 w-3" />,
  },
  {
    id: "platforms",
    label: "Socials",
    icon: <ListPlus className="mr-1 h-3 w-3" />,
  },
  {
    id: "format",
    label: "Format",
    icon: <Film className="mr-1 h-3 w-3" />,
  },
  {
    id: "month",
    label: "Month",
    icon: <CalendarIcon className="mr-1 h-3 w-3" />,
  },
  {
    id: "publish_date",
    label: "Post Time",
    icon: <CalendarIcon className="mr-1 h-3 w-3" />,
  },
  {
    id: "updatedAt",
    label: "Updated At",
    icon: <CalendarIcon className="mr-1 h-3 w-3" />,
  },
] as const;

const possibleHeights = [
  {
    value: "Small",
    label: "Small",
    icon: <Rows4 fontSize="small" />,
  },
  {
    value: "Medium",
    label: "Medium",
    icon: <Rows3 fontSize="small" />,
  },
  {
    value: "Large",
    label: "Large",
    icon: <Rows2 fontSize="small" />,
  },
  {
    value: "X-Large",
    label: "X-Large",
    icon: <RectangleHorizontal fontSize="small" />,
  },
  {
    value: "XX-Large",
    label: "XX-Large",
    icon: <Maximize2 fontSize="small" />,
  },
];

// Generate random color for avatar based on index (persistent per field)
const getAvatarColor = (index: number, avatarColors: Record<number, string>) => {
  // If color already exists for this index, return it
  if (avatarColors[index]) {
    return avatarColors[index];
  }

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500'
  ];

  // Use index to generate consistent color for same field
  return colors[Math.abs(index) % colors.length];
};


export function WorkspaceModal({ open, onClose, onAdd }: WorkspaceModalProps) {
  const router = useRouter()
  const boardTemplates = useFeedbirdStore(state => state.boardTemplates)
  const [currentStep, setCurrentStep] = React.useState(1)
  const [boardRules, setBoardRules] = React.useState<BoardRules>({
    autoSchedule: false,
    revisionRules: false,
    approvalDeadline: false,
    groupBy: "month",
    sortBy: "status",
    rowHeight: "Medium",
  })
  const [setAsDefault, setSetAsDefault] = React.useState(false)
  const [avatarColors, setAvatarColors] = React.useState<Record<number, string>>({})
  const [formData, setFormData] = React.useState<WorkspaceFormData>({
    name: '',
    logo: null,
    selectedBoards: [],
    boardRules: {},
    inviteEmails: []
  })

  const wsLogoInput = React.useRef<HTMLInputElement>(null)

  // Board rules handlers
  const updateRule = React.useCallback(<K extends keyof BoardRules>(key: K, value: BoardRules[K]) => {
    setBoardRules(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleAutoScheduleChange = React.useCallback((checked: boolean) => {
    updateRule('autoSchedule', checked)
  }, [updateRule])

  const handleRevisionRulesChange = React.useCallback((checked: boolean) => {
    updateRule('revisionRules', checked)
  }, [updateRule])

  const handleApprovalDeadlineChange = React.useCallback((checked: boolean) => {
    updateRule('approvalDeadline', checked)
  }, [updateRule])

  const handleGroupByChange = React.useCallback((value: string | null) => {
    updateRule('groupBy', value)
  }, [updateRule])

  const handleSortByChange = React.useCallback((value: string | null) => {
    updateRule('sortBy', value)
  }, [updateRule])

  /* Reset every open */
  React.useEffect(() => {
    if (open) {
      setCurrentStep(1)
      setFormData(prevFormData => ({
        ...prevFormData,
        name: '',
        logo: null,
        selectedBoards: [],
        boardRules: {},
        inviteEmails: ['', '', '']
      }))
      setBoardRules({
        autoSchedule: false,
        revisionRules: false,
        approvalDeadline: false,
        groupBy: "month",
        sortBy: "status",
        rowHeight: "Medium",
      })
      setSetAsDefault(false)
      setAvatarColors({})
      if (wsLogoInput.current) wsLogoInput.current.value = ''
    }
  }, [open])

  /* Initialize with 3 email fields on first mount */
  React.useEffect(() => {
    if (formData.inviteEmails.length === 0) {
      setFormData(prevFormData => ({
        ...prevFormData,
        inviteEmails: ['', '', '']
      }))
    }
  }, []) // Empty dependency array - only run on mount

  /* Ensure at least 1 email field is always available */
  React.useEffect(() => {
    if (formData.inviteEmails.length === 0) {
      setFormData(prevFormData => ({
        ...prevFormData,
        inviteEmails: ['']
      }))
    }
  }, [formData.inviteEmails.length])

  /* Set colors for email fields that have content but no color assigned */
  React.useEffect(() => {
    const newColors: Record<number, string> = {}
    let hasNewColors = false

    formData.inviteEmails.forEach((email, index) => {
      if (email && !avatarColors[index]) {
        newColors[index] = getAvatarColor(index, avatarColors)
        hasNewColors = true
      }
    })

    if (hasNewColors) {
      setAvatarColors(prev => ({ ...prev, ...newColors }))
    }
  }, [formData.inviteEmails, avatarColors])

  /* logo handlers */
  const handleLogoFile = (file: File, setter: (val: string) => void) => {
    const reader = new FileReader()
    reader.onload = e => {
      if (typeof e.target?.result === 'string') setter(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const updateFormData = (updates: Partial<WorkspaceFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return formData.name.trim().length > 0
      case 2: return formData.selectedBoards.length > 0
      case 3: return true // Board rules are optional
      case 4: return formData.inviteEmails.some(email => email.trim().length > 0)
      default: return false
    }
  }

  const handleSubmit = async () => {
    if (!canProceedToNext()) return

    // Create workspace with additional data
    const additionalData = {
      selectedBoards: formData.selectedBoards,
      boardRules: boardRules,
      inviteEmails: formData.inviteEmails.filter(email => email.trim().length > 0)
    }

    const workspaceId = await onAdd(formData.name.trim(), formData.logo, additionalData)

    // Navigate to the new workspace
    router.push(`/${workspaceId}`)

    onClose()
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Step 1 Title */}
      <div className="items-center">
        <h2 className="text-2xl font-semibold text-black">Create your workspace</h2>
      </div>

      {/* Card Content */}
      <div className="bg-white rounded-xl border border-elementStroke shadow-sm p-5 space-y-6">
        {/* Logo uploader */}
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            {/* Left side - Preview image */}
            <div className="flex-shrink-0">
              <div className="relative group">
                {formData.logo ? (
                  <div className="relative size-15 rounded-[10px] overflow-hidden border-1 border-elementStroke">
                    <Image src={formData.logo} alt="Logo" fill className="object-cover" />
                    <button
                      type="button"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer"
                      onClick={() => {
                        updateFormData({ logo: null })
                        if (wsLogoInput.current) wsLogoInput.current.value = ''
                      }}
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="size-15 rounded-[10px] border-1 border-elementStroke flex items-center justify-center">
                    <img src='/images/icons/workspace.svg' className='w-5 h-5' />
                  </div>
                )}
              </div>
            </div>

            {/* Center - Text information */}
            <div className="flex-1">
              <div className="text-base font-medium text-black">Workspace icon</div>
              <div className="text-xs font-normal text-grey mt-1">Min. 200×200px, PNG or JPG</div>
            </div>

            {/* Right side - Upload button */}
            <div className="flex-shrink-0">
              <div
                onClick={() => wsLogoInput.current?.click()}
                className="px-3 py-1.5 text-sm text-black font-semibold rounded-sm bg-backgroundHover hover:bg-backgroundHover/70 cursor-pointer"
              >
                Upload
              </div>
              <input
                hidden
                ref={wsLogoInput}
                type="file"
                accept="image/*"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleLogoFile(f, (logo) => updateFormData({ logo }))
                }}
              />
            </div>
          </div>
        </div>

        {/* Name input */}
        <div>
          <label className="text-sm font-medium text-black block mb-3">Workspace Name</label>
          <Input
            value={formData.name}
            onChange={e => updateFormData({ name: e.target.value })}
            placeholder="Enter workspace name"
            className="text-left text-sm text-black font-normal"
            autoFocus
          />
        </div>

        {/* Next Button */}
        <Button
          onClick={nextStep}
          disabled={!canProceedToNext()}
          className="w-full bg-main hover:bg-blue-700 text-white py-3 cursor-pointer"
        >
          Next
        </Button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Step 2 Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={prevStep}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-black" />
        </button>
        <div>
          <h2 className="text-2xl font-semibold text-black mb-2">Select boards</h2>
          <p className="text-stone-300 text-lg font-semibold">These will appear in the workspace from the beginning  </p>
        </div>
      </div>

      {/* Card Content */}
      <div className="bg-white rounded-xl border border-elementStroke shadow-sm p-5">
        {/* Boards Header with Selection Count */}
        <div className="flex items-center mb-3">
          <h3 className="text-sm font-medium text-black">Boards</h3>
          <span className="text-sm font-normal text-grey">
            &nbsp;({formData.selectedBoards.length} Selected)
          </span>
        </div>

        {/* Board Templates Grid */}
        <div className="flex flex-wrap gap-2 mb-6">
          {boardTemplates.map((template) => (
            <div
              key={template.id}
              className={`py-1 pl-1 pr-3 border-2 rounded-md cursor-pointer transition-all hover:shadow-md ${formData.selectedBoards.includes(template.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                const isSelected = formData.selectedBoards.includes(template.id)
                if (isSelected) {
                  updateFormData({
                    selectedBoards: formData.selectedBoards.filter(id => id !== template.id)
                  })
                } else {
                  updateFormData({
                    selectedBoards: [...formData.selectedBoards, template.id]
                  })
                }
              }}
            >
              <div className="flex items-center gap-2">
                {/* Icon with Background */}
                <div
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: template.color || '#f3f4f6' }}
                >
                  {template.image ? (
                    <img
                      src={template.image}
                      alt={template.name}
                      className={`w-3.5 h-3.5 ${template.color ? 'filter brightness-0 invert' : ''}`}
                    />
                  ) : (
                    <ImageIcon className={`w-3.5 h-3.5 ${template.color ? 'text-white' : 'text-gray-500'}`} />
                  )}
                </div>

                {/* Name */}
                <div className="whitespace-nowrap">
                  <h4 className="font-medium text-black text-sm">{template.name}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Next Button */}
        <div className="flex justify-center">
          <Button
            onClick={nextStep}
            disabled={!canProceedToNext()}
            className="w-full bg-main hover:bg-blue-700 text-white py-3 cursor-pointer"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Step 3 Title */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={prevStep}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-black" />
        </button>
        <div>
          <h2 className="text-2xl font-semibold text-black mb-2">Board rules</h2>
          <p className="text-stone-300 text-lg font-semibold">These rules will apply to all boards in the workspace, but you can change it later</p>
        </div>
      </div>

      {/* Card Content */}
      <div className="bg-white rounded-xl border border-elementStroke shadow-sm p-5 space-y-6">

        {/* Rules Content */}
        <div className="flex flex-col gap-4">
          {/* Auto-schedule */}
          <div
            className={
              [
                "p-3 rounded-md",
                "shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)]",
                "shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)]",
                "shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)]",
                "border",
                boardRules.autoSchedule ? "border-[#125AFF]" : "border-[#D3D3D3]",
                "flex justify-start items-center gap-2"
              ].join(" ")
            }
          >
            <div className="flex-1 flex justify-start items-start gap-3">
              <div className="flex-1 inline-flex flex-col justify-center items-start gap-1">
                <div className="inline-flex justify-start items-center gap-1.5">
                  <div className="w-4 h-4 relative overflow-hidden">
                    <img src="/images/boards/stars-01.svg" className="rounded-sm" alt="auto-schedule" />
                  </div>
                  <div className="text-sm font-medium text-black leading-none">Auto-schedule</div>
                </div>
                <div className="h-5 flex items-center text-[13px] text-[#75777C] leading-tight">
                  Automatically plan content based on your set rules and timeline.
                </div>
              </div>
            </div>
            <Switch
              checked={boardRules.autoSchedule}
              onCheckedChange={handleAutoScheduleChange}
              className="data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer"
              icon={
                <span className="flex items-center justify-center w-full h-full">
                  <img
                    src="/images/boards/stars-01.svg"
                    alt="star"
                    className="w-3 h-3"
                    style={{
                      filter: boardRules.autoSchedule
                        ? undefined
                        : 'grayscale(2) brightness(0.85)',
                    }}
                  />
                </span>
              }
            />
          </div>

          {/* Add revision rules */}
          <div className="p-3 rounded-md shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)] shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)] shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)] border border-[#D3D3D3] flex flex-col gap-4 bg-white data-[state=checked]:bg-[#F5FAFF]"
            style={{ borderColor: boardRules.revisionRules ? '#125AFF' : '#D3D3D3' }}>
            {/* header row */}
            <div className="flex justify-between items-center">
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-sm font-medium text-black leading-none">Add revision rules</span>
                <span className="text-[13px] text-[#75777C] leading-tight">Customize how content is reviewed and approved over time.</span>
              </div>
              <Switch
                checked={boardRules.revisionRules}
                onCheckedChange={handleRevisionRulesChange}
                className="data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer"
              />
            </div>
            {/* extra config shown only when enabled */}
            {boardRules.revisionRules && (
              <div className="w-full flex flex-col lg:flex-row gap-4 mt-2">
                {/* first month */}
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-[13px] font-medium text-black leading-none text-left">First month</span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={boardRules.firstMonth ? (boardRules.firstMonth === -1 ? 'Unlimited' : String(boardRules.firstMonth)) : ''}
                      onValueChange={(val) => updateRule('firstMonth', val === 'Unlimited' ? -1 : Number(val))}
                    >
                      <SelectTrigger className="w-full px-2.5 py-2 text-[13px] bg-white rounded-md border border-[#D3D3D3] shadow-sm text-left">
                        <SelectValue placeholder="Select how many revision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="Unlimited">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ongoing months */}
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-[13px] font-medium text-black leading-none text-left">Ongoing months</span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={boardRules.ongoingMonth ? (boardRules.ongoingMonth === -1 ? 'Unlimited' : String(boardRules.ongoingMonth)) : ''}
                      onValueChange={(val) => updateRule('ongoingMonth', val === 'Unlimited' ? -1 : Number(val))}
                    >
                      <SelectTrigger className="w-full px-2.5 py-2 text-[13px] bg-white rounded-md border border-[#D3D3D3] shadow-sm text-left">
                        <SelectValue placeholder="Select how many revision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="Unlimited">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Approval deadline */}
          <div
            className={[
              "p-3 rounded-md",
              "shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)]",
              "shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)]",
              "shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)]",
              "border",
              boardRules.approvalDeadline ? "border-[#125AFF]" : "border-[#D3D3D3]",
              "flex flex-col gap-3"
            ].join(" ")}
          >
            <div className="w-full flex justify-between items-center gap-2">
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-black leading-none">Approval deadline</div>
                <div className="h-5 flex items-center text-[13px] text-[#75777C] leading-tight">
                  Customize how content is reviewed and approved over time.
                </div>
              </div>
              <Switch
                checked={boardRules.approvalDeadline}
                onCheckedChange={handleApprovalDeadlineChange}
                className="data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer"
              />
            </div>
            {/* pills inside block */}
            {boardRules.approvalDeadline && (
              <>
                <div className="w-full flex flex-wrap gap-2">
                  {['7', '14', '30', '60', 'custom'].map(opt => {
                    const isCustom = opt === 'custom';
                    const selected = isCustom ? boardRules.approvalDays === undefined : boardRules.approvalDays === Number(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateRule('approvalDays', isCustom ? undefined : Number(opt))}
                        className={cn(
                          "flex-1 h-8 px-3 rounded-full border outline outline-1 outline-offset-[-1px] text-[13px] font-medium cursor-pointer",
                          selected ? 'bg-blue-600 text-white outline-blue-600' : 'bg-white text-black outline-slate-300'
                        )}
                      >
                        {opt === 'custom' ? 'Custom' : `${opt} days`}
                      </button>
                    );
                  })}
                </div>
                {boardRules.approvalDays === undefined && boardRules.approvalDeadline && (
                  <div className="w-full mt-1">
                    <input
                      type="number"
                      min={0}
                      placeholder="Select custom deadline"
                      className="small-spin w-full px-2.5 py-2 text-[13px] border border-[#D3D3D3] rounded-md"
                      value={boardRules.approvalCustom ?? ''}
                      onChange={e => updateRule('approvalCustom', e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

          </div>

          {/* Display Settings */}
          <div className="flex w-full gap-3">
            {/* Group by */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="text-[13px] font-medium text-black leading-none">Group by</div>
              <div className="w-full">
                <Select value={boardRules.groupBy || "none"} onValueChange={(value) => handleGroupByChange(value === "none" ? null : value)}>
                  <SelectTrigger className="w-full px-3 py-2 bg-white rounded-md shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)] shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)] shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)] border border-[#D3D3D3] flex items-center gap-2 overflow-hidden text-left">
                    {(() => {
                      const current = GROUP_OPTIONS.find(opt => opt.id === boardRules.groupBy);
                      return current ? (
                        <div className="flex items-center gap-1 w-full">
                          {current.icon}
                          <span className="flex-1 text-black text-[13px] font-medium leading-tight text-left">
                            {current.label}
                          </span>
                        </div>
                      ) : (
                        <SelectValue placeholder="None" />
                      );
                    })()}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-1">
                        <span className="text-[#75777C]">None</span>
                      </div>
                    </SelectItem>
                    {GROUP_OPTIONS.map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>
                        <div className="flex items-center gap-1">
                          {opt.icon}
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sort by */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="text-[13px] font-medium text-black leading-none">Sort by</div>
              <div className="w-full">
                <Select value={boardRules.sortBy || "none"} onValueChange={(value) => handleSortByChange(value === "none" ? null : value)}>
                  <SelectTrigger className="w-full px-3 py-2 bg-white rounded-md shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)] shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)] shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)] border border-[#D3D3D3] flex items-center gap-2 overflow-hidden text-left">
                    {(() => {
                      const current = SORT_OPTIONS.find(opt => opt.id === boardRules.sortBy);
                      return current ? (
                        <div className="flex items-center gap-1 w-full">
                          {current.icon}
                          <span className="flex-1 text-black text-[13px] font-medium leading-tight text-left">
                            {current.label}
                          </span>
                        </div>
                      ) : (
                        <SelectValue placeholder="None" />
                      );
                    })()}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-1">
                        <span className="text-[#75777C]">None</span>
                      </div>
                    </SelectItem>
                    {SORT_OPTIONS.map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>
                        <div className="flex items-center gap-1">
                          {opt.icon}
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row Height */}
            <div className="flex-1 flex flex-col justify-start items-start gap-2">
              <div className="text-[13px] font-medium text-black leading-none">Row Height</div>
              <div className="w-full">
                <Select
                  value={boardRules.rowHeight}
                  onValueChange={(val) => updateRule('rowHeight', val as RowHeightType)}
                >
                  <SelectTrigger className="w-full px-3 py-2 bg-white rounded-md shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)] shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)] shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)] border border-[#D3D3D3] flex justify-start items-center gap-2 overflow-hidden">
                    {(() => {
                      const current = possibleHeights.find(h => h.value === boardRules.rowHeight);
                      return current ? (
                        <div className="flex items-center gap-2 w-full">
                          {current.icon}
                          <span className="flex-1 text-black text-[13px] font-medium leading-tight text-left">
                            {current.label}
                          </span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Select" />
                      );
                    })()}
                  </SelectTrigger>
                  <SelectContent>
                    {possibleHeights.map(h => (
                      <SelectItem key={h.value} value={h.value}>
                        <div className="flex items-center gap-2">
                          {h.icon}
                          {h.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Set as Default Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="set-as-default"
            checked={setAsDefault}
            onCheckedChange={(checked) => setSetAsDefault(checked === true)}
            className="data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-white data-[state=checked]:border-[#125AFF]"
          />
          <label
            htmlFor="set-as-default"
            className="text-sm font-normal text-black cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Set as default board rules in future workspaces
          </label>
        </div>

        {/* Next Button */}
        <div className="flex justify-center">
          <Button
            onClick={currentStep === STEPS.length ? handleSubmit : nextStep}
            disabled={!canProceedToNext()}
            className="w-full bg-main hover:bg-blue-700 text-white py-3 cursor-pointer"
          >
            {currentStep === STEPS.length ? 'Create Workspace' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      {/* Step 4 Title */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={prevStep}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-grey/10 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-black" />
        </button>
        <div>
          <h2 className="text-2xl font-semibold text-black">Invite your clients</h2>
        </div>
      </div>

      {/* Card Content */}
      <div className="bg-white rounded-xl border border-elementStroke shadow-sm p-5 space-y-6">
        <div className="space-y-4">
          {formData.inviteEmails.map((email, index) => (
            <div key={index} className="flex items-center gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  email ? getAvatarColor(index, avatarColors) : 'bg-gray-200'
                }`}>
                  {email ? (
                    <span className="text-xs font-medium text-indigo-800">
                      {email.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="text-gray-500" style={{width: '14px', height: '14px'}} />
                  )}
                </div>
              </div>

              {/* Input Field */}
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  const newEmails = [...formData.inviteEmails]
                  const newValue = e.target.value
                  newEmails[index] = newValue

                  // Set color for this index if email is being entered and color doesn't exist
                  if (newValue && !avatarColors[index]) {
                    setAvatarColors(prev => ({
                      ...prev,
                      [index]: getAvatarColor(index, avatarColors)
                    }))
                  }

                  updateFormData({ inviteEmails: newEmails })
                }}
                placeholder="Enter email address"
                className="flex-1"
              />

              {/* Remove Button */}
                <div
                  className="flex-shrink-0 cursor-pointer"
                  onClick={() => {
                  if (formData.inviteEmails.length > 1) {
                    // Remove this field entirely
                    const newEmails = formData.inviteEmails.filter((_, i) => i !== index)
                    updateFormData({ inviteEmails: newEmails })

                    // Also remove the color for this index
                    setAvatarColors(prev => {
                      const newColors = { ...prev }
                      delete newColors[index]
                      return newColors
                    })
                  } else {
                    // Clear the current email if it's the only one
                    const newEmails = [...formData.inviteEmails]
                    newEmails[index] = ''
                    updateFormData({ inviteEmails: newEmails })
                  }
                }}
                >
                  <X className="text-darkGrey" style={{width: '14px', height: '14px'}} />
                </div>
            </div>
          ))}

          <div
            onClick={() => updateFormData({ inviteEmails: [...formData.inviteEmails, ''] })}
            className="text-sm text-main font-medium cursor-pointer flex items-center"
          >
            <Plus className="mr-1" style={{width: '14px', height: '14px'}} />
            Add more collaborators
          </div>
        </div>

        {/* Create Workspace Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={!canProceedToNext()}
            className="w-full bg-main hover:bg-blue-700 text-white py-3 cursor-pointer"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      default: return renderStep1()
    }
  }

  return (
    <>
      <div className={`fixed inset-0 z-50 ${open ? 'flex' : 'hidden'}`}>
        <div className="min-h-screen flex w-full">
          {/* Left Side - Workspace Creation Form */}
          <div className="flex-[11] flex flex-col items-center bg-white px-8 py-8 pt-16 min-h-screen">
            <div className="max-w-[480px] w-full flex flex-col min-h-full">
              {/* Header */}
              <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex-shrink-0">
                  <Image
                    src="/images/logo/logo.png"
                    alt="FeedBird Logo"
                    width={127}
                    height={20}
                    className="h-5 w-auto"
                  />
                </div>
              </div>

              {/* Content - This will grow to fill available space */}
              <div className="flex-1 flex flex-col justify-center">
                {renderCurrentStep()}
              </div>

            </div>
            {/* Horizontal Progress Bar - Four Separate Pieces */}
            <div className="pb-8">
              <div className="flex gap-1">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex-1">
                    <div
                      className={`h-1 w-25 rounded-full transition-all duration-300 ease-in-out ${currentStep > index ? 'bg-main' : 'bg-buttonStroke'
                      }`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Platform Preview */}
          <div className="flex-[14] flex flex-col pl-12 pt-36 bg-[#F8F8F8] relative">
            {/* Cancel Button - Top Right */}
            <div
              onClick={onClose}
              className="absolute top-4 right-4 text-darkGrey hover:text-black z-10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </div>

            {/* Platform Preview Image */}
            <div className="flex-1 flex justify-center">
              <div className="w-full h-full">
                <div className="w-full h-full rounded-tl-lg overflow-hidden border-l-5 border-t-5 border-elementStroke">
                  <img
                    src="/images/logo/preview.png"
                    alt="FeedBird Dashboard Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
