'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Image from 'next/image'
import { Platform } from '@/lib/social/platforms/platform-types'

export interface SocialAccountOption {
  id: string
  platform: Platform
  name: string
  handle: string
}

interface SocialSelectorProps {
  accounts: SocialAccountOption[]
  selected: string
  onChange: (accountId: string) => void
}

export function SocialSelector({ accounts, selected, onChange }: SocialSelectorProps) {
  const selectedAccount = accounts.find(acc => acc.id === selected)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors">
          {selectedAccount && (
            <>
              <div className="w-5 h-5 flex items-center justify-center">
                <Image
                  src={`/images/platforms/${selectedAccount.platform}.svg`}
                  alt={selectedAccount.platform}
                  width={16}
                  height={16}
                />
              </div>
              <span className="text-sm font-medium">{selectedAccount.name}</span>
            </>
          )}
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => onChange(account.id)}
            className={cn(
              'flex items-center gap-3 px-3 py-2',
              selected === account.id && 'bg-blue-50 text-blue-600'
            )}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <Image
                src={`/images/platforms/${account.platform}.svg`}
                alt={account.platform}
                width={16}
                height={16}
              />
            </div>
            <div>
              <div className="text-sm font-medium">{account.name}</div>
              <div className="text-xs text-gray-500">@{account.handle}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 