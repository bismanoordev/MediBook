import Link from "next/link"
import { ArrowRight, Calendar } from "lucide-react"

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

export function getDoctorCharacter(specialty: string) {
  const normalizedSpecialty = specialty.toLocaleLowerCase()

  if (normalizedSpecialty.includes("cardio") || normalizedSpecialty.includes("heart")) return "/images/doctor-character-cardiologist.png"
  if (normalizedSpecialty.includes("dent")) return "/images/doctor-character-dentist.png"
  if (normalizedSpecialty.includes("dermat") || normalizedSpecialty.includes("skin")) return "/images/doctor-character-dermatologist.png"
  if (normalizedSpecialty.includes("paediat") || normalizedSpecialty.includes("pediat") || normalizedSpecialty.includes("child")) return "/images/doctor-character-pediatrician.png"

  return "/images/doctor-character-general.png"
}

export function DoctorCard({ doctor, sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw", variant }: DoctorCardProps) {
  const fullName = doctor.full_name.trim() || "Clinic doctor"
  const specialty = doctor.specialties?.name.trim() || "Clinic doctor"
  const photoUrl = doctor.photo_url?.trim() || null
  const bio = doctor.bio?.trim() || "Professional care tailored to your needs."
  const hasPhoto = Boolean(photoUrl)
  const characterImage = getDoctorCharacter(specialty)

  if (variant === "directory") {
    return (
      <article className="group relative flex h-full min-h-[22rem] rounded-2xl bg-white">
        <Link
          href={`/doctors/${doctor.id}`}
          aria-label={`View profile for ${fullName}`}
          className="absolute inset-0 z-0 rounded-2xl border border-slate-200 bg-white transition duration-200 group-hover:-translate-y-0.5 group-hover:border-teal-200 group-hover:shadow-md group-hover:shadow-teal-900/5 focus-visible:-translate-y-0.5 focus-visible:border-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
        >
          <span className="sr-only">View profile for {fullName}</span>
        </Link>
        <div className="pointer-events-none relative z-10 flex w-full flex-col p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="grid size-[72px] shrink-0 place-items-center rounded-full bg-[#CCFBF1] p-1.5 sm:size-[88px]">
              <DoctorPhoto fullName={fullName} photoUrl={photoUrl} className="size-full rounded-full text-sm sm:text-base" sizes="88px" />
            </div>
            <div className="min-w-0">
              <h2 className="line-clamp-2 break-words text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{fullName}</h2>
              <p className="mt-2 inline-flex max-w-full break-words rounded-full bg-[#CCFBF1] px-2.5 py-1 text-xs font-semibold text-[#0F766E]">{specialty}</p>
            </div>
          </div>

          <div className="mt-5 flex min-h-10 gap-3">
            <span aria-hidden className="w-1 shrink-0 rounded-full bg-[#0F766E]" />
            <p className="line-clamp-2 text-sm leading-5 text-slate-600">{bio}</p>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Consultation fee</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{formatFee(doctor.fee)}</p>
            </div>
            <Link
              href={`/doctors/${doctor.id}`}
              aria-label={`View availability for ${fullName}`}
              className="pointer-events-auto inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#0F766E] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#0D5F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
            >
              View availability
              <Calendar className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="h-full">
      <Link
        href={`/doctors/${doctor.id}`}
        aria-label={`View availability for ${fullName}`}
        className="group flex h-full min-h-[16rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
      >
        {hasPhoto ? (
          <div className="relative h-36 shrink-0 overflow-hidden bg-teal-50">
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
