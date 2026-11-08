"use client"

import { Sparkle } from "@phosphor-icons/react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  createChatSession,
  getToolRecommendations,
  getChatSession,
  streamChatMessage,
  type ChatMessage,
  type ChatSession,
  type ToolSearchProgress,
  type ToolsState,
} from "@/lib/backend"
import { ChatComposer } from "@/components/chat-composer"
import { Button } from "@/components/ui/button"
import { useAppSession } from "@/components/app-session"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageContent } from "@/components/ui/message"
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceStatusIcon,
  TraceTitle,
  TraceToggleIcon,
} from "@/components/ui/trace"

function AssistantLoading({ title = "Thinking", progress, message }: { title?: string; progress?: number; message?: string }) {
  return (
    <Message>
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Sparkle size={15} weight="duotone" />
      </div>
      <MessageContent>
        <Trace>
          <TraceCollapsible defaultOpen>
            {({ open, setOpen }) => (
              <>
                <TraceCollapsibleTrigger onClick={() => setOpen(!open)}>
                  <TraceLine status="running">
                    <TraceIcon><TraceStatusIcon running /></TraceIcon>
                    <TraceTitle>{title}</TraceTitle>
                    <TraceToggleIcon open={open} />
                  </TraceLine>
                </TraceCollapsibleTrigger>
                <TraceCollapsibleContent open={open}>
                  <div className="space-y-2">
                    <p>{message ?? "Halite is processing your message."}</p>
                    {progress !== undefined && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                      </div>
                    )}
                  </div>
                </TraceCollapsibleContent>
              </>
            )}
          </TraceCollapsible>
        </Trace>
      </MessageContent>
    </Message>
  )
}

export function ChatPanel() {
  const { setSolutionApps, setSuggestedProblems, toolSearchStatus, toolSearchProgress, setToolSearchProgress } = useAppSession()
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [tools, setTools] = useState<ToolsState | null>(null)
  const [chatProgress, setChatProgress] = useState<ToolSearchProgress | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<number | null>(null)
  const sessionInitializationRef = useRef(false)
  const solutionApps = useMemo(
    () => getToolRecommendations(tools?.result ?? session?.solution_apps ?? session?.apps),
    [session?.apps, session?.solution_apps, tools?.result]
  )
  const isSearchingTools = toolSearchStatus === "running" || tools?.status === "running"
  const activeProgress = toolSearchProgress ?? chatProgress

  useEffect(() => {
    setSolutionApps(solutionApps)
  }, [setSolutionApps, solutionApps])

  useEffect(() => {
    if (session?.problems) setSuggestedProblems(session.problems)
    else if (session?.problem) setSuggestedProblems([session.problem])
  }, [setSuggestedProblems, session?.problem, session?.problems])

  useEffect(() => {
    if (sessionInitializationRef.current) return
    sessionInitializationRef.current = true
    const datasetId = new URLSearchParams(window.location.search).get("dataset_id")
    createChatSession(datasetId ?? undefined)
      .then((created) => {
        setSession(created)
        setMessages(created.messages)
        setTools(created.tools)
      })
      .catch((reason: Error) => setError(reason.message))
    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current)
    }
  }, [])

  useEffect(() => {
    if (!session?.session_id || tools?.status !== "running") return
    const poll = window.setInterval(() => {
      getChatSession(session.session_id)
        .then((updated) => {
          setSession(updated)
          setMessages(updated.messages)
          setTools(updated.tools)
          if (updated.tools.status !== "running") window.clearInterval(poll)
        })
        .catch(() => window.clearInterval(poll))
    }, 2500)
    pollingRef.current = poll
    return () => window.clearInterval(poll)
  }, [session?.session_id, tools?.status])

  async function sendMessage(message: string) {
    if (isSending || isSearchingTools) return
    setError(null)
    setIsSending(true)
    let activeSession = session
    try {
      if (!activeSession) {
        const datasetId = new URLSearchParams(window.location.search).get("dataset_id")
        activeSession = await createChatSession(datasetId ?? undefined)
        setSession(activeSession)
        setMessages(activeSession.messages)
        setTools(activeSession.tools)
      }
      const userMessage: ChatMessage = { role: "user", content: message, ts: 0 }
      setMessages((current) => [...current, userMessage, { role: "assistant", content: "", ts: 0 }])
      await streamChatMessage(activeSession.session_id, message, (event) => {
        if (event.event === "token") {
          setMessages((current) => {
            const next = [...current]
            const last = next[next.length - 1]
            if (last?.role === "assistant") next[next.length - 1] = { ...last, content: last.content + event.data.delta }
            return next
          })
        } else if (event.event === "state") {
          setSession((current) => (current ? { ...current, ...event.data } : current))
        } else if (event.event === "tools") {
          setTools((current) => ({ status: "running", problem: null, result: null, error: null, ...current, ...event.data }))
          setChatProgress((current) => current ?? { phase: "researching", message: "Starting tool research…", progress: 20 })
        } else if (event.event === "notice") {
          setMessages((current) => [...current, { role: "event", content: event.data.text, ts: Date.now() }])
        } else if (event.event === "status") {
          const progress = event.data.message.includes("Recommendations ready")
            ? 100
            : event.data.message.includes("Looking for tools")
              ? 35
              : event.data.message.includes("Checking vendor")
                ? 60
                : event.data.message.includes("Aggregating")
                  ? 82
                  : 15
          const nextProgress = { phase: event.data.phase, message: event.data.message, progress }
          setChatProgress(nextProgress)
          setToolSearchProgress(nextProgress)
        } else if (event.event === "done") {
          if (event.data.state && typeof event.data.state === "object") {
            const nextState = event.data.state as Partial<ChatSession>
            setSession((current) => (current ? { ...current, ...nextState } : current))
          }
          setTools((current) => ({
            status: "ready",
            problem: null,
            result: null,
            error: null,
            ...current,
            ...event.data.tools,
          }))
          setChatProgress(null)
        } else if (event.event === "error") {
          setError(event.data.message)
        }
      })
      setIsSending(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send message")
      setIsSending(false)
    }
  }

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border-t border-border/70 bg-card/30 lg:border-t-0">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-6">
        {messages.length === 0 && !error && !session && (
          <AssistantLoading />
        )}
        {messages.length === 0 && session && (
          <Message>
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkle size={15} weight="duotone" />
            </div>
            <MessageContent>
              <Bubble>
                <BubbleContent>I’m ready to learn about your business. What problem should we start with?</BubbleContent>
              </Bubble>
              <div className="flex flex-wrap gap-2">
                {["Get more customers", "Save time", "Understand my numbers"].map((prompt) => (
                  <Button key={prompt} variant="outline" size="sm" className="h-8 bg-transparent text-xs" disabled={isSending || isSearchingTools} onClick={() => sendMessage(prompt)}>
                    {prompt}
                  </Button>
                ))}
              </div>
            </MessageContent>
          </Message>
        )}
        {messages.map((message, index) =>
          message.role === "assistant" && !message.content && isSending ? null : message.role === "event" ? (
            <div key={`${message.ts}-${index}`} className="border-y border-border/60 py-2 text-center text-xs text-muted-foreground">
              {message.type === "problem_changed" ? `Switched focus to ${message.problem}` : message.content}
            </div>
          ) : (
            <Message key={`${message.ts}-${index}`} align={message.role === "user" ? "end" : "start"}>
              {message.role === "assistant" && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkle size={15} weight="duotone" />
                </div>
              )}
              <MessageContent>
                <Bubble align={message.role === "user" ? "end" : "start"}>
                  <BubbleContent>{message.content}</BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          )
        )}
        {isSending ? (
          <AssistantLoading
            title={isSearchingTools ? "Researching relevant AI tools" : undefined}
            progress={isSearchingTools ? activeProgress?.progress : undefined}
            message={isSearchingTools ? activeProgress?.message : undefined}
          />
        ) : isSearchingTools ? (
          <AssistantLoading title="Researching relevant AI tools" progress={activeProgress?.progress} message={activeProgress?.message} />
        ) : null}
        {tools?.status === "error" && <p className="text-xs text-destructive">{tools.error ?? "Tool research failed. Try sending another message."}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <ChatComposer disabled={isSending || isSearchingTools} clarity={session?.problem ? session.clarity : undefined} onSend={sendMessage} />
    </aside>
  )
}
