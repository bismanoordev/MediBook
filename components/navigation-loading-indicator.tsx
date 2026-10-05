"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

const DISPLAY_DELAY_MS = 120

/**
 * Gives every internal navigation a small, non-disruptive loading signal.
 * Route-level loading.tsx files continue to handle longer server transitions.
 */
export function NavigationLoadingIndicator() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const navigationKey = `${pathname}?${searchParams.toString()}`
  const [isLoading, setIsLoading] = useState(false)
  const delayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (delayTimeout.current) {
      clearTimeout(delayTimeout.current)
      delayTimeout.current = null
    }

    const finishTimeout = window.setTimeout(() => setIsLoading(false), 0)
    return () => window.clearTimeout(finishTimeout)
  }, [navigationKey])

  useEffect(() => {
    const stopLoading = () => {
      if (delayTimeout.current) {
        clearTimeout(delayTimeout.current)
        delayTimeout.current = null
      }
      setIsLoading(false)
    }

    const startLoadingForInternalLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) return

      const link = target.closest("a[href]")
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return

      const destination = new URL(link.href, window.location.href)
      const current = new URL(window.location.href)

      if (
        destination.origin !== current.origin ||
        (destination.pathname === current.pathname && destination.search === current.search)
      ) {
        return
      }

      if (delayTimeout.current) clearTimeout(delayTimeout.current)
      delayTimeout.current = setTimeout(() => {
        setIsLoading(true)
        delayTimeout.current = null
      }, DISPLAY_DELAY_MS)
    }

    document.addEventListener("click", startLoadingForInternalLink, true)
    window.addEventListener("popstate", stopLoading)

    return () => {
      document.removeEventListener("click", startLoadingForInternalLink, true)
      window.removeEventListener("popstate", stopLoading)
      if (delayTimeout.current) clearTimeout(delayTimeout.current)
    }
  }, [])

  if (!isLoading) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100]"
      role="status"
      aria-live="polite"
      aria-label="Loading next page"
    >
      <div className="h-1 w-full overflow-hidden bg-teal-950/15">
        <div className="h-full w-2/5 rounded-r-full bg-[#0F766E] shadow-[0_0_12px_rgba(20,184,166,0.8)] motion-safe:animate-[medibook-navigation-progress_1.1s_ease-in-out_infinite]" />
      </div>
      <span className="sr-only">Loading next page</span>
    </div>
  )
}
