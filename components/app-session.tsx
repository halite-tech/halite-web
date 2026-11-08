"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import type { ReportProblem, ToolRecommendation, ToolSearchProgress } from "@/lib/backend"

type AppSessionContextValue = {
  solutionApps: ToolRecommendation[]
  setSolutionApps: (apps: ToolRecommendation[]) => void
  suggestedProblems: (ReportProblem | string)[]
  setSuggestedProblems: (problems: (ReportProblem | string)[]) => void
  toolSearchStatus: "idle" | "running" | "ready" | "error"
  setToolSearchStatus: (status: "idle" | "running" | "ready" | "error") => void
  toolSearchProgress: ToolSearchProgress | null
  setToolSearchProgress: (progress: ToolSearchProgress | null) => void
}

const AppSessionContext = createContext<AppSessionContextValue | null>(null)

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [solutionApps, setSolutionApps] = useState<ToolRecommendation[]>([])
  const [suggestedProblems, setSuggestedProblems] = useState<(ReportProblem | string)[]>([])
  const [toolSearchStatus, setToolSearchStatus] = useState<"idle" | "running" | "ready" | "error">("idle")
  const [toolSearchProgress, setToolSearchProgress] = useState<ToolSearchProgress | null>(null)
  const value = useMemo(
    () => ({ solutionApps, setSolutionApps, suggestedProblems, setSuggestedProblems, toolSearchStatus, setToolSearchStatus, toolSearchProgress, setToolSearchProgress }),
    [solutionApps, suggestedProblems, toolSearchStatus, toolSearchProgress]
  )

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>
}

export function useAppSession() {
  const context = useContext(AppSessionContext)
  if (!context) throw new Error("useAppSession must be used within AppSessionProvider")
  return context
}
