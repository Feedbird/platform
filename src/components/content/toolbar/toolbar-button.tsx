// components/content/toolbar/ToolbarButton.tsx
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu'
import type { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface ToolbarButtonProps extends React.ComponentProps<typeof Button> {
  icon: LucideIcon
  label: string
  active?: boolean
}


export function ToolbarButton({ icon: Icon, label, active, ...rest }: ToolbarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-7 gap-1 px-2 text-sm', active && 'bg-muted')}
      {...rest}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Button>
  )
}

interface StayOpenItemProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  children: ReactNode
}

export function StayOpenItem({ checked, onCheckedChange, children }: StayOpenItemProps) {
  return (
    <DropdownMenuCheckboxItem
      checked={checked}
      onSelect={(e) => {
        e.preventDefault()
        onCheckedChange(!checked)
      }}
    >
      {children}
    </DropdownMenuCheckboxItem>
  )
}
// components/content/toolbar/ToolbarSeparator.tsx
export const ToolbarSeparator = () => (
  <div className="h-4 w-px bg-border mx-1" />
)
