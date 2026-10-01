"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, CalendarDays, Menu, Stethoscope, Users } from "lucide-react"

import { LogoutButton } from "@/components/auth/logout-button"
import { NotificationBell } from "@/components/patient/notification-bell"
import { cn } from "@/lib/utils"

const navigation = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/admin/patients", label: "Patients", icon: Users },
]

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href)
}

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin navigation" className={cn("grid gap-1", mobile && "p-2")}>
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href)

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2",
              active ? "bg-[#0F766E] text-white shadow-sm" : "text-slate-600 hover:bg-teal-50 hover:text-[#0F766E]",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminShell({ children, name, userId }: { children: React.ReactNode; name?: string | null; userId: string }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white px-4 py-5 lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]">
          <span className="grid size-9 place-items-center rounded-xl bg-[#0F766E] text-sm font-bold text-white">M</span>
          <span><span className="block font-bold tracking-tight text-slate-900">MediBook</span><span className="block text-[11px] font-medium text-slate-500">Clinic administration</span></span>
        </Link>
        <p className="mt-9 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        <div className="mt-3"><NavigationLinks /></div>
        <div className="mt-auto rounded-2xl bg-teal-50 p-4">
          <p className="text-xs font-semibold text-[#0F766E]">Secure admin area</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">Manage clinic activity and appointments with care.</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/" className="flex items-center gap-2 rounded-xl font-bold tracking-tight text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] lg:hidden">
                <span className="grid size-8 place-items-center rounded-lg bg-[#0F766E] text-xs text-white">M</span>
                MediBook
              </Link>
              <div className="hidden lg:block"><p className="text-sm font-semibold text-slate-900">Clinic operations</p><p className="text-xs text-slate-500">Overview and today&apos;s activity</p></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden max-w-40 truncate text-sm text-slate-600 sm:inline">{name ?? "Administrator"}</span>
              <NotificationBell userId={userId} href="/admin/notifications" />
              <LogoutButton />
              <details className="relative lg:hidden">
                <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-xl text-slate-600 hover:bg-teal-50 hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]"><Menu className="size-5" /><span className="sr-only">Open admin navigation</span></summary>
                <div className="absolute right-0 top-11 z-40 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl"><NavigationLinks mobile /></div>
              </details>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
