"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, CalendarDays, CalendarRange, ClipboardPenLine, FileText, HeartPulse, LayoutDashboard } from "lucide-react"

import { AccountMenu } from "@/components/auth/account-menu"
import { MobileNavigationDrawer } from "@/components/mobile-navigation-drawer"
import { NotificationBell } from "@/components/patient/notification-bell"
import { cn } from "@/lib/utils"
import type { DoctorApprovalStatus } from "@/lib/supabase/database.types"

const navigation = [
  { href: "/doctor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctor/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/doctor/availability", label: "Availability", icon: CalendarRange },
  { href: "/doctor/profile", label: "My profile", icon: ClipboardPenLine },
  { href: "/doctor/documents", label: "Documents", icon: FileText },
  { href: "/doctor/notifications", label: "Notifications", icon: Bell },
]

function isActive(pathname: string, href: string) {
  return href === "/doctor" ? pathname === href : pathname.startsWith(href)
}

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()

  return <nav aria-label="Doctor navigation" className={cn("grid gap-1", mobile && "p-2")}>
    {navigation.map(({ href, label, icon: Icon }) => (
      <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2", isActive(pathname, href) ? "bg-[#0F766E] text-white shadow-sm" : "text-slate-600 hover:bg-teal-50 hover:text-[#0F766E]")}> 
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </Link>
    ))}
  </nav>
}

function StatusBanner({ status, reason }: { status: DoctorApprovalStatus | null; reason?: string | null }) {
  if (status === "pending") return <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-950 sm:px-8 lg:px-10"><div className="mx-auto flex max-w-7xl items-center gap-2"><span className="size-2 rounded-full bg-amber-500" aria-hidden="true" /><p><strong>Your application is under review.</strong> We&apos;ll notify you once the clinic has made a decision.</p></div></div>
  if (status === "rejected" || status === "changes_requested") return <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-950 sm:px-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><p><strong>{status === "changes_requested" ? "Changes requested." : "Your application needs attention."}</strong>{reason ? ` ${reason}` : " Update your application before submitting it again."}</p><Link href="/doctor/onboarding" className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-[#0F766E] shadow-sm ring-1 ring-red-200 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]">Return to onboarding</Link></div></div>
  return null
}

export function DoctorShell({ children, name, email, userId, approvalStatus, rejectionReason }: { children: React.ReactNode; name?: string | null; email?: string | null; userId: string; approvalStatus: DoctorApprovalStatus | null; rejectionReason?: string | null }) {
  return <div className="min-h-screen bg-[#F8FAFC]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white px-4 py-5 lg:flex lg:flex-col">
      <Link href="/doctor" className="flex items-center gap-3 rounded-xl px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"><span className="grid size-9 place-items-center rounded-xl bg-[#0F766E] text-white"><HeartPulse className="size-5" aria-hidden="true" /></span><span><span className="block font-bold tracking-tight text-slate-900">MediBook</span><span className="block text-[11px] font-medium text-slate-500">Doctor workspace</span></span></Link>
      <p className="mt-9 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
      <div className="mt-3"><NavigationLinks /></div>
      <div className="mt-auto rounded-2xl bg-teal-50 p-4"><p className="text-xs font-semibold text-[#0F766E]">Your practice, organised</p><p className="mt-1 text-xs leading-5 text-slate-600">Manage care, availability, and your professional profile in one place.</p></div>
    </aside>

    <div className="lg:pl-64">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8"><div className="flex min-w-0 items-center gap-3"><Link href="/doctor" className="flex items-center gap-2 rounded-xl font-bold tracking-tight text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] lg:hidden"><span className="grid size-8 place-items-center rounded-lg bg-[#0F766E] text-white"><HeartPulse className="size-4" aria-hidden="true" /></span>MediBook</Link><div className="hidden lg:block"><p className="text-sm font-semibold text-slate-900">Doctor workspace</p><p className="text-xs text-slate-500">Care, schedule, and profile</p></div></div><div className="flex items-center gap-2 sm:gap-3"><div className="hidden lg:block"><NotificationBell userId={userId} href="/doctor/notifications" /></div><div className="hidden lg:block"><AccountMenu userId={userId} name={name} email={email} role="doctor" /></div><MobileNavigationDrawer links={navigation.map(({ href, label }) => ({ href, label }))} userId={userId} name={name} email={email} role="doctor" notificationsHref="/doctor/notifications" desktopBreakpoint="lg" /></div></div></header>
      <StatusBanner status={approvalStatus} reason={rejectionReason} />
      {children}
    </div>
  </div>
}
