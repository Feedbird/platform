/* components/brand/brand-dialog.tsx */
'use client'

import * as React from 'react'
import Image                    from 'next/image'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
}                               from '@/components/ui/dialog'
import { Button }               from '@/components/ui/button'
import { Input }                from '@/components/ui/input'
import { Textarea }             from '@/components/ui/textarea'
import {
  ChevronLeft, MoreHorizontal, X, ImageIcon, Trash,
}                               from 'lucide-react'
import { useFeedbirdStore }     from '@/lib/store/use-feedbird-store'
import { toast }                from 'sonner'
import { cn }                   from '@/lib/utils'

/* tiny wrapper for form rows */
const Field = ({
  label, desc, children,
}: { label:string; desc:string; children:React.ReactNode }) => (
  <div className="grid sm:grid-cols-5 gap-6 items-start">
    <div className="text-left sm:col-span-2 space-y-2">
      <p className="font-medium text-primary-foreground">{label}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
    <div className="sm:col-span-3 space-y-3">{children}</div>
  </div>
)

/* ─────────────────────────────────────────────── */
interface BrandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: 'create' | 'edit'
  brandId?: string
}

export default function BrandDialog({ open, onOpenChange, mode = 'create', brandId }: BrandDialogProps) {
  /* store -------------------------------------------------------- */
  const store   = useFeedbirdStore()
  const brand   = mode === 'edit' ? store.getActiveBrand() : null

  /* local state -------------------------------------------------- */
  const [name ,setName ] = React.useState(brand?.name ?? '')
  const [logo ,setLogo ] = React.useState<string|undefined>(brand?.logo)
  const [fonts,setFonts] = React.useState<string[]>(brand?.styleGuide?.fonts ?? ['','',''])
  const [cols ,setCols ] = React.useState<string[]>(brand?.styleGuide?.colors ?? ['','',''])
  const [link ,setLink ] = React.useState(brand?.link ? brand.link.replace(/^https?:\/\//, '') : '')
  const [voice,setVoice] = React.useState(brand?.voice ?? '')
  const [prefs,setPrefs] = React.useState(brand?.prefs ?? '')

  /* reset when dialog opens -------------------------------------- */
  React.useEffect(() => {
    if (open) {
      if (mode === 'create') {
        setName('')
        setLogo(undefined)
        setFonts(['','',''])
        setCols(['','',''])
        setLink('')
        setVoice('')
        setPrefs('')
      } else if (mode === 'edit' && brand) {
        setName(brand.name)
        setLogo(brand.logo)
        setFonts(brand.styleGuide?.fonts ?? ['','',''])
        setCols(brand.styleGuide?.colors ?? ['','',''])
        setLink(brand.link ? brand.link.replace(/^https?:\/\//, '') : '')
        setVoice(brand.voice ?? '')
        setPrefs(brand.prefs ?? '')
      }
    }
  }, [open, mode, brand])

  const close = () => onOpenChange(false)

  const handleLogo = (file: File | null) => {
    if (!file) return
    const r = new FileReader()
    r.onload = e => {
      if (typeof e.target?.result === 'string') setLogo(e.target.result)
    }
    r.readAsDataURL(file)
  }

  const save = async () => {
    const payload = {
      name,
      logo,
      styleGuide: { fonts: fonts.filter(Boolean), colors: cols.filter(Boolean) },
      link      : link ? `https://${link}` : '',
      voice,
      prefs,
    }

    try {
      if (mode === 'create') {
        const brandId = await store.addBrand(payload.name, payload.logo, payload.styleGuide, payload.link, payload.voice, payload.prefs)
        store.setActiveBrand(brandId)
        toast.success('Brand created')
      } else if (mode === 'edit' && brand) {
        await store.updateBrand(brand.id, payload)
        toast.success('Brand updated')
      }
      close()
    } catch (error) {
      toast.error(mode === 'create' ? 'Failed to create brand' : 'Failed to update brand')
      console.error('Error saving brand:', error)
    }
  }

  /* ───────────────────────── render ───────────────────────────── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        centered={false}
        overlayClassName="top-0 right-0 bottom-0 left-[var(--app-sidebar-gap,16rem)]"
        className={cn(
          'p-0 border-l border-elementStroke rounded-none h-svh w-[calc(100vw-var(--app-sidebar-gap,16rem))] max-w-none',
          'sm:max-w-none',
          'fixed top-0 left-[var(--app-sidebar-gap,16rem)] translate-x-0 translate-y-0 z-[60]',
          '[&>button:last-child]:hidden',
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Brand modal</DialogTitle>
        </DialogHeader>

        {/* Top-bar */}
        <div className="h-12 flex items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={close} className="cursor-pointer">
              <ChevronLeft className="h-5 w-5"/>
            </Button>
            <h1 className="text-sm font-semibold text-primary-foreground">
              {mode === 'create' ? 'New Brand' : `Edit – ${brand?.name}`}
            </h1>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center w-full overflow-y-auto h-[calc(100svh-48px)]">
          <div className="p-10 space-y-6 w-full max-w-4xl">
            {/* intro blurb */}
            <div className="space-y-1">
              <p className="font-semibold text-primary-foreground text-lg">Brand Guideline</p>
              <p className="text-sm">
                Brings all your entire brand together in one place.
              </p>
            </div>
            <hr/>
            
            {/* Brand name */}
            <Field label="Brand name" desc="Your brand name is the name your customers use to refer to you.">
              <Input value={name} onChange={e => setName(e.target.value)}/>
            </Field>
            <hr/>
            
            {/* Logo */}
            <Field label="Logo" desc="Your logo name is the name your customers use to refer to you.">
              {logo ? (
                <div className="relative w-28 h-28">
                  <Image
                    src={logo}
                    alt=""
                    fill
                    className="object-contain border rounded-lg"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute -top-3 -right-3 bg-black text-white font-semibold rounded-full cursor-pointer"
                    onClick={() => setLogo(undefined)}
                  >
                    <X className="h-4 w-4"/>
                  </Button>
                </div>
              ) : (
                <label
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ring-2','ring-primary') }}
                  onDragLeave={e => e.currentTarget.classList.remove('ring-2','ring-primary')}
                  onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('ring-2','ring-primary'); handleLogo(e.dataTransfer.files[0]) }}
                  className="h-28 w-28 flex flex-col items-center justify-center border rounded-lg cursor-pointer gap-1 text-muted-foreground w-full px-[24px] py-[16px]"
                >
                  <input hidden type="file" accept="image/*" onChange={e => handleLogo(e.target.files?.[0] ?? null)}/>
                  <ImageIcon className="h-7 w-7 border border-secondary rounded-full"/>
                  <p className="text-sm text-center pt-2">
                    <span className="text-[#4D3AF1] text-sm">Click to upload</span> or drag and drop<br/>SVG, PNG, JPG (max. 800x400px)
                  </p>
                </label>
              )}
            </Field>
            <hr/>
            
            {/* Fonts */}
            <Field label="Fonts" desc="Style of text that's printed on a page or displayed on a design.">
              {fonts.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder={['Heading','Sub-heading','Body','Additional'][i] ?? 'Additional'}
                    value={f}
                    onChange={e => {
                      const arr = [...fonts]; arr[i] = e.target.value; setFonts(arr)
                    }}
                    style={{ fontFamily: f || 'inherit' }}
                  />
                  {i > 2 && (
                    <Button size="icon" variant="ghost" onClick={() => setFonts(fonts.filter((_, idx) => idx !== i))}>
                      <X className="h-4 w-4"/>
                    </Button>
                  )}
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setFonts([...fonts, ''])} className="cursor-pointer">
                + Add font
              </Button>
            </Field>
            <hr/>

            {/* Colours */}
            <Field label="Colours" desc="Represent its brand identity of your company or organization.">
              {cols.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={c}
                    onChange={e => {
                      const arr = [...cols]; arr[i] = e.target.value; setCols(arr)
                    }}
                    className="h-10 w-10 p-0 border cursor-pointer"
                  />
                  <Input
                    value={c}
                    onChange={e => {
                      const arr = [...cols]; arr[i] = e.target.value; setCols(arr)
                    }}
                    placeholder={['Primary','Secondary','Tertiary','Additional'][i] ?? 'Additional'}
                  />
                  {i > 2 && (
                    <Button size="icon" variant="ghost" onClick={() => setCols(cols.filter((_, idx) => idx !== i))}>
                      <X className="h-4 w-4"/>
                    </Button>
                  )}
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setCols([...cols, '#ffffff'])} className="cursor-pointer">
                + Add colour
              </Button>
            </Field>
            <hr/>

            {/* Links */}
            <Field label="Links" desc="Your website.">
              <div className="flex w-full">
                <span className="px-3 inline-flex items-center bg-muted border rounded-l-md select-none">
                  https://
                </span>
                <Input
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  className="rounded-l-none"
                />
              </div>
            </Field>
            <hr/>

            {/* Voice / Preferences */}
            <Field label="Brand voice" desc="Personality a brand adopts in its communications.">
              <Textarea rows={4} value={voice} onChange={e => setVoice(e.target.value)} placeholder="For example: Innovative, sophisticated, and minimalistic."/>
            </Field>
            <hr/>
            <Field label="Preferences" desc="Personal tastes, needs, and desires.">
              <Textarea rows={4} value={prefs} onChange={e => setPrefs(e.target.value)} placeholder="For example: We prefer a clean, uncluttered layout. It should be easy to navigate, with a focus on legibility and a balance between text and imagery."/>
            </Field>
            <hr/>
            
            <div className="flex justify-end gap-2">
              <Button
                className="bg-[#FFFFFF] border border-[#D0D5DD] text-foreground cursor-pointer"
                onClick={close}
                disabled={!name.trim()}
                variant="ghost"
              >
                Cancel
              </Button>
                             <Button
                 className="bg-[#4D3AF1] hover:bg-[#3a2dd6] text-white cursor-pointer"
                 onClick={save}
                 disabled={!name.trim()}
               >
                 {mode === 'create' ? 'Create' : 'Save'}
               </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 