"use client"

import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useEffect, useState } from "react"

import { NotificationBell } from "@/components/patient/notification-bell"

type NavigationLink = { href: string; label: string }

export function MobileNavigationDrawer({ links, userId, notificationsHref }: { links: NavigationLink[]; userId?: string; notificationsHref?: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [open])

  return (
    <div className="sm:hidden">
      <button type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation-drawer" onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-xl text-slate-600 transition hover:bg-teal-50 hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]">
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {open ? <div className="fixed inset-0 z-50 bg-slate-950/25" onClick={() => setOpen(false)}>
        <aside id="mobile-navigation-drawer" aria-label="Mobile navigation" className="ml-auto flex min-h-full w-[min(20rem,calc(100vw-1.25rem))] flex-col bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
            <p className="font-bold tracking-tight text-slate-900">MediBook</p>
            <button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-xl text-slate-600 transition hover:bg-teal-50 hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]" aria-label="Close navigation"><X className="size-5" aria-hidden="true" /></button>
          </div>
          <nav className="grid px-5 py-3">
            {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="border-b border-slate-100 py-4 text-base font-medium text-slate-800 transition hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]">{link.label}</Link>)}
          </nav>
          {userId && notificationsHref ? <div className="mt-auto border-t border-slate-100 p-5"><div className="flex items-center justify-between rounded-xl bg-teal-50 px-3 py-2"><span className="text-sm font-semibold text-slate-700">Notifications</span><NotificationBell userId={userId} href={notificationsHref} /></div></div> : null}
        </aside>
      </div> : null}
    </div>
  )
}
