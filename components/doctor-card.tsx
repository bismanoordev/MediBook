import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { DoctorPhoto } from "@/components/doctor-photo"
import { cn } from "@/lib/utils"

export type DoctorCardData = {
  id: string
  full_name: string
  bio: string | null
  fee: number
  photo_url: string | null
  specialties: { name: string } | null
}

type DoctorCardProps = {
  doctor: DoctorCardData
  sizes?: string
  variant?: "directory"
}

function formatFee(fee: number) {
  const amount = Number(fee)
  return Number.isFinite(amount) ? `Rs. ${amount.toLocaleString()}` : "Contact clinic"
}

function getDoctorCharacter(specialty: string) {
  const normalizedSpecialty = specialty.toLocaleLowerCase()

  if (normalizedSpecialty.includes("cardio") || normalizedSpecialty.includes("heart")) return "/images/doctor-character-cardiologist.png"
  if (normalizedSpecialty.includes("dent")) return "/images/doctor-character-dentist.png"
  if (normalizedSpecialty.includes("dermat") || normalizedSpecialty.includes("skin")) return "/images/doctor-character-dermatologist.png"
  if (normalizedSpecialty.includes("paediat") || normalizedSpecialty.includes("pediat") || normalizedSpecialty.includes("child")) return "/images/doctor-character-pediatrician.png"

  return "/images/doctor-character-general.png"
}

export function DoctorCard({ doctor, sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" }: DoctorCardProps) {
  const fullName = doctor.full_name.trim() || "Clinic doctor"
  const specialty = doctor.specialties?.name.trim() || "Clinic doctor"
  const photoUrl = doctor.photo_url?.trim() || null
  const bio = doctor.bio?.trim() || "Professional care tailored to your needs."
  const hasPhoto = Boolean(photoUrl)
  const characterImage = getDoctorCharacter(specialty)

  return (
    <article className="h-full">
      <Link
        href={`/doctors/${doctor.id}`}
        aria-label={`View availability for ${fullName}`}
        className="group flex h-full min-h-[23rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
      >
        {hasPhoto ? (
          <div className="relative h-52 shrink-0 overflow-hidden bg-teal-50">
            <DoctorPhoto fullName={fullName} photoUrl={photoUrl} fallbackImageUrl={characterImage} fallbackAlt={`Illustrated ${specialty} clinician`} className="size-full rounded-none text-lg" sizes={sizes} />
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/20 to-transparent" />
          </div>
        ) : (
          <div className="flex min-h-24 items-center gap-4 border-b border-slate-100 px-5 py-4">
            <DoctorPhoto fullName={fullName} fallbackImageUrl={characterImage} fallbackAlt={`Illustrated ${specialty} clinician`} className="size-16 rounded-full text-sm" sizes="64px" />
            <div className="min-w-0">
              <h2 className="break-words text-xl font-semibold tracking-tight text-slate-900">{fullName}</h2>
              <p className="mt-1 line-clamp-2 w-fit max-w-full break-words rounded-full bg-[#CCFBF1] px-2.5 py-1 text-xs font-semibold text-[#0F766E]">{specialty}</p>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col p-5">
          {hasPhoto ? (
            <div>
              <h2 className="break-words text-xl font-semibold tracking-tight text-slate-900">{fullName}</h2>
              <p className="mt-2 inline-flex max-w-full break-words rounded-full bg-[#CCFBF1] px-2.5 py-1 text-xs font-semibold text-[#0F766E]">{specialty}</p>
            </div>
          ) : null}
          <p className={cn("line-clamp-2 min-h-10 text-sm leading-5 text-slate-600", hasPhoto ? "mt-4" : "mt-0")}>{bio}</p>
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <span className="text-sm font-semibold text-slate-700">{formatFee(doctor.fee)}</span>
            <span className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#0F766E] px-3 text-sm font-semibold text-white transition group-hover:bg-[#0D5F59] group-focus-visible:bg-[#0D5F59]">
              View availability
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
