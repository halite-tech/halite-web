import { cn } from "cn"
import type { HTMLAttributes } from "react"

function Message({ className, align = "start", ...props }: HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" }) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn("flex w-full gap-3", align === "end" && "justify-end", className)}
      {...props}
    />
  )
}

function MessageContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="message-content" className={cn("flex min-w-0 flex-col gap-2", className)} {...props} />
}

function MessageFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="message-footer" className={cn("flex items-center gap-1", className)} {...props} />
}

export { Message, MessageContent, MessageFooter }
