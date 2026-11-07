"use client"

import {
  Check,
  CaretDown,
  EnvelopeSimple,
  InstagramLogo,
  Phone,
} from "@phosphor-icons/react"
import { useState } from "react"

const contactOptions = [
  { label: "Email", value: "hello@halite.ai", icon: EnvelopeSimple },
  { label: "Phone", value: "+1 (555) 010-2048", icon: Phone },
  { label: "Instagram", value: "@halite.ai", icon: InstagramLogo },
]

export function ContactMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState<"copied" | "error" | null>(null)

  async function copyContact(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopyStatus("copied")
      setIsOpen(false)
      window.setTimeout(() => setCopyStatus(null), 1800)
    } catch {
      setCopyStatus("error")
      window.setTimeout(() => setCopyStatus(null), 2400)
    }
  }

  return (
    <div className="relative mt-8 inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        {copyStatus === "copied"
          ? "Copied"
          : copyStatus === "error"
            ? "Copy failed"
            : "Contact the Halite team"}
        {copyStatus === "copied" ? <Check className="size-4" /> : <CaretDown className="size-4" />}
      </button>
      {isOpen && (
        <div
          role="menu"
          aria-label="Contact options"
          className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-border bg-popover p-1.5 text-left shadow-xl"
        >
          {contactOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.label}
                type="button"
                role="menuitem"
                onClick={() => copyContact(option.value)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium">{option.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{option.value}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
