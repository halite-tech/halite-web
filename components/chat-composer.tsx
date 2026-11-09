"use client"

import { Paperclip, PaperPlaneTilt } from "@phosphor-icons/react"
import { useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"

export function ChatComposer({
  disabled = false,
  onSend,
  onAttachFiles,
}: {
  disabled?: boolean
  onSend: (message: string) => void
  onAttachFiles: (files: File[]) => Promise<void>
}) {
  const [message, setMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)

  function submit() {
    const trimmed = message.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setMessage("")
  }

  async function handleAttach(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (!files.length || disabled || isUploading) return
    setIsUploading(true)
    setUploadStatus("Saving to context…")
    try {
      await onAttachFiles(files)
      setUploadStatus(`${files.length} file${files.length === 1 ? "" : "s"} saved to context`)
      window.setTimeout(() => setUploadStatus(null), 3000)
    } catch (reason) {
      setUploadStatus(reason instanceof Error ? reason.message : "Could not save files")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="shrink-0 border-t border-border/70 p-4">
      <div className="rounded-xl border border-border bg-background/70 p-2 shadow-sm">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
          disabled={disabled}
          aria-label="Message Halite"
          placeholder="Ask anything about your business..."
          className="min-h-16 w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="flex items-center justify-between gap-3 px-1 pt-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <label
              htmlFor="chat-attachment"
              className={`inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${disabled || isUploading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
              title="Attach file"
            >
              <Paperclip size={17} />
              <span className="sr-only">Attach file</span>
            </label>
            <input
              id="chat-attachment"
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.xlsm"
              className="sr-only"
              onChange={handleAttach}
              disabled={disabled || isUploading}
            />
            {uploadStatus && <span className="truncate text-xs text-muted-foreground">{uploadStatus}</span>}
          </div>
          <Button type="button" size="icon-sm" onClick={submit} disabled={disabled || !message.trim()} aria-label="Send message">
            <PaperPlaneTilt size={16} weight="fill" />
          </Button>
        </div>
      </div>
    </div>
  )
}
