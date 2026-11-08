"use client"

import {
  ArrowsDownUp,
  FileCsv,
  FileDoc,
  FilePdf,
  FileText,
  FolderOpen,
  GridFour,
  List,
  Plus,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react"
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { analyzeDataset, deleteDatasetFile, getReport, uploadFiles, type UploadFile } from "@/lib/backend"

type StoredFile = UploadFile & { localName: string; size: number; lastModified: number; type: string }
type ViewMode = "list" | "grid"
type SortOrder = "newest" | "oldest"

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

function reportFiles(files: UploadFile[] = []): StoredFile[] {
  return files.map((file, index) => {
    const localName = file.name ?? file.filename ?? `Uploaded file ${index + 1}`
    return {
      ...file,
      localName,
      size: typeof file.size === "number" ? file.size : 0,
      lastModified: typeof file.last_modified === "number" ? file.last_modified : Date.now(),
      type: typeof file.type === "string" ? file.type : "",
    }
  })
}

export default function ContextPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<StoredFile[]>([])
  const [datasetId, setDatasetId] = useState<string | null>(null)
  const [view, setView] = useState<ViewMode>("list")
  const [query, setQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
  const [isUploading, setIsUploading] = useState(false)
  const [deletingFile, setDeletingFile] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const currentDatasetId = params.get("dataset_id")
    if (!currentDatasetId) return
    queueMicrotask(() => {
      setDatasetId(currentDatasetId)
      setStatus("Loading your business context…")
    })
    getReport(currentDatasetId)
      .catch((reason: Error) => {
        if (reason.message.includes("dataset not analyzed yet")) {
          setStatus("Rebuilding your business context…")
          return analyzeDataset(currentDatasetId)
        }
        throw reason
      })
      .then((report) => {
        setFiles(reportFiles(report.files))
        setStatus(null)
      })
      .catch((reason: Error) => {
        if (reason.message.includes("unknown dataset_id")) {
          params.delete("dataset_id")
          window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`)
          setDatasetId(null)
          setFiles([])
          setStatus("The previous business context is no longer available. Upload your files again.")
          return
        }
        setError(reason.message)
        setStatus(null)
      })
  }, [])

  const visibleFiles = useMemo(
    () =>
      files
        .filter((file) => `${file.localName} ${file.type} ${file.domain ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => (sortOrder === "newest" ? b.lastModified - a.lastModified : a.lastModified - b.lastModified)),
    [files, query, sortOrder]
  )

  async function uploadSelectedFiles(selected: File[]) {
    if (!selected.length) return
    setIsUploading(true)
    setError(null)
    setStatus("Uploading and mapping your files…")
    try {
      const ingest = await uploadFiles(selected, undefined, datasetId ?? undefined)
      setDatasetId(ingest.dataset_id)
      setStatus("Files uploaded. Running analysis…")
      const report = await analyzeDataset(ingest.dataset_id)
      setFiles(reportFiles(report.files ?? ingest.files))
      const params = new URLSearchParams(window.location.search)
      params.set("dataset_id", ingest.dataset_id)
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`)
      window.dispatchEvent(new PopStateEvent("popstate"))
      setStatus("Your business context is ready in the app.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed")
      setStatus(null)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDeleteFile(file: StoredFile) {
    if (!datasetId || deletingFile || !window.confirm(`Delete ${file.localName}?`)) return
    setDeletingFile(file.localName)
    setError(null)
    setStatus(`Deleting ${file.localName}…`)
    try {
      const dataset = await deleteDatasetFile(datasetId, file.localName)
      const report = await analyzeDataset(datasetId)
      setFiles(reportFiles(report.files ?? dataset.files))
      setStatus("File deleted. Your business context was updated.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Delete failed")
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
                  <Button variant="outline" size="icon" className="size-10 text-muted-foreground hover:text-foreground" onClick={() => setView((current) => (current === "list" ? "grid" : "list"))} aria-label="Change file view">
                    {view === "list" ? <List size={17} /> : <GridFour size={17} />}
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
            ) : view === "list" ? (
              <div className="space-y-2.5">
                {visibleFiles.map((file, index) => (
                  <div key={`${file.localName}-${file.domain ?? file.type}-${file.lastModified}-${index}`} className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/30 p-3">
                    <FileIcon file={file} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{file.localName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{(file.domain ?? file.type) || "Uploaded file"} · {formatSize(file.size)}</p>
                    </div>
                    <time className="hidden text-xs text-muted-foreground sm:block">{new Date(file.lastModified).toLocaleDateString()}</time>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => void handleDeleteFile(file)}
                      disabled={Boolean(deletingFile)}
                      aria-label={`Delete ${file.localName}`}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleFiles.map((file, index) => (
                  <div key={`${file.localName}-${file.domain ?? file.type}-${file.lastModified}-${index}`} className="rounded-xl border border-border/70 bg-background/30 p-4">
                    <FileIcon file={file} large />
                    <p className="mt-4 truncate text-sm font-medium">{file.localName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{(file.domain ?? file.type) || "Uploaded file"} · {formatSize(file.size)}</p>
                    <time className="mt-3 block text-xs text-muted-foreground">{new Date(file.lastModified).toLocaleDateString()}</time>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-muted-foreground hover:text-destructive"
                      onClick={() => void handleDeleteFile(file)}
                      disabled={Boolean(deletingFile)}
                    >
                      <Trash size={15} />
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {datasetId && <p className="mt-4 text-xs text-muted-foreground">Context is available to the app for this session.</p>}
      </div>
    </main>
  )
}
