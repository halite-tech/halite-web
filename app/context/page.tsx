"use client"

import {
  ArrowsDownUp,
  Check,
  FileCsv,
  FileDoc,
  FilePdf,
  FileText,
  FolderOpen,
  Plus,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogViewport,
} from "@/components/ui/dialog"
import { deleteContextFiles as deleteStoredFiles, listContextFiles, saveContextFiles, type ContextFileMetadata } from "@/lib/context-storage"

type StoredFile = ContextFileMetadata & { localName: string; domain?: string | null }
type SortOrder = "newest" | "oldest"
type PendingDelete =
  | { type: "file"; file: StoredFile }
  | { type: "selected"; filenames: string[] }

function iconForFile(name: string) {
  const extension = name.split(".").pop()?.toLowerCase()
  if (extension === "csv") return { icon: FileCsv, color: "bg-emerald-500/10 text-emerald-300" }
  if (extension === "pdf") return { icon: FilePdf, color: "bg-rose-500/10 text-rose-300" }
  if (["doc", "docx"].includes(extension ?? "")) return { icon: FileDoc, color: "bg-blue-500/10 text-blue-300" }
  return { icon: FileText, color: "bg-violet-500/10 text-violet-300" }
}

function FileIcon({ file, large = false }: { file: StoredFile; large?: boolean }) {
  const { icon: Icon, color } = iconForFile(file.localName)
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-xl ${color} ${large ? "size-12" : "size-10"}`}>
      <Icon size={large ? 25 : 21} weight="duotone" />
    </div>
  )
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fileTitle(filename: string) {
  return filename.replace(/\.[^./]+$/, "")
}

function fileType(filename: string) {
  return filename.split(".").pop()?.toUpperCase() || "FILE"
}

function reportFiles(files: ContextFileMetadata[] = []): StoredFile[] {
  return files.map((file, index) => {
    const localName = file.name || `Uploaded file ${index + 1}`
    return {
      ...file,
      localName,
      size: typeof file.size === "number" ? file.size : 0,
      lastModified: typeof file.lastModified === "number" ? file.lastModified : Date.now(),
      type: typeof file.type === "string" ? file.type : "",
    }
  })
}

function optimisticFiles(selected: File[]): StoredFile[] {
  const uploadedAt = Date.now()
  return selected.map((file) => ({
    name: file.name,
    filename: file.name,
    localName: file.name,
    size: file.size,
    lastModified: uploadedAt,
    type: file.type,
  }))
}

export default function ContextPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const storageUserId = user?.id ?? "local"
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<StoredFile[]>([])
  const [query, setQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
  const [isUploading, setIsUploading] = useState(false)
  const [deletingFile, setDeletingFile] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isDragActive, setIsDragActive] = useState(false)
  const [status, setStatus] = useState<string | null>("Loading your business context…")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/")
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    let active = true
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname)
    listContextFiles(storageUserId)
      .then((context) => {
        if (!active) return
        setFiles(reportFiles(context))
        setStatus(context.length ? null : "Upload your files to create your business context.")
      })
      .catch((reason: Error) => {
        if (!active) return
        if (reason.message.includes("no files uploaded")) {
          setFiles([])
          setStatus("Upload your files to create your business context.")
          return
        }
        setError(reason.message)
        setStatus(null)
      })
    return () => {
      active = false
    }
  }, [isLoaded, isSignedIn, storageUserId])

  const visibleFiles = useMemo(
    () =>
      files
        .filter((file) => `${file.localName} ${file.type} ${file.domain ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => (sortOrder === "newest" ? b.lastModified - a.lastModified : a.lastModified - b.lastModified)),
    [files, query, sortOrder]
  )
  const allVisibleSelected = visibleFiles.length > 0 && visibleFiles.every((file) => selectedFiles.has(file.localName))

  if (!isLoaded || !isSignedIn) return null

  function toggleSelected(filename: string) {
    setSelectedFiles((current) => {
      const next = new Set(current)
      if (next.has(filename)) next.delete(filename)
      else next.add(filename)
      return next
    })
  }

  function toggleAllVisible() {
    setSelectedFiles((current) => {
      const next = new Set(current)
      if (allVisibleSelected) visibleFiles.forEach((file) => next.delete(file.localName))
      else visibleFiles.forEach((file) => next.add(file.localName))
      return next
    })
  }

  async function uploadSelectedFiles(selected: File[]) {
    if (!selected.length) return
    const optimistic = optimisticFiles(selected)
    const optimisticByName = new Map(optimistic.map((file) => [file.localName, file]))
    setFiles((current) => [
      ...current.filter((file) => !optimisticByName.has(file.localName)),
      ...optimistic,
    ])
    setIsUploading(true)
    setError(null)
    setStatus("Uploading your files…")
    try {
      await saveContextFiles(storageUserId, selected)
      setSelectedFiles(new Set())
      setStatus("Files uploaded and saved.")
    } catch (reason) {
      const saved = await listContextFiles(storageUserId)
      setFiles(reportFiles(saved))
      setError(reason instanceof Error ? reason.message : "Upload failed")
      setStatus(null)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDeleteFile(file: StoredFile) {
    if (deletingFile) return
    const previousFiles = files
    setFiles((current) => current.filter((candidate) => candidate.localName !== file.localName))
    setDeletingFile(file.localName)
    setError(null)
    setStatus(`Deleting ${file.localName}…`)
    try {
      await deleteStoredFiles(storageUserId, [file.localName])
      setSelectedFiles((current) => {
        const next = new Set(current)
        next.delete(file.localName)
        return next
      })
      setStatus("File deleted.")
    } catch (reason) {
      setFiles(previousFiles)
      setError(reason instanceof Error ? reason.message : "Delete failed")
      setStatus(null)
    } finally {
      setDeletingFile(null)
    }
  }

  async function handleDeleteSelected() {
    if (deletingFile || selectedFiles.size === 0) return
    const filenames = Array.from(selectedFiles)
    const previousFiles = files
    setFiles((current) => current.filter((file) => !selectedFiles.has(file.localName)))
    setDeletingFile("selected")
    setError(null)
    setStatus(`Deleting ${filenames.length} selected files…`)
    try {
      await deleteStoredFiles(storageUserId, filenames)
      setSelectedFiles(new Set())
      setStatus("Selected files deleted.")
    } catch (reason) {
      setFiles(previousFiles)
      setError(reason instanceof Error ? reason.message : "Bulk delete failed")
      setStatus(null)
    } finally {
      setDeletingFile(null)
    }
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ""
    void uploadSelectedFiles(selected)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
    if (!isUploading) setIsDragActive(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragActive(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragActive(false)
    if (isUploading) return
    void uploadSelectedFiles(Array.from(event.dataTransfer.files))
  }

  return (
    <main
      className={`min-h-screen bg-background transition-colors ${isDragActive ? "bg-primary/[0.03]" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wide text-primary uppercase">
              <FolderOpen size={15} weight="duotone" />
              Business context
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Your business files</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Upload the files Halite should use to understand your business.</p>
          </div>
          <label className={`inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 ${isUploading ? "pointer-events-none opacity-60" : ""}`}>
            <Plus size={16} />
            {isUploading ? "Uploading…" : "Add files"}
            <input ref={inputRef} type="file" multiple accept=".csv,.xlsx,.xls,.xlsm" className="sr-only" onChange={handleUpload} />
          </label>
        </div>

        <Card
          className={`overflow-hidden border-border/70 bg-card/60 py-0 transition-colors ${isDragActive ? "border-primary/60 bg-primary/[0.06]" : ""}`}
        >
          <CardHeader className="gap-5 border-b border-border/70 px-5 py-6 sm:px-7 sm:py-7">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <CardTitle className="text-base">Stored files</CardTitle>
                <CardDescription className="mt-1">
                  {files.length ? `${files.length} file${files.length === 1 ? "" : "s"} available to your AI co-pilot` : "No files uploaded yet"}
                </CardDescription>
              </div>
              {files.length > 0 && (
                <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap">
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files" aria-label="Search files" className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background/60 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring sm:w-64 sm:flex-none" />
                  <Button variant="outline" size="icon" className="size-10 text-muted-foreground hover:text-foreground" onClick={() => setSortOrder((order) => (order === "newest" ? "oldest" : "newest"))} aria-label="Change file date order">
                    <ArrowsDownUp size={15} />
                  </Button>
                  <Button variant={allVisibleSelected ? "default" : "outline"} size="default" className={`h-10 ${allVisibleSelected ? "" : "text-muted-foreground hover:text-foreground"}`} onClick={toggleAllVisible}>
                    {allVisibleSelected ? "Deselect all" : "Select all"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="default"
                    className="h-10"
                    disabled={!selectedFiles.size || Boolean(deletingFile)}
                    onClick={() => setPendingDelete({ type: "selected", filenames: Array.from(selectedFiles) })}
                  >
                    <Trash size={15} />
                    Delete{selectedFiles.size ? ` (${selectedFiles.size})` : ""}
                  </Button>
                </div>
              )}
            </div>
            {(status || error) && <p className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>{error ?? status}</p>}
          </CardHeader>
          <CardContent className="px-4 py-4 sm:px-5">
            {visibleFiles.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
                <UploadSimple className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {query ? "No files match your search." : isDragActive ? "Drop your business files here." : "Upload business files or drop them here to give Halite context."}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {visibleFiles.map((file, index) => (
                  <div key={`${file.localName}-${file.domain ?? file.type}-${file.lastModified}-${index}`} className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/30 p-3">
                    <label className="flex shrink-0 cursor-pointer items-center" aria-label={`Select ${file.localName}`}>
                      <input type="checkbox" checked={selectedFiles.has(file.localName)} onChange={() => toggleSelected(file.localName)} className="sr-only" />
                      <span className={`flex size-4 items-center justify-center rounded-[4px] border transition-colors ${selectedFiles.has(file.localName) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/60"}`}>
                        {selectedFiles.has(file.localName) && <Check size={11} weight="bold" />}
                      </span>
                    </label>
                    <FileIcon file={file} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{fileTitle(file.localName)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{fileType(file.localName)} · {formatSize(file.size)}</p>
                    </div>
                    <time className="hidden text-xs text-muted-foreground sm:block">{new Date(file.lastModified).toLocaleDateString()}</time>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setPendingDelete({ type: "file", file })}
                      disabled={Boolean(deletingFile)}
                      aria-label={`Delete ${file.localName}`}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Dialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null) }}>
          <DialogPortal>
            <DialogBackdrop />
            <DialogViewport>
              <DialogPopup className="max-w-md">
                <DialogTitle>Delete {pendingDelete?.type === "file" ? "file" : "selected files"}?</DialogTitle>
                <DialogDescription className="mt-2">
                  {pendingDelete?.type === "file"
                    ? `This will permanently remove ${pendingDelete.file.localName} from your business context.`
                    : `This will permanently remove ${pendingDelete?.filenames.length ?? 0} selected files from your business context.`}
                </DialogDescription>
                <div className="mt-6 flex justify-end gap-2">
                  <DialogClose render={<Button variant="outline">Cancel</Button>} />
                  <Button
                    variant="destructive"
                    disabled={Boolean(deletingFile)}
                    onClick={() => {
                      const request = pendingDelete
                      setPendingDelete(null)
                      if (request?.type === "file") void handleDeleteFile(request.file)
                      if (request?.type === "selected") void handleDeleteSelected()
                    }}
                  >
                    <Trash size={15} />
                    Delete
                  </Button>
                </div>
              </DialogPopup>
            </DialogViewport>
          </DialogPortal>
        </Dialog>
        <p className="mt-4 text-xs text-muted-foreground">Your business context stays in this browser until you remove it.</p>
      </div>
    </main>
  )
}
