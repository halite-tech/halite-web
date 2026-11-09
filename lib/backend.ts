export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"

let authTokenProvider: (() => Promise<string | null>) | null = null
let cachedAuthToken: { value: string | null; expiresAt: number } | null = null
let authTokenRequest: Promise<string | null> | null = null

export function setAuthTokenProvider(provider: (() => Promise<string | null>) | null) {
  authTokenProvider = provider
  cachedAuthToken = null
  authTokenRequest = null
}

async function getAuthToken() {
  if (!authTokenProvider) return null
  if (cachedAuthToken && cachedAuthToken.expiresAt > Date.now()) return cachedAuthToken.value
  if (!authTokenRequest) {
    authTokenRequest = authTokenProvider().then((value) => {
      cachedAuthToken = { value, expiresAt: Date.now() + 30_000 }
      return value
    }).finally(() => {
      authTokenRequest = null
    })
  }
  return authTokenRequest
}

export type UploadFile = {
  name?: string
  filename?: string
  domain?: string | null
  matched?: boolean
  mapping?: string | null
  [key: string]: unknown
}

export type UploadResponse = {
  dataset_id: string
  domains: string[]
  files: UploadFile[]
  data_quality: Record<string, unknown>
}

export type ContextResponse = UploadResponse

export type ReportProblem = {
  category: string
  label: string
  description?: string
  summary?: string
  pain_score?: number
  confidence?: number
  cost?: { annual?: number; recoverable?: number; range?: unknown; pct_revenue?: number }
  time?: { hours_per_week?: number; by_role?: Record<string, number> }
  drivers?: { evidence?: string; text?: string; engine?: string }[]
  missing?: string[]
}

export type Report = {
  restaurant?: { name?: string; annual_revenue?: number; period_start?: string; period_end?: string }
  alpha?: number
  top_problems: ReportProblem[]
  all_problems?: ReportProblem[]
  needs_more_data?: boolean
  not_assessed?: string[]
  totals?: Record<string, unknown>
  files?: UploadFile[]
  domains?: string[]
  data_quality?: Record<string, unknown>
  skipped?: unknown[]
  sensitivity?: Record<string, unknown>
}

export type Industry = {
  id: string
  label: string
}

export const INDUSTRIES: Industry[] = [
  { id: "restaurant", label: "Restaurant" },
  { id: "coffee_shop", label: "Coffee shop" },
  { id: "retail", label: "Retail" },
  { id: "healthcare", label: "Healthcare" },
  { id: "hospitality", label: "Hospitality" },
  { id: "hvac", label: "HVAC services" },
  { id: "landscaping", label: "Landscaping" },
  { id: "professional_services", label: "Professional services" },
  { id: "manufacturing", label: "Manufacturing" },
]

export type SolutionType = {
  id: string
  label: string
  description: string
}

export type ToolRecommendation = {
  tool_number?: number
  tool_name: string
  tool_tagline?: string
  category?: string
  tool_description?: string
  tool_pricing?: string
  tool_home_page: string
  solution_tags?: string[]
  tool_logo_url?: string
  solution_types?: SolutionType[]
}

export type ToolRecommendationGroup = {
  problem: string
  final_recommendation?: string
  tools: ToolRecommendation[]
}

export type ToolRecommendations = {
  recommendations: ToolRecommendationGroup[]
}

export type ToolSearchProgress = {
  phase: string
  message: string
  progress: number
}

export type ToolResult = ToolRecommendation | ToolRecommendation[] | ToolRecommendations | string | Record<string, unknown>

export type ToolsState = {
  status: "idle" | "running" | "ready" | "error"
  problem: string | null
  result: ToolResult | null
  error: string | null
  updated_at?: number
}

export type ChatMessage = {
  role: "user" | "assistant" | "event"
  content: string
  ts: number
  type?: "problem_changed"
  problem?: string
  previous_problem?: string | null
}

export type ChatSession = {
  session_id: string
  problem: string | null
  problem_version: number
  known_facts: string[]
  open_questions: string[]
  messages: ChatMessage[]
  tools: ToolsState
  problems?: ReportProblem[] | string[]
  solution_apps?: ToolResult
  apps?: ToolResult
}

export type ChatEvent =
  | { event: "state"; data: Partial<ChatSession> & { action?: string; previous_problem?: string | null } }
  | { event: "status"; data: { phase: string; message: string } }
  | { event: "tools"; data: Partial<ToolsState> }
  | { event: "notice"; data: { text: string } }
  | { event: "token"; data: { delta: string } }
  | { event: "done"; data: { state: unknown; tools: Partial<ToolsState> } }
  | { event: "error"; data: { message: string } }

export function plainText(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
}

function normalizeTool(value: unknown): ToolRecommendation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const tool = value as Record<string, unknown>
  const name = tool.tool_name ?? tool.toolName ?? tool.name
  if (typeof name !== "string" || !name.trim()) return null

  const homepage = tool.tool_home_page ?? tool.toolHomePage ?? tool.home_page ?? tool.homePage ?? tool.url
  return {
    tool_number: typeof tool.tool_number === "number" ? tool.tool_number : undefined,
    tool_name: plainText(name.trim()),
    tool_tagline: typeof tool.tool_tagline === "string"
      ? plainText(tool.tool_tagline)
      : typeof tool.toolTagline === "string"
        ? plainText(tool.toolTagline)
        : typeof tool.tagline === "string"
          ? plainText(tool.tagline)
          : undefined,
    category: typeof tool.category === "string" ? tool.category : undefined,
    tool_description: typeof tool.tool_description === "string"
      ? plainText(tool.tool_description)
      : typeof tool.toolDescription === "string"
        ? plainText(tool.toolDescription)
        : typeof tool.description === "string"
          ? plainText(tool.description)
          : undefined,
    tool_pricing: typeof tool.tool_pricing === "string"
      ? plainText(tool.tool_pricing)
      : typeof tool.toolPricing === "string"
        ? plainText(tool.toolPricing)
        : typeof tool.pricing === "string"
          ? plainText(tool.pricing)
          : undefined,
    tool_home_page: typeof homepage === "string" && homepage.trim() ? homepage : "#",
    tool_logo_url: typeof tool.tool_logo_url === "string" ? tool.tool_logo_url : undefined,
    solution_tags: Array.isArray(tool.solution_tags)
      ? tool.solution_tags.filter((tag): tag is string => typeof tag === "string")
      : Array.isArray(tool.solutionTags)
        ? tool.solutionTags.filter((tag): tag is string => typeof tag === "string")
        : undefined,
    solution_types: Array.isArray(tool.solution_types)
      ? tool.solution_types.filter((type): type is SolutionType =>
        Boolean(type && typeof type === "object" && typeof (type as Record<string, unknown>).label === "string")
      )
      : undefined,
  }
}

export function getToolRecommendations(result: unknown): ToolRecommendation[] {
  if (!result) return []
  if (Array.isArray(result)) return result.flatMap((item) => {
    const tool = normalizeTool(item)
    return tool ? [tool] : getToolRecommendations(item)
  })
  if (typeof result === "string") {
    try {
      return getToolRecommendations(JSON.parse(result))
    } catch {
      return []
    }
  }
  if (typeof result !== "object") return []
  const value = result as Record<string, unknown>
  const tool = normalizeTool(value)
  if (tool) return [tool]
  return ["result", "tools", "solution_apps", "apps", "recommendations", "recommendation"].flatMap((key) =>
    getToolRecommendations(value[key])
  )
}

export function getToolRecommendationGroups(result: unknown): ToolRecommendationGroup[] {
  if (!result) return []
  if (typeof result === "string") {
    try {
      return getToolRecommendationGroups(JSON.parse(result))
    } catch {
      return []
    }
  }
  if (typeof result !== "object") return []
  const value = result as Record<string, unknown>
  const recommendations = Array.isArray(value.recommendations) ? value.recommendations : []
  return recommendations.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const group = item as Record<string, unknown>
    const problem = typeof group.problem === "string" ? group.problem : ""
    const tools = getToolRecommendations(group.tools)
    return problem || tools.length
      ? [{
          problem,
          final_recommendation: typeof group.final_recommendation === "string" ? plainText(group.final_recommendation) : undefined,
          tools,
        }]
      : []
  })
}

function logBackend(direction: "→" | "←", message: string, details?: unknown) {
  if (details === undefined) {
    console.log(`[Halite backend] ${direction} ${message}`)
  } else {
    console.log(`[Halite backend] ${direction} ${message}`, details)
  }
}

function describeRequest(init?: RequestInit) {
  if (!init?.body) return undefined
  if (init.body instanceof FormData) {
    return {
      type: "multipart/form-data",
      files: Array.from(init.body.getAll("files")).map((file) =>
        file instanceof File ? { name: file.name, size: file.size, type: file.type } : typeof file
      ),
      fields: Array.from(init.body.keys()).filter((key) => key !== "files"),
    }
  }
  if (typeof init.body === "string") {
    try {
      return JSON.parse(init.body)
    } catch {
      return "[unparseable request body]"
    }
  }
  return { type: typeof init.body }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? "GET"
  logBackend("→", `${method} ${path}`, describeRequest(init))
  let response: Response
  try {
    const token = await getAuthToken()
    const headers = new Headers(init?.headers)
    if (token) headers.set("Authorization", `Bearer ${token}`)
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  } catch (error) {
    logBackend("←", `${method} ${path} network error`, error)
    throw error
  }
  if (!response.ok) {
    let message = `Backend request failed (${response.status})`
    let body: unknown
    try {
      body = await response.json()
      message = (body as { detail?: string }).detail ?? message
    } catch {
      // Keep the status-based message when the backend does not return JSON.
    }
    logBackend("←", `${method} ${path} ${response.status}`, body ?? message)
    throw new Error(message)
  }
  const body = await response.json()
  logBackend("←", `${method} ${path} ${response.status}`, body)
  return body as T
}

export function uploadFiles(files: File[], profile?: Record<string, unknown>, datasetId?: string) {
  const body = new FormData()
  files.forEach((file) => body.append("files", file))
  if (profile) body.append("profile", JSON.stringify(profile))
  if (datasetId) body.append("dataset_id", datasetId)
  return request<UploadResponse>("/uploads", { method: "POST", body })
}

export function uploadContextFiles(files: File[], profile?: Record<string, unknown>) {
  const body = new FormData()
  files.forEach((file) => body.append("files", file))
  if (profile) body.append("profile", JSON.stringify(profile))
  return request<ContextResponse>("/context/files", { method: "POST", body })
}

export function getContext() {
  return request<ContextResponse>("/context")
}

export function deleteContextFiles(filenames: string[]) {
  return request<ContextResponse>("/context/files", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filenames),
  })
}

export function analyzeContext(alpha = 0.7, industry = "restaurant") {
  return request<Report>(`/context/analyze?alpha=${alpha}&industry=${encodeURIComponent(industry)}`, { method: "POST" })
}

export function getContextReport(files: File[], alpha = 0.7, industry = "restaurant") {
  const body = new FormData()
  files.forEach((file) => body.append("files", file))
  body.append("alpha", String(alpha))
  body.append("industry", industry)
  return request<Report>("/context/report", { method: "POST", body })
}

export function deleteDatasetFile(datasetId: string, filename: string) {
  return request<UploadResponse>(
    `/datasets/${encodeURIComponent(datasetId)}/files?filename=${encodeURIComponent(filename)}`,
    { method: "DELETE" },
  )
}

export function deleteDatasetFiles(datasetId: string, filenames: string[]) {
  return request<UploadResponse>(
    `/datasets/${encodeURIComponent(datasetId)}/files/bulk`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filenames),
    },
  )
}

export function analyzeDataset(datasetId: string, alpha = 0.7) {
  return request<Report>(`/analyze/${encodeURIComponent(datasetId)}?alpha=${alpha}`, { method: "POST" })
}

export function getReport(datasetId: string, alpha = 0.7) {
  return request<Report>(`/report/${encodeURIComponent(datasetId)}?alpha=${alpha}`)
}

export function getTools(datasetId: string, alpha = 0.7, signal?: AbortSignal) {
  return request<ToolRecommendations>(`/tools?dataset_id=${encodeURIComponent(datasetId)}&alpha=${alpha}`, { signal })
}

export async function streamToolRecommendations(
  alpha: number,
  onProgress: (progress: ToolSearchProgress) => void,
  signal?: AbortSignal,
  problem?: string,
  files: File[] = [],
) {
  const body = new FormData()
  files.forEach((file) => body.append("files", file))
  body.append("alpha", String(alpha))
  if (problem) body.append("problem", problem)
  const path = "/context/tools/stream"
  const token = await getAuthToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined
  const response = await fetch(`${API_BASE_URL}${path}`, { method: "POST", body, signal, headers })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null
    throw new Error(body?.detail ?? `Backend request failed (${response.status})`)
  }
  if (!response.body) throw new Error("Tool search stream did not include a response body")
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })
    let separator = buffer.indexOf("\n\n")
    while (separator >= 0) {
      const block = buffer.slice(0, separator)
      buffer = buffer.slice(separator + 2)
      const event = /^event: (.*)$/m.exec(block)?.[1]
      const data = /^data: (.*)$/m.exec(block)?.[1]
      if (event && data) {
        const payload = JSON.parse(data)
        if (event === "progress") onProgress(payload as ToolSearchProgress)
        if (event === "error") throw new Error(payload.message ?? "Tool search failed")
        if (event === "done") return payload as ToolRecommendations
      }
      separator = buffer.indexOf("\n\n")
    }
    if (done) break
  }
  throw new Error("Tool search stream ended before recommendations were ready")
}

export async function streamUserProblemTools(
  problem: string,
  onProgress: (progress: ToolSearchProgress) => void,
  signal?: AbortSignal,
) {
  const token = await getAuthToken()
  const headers = new Headers({ "Content-Type": "application/json" })
  if (token) headers.set("Authorization", `******`)
  const response = await fetch(`${API_BASE_URL}/context/tools/problem/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ problem }),
    signal,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null
    throw new Error(body?.detail ?? `Backend request failed (${response.status})`)
  }
  if (!response.body) throw new Error("Tool search stream did not include a response body")
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })
    let separator = buffer.indexOf("\n\n")
    while (separator >= 0) {
      const block = buffer.slice(0, separator)
      buffer = buffer.slice(separator + 2)
      const event = /^event: (.*)$/m.exec(block)?.[1]
      const data = /^data: (.*)$/m.exec(block)?.[1]
      if (event && data) {
        const payload = JSON.parse(data)
        if (event === "progress") onProgress(payload as ToolSearchProgress)
        if (event === "error") throw new Error(payload.message ?? "Tool search failed")
        if (event === "done") return payload as ToolRecommendations
      }
      separator = buffer.indexOf("\n\n")
    }
    if (done) break
  }
  throw new Error("Tool search stream ended before recommendations were ready")
}

export function createChatSession(industry = "restaurant") {
  return request<ChatSession>("/chat/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ industry }),
  })
}

export function getChatSession(sessionId: string) {
  return request<ChatSession>(`/chat/sessions/${encodeURIComponent(sessionId)}`)
}

export async function deleteChatSession(sessionId: string) {
  await request<unknown>(`/chat/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" })
}

export async function streamChatMessage(
  sessionId: string,
  message: string,
  onEvent: (event: ChatEvent) => void
) {
  const path = `/chat/sessions/${encodeURIComponent(sessionId)}/messages`
  const requestBody = { message }
  logBackend("→", `POST ${path}`, requestBody)
  let response: Response
  try {
    const token = await getAuthToken()
    const headers = new Headers({ "Content-Type": "application/json" })
    if (token) headers.set("Authorization", `Bearer ${token}`)
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })
  } catch (error) {
    logBackend("←", `POST ${path} network error`, error)
    throw error
  }
  if (!response.ok) {
    let error = `Chat request failed (${response.status})`
    let body: unknown
    try {
      body = await response.json()
      error = (body as { detail?: string }).detail ?? error
    } catch {
      // Keep the status-based message when the backend does not return JSON.
    }
    logBackend("←", `POST ${path} ${response.status}`, body ?? error)
    throw new Error(error)
  }
  logBackend("←", `POST ${path} ${response.status} stream opened`, {
    contentType: response.headers.get("content-type"),
  })
  if (!response.body) {
    logBackend("←", `POST ${path} stream missing`)
    throw new Error("Chat response did not include a stream")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let terminalEvent: "done" | "error" | null = null
  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })
    let separator = buffer.indexOf("\n\n")
    while (separator >= 0) {
      const block = buffer.slice(0, separator)
      buffer = buffer.slice(separator + 2)
      const event = /^event: (.*)$/m.exec(block)?.[1]
      const data = /^data: (.*)$/m.exec(block)?.[1]
      if (event && data) {
        const payload = JSON.parse(data)
        logBackend("←", `SSE ${event}`, payload)
        if (event === "done" || event === "error") terminalEvent = event
        onEvent({ event, data: payload } as ChatEvent)
      }
      separator = buffer.indexOf("\n\n")
    }
    if (done) break
  }
  logBackend(
    "←",
    `POST ${path} stream ${terminalEvent ? `closed after ${terminalEvent}` : "ended before a terminal event"}`,
  )
}