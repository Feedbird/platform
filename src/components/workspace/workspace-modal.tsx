'use client'

import * as React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X, ImageIcon } from 'lucide-react'

/* ---------------------------------------------------------------------
   Two-step modal to create workspace + brand
   Step 1: workspace basics (name, logo)
   Step 2: full brand guideline form (same sections & style as BrandSheet)
--------------------------------------------------------------------- */

interface BrandPayload {
  name : string
  logo?: string | null
  fonts: string[]
  colors: string[]
  link : string
  voice: string
  prefs: string
}

interface WorkspaceModalProps {
  open   : boolean
  onClose: () => void
  onAdd  : (name: string, logo: string | null, brand: BrandPayload) => void
}

/* Shared field wrapper from BrandSheet */
const Field = ({ label, desc, children }: { label:string; desc:string; children:React.ReactNode }) => (
  <div className="grid sm:grid-cols-5 gap-6 items-start text-left w-full">
    <div className="space-y-2 sm:col-span-2">
      <p className="font-medium text-primary-foreground">{label}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
    <div className="sm:col-span-3 space-y-3 w-full">{children}</div>
  </div>
)

export function WorkspaceModal({ open, onClose, onAdd }: WorkspaceModalProps) {
  /* wizard step */
  const [step, setStep] = React.useState<1|2>(1)

  /* Step-1 state */
  const [wsName, setWsName] = React.useState('')
  const [wsLogo, setWsLogo] = React.useState<string | null>(null)
  const wsLogoInput = React.useRef<HTMLInputElement>(null)

  /* Step-2 (brand) state — defaults copied from BrandSheet */
  const [brandName,  setBrandName ] = React.useState('')
  const [brandLogo,  setBrandLogo ] = React.useState<string | null>(null)
  const [fonts,      setFonts     ] = React.useState<string[]>(['','', ''])
  const [colors,     setColors    ] = React.useState<string[]>(['#1e293b','#0284c7','#e11d48'])
  const [link,       setLink      ] = React.useState('')
  const [voice,      setVoice     ] = React.useState('')
  const [prefs,      setPrefs     ] = React.useState('')
  const brandLogoInput = React.useRef<HTMLInputElement>(null)

  /* Reset every open */
  React.useEffect(()=>{
    if (open) {
      setStep(1)
      setWsName(''); setWsLogo(null); if(wsLogoInput.current) wsLogoInput.current.value=''
      setBrandName(''); setBrandLogo(null); if(brandLogoInput.current) brandLogoInput.current.value=''
      setFonts(['','', ''])
      setColors(['#1e293b','#0284c7','#e11d48'])
      setLink(''); setVoice(''); setPrefs('')
    }
  },[open])

  /* logo handlers (workspace + brand) */
  const handleLogoFile = (file: File, setter: (val:string)=>void) => {
    const reader = new FileReader()
    reader.onload = e => {
      if (typeof e.target?.result === 'string') setter(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  /* colour swatch helpers */
  const addColor   = () => setColors(c=>[...c,'#ffffff'])
  const updColor   = (i:number,val:string) => setColors(c=>c.map((col,idx)=>idx===i?val:col))
  const delColor   = (i:number) => setColors(c=>c.filter((_,idx)=>idx!==i))

  /* font helpers */
  const addFont    = () => setFonts(f=>[...f,''])
  const updFont    = (i:number,val:string) => setFonts(f=>f.map((v,idx)=>idx===i?val:v))
  const delFont    = (i:number) => setFonts(f=>f.filter((_,idx)=>idx!==i))

  /* navigation */
  const next = () => {
    if (!wsName.trim()) return
    if (!brandName.trim()) setBrandName(wsName.trim()) // prefill
    setStep(2)
  }
  const back = () => setStep(1)

  /* final submit */
  const submit = () => {
    if (!wsName.trim() || !brandName.trim()) return
    const payload: BrandPayload = {
      name : brandName.trim(),
      logo : brandLogo,
      fonts: fonts.filter(Boolean),
      colors,
      link : link ? `https://${link.replace(/^https?:\/\//,'')}` : '',
      voice: voice,
      prefs: prefs,
    }
    onAdd(wsName.trim(), wsLogo, payload)
    onClose()
  }

  /* ------------------------------------------------------------------ */
  return (
    <div className={`fixed inset-0 z-50 bg-secondary flex items-center justify-center ${open?'flex':'hidden'}`}>
      {/* close */}
      <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-6 h-6"/></button>

      {/* STEP 1 */}
      {step===1 && (
        <form onSubmit={e=>{e.preventDefault();next()}} className="w-full max-w-md space-y-8 text-center">
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
            <Button type="submit" disabled={!wsName.trim()} className="bg-foreground text-background">Next</Button>
          </div>
        </form>
      )}

      {/* STEP 2 – Brand guideline */}
      {step===2 && (
        <div className="w-full p-10  overflow-y-auto h-[90vh]">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="font-semibold text-lg text-primary-foreground">Brand Guideline</h2>

            {/* brand name */}
            <Field label="Brand name" desc="Your brand name is the name your customers use to refer to you.">
              <Input value={brandName} onChange={e=>setBrandName(e.target.value)} />
            </Field>
            <hr/>
            {/* brand logo */}
            <Field label="Logo" desc="Upload your brand logo.">
              {brandLogo ? (
                <div className="relative w-28 h-28">
                  <Image src={brandLogo} alt="" fill className="object-contain border rounded-lg" />
                  <Button size="icon" variant="ghost" className="absolute -top-3 -right-3 bg-black text-white" onClick={()=>setBrandLogo(null)}><X className="h-4 w-4"/></Button>
                </div>
              ) : (
                <label className="h-28 w-28 flex flex-col items-center justify-center border rounded-lg cursor-pointer gap-1 text-muted-foreground">
                  <input hidden type="file" accept="image/*" ref={brandLogoInput} onChange={e=>{const f=e.target.files?.[0]; if(f) handleLogoFile(f,setBrandLogo)}} />
                  <ImageIcon className="h-7 w-7 border border-secondary rounded-full" />
                  <p className="text-sm text-center pt-2"><span className="text-[#4D3AF1]">Click to upload</span><br/>SVG, PNG, JPG</p>
                </label>
              )}
            </Field>
            <hr/>
            {/* fonts */}
            <Field label="Fonts" desc="Styles of text used by your brand.">
              {fonts.map((f,i)=>(
                <div key={i} className="flex items-center gap-2">
                  <Input placeholder={['Heading','Sub-heading','Body','Additional'][i] ?? 'Additional'} value={f} onChange={e=>updFont(i,e.target.value)} style={{fontFamily:f||'inherit'}} />
                  {i>2 && <Button size="icon" variant="ghost" onClick={()=>delFont(i)}><X className="h-4 w-4"/></Button>}
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addFont}>+ Add font</Button>
            </Field>
            <hr/>
            {/* colours */}
            <Field label="Colours" desc="Primary colours for your brand palette.">
              {colors.map((c,i)=>(
                <div key={i} className="flex items-center gap-2">
                  <Input type="color" value={c} onChange={e=>updColor(i,e.target.value)} className="h-10 w-10 p-0 border cursor-pointer" />
                  <Input value={c} onChange={e=>updColor(i,e.target.value)} />
                  {i>2 && <Button size="icon" variant="ghost" onClick={()=>delColor(i)}><X className="h-4 w-4"/></Button>}
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addColor}>+ Add colour</Button>
            </Field>
            <hr/>
            {/* links */}
            <Field label="Links" desc="Your website.">
              <div className="flex w-full"><span className="px-3 inline-flex items-center bg-muted border rounded-l-md select-none">https://</span><Input value={link} onChange={e=>setLink(e.target.value)} className="rounded-l-none" /></div>
            </Field>
            <hr/>
            {/* voice */}
            <Field label="Brand voice" desc="Personality a brand adopts in its communications.">
              <Textarea rows={4} value={voice} onChange={e=>setVoice(e.target.value)} placeholder="Innovative, sophisticated, minimalistic…" />
            </Field>
            <hr/>
            {/* prefs */}
            <Field label="Preferences" desc="Personal tastes, needs, desires.">
              <Textarea rows={4} value={prefs} onChange={e=>setPrefs(e.target.value)} placeholder="We prefer a clean, uncluttered layout…" />
            </Field>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={back}>Back</Button>
              <Button type="button" className="bg-foreground text-background" onClick={submit} disabled={!brandName.trim()}>Add Workspace</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
