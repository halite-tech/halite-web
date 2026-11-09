"use client"

import { useAuth } from "@clerk/nextjs"
import { useEffect } from "react"
import { setAuthTokenProvider } from "@/lib/backend"

export function BackendAuth() {
  const { getToken, isLoaded } = useAuth()

  useEffect(() => {
    if (!isLoaded) return
    setAuthTokenProvider(() => getToken())
    return () => setAuthTokenProvider(null)
  }, [getToken, isLoaded])

  return null
}
