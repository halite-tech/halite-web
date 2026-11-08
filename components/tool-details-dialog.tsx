"use client"

import { ArrowUpRight, X } from "@phosphor-icons/react"
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DialogViewport,
} from "@/components/ui/dialog"
import type { ReactNode } from "react"

type ToolDetails = {
  name: string
  description: string
  category: string
  website: string
  pricing: string
  summary: string
  stats: { label: string; value: string }[]
  solutionTypes?: { label: string; description: string }[]
}

export function ToolDetailsDialog({ tool, children }: { tool: ToolDetails; children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={`Learn more about ${tool.name}`}
            title="More"
            className="group w-full rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        }
      >
        {children}
      </DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogViewport>
          <DialogPopup>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-primary uppercase">{tool.category}</p>
                <DialogTitle>{tool.name}</DialogTitle>
              </div>
              <DialogClose aria-label="Close">
                <X size={18} />
              </DialogClose>
            </div>
            <DialogDescription className="mt-3">{tool.summary}</DialogDescription>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {tool.stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border/70 bg-background/40 p-4">
                  <p className="text-lg font-semibold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <a
                href={tool.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Visit website
                <ArrowUpRight size={14} />
              </a>
            </div>
          </DialogPopup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  )
}