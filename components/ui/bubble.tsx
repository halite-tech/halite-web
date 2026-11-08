import { cn } from "cn"
import type { HTMLAttributes } from "react"

function Bubble({ className, align = "start", ...props }: HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" }) {
  return (
    <div
      data-slot="bubble"
      data-align={align}
      className={cn(
        "max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-6",
        align === "end" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted/60",
        className
      )}
      {...props}
    />
  )
}

function BubbleContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="bubble-content" className={cn("whitespace-pre-wrap", className)} {...props} />
}

export { Bubble, BubbleContent }
