import { cn } from "@/lib/utils"
import { VariantProps, cva } from "class-variance-authority"
import { HTMLAttributes, forwardRef } from "react"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary hover:bg-primary/80 text-primary-foreground",
        draft: "bg-gray-100 text-gray-800",
        pending: "bg-blue-100 text-blue-800",
        needsRevision: "bg-amber-100 text-amber-800",
        approved: "bg-green-100 text-green-800",
        scheduled: "bg-purple-100 text-purple-800",
        posted: "bg-teal-100 text-teal-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface StatusBadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        className={cn(statusBadgeVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

StatusBadge.displayName = "StatusBadge"

export { StatusBadge, statusBadgeVariants }