import Link from "next/link"

import { Menu } from "lucide-react"

import { AccountMenu } from "@/components/auth/account-menu"
import { NotificationBell } from "@/components/patient/notification-bell"

type AppHeaderProps = {
  name?: string | null
  email?: string | null
  admin?: boolean
  userId?: string
}

export function AppHeader({ name, email, admin = false, userId }: AppHeaderProps) {
  const links = admin
    ? [{ href: "/admin", label: "Dashboard" }, { href: "/admin/doctors", label: "Doctors" }, { href: "/admin/appointments", label: "Appointments" }, { href: "/admin/patients", label: "Patients" }]
    : [{ href: "/doctors", label: "Doctors" }, { href: "/appointments", label: "Appointments" }, { href: "/profile", label: "Profile" }]

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-xl bg-[#0F766E] text-sm text-white">M</span>
            MediBook
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-slate-600 sm:flex">{links.map((link) => <Link key={link.href} href={link.href} className="hover:text-[#0F766E]">{link.label}</Link>)}</nav>
        </div>
        <div className="flex items-center gap-3">
          {userId ? <NotificationBell userId={userId} href={admin ? "/admin/notifications" : "/notifications"} /> : null}
          <AccountMenu name={name} email={email} role={admin ? "admin" : "patient"} />
          <details className="relative sm:hidden"><summary className="grid size-9 cursor-pointer list-none place-items-center rounded-xl text-slate-600 hover:bg-teal-50 hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]"><Menu className="size-5" /><span className="sr-only">Open navigation</span></summary><nav className="absolute right-0 top-11 z-30 grid w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">{links.map((link) => <Link key={link.href} href={link.href} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-[#0F766E]">{link.label}</Link>)}</nav></details>
        </div>
      </div>
    </header>
  )
}
