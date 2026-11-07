import Image from "next/image"
import Link from "next/link"
import { AuthActions } from "@/components/auth-actions"

const navigation = [
  { label: "Home", href: "/" },
  { label: "App", href: "/app" },
  { label: "Context", href: "/context" },
  { label: "Contact", href: "/#contact" },
]

export function SiteHeader() {
  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center border-b border-border/70 bg-background/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-8">
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/halite.svg" alt="Halite" width={32} height={32} className="size-8 object-contain" />
          <span className="font-heading text-lg font-semibold tracking-tight">halite</span>
        </Link>
      </div>
      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
        {navigation.map((item) => (
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
  )
}
