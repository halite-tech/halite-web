"use client"

import { ArrowUpRight, Check, CircleNotch, Copy, Globe, X } from "@phosphor-icons/react"
import { useUser } from "@clerk/nextjs"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { useAppSession } from "@/components/app-session"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getContextReport, plainText, streamToolRecommendations, streamUserProblemTools, type Report, type ReportProblem, type ToolRecommendation, type ToolRecommendationGroup } from "@/lib/backend"
import { readContextFiles } from "@/lib/context-storage"

function problemTitle(problem: ReportProblem | string) {
  return plainText(typeof problem === "string" ? problem : problem.label)
}

function problemKey(problem: ReportProblem | string) {
  return problemTitle(problem).trim().toLowerCase().replace(/\s+/g, " ")
}

function problemDescription(problem: ReportProblem | string) {
  if (typeof problem === "string") return "Tell Halite more about this problem to find the right tools."
  return plainText(problem.description ?? problem.summary ?? "Tell Halite more about this problem to find the right tools.")
}

function toolLogoCandidates(tool: ToolRecommendation) {
  const candidates = tool.tool_logo_url && /^https?:\/\//i.test(tool.tool_logo_url)
    ? [tool.tool_logo_url]
    : []
  try {
    const hostname = new URL(tool.tool_home_page).hostname.replace(/^www\./, "")
    candidates.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`)
  } catch {
    // Use initials when the recommendation does not contain a valid homepage.
  }
  return candidates
}

function toolInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function ToolLogo({ tool }: { tool: ToolRecommendation }) {
  const [candidateIndex, setCandidateIndex] = useState(0)
  const candidates = toolLogoCandidates(tool)
  const source = candidates[candidateIndex]

  if (!source) {
    return <span className="text-xs font-semibold text-primary">{toolInitials(tool.tool_name)}</span>
  }

  return (
    <Image
      src={source}
      alt=""
      width={24}
      height={24}
      className="size-6 object-contain"
      unoptimized
      onError={() => setCandidateIndex((index) => index + 1)}
    />
  )
}

function ToolRow({
  tool,
  selected,
  onToggle,
  onOpenAdopt,
}: {
  tool: ToolRecommendation
  selected?: boolean
  onToggle?: () => void
  onOpenAdopt?: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      {onToggle && (
        <button
          type="button"
          aria-label={`${selected ? "Remove" : "Add"} ${tool.tool_name} from comparison`}
          aria-pressed={selected}
          onClick={(event) => {
            event.stopPropagation()
            onToggle()
          }}
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border/70 text-muted-foreground hover:border-primary/50"}`}
        >
          {selected ? <Check size={15} weight="bold" /> : <span className="text-lg leading-none">+</span>}
        </button>
      )}
      <div
        role={onOpenAdopt ? "button" : undefined}
        tabIndex={onOpenAdopt ? 0 : undefined}
        onClick={onOpenAdopt}
        onKeyDown={(event) => {
          if (onOpenAdopt && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault()
            onOpenAdopt()
          }
        }}
        className={`flex min-w-0 flex-1 items-center gap-4 rounded-lg border border-border/70 bg-background/30 p-3 transition-colors ${onOpenAdopt ? "cursor-pointer hover:border-primary/30 hover:bg-muted/40" : ""}`}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background p-2.5">
          <ToolLogo tool={tool} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{tool.tool_name}</p>
              {tool.solution_types?.map((type) => (
                <span key={type.label} title={type.description} className="hidden rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground sm:inline">
                  {type.label}
                </span>
              ))}
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">{plainText(tool.tool_tagline ?? "Explore this tool for your business.")}</p>
        </div>
        <span className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors group-hover:text-foreground">
          <ArrowUpRight size={17} />
        </span>
      </div>
    </div>
  )
}

function CompareDialog({
  problem,
  tools,
  open,
  onOpenChange,
  onAdopt,
}: {
  problem: string
  tools: ToolRecommendation[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdopt: (tool: ToolRecommendation) => void
}) {
  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogViewport className="overflow-y-auto">
          <DialogPopup className="my-4 max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto p-4 sm:my-6 sm:max-h-[calc(100dvh-3rem)] sm:max-w-[calc(100vw-3rem)] sm:p-6 lg:max-w-5xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-medium tracking-wide text-primary uppercase">Compare tools</p>
                <DialogTitle>{problem}</DialogTitle>
                <DialogDescription className="mt-2">Compare options for this problem, then open an adoption plan for your choice.</DialogDescription>
              </div>
              <DialogClose aria-label="Close"><X size={18} /></DialogClose>
            </div>
            <div className="mt-6 overflow-x-auto">
              <div className="grid min-w-[640px] gap-3" style={{ gridTemplateColumns: `140px repeat(${tools.length}, minmax(150px, 1fr))` }}>
                <div />
                {tools.map((tool) => (
                  <div
                    key={tool.tool_name}
                    role="button"
                    tabIndex={0}
                    onClick={() => onAdopt(tool)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        onAdopt(tool)
                      }
                    }}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/40 p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="flex min-w-0 items-center gap-2"><ToolLogo tool={tool} /><span className="truncate text-sm font-medium">{tool.tool_name}</span></div>
                    <ArrowUpRight className="shrink-0 text-muted-foreground" size={16} />
                  </div>
                ))}
                {[
                  ["One-liner", (tool: ToolRecommendation) => plainText(tool.tool_tagline ?? "Not publicly available")],
                  ["Pricing", (tool: ToolRecommendation) => plainText(tool.tool_pricing ?? "Not publicly available")],
                  ["Fit type", (tool: ToolRecommendation) => tool.category === "platform_integrated" ? "Fits your POS stack" : "Highest ROI standalone"],
                  ["What it does", (tool: ToolRecommendation) => tool.solution_types?.map((type) => type.label).join(", ") || "Restaurant operations"],
                  ["Details", (tool: ToolRecommendation) => plainText(tool.tool_description ?? "Not publicly available")],
                ].map(([label, value], rowIndex, rows) => (
                  <div key={String(label)} className="contents">
                    <div className={`flex items-center ${rowIndex < rows.length - 1 ? "border-b border-border/60" : ""} py-3 text-xs font-medium text-muted-foreground`}>{String(label)}</div>
                    {tools.map((tool) => <div key={`${String(label)}-${tool.tool_name}`} className={`${rowIndex < rows.length - 1 ? "border-b border-border/60" : ""} py-3 text-xs leading-5`}>{(value as (tool: ToolRecommendation) => string)(tool)}</div>)}
                  </div>
                ))}
              </div>
            </div>
          </DialogPopup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  )
}

function AdoptionDialog({
  problem,
  tool,
  recommendation,
  open,
  onOpenChange,
}: {
  problem: string
  tool: ToolRecommendation
  recommendation?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [copied, setCopied] = useState(false)
  const plan = `Problem: ${problem}\nChosen tool: ${tool.tool_name}\nNext steps:\n1. Book a demo or review pricing: ${tool.tool_home_page}\n2. Confirm the fit against your current process and constraints.\n3. Prepare the data this tool needs, then set a measurable success target.`
  async function copyPlan() {
    await navigator.clipboard.writeText(plan)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogViewport className="overflow-y-auto">
          <DialogPopup className="my-4 max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:my-6 sm:max-h-[calc(100dvh-3rem)] sm:max-w-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-medium tracking-wide text-primary uppercase">Adoption plan</p>
                <DialogTitle>Start with {tool.tool_name}</DialogTitle>
                <DialogDescription className="mt-2">{problem}</DialogDescription>
              </div>
              <DialogClose aria-label="Close"><X size={18} /></DialogClose>
            </div>
            {recommendation && <p className="mt-5 rounded-xl border border-primary/20 bg-primary/[0.05] p-4 text-sm leading-6 text-muted-foreground">{recommendation}</p>}
            <div className="mt-5 space-y-3">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">Your Monday morning plan</p>
              {[
                ["This week", "Book a demo or review pricing and integrations."],
                ["Before you buy", "Confirm the workflow fits your staff, budget, and current systems."],
                ["Data to connect", "Prepare the export or process data this tool needs and define one success metric."],
              ].map(([label, detail], index) => (
                <div key={label} className="flex gap-3 rounded-xl border border-border/70 bg-background/40 p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span>
                  <div><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={tool.tool_home_page} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">View pricing / start trial <ArrowUpRight size={14} /></a>
              <button type="button" onClick={() => void copyPlan()} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium"><Copy size={14} />{copied ? "Copied plan" : "Copy plan"}</button>
            </div>
          </DialogPopup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  )
}

function ProblemCard({
  problem,
  tools,
  finalRecommendation,
  onFindTools,
  isSearching,
  progress,
  elapsedSeconds = 0,
  selectedTools,
  onToggleCompare,
  onOpenAdopt,
  onSelectAll,
  onCompare,
}: {
  problem: ReportProblem | string
  tools: ToolRecommendation[]
  finalRecommendation?: string
  onFindTools?: () => void
  isSearching?: boolean
  progress?: { message: string; progress: number } | null
  elapsedSeconds?: number
  selectedTools?: ToolRecommendation[]
  onToggleCompare?: (tool: ToolRecommendation) => void
  onOpenAdopt?: (tool: ToolRecommendation) => void
  onSelectAll?: () => void
  onCompare?: () => void
}) {
  return (
    <Card className="gap-0 overflow-hidden border-border/70 border-l-2 border-l-primary/40 bg-card/60 py-0">
      <CardHeader className="border-b border-border/60 bg-primary/[0.04] px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{problemTitle(problem)}</CardTitle>
        </div>
        <CardDescription className="mt-1 text-xs">{problemDescription(problem)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 px-4 py-4 sm:px-5">
        {finalRecommendation && (
          <div className="rounded-lg border border-primary/20 bg-primary/[0.06] px-3 py-2 text-xs leading-5 text-muted-foreground">
            <span className="font-medium text-foreground">Recommended starting point: </span>{plainText(finalRecommendation)}
          </div>
        )}
        {tools.length > 0 ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/40 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">Select 2–4 tools to compare.</p>
              <div className="flex items-center gap-2">
                {onSelectAll && (
                  <Button size="sm" variant="ghost" onClick={onSelectAll} className="h-8 text-xs text-muted-foreground hover:text-foreground">
                    {(selectedTools?.length ?? 0) >= Math.min(4, tools.length) ? "Clear selection" : "Select all"}
                  </Button>
                )}
                {onCompare && (
                  <Button
                    size="sm"
                    disabled={(selectedTools?.length ?? 0) < 2}
                    onClick={onCompare}
                    className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 disabled:translate-y-0 disabled:opacity-50"
                  >
                    Compare{(selectedTools?.length ?? 0) > 0 ? ` (${selectedTools?.length})` : ""}
                    <ArrowUpRight size={14} />
                  </Button>
                )}
              </div>
            </div>
            {tools.map((tool, index) => <ToolRow key={`${tool.tool_name}-${index}`} tool={tool} selected={selectedTools?.some((selected) => selected.tool_name === tool.tool_name)} onToggle={onToggleCompare ? () => onToggleCompare(tool) : undefined} onOpenAdopt={onOpenAdopt ? () => onOpenAdopt(tool) : undefined} />)}
          </>
        ) : onFindTools ? (
          <Button
            variant="outline"
            disabled={isSearching}
            onClick={onFindTools}
            className="h-auto min-h-12 w-full justify-between rounded-xl border-primary/30 bg-primary/[0.06] px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:border-primary/60 hover:bg-primary/[0.12] hover:shadow-md"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
              {isSearching ? <CircleNotch className="shrink-0 animate-spin text-primary" /> : <Globe className="shrink-0 text-primary" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate">
                  {isSearching
                    ? `${progress?.message ?? "Researching tools…"} (${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")})`
                    : "Research tools"}
                </span>
                {isSearching && progress && (
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-primary/15">
                    <span
                      className="block h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, progress.progress))}%` }}
                    />
                  </span>
                )}
              </span>
            </span>
            {!isSearching && <ArrowUpRight className="text-muted-foreground" size={16} />}
          </Button>
        ) : (
          <p className="px-2 py-4 text-xs text-muted-foreground">Keep chatting with Halite to discover tools for this problem.</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function App() {
  const { user } = useUser()
  const [report, setReport] = useState<Report | null>(null)
  const [toolGroups, setToolGroups] = useState<ToolRecommendationGroup[]>([])
  const [toolsLoading, setToolsLoading] = useState(false)
  const [toolsError, setToolsError] = useState<string | null>(null)
  const toolSearchController = useRef<AbortController | null>(null)
  const maxProgress = useRef(0)
  const [activeProblem, setActiveProblem] = useState<string | null>(null)
  const [researchElapsedSeconds, setResearchElapsedSeconds] = useState(0)
  const [compareSelection, setCompareSelection] = useState<Record<string, ToolRecommendation[]>>({})
  const [compareProblem, setCompareProblem] = useState<{ title: string; tools: ToolRecommendation[]; recommendation?: string } | null>(null)
  const [adoptionProblem, setAdoptionProblem] = useState<{ title: string; tool: ToolRecommendation; recommendation?: string } | null>(null)
  const { solutionApps, suggestedProblems, setToolSearchStatus, toolSearchProgress, setToolSearchProgress } = useAppSession()
  const problems = useMemo(
    () => {
      if (!suggestedProblems.length) return report?.top_problems ?? []
      const userProblem = suggestedProblems[0]
      const seen = new Set([problemKey(userProblem)])
      const contextProblems = (report?.top_problems ?? []).filter((problem) => {
        const key = problemKey(problem)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }).slice(0, 2)
      return [userProblem, ...contextProblems]
    },
    [report?.top_problems, suggestedProblems]
  )

  useEffect(() => {
    if (!activeProblem) return
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      setResearchElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [activeProblem])

  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname)
    readContextFiles(user?.id ?? "local")
      .then((files) => {
        if (!files.length) throw new Error("no files uploaded")
        return getContextReport(files)
      })
      .then((nextReport) => {
        setReport(nextReport)
      })
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") {
          if (reason.message.includes("no files uploaded")) {
            setReport(null)
            setToolGroups([])
            setToolsError(null)
            setToolSearchProgress(null)
            return
          }
          setToolsError(reason.message)
        }
      })
    return () => toolSearchController.current?.abort()
  }, [setToolSearchProgress, user?.id])

  async function findTools(problem: ReportProblem | string) {
    if (toolSearchController.current) return
    const label = problemTitle(problem)
    const controller = new AbortController()
    toolSearchController.current = controller
    maxProgress.current = 0
    setActiveProblem(label)
    setResearchElapsedSeconds(0)
    setToolsLoading(true)
    setToolsError(null)
    setToolSearchStatus("running")
    setToolSearchProgress({ phase: "preparing", message: "Preparing tool research…", progress: 0 })
    try {
      const onProgress = (progress: { progress: number; phase: string; message: string }) => {
        if (progress.progress < maxProgress.current) return
        maxProgress.current = progress.progress
        setToolSearchProgress(progress)
      }
      const result = typeof problem === "string"
        ? await streamUserProblemTools(label, onProgress, controller.signal)
        : await streamToolRecommendations(
            report?.alpha ?? 0.7,
            onProgress,
            controller.signal,
            label,
            await readContextFiles(user?.id ?? "local"),
          )
      setToolGroups((current) => [
        ...current.filter((group) => group.problem !== result.recommendations[0]?.problem),
        ...result.recommendations,
      ])
      setToolSearchStatus("ready")
      setToolSearchProgress({ phase: "complete", message: "Recommendations ready.", progress: 100 })
    } catch (reason) {
      if (reason instanceof Error && reason.name !== "AbortError") {
        setToolsError(reason.message)
        setToolSearchStatus("error")
      }
    } finally {
      setToolsLoading(false)
      setActiveProblem(null)
      toolSearchController.current = null
    }
  }
  const dashboardTools = toolGroups.flatMap((group) => group.tools)
  const toolsForProblem = (problem: ReportProblem | string) => {
    const label = problemTitle(problem).toLowerCase()
    const group = toolGroups.find((candidate) => candidate.problem.toLowerCase() === label)
      ?? toolGroups.find((candidate) => label.includes(candidate.problem.toLowerCase()) || candidate.problem.toLowerCase().includes(label))
    return group
  }
  function toggleCompare(problem: ReportProblem | string, tool: ToolRecommendation) {
    const key = problemKey(problem)
    setCompareSelection((current) => {
      const selected = current[key] ?? []
      const exists = selected.some((item) => item.tool_name === tool.tool_name)
      if (exists) return { ...current, [key]: selected.filter((item) => item.tool_name !== tool.tool_name) }
      if (selected.length >= 4) return current
      return { ...current, [key]: [...selected, tool] }
    })
  }
  function selectAllForCompare(problem: ReportProblem | string, tools: ToolRecommendation[]) {
    const key = problemKey(problem)
    setCompareSelection((current) => ({
      ...current,
      [key]: (current[key]?.length ?? 0) >= Math.min(4, tools.length) ? [] : tools.slice(0, 4),
    }))
  }

  return (
    <section className="border-b border-border/70 px-5 py-8 lg:border-r lg:border-b-0 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-9">
          <p className="mb-3 text-xs font-medium tracking-wide text-primary uppercase">Your AI toolkit</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Build a better business,{" "}
            <span className="bg-gradient-to-r from-orange-300 via-rose-300 to-blue-300 bg-clip-text text-transparent">
              one tool at a time.
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Explore tools picked for the problems small businesses face every day. Ask Halite on the right where to start.
          </p>
        </div>

        {problems.length > 0 ? (
          <div className="space-y-5">
            {problems.map((problem, index) => (
              <ProblemCard
                key={`${problemTitle(problem)}-${index}`}
                problem={problem}
                tools={toolsForProblem(problem)?.tools ?? solutionApps}
                finalRecommendation={toolsForProblem(problem)?.final_recommendation}
                selectedTools={compareSelection[problemKey(problem)]}
                onToggleCompare={(tool) => toggleCompare(problem, tool)}
                onOpenAdopt={(tool) => setAdoptionProblem({
                  title: problemTitle(problem),
                  tool,
                  recommendation: toolsForProblem(problem)?.final_recommendation,
                })}
                onSelectAll={() => selectAllForCompare(problem, toolsForProblem(problem)?.tools ?? solutionApps)}
                onCompare={() => setCompareProblem({
                  title: problemTitle(problem),
                  tools: compareSelection[problemKey(problem)] ?? [],
                  recommendation: toolsForProblem(problem)?.final_recommendation,
                })}
                onFindTools={() => void findTools(problem)}
                isSearching={activeProblem === problemTitle(problem)}
                progress={activeProblem === problemTitle(problem) ? toolSearchProgress : null}
                elapsedSeconds={activeProblem === problemTitle(problem) ? researchElapsedSeconds : 0}
              />
            ))}
          </div>
        ) : dashboardTools.length > 0 ? (
          <ProblemCard problem="Suggested tools" tools={dashboardTools} />
        ) : solutionApps.length > 0 ? (
          <ProblemCard problem="Suggested tools" tools={solutionApps} />
        ) : toolsLoading ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-background/20 px-5 py-10 text-center text-sm text-muted-foreground">
            Researching tools for these problems…
          </div>
        ) : toolsError ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-background/20 px-5 py-10 text-center">
            <p className="text-sm font-medium">Tool recommendations unavailable</p>
            <p className="mt-2 text-xs text-muted-foreground">{toolsError}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 bg-background/20 px-5 py-10 text-center">
            <p className="text-sm font-medium">No suggestions yet</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Tell Halite what you want to improve to get tailored problems and tools.</p>
          </div>
        )}
        {compareProblem && (
          <CompareDialog
            problem={compareProblem.title}
            tools={compareProblem.tools}
            open
            onOpenChange={(open) => { if (!open) setCompareProblem(null) }}
            onAdopt={(tool) => {
              setCompareProblem(null)
              setAdoptionProblem({ title: compareProblem.title, tool, recommendation: compareProblem.recommendation })
            }}
          />
        )}
        {adoptionProblem && (
          <AdoptionDialog
            problem={adoptionProblem.title}
            tool={adoptionProblem.tool}
            recommendation={adoptionProblem.recommendation}
            open
            onOpenChange={(open) => { if (!open) setAdoptionProblem(null) }}
          />
        )}
      </div>
    </section>
  )
}
