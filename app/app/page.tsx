"use client"

import { ArrowUpRight, CircleNotch, Globe } from "@phosphor-icons/react"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { useAppSession } from "@/components/app-session"
import { ToolDetailsDialog } from "@/components/tool-details-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { analyzeDataset, getReport, streamToolRecommendations, type Report, type ReportProblem, type ToolRecommendation, type ToolRecommendationGroup } from "@/lib/backend"

function problemTitle(problem: ReportProblem | string) {
  return typeof problem === "string" ? problem : problem.label
}

function problemDescription(problem: ReportProblem | string) {
  if (typeof problem === "string") return "Tell Halite more about this problem to find the right tools."
  return problem.description ?? problem.summary ?? "Tell Halite more about this problem to find the right tools."
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

function ToolRow({ tool }: { tool: ToolRecommendation }) {
  return (
    <ToolDetailsDialog
      tool={{
        name: tool.tool_name,
        category: tool.category ?? "AI tool",
        summary: tool.tool_description ?? tool.tool_tagline ?? "Explore this tool to learn how it can help your business.",
        description: tool.tool_description ?? "",
        website: tool.tool_home_page,
        pricing: tool.tool_pricing || tool.tool_home_page,
        stats: [],
        solutionTypes: tool.solution_types,
      }}
    >
      <div className="flex items-center gap-4 rounded-lg border border-border/70 bg-background/30 p-3 transition-colors hover:border-primary/30 hover:bg-muted/40">
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
            <p className="mt-1 truncate text-xs text-muted-foreground">{tool.tool_tagline ?? "Explore this tool for your business."}</p>
        </div>
        <span className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors group-hover:text-foreground">
          <ArrowUpRight size={17} />
        </span>
      </div>
    </ToolDetailsDialog>
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
}: {
  problem: ReportProblem | string
  tools: ToolRecommendation[]
  finalRecommendation?: string
  onFindTools?: () => void
  isSearching?: boolean
  progress?: { message: string; progress: number } | null
  elapsedSeconds?: number
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
            <span className="font-medium text-foreground">Recommended starting point: </span>{finalRecommendation}
          </div>
        )}
        {tools.length > 0 ? tools.map((tool, index) => <ToolRow key={`${tool.tool_name}-${index}`} tool={tool} />) : onFindTools ? (
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
  const [report, setReport] = useState<Report | null>(null)
  const [toolGroups, setToolGroups] = useState<ToolRecommendationGroup[]>([])
  const [toolsLoading, setToolsLoading] = useState(false)
  const [toolsError, setToolsError] = useState<string | null>(null)
  const toolSearchController = useRef<AbortController | null>(null)
  const maxProgress = useRef(0)
  const [activeProblem, setActiveProblem] = useState<string | null>(null)
  const [researchElapsedSeconds, setResearchElapsedSeconds] = useState(0)
  const { solutionApps, suggestedProblems, setToolSearchStatus, toolSearchProgress, setToolSearchProgress } = useAppSession()
  const problems = useMemo(
    () => (report?.top_problems?.length ? report.top_problems : suggestedProblems),
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
    const datasetId = new URLSearchParams(window.location.search).get("dataset_id")
    if (!datasetId) return
    getReport(datasetId)
      .catch((reason: Error) => {
        if (reason.message.includes("dataset not analyzed yet")) {
          return analyzeDataset(datasetId)
        }
        throw reason
      })
      .then((nextReport) => {
        setReport(nextReport)
      })
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") {
          if (reason.message.includes("unknown dataset_id")) {
            const params = new URLSearchParams(window.location.search)
            params.delete("dataset_id")
            window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`)
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
  }, [setToolSearchProgress])

  async function findTools(problem: ReportProblem | string) {
    const datasetId = new URLSearchParams(window.location.search).get("dataset_id")
    if (!datasetId || toolSearchController.current) return
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
      const result = await streamToolRecommendations(
        datasetId,
        report?.alpha ?? 0.7,
        (progress) => {
          if (progress.progress < maxProgress.current) return
          maxProgress.current = progress.progress
          setToolSearchProgress(progress)
        },
        controller.signal,
        label,
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
                tools={toolsForProblem(problem)?.tools ?? (toolGroups.length ? [] : solutionApps)}
                finalRecommendation={toolsForProblem(problem)?.final_recommendation}
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
      </div>
    </section>
  )
}
