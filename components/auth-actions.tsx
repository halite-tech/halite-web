"use client"

import { ArrowRight } from "@phosphor-icons/react"
import { SignInButton, UserButton, useAuth, useUser } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { Button } from "@/components/ui/button"

export function AuthActions() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return <div className="size-8 animate-pulse rounded-full bg-muted" aria-hidden="true" />
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-full border-primary/30 bg-primary/10 px-4 text-primary hover:bg-primary/20 hover:text-primary"
        >
          Log in
          <ArrowRight data-icon="inline-end" />
        </Button>
      </SignInButton>
    )
  }

  return (
    <div className="relative flex size-8 items-center justify-center">
      <div
        className="size-8 shrink-0 rounded-full bg-cover bg-center"
        style={{ backgroundImage: user?.imageUrl ? `url(${user.imageUrl})` : undefined }}
        aria-hidden="true"
      >
        {!user?.imageUrl && (
          <span className="flex size-full items-center justify-center rounded-full bg-muted text-xs font-medium">
            {(user?.firstName?.[0] ?? "A").toUpperCase()}
          </span>
        )}
      </div>
      <UserButton
        appearance={{
          theme: dark,
          elements: {
            rootBox: "absolute inset-0 z-10 size-full",
            userButtonTrigger: "size-full rounded-full opacity-0",
            avatarBox: "size-full opacity-0",
            userButtonPopoverCard: "bg-card border-border",
          },
        }}
      />
    </div>
  )
}
