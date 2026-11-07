import { Sparkle } from "@phosphor-icons/react/dist/ssr"
import { ChatComposer } from "@/components/chat-composer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <SiteHeader />
      <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(320px,45%)] overflow-hidden lg:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)] lg:grid-rows-1">
        <div className="min-h-0 overflow-y-auto">{children}</div>
        <aside className="flex min-h-0 flex-col overflow-hidden border-t border-border/70 bg-card/30 lg:border-t-0">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-6">
            <div className="flex gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkle size={15} weight="duotone" />
              </div>
              <div className="max-w-[88%] space-y-3">
                <p className="text-sm leading-6">
                  Hi Vivek! I can help you find the right AI tools for your business. What are you trying to improve today?
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Get more customers", "Save time", "Understand my numbers"].map((prompt) => (
                    <Button key={prompt} variant="outline" size="sm" className="h-8 bg-transparent text-xs">
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ChatComposer />
        </aside>
      </div>
    </div>
  )
}
