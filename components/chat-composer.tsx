"use client"

import {
  ArrowClockwise,
  BookOpenText,
  Paperclip,
  PaperPlaneTilt,
  Plus,
  X,
} from "@phosphor-icons/react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"

export function ChatComposer() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null)
    event.target.value = ""
  }

  return (
    <div className="shrink-0 border-t border-border/70 p-4">
      <div className="rounded-xl border border-border bg-background/70 p-2 shadow-sm">
        {file && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs">
            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            <span className="shrink-0 text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              aria-label={`Remove ${file.name}`}
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
        <textarea
          aria-label="Message Halite"
          placeholder="Ask anything about your business..."
          className="min-h-16 w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between px-1 pt-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={handleFileChange}
              aria-label="Attach a file"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach a file"
              title="Attach a file"
            >
              <Paperclip size={16} />
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Start a new chat"
              title="New chat"
            >
              <Plus size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="View context"
              title="View context"
            >
              <BookOpenText size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Restart chat"
              title="Restart chat"
            >
              <ArrowClockwise size={16} />
            </Button>
          </div>
          <Button type="button" size="icon-sm" aria-label="Send message">
            <PaperPlaneTilt size={16} weight="fill" />
          </Button>
        </div>
      </div>
    </div>
  )
}
