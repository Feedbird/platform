/* components/brand/brand-details-sidebar.tsx */
'use client'

import * as React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  X, Edit, Globe, Palette, Type, MessageSquare, Settings,
} from 'lucide-react'
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────── */
interface BrandDetailsSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditClick: () => void
}

export default function BrandDetailsSidebar({ 
  open, 
  onOpenChange, 
  onEditClick 
}: BrandDetailsSidebarProps) {
  /* store -------------------------------------------------------- */
  const store = useFeedbirdStore()
  const brand = store.getActiveBrand()

  const close = () => onOpenChange(false)

  if (!brand) return null

  return (
    <div className={cn(
      'fixed inset-y-0 right-0 z-50 w-96 bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out',
      open ? 'translate-x-0' : 'translate-x-full'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Brand Details</h2>
        <Button variant="ghost" size="icon" onClick={close} className="cursor-pointer">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-4">
            {brand.logo ? (
              <div className="relative w-16 h-16">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <Type className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{brand.name}</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onEditClick}
                className="mt-2 cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Brand
              </Button>
            </div>
          </div>

          <Separator />

          {/* Website */}
          {brand.link && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Website</h4>
              </div>
              <a 
                href={brand.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {brand.link}
              </a>
            </div>
          )}

          {/* Colors */}
          {brand.styleGuide?.colors && brand.styleGuide.colors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Colors</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {brand.styleGuide.colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-muted-foreground">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fonts */}
          {brand.styleGuide?.fonts && brand.styleGuide.fonts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Fonts</h4>
              </div>
              <div className="space-y-1">
                {brand.styleGuide.fonts.map((font, index) => (
                  <div key={index} className="text-sm">
                    <span 
                      className="font-medium"
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand Voice */}
          {brand.voice && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Brand Voice</h4>
              </div>
              <p className="text-sm text-muted-foreground">{brand.voice}</p>
            </div>
          )}

          {/* Preferences */}
          {brand.prefs && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Preferences</h4>
              </div>
              <p className="text-sm text-muted-foreground">{brand.prefs}</p>
            </div>
          )}

          {/* Created Info */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Brand ID: {brand.id}
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
} 