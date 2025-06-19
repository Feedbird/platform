'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface WorkspaceModalProps {
  open: boolean
  onClose: () => void
  onAdd: (name: string, logo: string | null) => void
}

export function WorkspaceModal({ open, onClose, onAdd }: WorkspaceModalProps) {
  const [name, setName] = React.useState('')
  const [logo, setLogo] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // ✅ Reset fields every time modal is opened
  React.useEffect(() => {
    if (open) {
      setName('')
      setLogo(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, logo) // pass both name and logo
    onClose()
  }
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result
        if (typeof result === 'string') {
          setLogo(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className={`fixed inset-0 z-50 bg-secondary flex items-center justify-center p-6 ${open ? 'flex' : 'hidden'}`}>
      {/* Close button on top right */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-8 text-center"
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold mb-1 text-primary-foreground">Tell us about your workspace</h1>
          <p className="text-sm text-foreground">
            Type in your workspace name and optionally upload a logo.
          </p>
        </div>

        {/* Logo uploader */}
        <div className="flex justify-center">
          <div className="relative group">
            {logo ? (
              <div className="relative size-24 rounded-full overflow-hidden border border-muted">
                <Image
                  src={logo}
                  alt="Uploaded logo"
                  fill
                  className="object-cover transition-opacity cursor-pointer"
                />
                <button
                  type="button"
                  className="absolute cursor-pointer inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  onClick={() => {
                    setLogo(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="size-24 rounded-full flex flex-col items-center justify-center text-muted-foreground cursor-pointer"
              >
                <ImageIcon className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-medium">Workspace Logo</span>
              </Button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        {/* Input */}
        <div className="w-full flex justify-center">
          <Input
            id="workspace-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter workspace name"
            className="w-[260px] text-center"
            autoFocus
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()} className="cursor-pointer bg-foreground text-background cursor-pointer">
            Add Workspace
          </Button>
        </div>
      </form>
    </div>
  )
}
