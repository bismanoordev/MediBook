"use client"

import Link from "next/link"
import { HeartPulse, Menu, X } from "lucide-react"
import { useState } from "react"

import { AccountMenu } from "@/components/auth/account-menu"
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
  const [open, setOpen] = useState(false)
  const authenticated = Boolean(userId && role)
  const admin = role === "admin"
  const links = authenticated ? (admin ? adminLinks : patientLinks) : guestLinks
  const logoHref = "/"

  return <header className="relative z-20 mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8"><Link href={logoHref} className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-[#0F766E] text-white"><HeartPulse className="size-5" /></span><span>MediBook<span className="block text-[9px] font-medium tracking-[.14em] text-[#0F766E]">YOUR CARE, CLEARLY</span></span></Link><nav aria-label="Primary navigation" className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex">{links.map((link) => <Link key={link.href} href={link.href} className="transition hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F766E]">{link.label}</Link>)}</nav><div className="flex items-center gap-2">{authenticated ? <><NotificationBell userId={userId!} href={admin ? "/admin/notifications" : "/notifications"} /><AccountMenu userId={userId!} name={name} email={email} role={admin ? "admin" : "patient"} /></> : <><Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "hidden rounded-xl sm:inline-flex")}>Log in</Link><Link href="/signup" className={cn(buttonVariants(), "hidden rounded-xl bg-[#0F766E] hover:bg-[#0D5F59] sm:inline-flex")}>Get started</Link></>}<button type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-controls="landing-mobile-navigation" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="grid size-10 place-items-center rounded-xl border border-teal-800/10 text-[#0F766E] transition hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] lg:hidden">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button></div>{open ? <nav id="landing-mobile-navigation" aria-label="Mobile navigation" className="absolute inset-x-5 top-[calc(100%+0.5rem)] grid gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:inset-x-8 lg:hidden">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]">{link.label}</Link>)}{authenticated ? null : <div className="grid gap-2 border-t border-slate-100 pt-3 sm:hidden"><Link href="/login" onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>Log in</Link><Link href="/signup" onClick={() => setOpen(false)} className={cn(buttonVariants(), "rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]")}>Get started</Link></div>}</nav> : null}</header>
}
