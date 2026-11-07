import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const toolGroups = [
  {
    title: "Get more customers",
    description: "Turn attention into a steady stream of new business.",
    tools: [
      {
        name: "AdCreative.ai",
        description: "Generate high-converting ads in seconds",
        category: "Marketing",
        logo: "https://cdn.simpleicons.org/hubspot/FF7A59",
      },
      {
        name: "Jasper",
        description: "Create on-brand marketing copy",
        category: "Content",
        logo: "https://cdn.simpleicons.org/jasper/FF4F00",
      },
      {
        name: "Tavily",
        description: "Research your market and competitors",
        category: "Research",
        logo: "https://cdn.simpleicons.org/perplexity/20B8CD",
      },
    ],
  },
  {
    title: "Save time on busywork",
    description: "Automate repetitive tasks so you can focus on the work that matters.",
    tools: [
      {
        name: "Zapier",
        description: "Connect your tools and automate workflows",
        category: "Automation",
        logo: "https://cdn.simpleicons.org/zapier/FF4A00",
      },
      {
        name: "Notion AI",
        description: "Organize notes, docs, and team knowledge",
        category: "Productivity",
        logo: "https://cdn.simpleicons.org/notion/FFFFFF",
      },
      {
        name: "Granola",
        description: "Turn meetings into clear next steps",
        category: "Meetings",
        logo: "https://cdn.simpleicons.org/granola/FFFFFF",
      },
    ],
  },
  {
    title: "Understand your numbers",
    description: "Make confident decisions with a clearer view of your business.",
    tools: [
      {
        name: "Fathom",
        description: "See what is driving your business forward",
        category: "Analytics",
        logo: "https://cdn.simpleicons.org/fathom/FFFFFF",
      },
      {
        name: "QuickBooks AI",
        description: "Keep your books accurate and up to date",
        category: "Finance",
        logo: "https://cdn.simpleicons.org/quickbooks/2CA01C",
      },
    ],
  },
]

function ToolRow({
  tool,
}: {
  tool: (typeof toolGroups)[number]["tools"][number]
}) {
  return (
    <div className="group flex items-center gap-4 rounded-lg border border-border/70 bg-background/30 p-3 transition-colors hover:border-border hover:bg-muted/40">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background p-2.5">
        <Image src={tool.logo} alt="" width={24} height={24} className="size-6 object-contain" unoptimized />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{tool.name}</p>
          <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground sm:inline">
            {tool.category}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{tool.description}</p>
      </div>
      <Button variant="outline" size="sm" className="shrink-0 bg-transparent">
        Explore
        <ArrowUpRight data-icon="inline-end" />
      </Button>
    </div>
  )
}

export default function App() {
  return (
    <section className="border-b border-border/70 px-5 py-8 lg:border-r lg:border-b-0 lg:px-10 lg:py-12">
          <div className="mx-auto max-w-3xl">
            <div className="mb-9">
              <p className="mb-3 text-xs font-medium tracking-wide text-primary uppercase">Your AI toolkit</p>
              <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Build a better business, <span className="text-muted-foreground">one tool at a time.</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Explore tools picked for the problems small businesses face every day. Ask Halite on the right where to start.
              </p>
            </div>

            <div className="space-y-5">
              {toolGroups.map((group) => {
                return (
                  <Card key={group.title} className="gap-0 overflow-hidden border-border/70 bg-card/60 py-0">
                    <CardHeader className="flex-row items-start justify-between gap-4 border-b border-border/60 px-5 py-5 sm:px-6">
                      <div>
                        <CardTitle className="text-base">{group.title}</CardTitle>
                        <CardDescription className="mt-1 text-xs">{group.description}</CardDescription>
                      </div>
                      <span className="hidden rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground sm:inline">
                        {group.tools.length} tools
                      </span>
                    </CardHeader>
                    <CardContent className="space-y-2.5 px-4 py-4 sm:px-5">
                      {group.tools.map((tool) => (
                        <ToolRow key={tool.name} tool={tool} />
                      ))}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
    </section>
  )
}
