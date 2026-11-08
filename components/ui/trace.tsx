import { CaretDown, Check, CircleNotch } from "@phosphor-icons/react"
import { cn } from "cn"
import { useState, type HTMLAttributes, type ReactNode } from "react"

function Trace({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="trace" className={cn("w-full", className)} {...props} />
}

function TraceLine({ className, status, children, ...props }: HTMLAttributes<HTMLDivElement> & { status?: "running" }) {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)} {...props}>
      {children}
      {status === "running" && <span className="ml-1 inline-flex size-1.5 animate-pulse rounded-full bg-primary" />}
    </div>
  )
}

function TraceIcon({ className, children }: { className?: string; children?: ReactNode }) {
  return <span className={cn("flex size-5 items-center justify-center text-primary", className)}>{children}</span>
}

function TraceTitle({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("font-medium", className)} {...props} />
}

function TraceCollapsible({
  className,
  open,
  defaultOpen,
  onOpenChange,
  children,
}: Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode | ((state: { open: boolean; setOpen: (open: boolean) => void }) => ReactNode)
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
  const isOpen = open ?? uncontrolledOpen
  function setOpen(value: boolean) {
    if (open === undefined) setUncontrolledOpen(value)
    onOpenChange?.(value)
  }
  return (
    <div data-slot="trace-collapsible" data-open={isOpen} className={cn("rounded-lg", className)}>
      {typeof children === "function" ? children({ open: isOpen, setOpen }) : children}
    </div>
  )
}

function TraceCollapsibleTrigger({ className, ...props }: HTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cn("flex w-full items-center text-left", className)} {...props} />
}

function TraceCollapsibleContent({ className, open = true, ...props }: HTMLAttributes<HTMLDivElement> & { open?: boolean }) {
  return open ? <div className={cn("mt-2 border-l border-border/70 pl-7 text-xs leading-5 text-muted-foreground", className)} {...props} /> : null
}

function TraceStatusIcon({ running = false }: { running?: boolean }) {
  return running ? <CircleNotch className="size-4 animate-spin" /> : <Check className="size-4" />
}

function TraceToggleIcon({ open }: { open: boolean }) {
  return <CaretDown className={cn("size-3 transition-transform", !open && "-rotate-90")} />
}

export {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceStatusIcon,
  TraceTitle,
  TraceToggleIcon,
}
