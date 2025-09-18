import * as React from "react"

import { cn } from "@/lib/utils"

type SelectorValue = "Team" | "Client"

interface InputProps extends React.ComponentProps<"input"> {
  endSelect?: {
    value: SelectorValue
    onChange: (value: SelectorValue) => void
    options?: SelectorValue[]
    className?: string
  }
}

function Input({ className, type, endSelect, ...props }: InputProps) {
  if (!endSelect) {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        {...props}
      />
    )
  }

  const options: SelectorValue[] = endSelect.options && endSelect.options.length > 0 ? endSelect.options : ["Team", "Client"]

  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return
      if (event.target instanceof Node && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          "pr-24",
          className
        )}
        {...props}
      />
      <div className={cn("absolute inset-y-0 right-3 flex items-center", endSelect.className)}>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="h-7 inline-flex items-center gap-[5px] text-xs text-darkGrey font-medium cursor-pointer"
        >
          <span>{endSelect.value}</span>
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M5 7L10 12L15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {isOpen && (
          <div className="absolute right-0 top-[110%] z-10 w-28 rounded-md border border-input bg-white shadow-md">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { endSelect.onChange(opt); setIsOpen(false) }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-gray-50",
                  opt === endSelect.value ? "text-black" : "text-darkGrey"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { Input }
