import Link from "next/link"
import { HeartPulse } from "lucide-react"

type SiteFooterProps = {
  authenticated?: boolean
}

const linkClassName =
  "rounded-sm text-sm text-teal-100/75 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9E96] focus-visible:ring-offset-2 focus-visible:ring-offset-[#073B3A]"

export function SiteFooter({ authenticated = false }: SiteFooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#073B3A] text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1.35fr_repeat(2,minmax(0,1fr))]">
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
          <div className="flex flex-col items-start gap-2">
            <Link className={linkClassName} href="/doctors">Find a doctor</Link>
            <Link className={linkClassName} href="/appointments">Appointments</Link>
            <Link className={linkClassName} href="/#services">Services</Link>
          </div>
        </nav>

        <nav aria-label="Footer support" className="space-y-3">
          <h2 className="text-sm font-semibold text-white">MediBook</h2>
          <div className="flex flex-col items-start gap-2">
            <Link className={linkClassName} href="/#about">How it works</Link>
            {!authenticated && (
              <>
                <Link className={linkClassName} href="/login">Log in</Link>
                <Link className={linkClassName} href="/signup">Create account</Link>
              </>
            )}
          </div>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4 text-xs text-teal-100/60 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {currentYear} MediBook. All rights reserved.</p>
          <p>Care made clear.</p>
        </div>
      </div>
    </footer>
  )
}
