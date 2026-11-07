"use client"

import {
  ArrowsDownUp,
  DownloadSimple,
  FileCsv,
  FileDoc,
  FilePdf,
  FileText,
  FolderOpen,
  GridFour,
  List,
  MagnifyingGlass,
  Plus,
  Trash,
  Eye,
} from "@phosphor-icons/react"
import { useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const files = [
  {
    name: "2024 Business Plan.pdf",
    type: "PDF",
    date: "Oct 24, 2024",
    size: "2.4 MB",
    icon: FilePdf,
    color: "bg-rose-500/10 text-rose-300",
  },
  {
    name: "Q3 Revenue Report.csv",
    type: "CSV",
    date: "Oct 18, 2024",
    size: "184 KB",
    icon: FileCsv,
    color: "bg-emerald-500/10 text-emerald-300",
  },
  {
    name: "Brand Voice & Guidelines.docx",
    type: "DOCX",
    date: "Oct 11, 2024",
    size: "1.1 MB",
    icon: FileDoc,
    color: "bg-blue-500/10 text-blue-300",
  },
  {
    name: "Customer Personas.pdf",
    type: "PDF",
    date: "Sep 29, 2024",
    size: "3.8 MB",
    icon: FilePdf,
    color: "bg-rose-500/10 text-rose-300",
  },
  {
    name: "Team Meeting Notes.txt",
    type: "TXT",
    date: "Sep 21, 2024",
    size: "46 KB",
    icon: FileText,
    color: "bg-violet-500/10 text-violet-300",
  },
  {
    name: "Marketing Campaign Results.csv",
    type: "CSV",
    date: "Sep 14, 2024",
    size: "296 KB",
    icon: FileCsv,
    color: "bg-emerald-500/10 text-emerald-300",
  },
]

type ViewMode = "list" | "grid"
type SortOrder = "newest" | "oldest"

function FileIcon({
  file,
  size = "default",
}: {
  file: (typeof files)[number]
  size?: "default" | "large"
}) {
  const Icon = file.icon

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl ${file.color} ${
        size === "large" ? "size-12" : "size-10"
      }`}
    >
      <Icon size={size === "large" ? 25 : 21} weight="duotone" />
    </div>
  )
}

function FileActions({ file }: { file: (typeof files)[number] }) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        aria-label={`View ${file.name}`}
        title="View"
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Eye className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`Download ${file.name}`}
        title="Download"
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <DownloadSimple className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`Delete ${file.name}`}
        title="Delete"
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash className="size-4" />
      </button>
    </div>
  )
}

export default function ContextPage() {
  const [view, setView] = useState<ViewMode>("list")
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")

  const visibleFiles = files
    .filter((file) => {
      const searchableText = `${file.name} ${file.type}`.toLowerCase()
      return searchableText.includes(query.trim().toLowerCase())
    })
    .sort((a, b) => {
      const dateDifference = new Date(b.date).getTime() - new Date(a.date).getTime()
      return sortOrder === "newest" ? dateDifference : -dateDifference
    })

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wide text-primary uppercase">
              <FolderOpen size={15} weight="duotone" />
              Business context
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Your business files
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Everything Halite knows about your business, organized in one place.
            </p>
          </div>
          <Button className="gap-2">
            <Plus size={16} />
            Add files
          </Button>
        </div>

        <Card className="overflow-hidden border-border/70 bg-card/60 py-0">
          <CardHeader className="gap-5 border-b border-border/70 px-5 py-6 sm:px-7 sm:py-7">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <CardTitle className="text-base">Stored files</CardTitle>
                <CardDescription className="mt-1">6 files available to your AI co-pilot</CardDescription>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap">
                <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background/60 px-3 text-sm text-muted-foreground transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 sm:w-64 sm:flex-none">
                  <MagnifyingGlass size={16} className="shrink-0" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search files"
                    aria-label="Search files"
                    className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-10 text-muted-foreground hover:text-foreground"
                  onClick={() => setSortOrder((order) => (order === "newest" ? "oldest" : "newest"))}
                  aria-label={`Sort files: ${sortOrder === "newest" ? "newest first" : "oldest first"}`}
                  title={`Sort ${sortOrder === "newest" ? "oldest first" : "newest first"}`}
                >
                  <ArrowsDownUp size={15} />
                </Button>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-10 bg-background/60 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsViewMenuOpen((open) => !open)}
                    aria-label="Choose file view"
                    aria-expanded={isViewMenuOpen}
                    aria-haspopup="menu"
                  >
                    {view === "list" ? <List size={17} /> : <GridFour size={17} />}
                  </Button>
                  {isViewMenuOpen && (
                    <div
                      role="menu"
                      aria-label="File view options"
                      className="absolute right-0 z-20 mt-2 w-36 rounded-lg border border-border bg-popover p-1 shadow-lg"
                    >
                      {[
                        { value: "list" as const, label: "List view", icon: List },
                        { value: "grid" as const, label: "Card view", icon: GridFour },
                      ].map((option) => {
                        const OptionIcon = option.icon
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setView(option.value)
                              setIsViewMenuOpen(false)
                            }}
                            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted ${
                              view === option.value ? "bg-muted text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            <OptionIcon size={16} />
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className={view === "list" ? "px-0 py-0" : "grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3"}>
            {visibleFiles.map((file) =>
              view === "list" ? (
                <div
                  key={file.name}
                  className="flex items-center gap-4 border-b border-border/60 px-5 py-4 last:border-b-0 sm:px-6"
                >
                  <FileIcon file={file} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{file.type}</p>
                  </div>
                  <p className="hidden w-32 text-xs text-muted-foreground sm:block">{file.date}</p>
                  <p className="hidden w-20 text-right text-xs text-muted-foreground sm:block">{file.size}</p>
                  <FileActions file={file} />
                </div>
              ) : (
                <div
                  key={file.name}
                  className="group rounded-xl border border-border/70 bg-background/30 p-4 transition-colors hover:border-primary/30 hover:bg-muted/30"
                >
                  <div className="mb-8 flex items-start justify-between">
                    <FileIcon file={file} size="large" />
                    <FileActions file={file} />
                  </div>
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{file.date}</span>
                    <span>{file.size}</span>
                  </div>
                </div>
              )
            )}
            {visibleFiles.length === 0 && (
              <div
                className={`px-6 py-12 text-center ${
                  view === "grid" ? "col-span-full flex min-h-48 flex-col items-center justify-center" : ""
                }`}
              >
                <p className="text-sm font-medium">No files found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a different search term.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
