"use client"

import Link from "next/link"
import { ChevronDown, HeartPulse } from "lucide-react"
import { useId, useState } from "react"

type SiteFooterProps = {
  authenticated?: boolean
}

type FooterLink = {
  href: string
  label: string
}

const exploreLinks: FooterLink[] = [
  { href: "/doctors", label: "Find a doctor" },
  { href: "/appointments", label: "Appointments" },
  { href: "/#services", label: "Services" },
]

const mediBookLinks: FooterLink[] = [
  { href: "/#about", label: "How it works" },
]

const linkClassName =
  "rounded-sm text-sm text-teal-100/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9E96] focus-visible:ring-offset-2 focus-visible:ring-offset-[#073B3A] motion-reduce:transition-none"

function FooterLinks({ links }: { links: FooterLink[] }) {
  return (
    <div className="flex flex-col items-start gap-2">
      {links.map((link) => (
        <Link className={linkClassName} href={link.href} key={link.href}>
          {link.label}
        </Link>
      ))}
    </div>
  )
}

function MobileFooterSection({ title, links }: { title: string; links: FooterLink[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const contentId = useId()

  return (
    <section className="border-t border-white/10">
      <h2>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen((open) => !open)}
          className="flex min-h-12 w-full items-center justify-between rounded-lg py-2 text-left text-sm font-semibold text-white transition-colors hover:text-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9E96] focus-visible:ring-offset-2 focus-visible:ring-offset-[#073B3A] motion-reduce:transition-none"
        >
          {title}
          <ChevronDown
            className={`size-4 text-teal-100/75 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </h2>
      <div
        id={contentId}
        inert={!isOpen}
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pb-4 pt-1">
            <FooterLinks links={links} />
          </div>
        </div>
      </div>
    </section>
  )
}

export function SiteFooter({ authenticated = false }: SiteFooterProps) {
  const currentYear = new Date().getFullYear()
  const accountLinks = authenticated
    ? mediBookLinks
    : [...mediBookLinks, { href: "/login", label: "Log in" }, { href: "/signup", label: "Create account" }]

  return (
    <footer className="bg-[#073B3A] text-slate-300">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 md:hidden">
        <div className="max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-sm text-lg font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9E96] focus-visible:ring-offset-2 focus-visible:ring-offset-[#073B3A]"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-[#0F9E96]" aria-hidden="true">
              <HeartPulse className="size-4" />
            </span>
            MediBook
          </Link>
          <p className="mt-2 text-sm leading-5 text-teal-100/70">
            Clear, caring access to trusted clinic appointments.
          </p>
        </div>

        <div className="mt-5 border-b border-white/10">
          <MobileFooterSection title="Explore" links={exploreLinks} />
          <MobileFooterSection title="MediBook" links={accountLinks} />
        </div>
      </div>

      <div className="mx-auto hidden max-w-7xl gap-8 px-8 py-10 md:grid md:grid-cols-[1.35fr_repeat(2,minmax(0,1fr))]">
        <div className="max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-sm text-lg font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9E96] focus-visible:ring-offset-2 focus-visible:ring-offset-[#073B3A]"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-[#0F9E96]" aria-hidden="true">
              <HeartPulse className="size-5" />
            </span>
            MediBook
          </Link>
          <p className="mt-3 text-sm leading-6 text-teal-100/70">
            Clear, caring access to trusted clinic appointments. Your privacy and care always come first.
          </p>
        </div>

        <nav aria-label="Footer navigation" className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Explore</h2>
          <FooterLinks links={exploreLinks} />
        </nav>

        <nav aria-label="Footer support" className="space-y-3">
          <h2 className="text-sm font-semibold text-white">MediBook</h2>
          <FooterLinks links={accountLinks} />
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4 text-xs text-teal-100/60 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {currentYear} MediBook. All rights reserved.</p>
          <p>Care made clear.</p>
        </div>
      </div>
    </footer>
  )
}
