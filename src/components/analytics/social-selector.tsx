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
        <button className="flex items-center gap-2 px-2 py-1.5 border border-buttonStroke rounded-md bg-white hover:bg-gray-50 transition-colors">
          {selectedAccount && (
            <>
              <Image
                src={`/images/platforms/${selectedAccount.platform}.svg`}
                alt={selectedAccount.platform}
                width={18}
                height={18}
              />
              <span className="text-sm font-medium text-black">{selectedAccount.name}</span>
            </>
          )}
          <ChevronDown className="text-darkGrey" style={{ width: '12px', height: '12px' }}/>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => onChange(account.id)}
            className={cn(
              'flex items-center gap-3 px-3 py-2',
              selected === account.id && 'bg-blue-50 text-blue-600'
            )}
          >
              <Image
                src={`/images/platforms/${account.platform}.svg`}
                alt={account.platform}
                width={18}
                height={18}
              />
              <div className="text-sm font-medium text-black">{account.name}</div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 