"use client"

import Image from "next/image"
import { useState } from "react"

import { cn } from "@/lib/utils"

export function getDoctorInitials(fullName: string) {
  const names = fullName.trim().split(/\s+/).filter((name) => !/^dr\.?$/i.test(name))
  if (names.length === 1) return names[0].slice(0, 2).toUpperCase()
  return names.slice(0, 2).map((name) => name[0]).join("").toUpperCase() || "DR"
}

type DoctorPhotoProps = { fullName: string; photoUrl?: string | null; className?: string; sizes?: string; priority?: boolean }

export function DoctorPhoto({ fullName, photoUrl, className, sizes, priority }: DoctorPhotoProps) {
  const [failed, setFailed] = useState(false)
  return <div className={cn("relative grid shrink-0 place-items-center overflow-hidden bg-teal-50 text-sm font-semibold text-[#0F766E]", className)}>{photoUrl && !failed ? <Image src={photoUrl} alt={`Portrait of ${fullName}`} fill priority={priority} sizes={sizes} className="object-cover object-top" onError={() => setFailed(true)} /> : <><span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(255,255,255,.32),transparent_22%),linear-gradient(145deg,#0F766E,#10B8AD)]" /><span aria-hidden className="absolute -bottom-1/4 -left-1/4 size-3/4 rounded-full border-[18px] border-white/15" /><span aria-label={`${fullName} initials`} className="relative grid size-[52%] place-items-center rounded-[30%] border border-white/30 bg-white/15 font-bold text-white shadow-lg backdrop-blur-sm">{getDoctorInitials(fullName)}</span></>}</div>
}
