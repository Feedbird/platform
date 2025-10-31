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
  endButton?: {
    onClick: () => void
    label?: string
    className?: string
    disabled?: boolean
  }
}

function Input({ className, type, endSelect, endButton, ...props }: InputProps) {
  if (!endSelect && !endButton) {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          "input",
          className
        )}
        {...props}
      />
    )
  }

  const options: SelectorValue[] = endSelect && endSelect.options && endSelect.options.length > 0 ? endSelect.options : ["Team", "Client"]

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

  const rightPaddingClass = endSelect && endButton ? "pr-44" : (endSelect || endButton) ? "pr-24" : undefined

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type={type}
        data-slot="input"
        className={cn(
          "input",
          rightPaddingClass,
          className
        )}
        {...props}
      />
      <div className={cn("absolute inset-y-0 right-3 flex items-center gap-2", endButton ? "right-[5px]" : "right-3")}>
        {endSelect && (
          <div className={cn("relative", endSelect.className)}>
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
              <div className="absolute right-0 top-[110%] z-10 w-20 p-1 rounded-md border border-input bg-white shadow-md">
                {options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { endSelect.onChange(opt); setIsOpen(false) }}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm !leading-[14px] font-medium text-black cursor-pointer rounded-md",
                      opt === endSelect.value ? "bg-accent" : ""
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {endButton && (
          <button
            type="button"
            onClick={endButton.onClick}
            disabled={endButton.disabled}
            className={cn(
              "h-6.5 px-2.5 inline-flex items-center justify-center cursor-pointer rounded-[4px] bg-main text-white text-sm font-medium shadow-sm transition-colors hover:bg-main/80 disabled:opacity-50 disabled:cursor-not-allowed",
              endButton.className
            )}
          >
            {endButton.label ?? "Invite"}
          </button>
        )}
      </div>
    </div>
  )
}

export { Input }
