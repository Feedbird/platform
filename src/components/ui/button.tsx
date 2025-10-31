import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "button-base",
  {
    variants: {
      variant: {
        default:
          "button-default",
        // New standardized naming
        primary:
          "button-primary",
        destructive:
          "button-destructive",
        outline:
          "button-outline",
        secondary:
          "button-secondary",
        ghost:
          "button-ghost",
        // Tertiary maps to a subtle/ghost style
        tertiary:
          "button-tertiary",
        // Disabled visual template; use with disabled attribute for semantics
        disabled:
          "button-disabled",
        link: "button-link",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
