"use client"

import { ArrowUpRight } from "@phosphor-icons/react"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { useAppSession } from "@/components/app-session"
import { ToolDetailsDialog } from "@/components/tool-details-dialog"
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
  const candidates = tool.tool_logo_url ? [tool.tool_logo_url] : []
  try {
    const hostname = new URL(tool.tool_home_page).hostname
    candidates.push(`https://icons.duckduckgo.com/ip3/${hostname}.ico`)
  } catch {
    return candidates
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

function ProblemCard({ problem, tools, finalRecommendation }: { problem: ReportProblem | string; tools: ToolRecommendation[]; finalRecommendation?: string }) {
  return (
    <Card className="gap-0 overflow-hidden border-border/70 border-l-2 border-l-primary/40 bg-card/60 py-0">
      <CardHeader className="border-b border-border/60 bg-primary/[0.04] px-5 py-5 sm:px-6">
        <CardTitle className="text-base">{problemTitle(problem)}</CardTitle>
        <CardDescription className="mt-1 text-xs">{problemDescription(problem)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 px-4 py-4 sm:px-5">
        {finalRecommendation && (
          <div className="rounded-lg border border-primary/20 bg-primary/[0.06] px-3 py-2 text-xs leading-5 text-muted-foreground">
            <span className="font-medium text-foreground">Recommended starting point: </span>{finalRecommendation}
          </div>
        )}
        {tools.length > 0 ? tools.map((tool, index) => <ToolRow key={`${tool.tool_name}-${index}`} tool={tool} />) : (
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
  const { solutionApps, suggestedProblems, setToolSearchStatus, setToolSearchProgress } = useAppSession()
  const problems = useMemo(
    () => (report?.top_problems?.length ? report.top_problems : suggestedProblems),
    [report?.top_problems, suggestedProblems]
  )

  useEffect(() => {
    const datasetId = new URLSearchParams(window.location.search).get("dataset_id")
    if (!datasetId) return
    if (toolSearchController.current && !toolSearchController.current.signal.aborted) return
    const controller = new AbortController()
    toolSearchController.current = controller
    getReport(datasetId)
      .catch((reason: Error) => {
        if (reason.message.includes("dataset not analyzed yet")) {
          return analyzeDataset(datasetId)
        }
        throw reason
      })
      .then((nextReport) => {
        setReport(nextReport)
        if (!nextReport.top_problems?.length) {
          setToolSearchStatus("idle")
          return null
        }
        setToolsLoading(true)
        setToolSearchStatus("running")
        if (maxProgress.current === 0) {
          setToolSearchProgress({ phase: "preparing", message: "Preparing tool research…", progress: 0 })
        }
        return streamToolRecommendations(
          datasetId,
          nextReport.alpha ?? 0.7,
          (progress) => {
            if (progress.progress < maxProgress.current) return
            maxProgress.current = progress.progress
            setToolSearchProgress(progress)
          },
          controller.signal,
        )
      })
      .then((toolResponse) => {
        if (!toolResponse) return
        setToolGroups(toolResponse.recommendations)
        setToolSearchStatus("ready")
        setToolSearchProgress({ phase: "complete", message: "Recommendations ready.", progress: 100 })
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
            setToolSearchStatus("idle")
            setToolSearchProgress(null)
            return
          }
          setToolsError(reason.message)
          setToolSearchStatus("error")
        }
      })
      .finally(() => {
        setToolsLoading(false)
      })
    return () => {
      controller.abort()
      if (toolSearchController.current === controller) toolSearchController.current = null
    }
  }, [setToolSearchProgress, setToolSearchStatus])
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
