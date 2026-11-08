import { ChatPanel } from "@/components/chat-panel"
import { AppSessionProvider } from "@/components/app-session"
import { SiteHeader } from "@/components/site-header"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AppSessionProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <SiteHeader />
        <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(320px,45%)] overflow-hidden lg:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)] lg:grid-rows-1">
          <div className="min-h-0 overflow-y-auto">{children}</div>
          <ChatPanel />
        </div>
      </div>
    </AppSessionProvider>
  )
}
