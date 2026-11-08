import {
  ArrowRight,
  FileText,
  Lightning,
  Sparkle,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr"
import Image from "next/image"
import Link from "next/link"
import { ContactMenu } from "@/components/contact-menu"
import { SiteHeader } from "@/components/site-header"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] overflow-hidden">
          <div className="absolute left-[12%] top-[-18%] size-[560px] rounded-full bg-primary/[0.08] blur-3xl" />
          <div className="absolute right-[8%] top-[8%] size-[380px] rounded-full bg-primary/[0.05] blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_45%,var(--background)_100%)]" />
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              A smarter way to build your business
            </div>
            <h1 className="font-heading text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-8xl">
              Your next best move is{" "}
              <span className="bg-gradient-to-r from-orange-300 via-rose-300 to-blue-300 bg-clip-text text-transparent">
                closer than you think.
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Halite helps small businesses discover useful AI tools, understand what they do, and choose where to start—with less noise and more momentum.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/app" className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80">
                Find your tools
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/context" className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-transparent px-5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground">
                See how it works
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-20 max-w-5xl rounded-2xl border border-border/80 bg-card/70 p-2 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="rounded-xl border border-border/60 bg-background/80 p-5 sm:p-8">
              <div className="mb-8 flex items-center justify-between border-b border-border/60 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkle size={18} weight="duotone" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Your AI toolkit</p>
                    <p className="text-xs text-muted-foreground">Built around your business</p>
                  </div>
                </div>
                <span className="hidden rounded-full border border-border px-3 py-1 text-xs text-muted-foreground sm:inline">
                  Personalized recommendations
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Lightning, title: "Save time", text: "Automate the busywork" },
                  { icon: FileText, title: "Get organized", text: "Make sense of your context" },
                  { icon: TrendUp, title: "Grow smarter", text: "Turn insight into action" },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="rounded-xl border border-border/70 bg-muted/20 p-4 text-left">
                      <Icon size={20} className="mb-8 text-muted-foreground" weight="duotone" />
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 lg:px-8 lg:py-28">
        <div className="relative overflow-visible rounded-2xl border border-border/80 bg-card/70 px-6 py-12 text-center shadow-xl shadow-black/10 sm:px-12">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -left-20 -top-24 size-64 rounded-full bg-primary/[0.08] blur-3xl" />
            <div className="absolute -bottom-28 -right-16 size-64 rounded-full bg-primary/[0.06] blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Let&apos;s talk</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Have a question or an idea?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
              Tell us what you&apos;re building, what&apos;s getting in the way, or what you&apos;d like to see from Halite next.
            </p>
            <ContactMenu />
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70">
        <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
          <div>
            <div>
              <Link href="/" className="flex items-center gap-3">
                <Image src="/halite.svg" alt="Halite" width={28} height={28} className="size-7 object-contain" />
                <span className="font-heading text-base font-semibold">halite</span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
                Practical AI discovery for the people building what comes next.
              </p>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Halite. Built for better next steps.</p>
            <p>Made with intention for small businesses.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
