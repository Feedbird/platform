'use client'

import * as React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, ImageIcon } from 'lucide-react'

/* ---------------------------------------------------------------------
   Single-step modal to create workspace
   Step 1: workspace basics (name, logo)
--------------------------------------------------------------------- */

interface WorkspaceModalProps {
  open   : boolean
  onClose: () => void
  onAdd  : (name: string, logo: string | null) => void
}

export function WorkspaceModal({ open, onClose, onAdd }: WorkspaceModalProps) {
  /* Step-1 state */
  const [wsName, setWsName] = React.useState('')
  const [wsLogo, setWsLogo] = React.useState<string | null>(null)
  const wsLogoInput = React.useRef<HTMLInputElement>(null)

  /* Reset every open */
  React.useEffect(()=>{
    if (open) {
      setWsName(''); setWsLogo(null); if(wsLogoInput.current) wsLogoInput.current.value=''
    }
  },[open])

  /* logo handlers */
  const handleLogoFile = (file: File, setter: (val:string)=>void) => {
    const reader = new FileReader()
    reader.onload = e => {
      if (typeof e.target?.result === 'string') setter(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  /* final submit */
  const submit = () => {
    if (!wsName.trim()) return
    onAdd(wsName.trim(), wsLogo)
    onClose()
  }

  /* ------------------------------------------------------------------ */
  return (
    <div className={`fixed inset-0 z-50 bg-secondary flex items-center justify-center ${open?'flex':'hidden'}`}>
      {/* close */}
      <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-6 h-6"/></button>

      {/* WORKSPACE CREATION */}
      <form onSubmit={e=>{e.preventDefault();submit()}} className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-2xl font-semibold mb-1 text-primary-foreground">Tell us about your workspace</h1>
          <p className="text-sm text-foreground">Type in your workspace name and optionally upload a logo.</p>
        </div>
        {/* logo uploader */}
        <div className="flex justify-center">
          <div className="relative group">
            {wsLogo ? (
              <div className="relative size-24 rounded-full overflow-hidden border">
                <Image src={wsLogo} alt="Logo" fill className="object-cover" />
                <button type="button" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100" onClick={()=>{setWsLogo(null); if(wsLogoInput.current) wsLogoInput.current.value=''}}>
                  <X className="h-5 w-5 text-white"/>
                </button>
              </div>
            ) : (
              <Button type="button" variant="outline" size="icon" onClick={()=>wsLogoInput.current?.click()} className="size-24 rounded-full flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-6 w-6 mb-1"/>
                <span className="text-[10px] font-medium">Workspace Logo</span>
              </Button>
            )}
            <input hidden ref={wsLogoInput} type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0]; if(f) handleLogoFile(f,setWsLogo)}} />
          </div>
        </div>
        <Input value={wsName} onChange={e=>setWsName(e.target.value)} placeholder="Enter workspace name" className="text-center" autoFocus />
        <div className="flex justify-center gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!wsName.trim()} className="bg-foreground text-background">Add Workspace</Button>
        </div>
      </form>
    </div>
  )
}
