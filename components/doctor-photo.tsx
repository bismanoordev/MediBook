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
  return <div className={cn("relative grid shrink-0 place-items-center overflow-hidden bg-teal-50 text-sm font-semibold text-[#0F766E]", className)}>{photoUrl && !failed ? <Image src={photoUrl} alt={`Portrait of ${fullName}`} fill priority={priority} sizes={sizes} className="object-cover object-top" onError={() => setFailed(true)} /> : <span aria-label={`${fullName} initials`}>{getDoctorInitials(fullName)}</span>}</div>
}
