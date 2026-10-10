"use client"

import { useEffect, useRef, useState } from "react"

type DoctorAboutProps = {
  bio: string | null
}

export function DoctorAbout({ bio }: DoctorAboutProps) {
  const [expanded, setExpanded] = useState(false)
  const [canExpand, setCanExpand] = useState(false)
  const bioRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const element = bioRef.current
    if (!bio || !element) return

    const checkOverflow = () => setCanExpand(element.scrollHeight > element.clientHeight + 1)
    checkOverflow()
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(element)

    return () => observer.disconnect()
  }, [bio, expanded])

  return (
    <section className="mt-4 min-w-0">
      <h2 className="text-xs font-semibold uppercase tracking-[.14em] text-slate-500">About</h2>
      <p ref={bioRef} className={`mt-2 break-words text-sm leading-relaxed text-slate-600 ${bio ? expanded ? "whitespace-pre-wrap" : "line-clamp-3" : ""}`}>
        {bio ?? "Professional, patient-centered care."}
      </p>
      {bio && canExpand ? <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className="mt-1 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-[#0F766E] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">{expanded ? "Show less" : "Read more"}</button> : null}
    </section>
  )
}
