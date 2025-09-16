'use client'

import * as React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TimezonePicker } from '@/components/ui/timezone-picker'
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store'
import { workspaceApi } from '@/lib/api/api-service'
import { ManageSocialsDialog } from '@/components/social/manage-socials-dialog'
import { X, ChevronLeft } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  workspaceId?: string | null
}

export function ClientOnboardingModal({ open, onClose, workspaceId }: Props) {
  const [step, setStep] = React.useState(1)
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [company, setCompany] = React.useState('')

  const [timezone, setTimezone] = React.useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [weekStart, setWeekStart] = React.useState<'monday'|'sunday'>('monday')
  const [timeFormat, setTimeFormat] = React.useState<'24h'|'12h'>('24h')
  const [saving, setSaving] = React.useState(false)
  const [socialsOpen, setSocialsOpen] = React.useState(false)

  const setActiveWorkspace = useFeedbirdStore(s => s.setActiveWorkspace)

  React.useEffect(()=>{ if (open) setStep(1) }, [open])

  const next = () => setStep((s)=>Math.min(4, s+1))
  const back = () => setStep((s)=>Math.max(1, s-1))

  const canNext = () => {
    if (step === 1) return firstName && lastName && email && company
    return true
  }

  const saveWorkspaceSettings = async () => {
    if (!workspaceId) return
    setSaving(true)
    try {
      await workspaceApi.updateWorkspace(workspaceId, { timezone, week_start: weekStart, time_format: timeFormat })
      setActiveWorkspace(workspaceId)
    } finally {
      setSaving(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-black">Tell us about you</h2>
      <div className="bg-white rounded-xl border border-elementStroke shadow-sm p-5 space-y-4">
        <div className="flex gap-4">
          <Input placeholder="First name" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
          <Input placeholder="Last name" value={lastName} onChange={(e)=>setLastName(e.target.value)} />
        </div>
        <Input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <Input placeholder="Company name" value={company} onChange={(e)=>setCompany(e.target.value)} />
        <Button onClick={next} disabled={!canNext()} className="w-full bg-main text-white">Next</Button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={back} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"><ChevronLeft className="w-5 h-5"/></button>
        <h2 className="text-2xl font-semibold text-black">Workspace settings</h2>
      </div>
      <div className="bg-white rounded-xl border border-elementStroke shadow-sm p-5 space-y-4">
        <div>
          <div className="text-sm font-medium text-black mb-2">Timezone</div>
          <TimezonePicker value={timezone} onChange={setTimezone} />
        </div>
        <div>
          <div className="text-sm font-medium text-black mb-2">Start of week</div>
          <Select value={weekStart} onValueChange={(v)=>setWeekStart(v as 'monday'|'sunday')}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="sunday">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="text-sm font-medium text-black mb-2">Time format</div>
          <Select value={timeFormat} onValueChange={(v)=>setTimeFormat(v as '24h'|'12h')}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24-hour</SelectItem>
              <SelectItem value="12h">12-hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={async ()=>{ await saveWorkspaceSettings(); next(); }} disabled={saving} className="w-full bg-main text-white">{saving ? 'Saving...' : 'Next'}</Button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={back} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"><ChevronLeft className="w-5 h-5"/></button>
        <h2 className="text-2xl font-semibold text-black">Connect socials</h2>
      </div>
      <div className="bg-white rounded-xl border border-elementStroke shadow-sm p-5 space-y-4">
        <p className="text-sm text-grey">Connect at least one account to start posting.</p>
        <Button onClick={()=>setSocialsOpen(true)} className="w-full bg-main text-white">+ Add account</Button>
        <div className="flex justify-center">
          <Button onClick={next} variant="outline" className="w-full">Skip for now</Button>
        </div>
      </div>
      {workspaceId && (
        <ManageSocialsDialog workspaceId={workspaceId} open={socialsOpen} onOpenChange={setSocialsOpen} />
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={back} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"><ChevronLeft className="w-5 h-5"/></button>
        <h2 className="text-2xl font-semibold text-black">Invite your team</h2>
      </div>
      <div className="bg-white rounded-xl border border-elementStroke shadow-sm p-5 space-y-4">
        {/* Simple invite field leveraging workspace modal pattern could be added later */}
        <p className="text-sm text-grey">You can invite collaborators now or later from workspace settings.</p>
        <Button onClick={onClose} className="w-full bg-main text-white">Finish</Button>
      </div>
    </div>
  )

  const renderCurrent = () => {
    switch (step) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      default: return renderStep1()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="min-h-screen flex w-full">
        {/* Left */}
        <div className="flex-[11] flex flex-col items-center bg-white px-8 py-8 pt-8 min-h-screen">
          <div className="max-w-[480px] w-full flex flex-col min-h-full">
            <div className="flex items-center justify-between mb-8">
              <Image src="/images/logo/logo(1).svg" alt="FeedBird Logo" width={127} height={20} className="h-5 w-auto" />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {renderCurrent()}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex-[14] flex flex-col pl-12 pt-36 bg-[#F8F8F8] relative">
          <div onClick={onClose} className="absolute top-4 right-4 text-darkGrey hover:text-black z-10 cursor-pointer">
            <X className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  )
}


