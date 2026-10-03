import Link from "next/link"

import { HeartPulse } from "lucide-react"

import { AccountMenu } from "@/components/auth/account-menu"
import { MobileNavigationDrawer } from "@/components/mobile-navigation-drawer"
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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-xl bg-[#0F766E] text-white"><HeartPulse className="size-4" aria-hidden="true" /></span>
            MediBook
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-slate-600 sm:flex">{links.map((link) => <Link key={link.href} href={link.href} className="hover:text-[#0F766E]">{link.label}</Link>)}</nav>
        </div>
        <div className="flex items-center gap-3">
          {userId ? <div className="hidden sm:block"><NotificationBell userId={userId} href={admin ? "/admin/notifications" : "/notifications"} /></div> : null}
          {userId ? <AccountMenu userId={userId} name={name} email={email} role={admin ? "admin" : "patient"} /> : null}
          <MobileNavigationDrawer links={links} userId={userId} notificationsHref={admin ? "/admin/notifications" : "/notifications"} />
        </div>
      </div>
    </header>
  )
}
