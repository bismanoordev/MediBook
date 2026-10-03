"use client"

import Link from "next/link"
import { HeartPulse } from "lucide-react"

import { AccountMenu } from "@/components/auth/account-menu"
import { MobileNavigationDrawer } from "@/components/mobile-navigation-drawer"
import { NotificationBell } from "@/components/patient/notification-bell"
import { buttonVariants } from "@/components/ui/button"
import type { UserRole } from "@/lib/auth"
import { cn } from "@/lib/utils"

type LandingHeaderProps = { userId?: string; name?: string | null; email?: string | null; role?: UserRole | null }

const guestLinks = [
  { href: "/doctors", label: "Find a doctor" },
  { href: "#services", label: "Services" },
  { href: "#about", label: "Why MediBook" },
  { href: "#team", label: "Our team" },
]

const patientLinks = [
  { href: "/doctors", label: "Doctors" },
  { href: "/appointments", label: "My appointments" },
  { href: "/profile", label: "Profile" },
]

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/doctors", label: "Doctors" },
  { href: "/admin/appointments", label: "Appointments" },
  { href: "/admin/patients", label: "Patients" },
]

export function LandingHeader({ userId, name, email, role }: LandingHeaderProps) {
  const authenticated = Boolean(userId && role)
  const admin = role === "admin"
  const links = authenticated ? (admin ? adminLinks : patientLinks) : guestLinks
  const mobileLinks = authenticated
    ? (admin ? adminLinks : [{ href: "/", label: "Home" }, { href: "/doctors", label: "Find a doctor" }, { href: "/appointments", label: "My appointments" }, { href: "/profile", label: "Profile" }])
    : [
        { href: "/doctors", label: "Find a doctor" },
        { href: "#services", label: "Services" },
        { href: "#about", label: "Why MediBook" },
        { href: "#team", label: "Our team" },
      ]

  return (
    <header className="sticky top-0 z-40 mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 bg-[#E7F7F5]/95 px-5 backdrop-blur sm:px-8">
      <Link href="/" className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight">
        <span className="grid size-9 place-items-center rounded-xl bg-[#0F766E] text-white"><HeartPulse className="size-5" /></span>
        <span>MediBook<span className="block text-[9px] font-medium tracking-[.14em] text-[#0F766E]">YOUR CARE, CLEARLY</span></span>
      </Link>
      <nav aria-label="Primary navigation" className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex">
        {links.map((link) => <Link key={link.href} href={link.href} className="transition hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F766E]">{link.label}</Link>)}
      </nav>
      <div className="flex items-center gap-2">
        {authenticated ? (
          <>
            <div className="hidden lg:block"><NotificationBell userId={userId!} href={admin ? "/admin/notifications" : "/notifications"} /></div>
            <div className="hidden lg:block"><AccountMenu userId={userId!} name={name} email={email} role={admin ? "admin" : "patient"} /></div>
          </>
        ) : (
          <>
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "hidden rounded-xl lg:inline-flex")}>Log in</Link>
            <Link href="/signup" className={cn(buttonVariants(), "hidden rounded-xl bg-[#0F766E] hover:bg-[#0D5F59] lg:inline-flex")}>Get started</Link>
          </>
        )}
        <MobileNavigationDrawer
          links={mobileLinks}
          userId={userId}
          name={name}
          email={email}
          role={admin ? "admin" : authenticated ? "patient" : undefined}
          notificationsHref={admin ? "/admin/notifications" : "/notifications"}
          desktopBreakpoint="lg"
          headerOffset="20"
        />
      </div>
    </header>
  )
}
