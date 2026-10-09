"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, HeartPulse, Menu, X } from "lucide-react"
import { createPortal } from "react-dom"
import { useEffect, useId, useRef, useState } from "react"

import { AccountMenu } from "@/components/auth/account-menu"
import { NotificationBell } from "@/components/patient/notification-bell"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type NavigationLink = { href: string; label: string }

type MobileNavigationDrawerProps = {
  links: NavigationLink[]
  userId?: string
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
  role?: "patient" | "doctor" | "admin"
  notificationsHref?: string
  desktopBreakpoint?: "sm" | "lg"
  headerOffset?: "16" | "20"
}

export function MobileNavigationDrawer({ links, userId, name, email, avatarUrl, role, notificationsHref, desktopBreakpoint = "sm", headerOffset = "16" }: MobileNavigationDrawerProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const drawerId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const previousOverflow = useRef("")
  const authenticated = Boolean(userId && role)

  useEffect(() => {
    setMounted(true)
  }, [])

  function closeDrawer(restoreFocus = true) {
    setOpen(false)
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus())
  }

  useEffect(() => {
    if (!open) return

    previousOverflow.current = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeDrawer()

      if (event.key === "Tab") {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
        if (!focusable?.length) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow.current
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  return (
    <div className={desktopBreakpoint === "lg" ? "lg:hidden" : "sm:hidden"}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls={drawerId}
        onClick={() => (open ? closeDrawer(false) : setOpen(true))}
        className="grid size-11 place-items-center rounded-xl text-slate-600 transition hover:bg-teal-50 hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {mounted && open
        ? createPortal(
            <div
              className={`${desktopBreakpoint === "lg" ? "lg:hidden" : "sm:hidden"} ${headerOffset === "20" ? "fixed inset-x-0 bottom-0 top-20 z-50 bg-slate-950/15" : "fixed inset-x-0 bottom-0 top-16 z-50 bg-slate-950/15"}`}
              onPointerDown={() => closeDrawer()}
            >
              <aside
                ref={drawerRef}
                id={drawerId}
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation"
                className="flex h-full w-full flex-col overflow-y-auto rounded-b-2xl border-b border-slate-200 bg-white"
                onPointerDown={(event) => event.stopPropagation()}
              >
            <div className="flex min-h-16 items-center justify-between border-b border-slate-100 px-5">
              <Link href="/" onClick={() => closeDrawer(false)} className="flex items-center gap-2 font-bold tracking-tight text-slate-900">
                <span className="grid size-8 place-items-center rounded-xl bg-[#0F766E] text-white"><HeartPulse className="size-4" aria-hidden="true" /></span>
                MediBook
              </Link>
              <button
                ref={closeRef}
                type="button"
                onClick={() => closeDrawer()}
                className="grid size-11 place-items-center rounded-xl text-slate-600 transition hover:bg-teal-50 hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]"
                aria-label="Close navigation"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="px-5 py-2" aria-label="Mobile navigation links">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => closeDrawer(false)}
                  aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined}
                  className={`flex min-h-12 items-center border-b border-slate-100 py-3 text-base font-medium transition hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0F766E] ${pathname === link.href || pathname.startsWith(`${link.href}/`) ? "text-[#0F766E]" : "text-slate-800"}`}
                >
                  {link.label}
                </Link>
              ))}
              {authenticated && notificationsHref ? (
                <Link
                  href={notificationsHref}
                  onClick={() => closeDrawer(false)}
                  className="flex min-h-12 items-center gap-2 border-b border-slate-100 py-3 text-base font-medium text-slate-800 transition hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0F766E]"
                >
                  <Bell className="size-4 text-[#0F766E]" aria-hidden="true" />
                  Notifications
                </Link>
              ) : null}
            </nav>

            <div className="mt-auto border-t border-slate-100 bg-[#F8FAFC] px-5 py-4">
              {authenticated && userId && role && notificationsHref ? (
                <div className="flex items-center justify-between gap-3">
                  <AccountMenu userId={userId} name={name} email={email} role={role} avatarUrl={avatarUrl} />
                  <NotificationBell userId={userId} href={notificationsHref} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login" onClick={() => closeDrawer(false)} className={cn(buttonVariants({ variant: "outline" }), "min-h-12 rounded-xl border-slate-200 bg-white text-slate-800 hover:bg-teal-50 hover:text-[#0F766E]")}>Log in</Link>
                  <Link href="/signup" onClick={() => closeDrawer(false)} className={cn(buttonVariants(), "min-h-12 rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]")}>Create account</Link>
                </div>
              )}
            </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
