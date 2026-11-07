import { Sparkle } from "@phosphor-icons/react/dist/ssr"
import Image from "next/image"
import Link from "next/link"
import { AuthActions } from "@/components/auth-actions"
import { ChatComposer } from "@/components/chat-composer"
import { Button } from "@/components/ui/button"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="relative flex h-14 shrink-0 items-center border-b border-border/70 bg-background/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/halite.svg" alt="Halite" width={32} height={32} className="size-8 object-contain" />
            <span className="font-heading text-lg font-semibold tracking-tight">halite</span>
          </Link>
        </div>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {[
            { label: "Home", href: "/" },
            { label: "App", href: "/app" },
            { label: "Context", href: "/context" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <AuthActions />
        </div>
      </header>
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
