import Link from "next/link"

import { DoctorPhoto } from "@/components/doctor-photo"
import { buttonVariants } from "@/components/ui/button"
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
  variant?: "standard" | "directory"
}

function formatFee(fee: number) {
  const amount = Number(fee)
  return Number.isFinite(amount) ? amount.toLocaleString() : "Contact clinic"
}

export function DoctorCard({ doctor, sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw", variant = "directory" }: DoctorCardProps) {
  const fullName = doctor.full_name.trim() || "Clinic doctor"
  const specialty = doctor.specialties?.name ?? "Clinic doctor"
  const photoUrl = doctor.photo_url?.trim() || null
  const bio = doctor.bio?.trim() || "Professional care tailored to your needs."
  const fee = formatFee(doctor.fee)

  if (variant === "directory") {
    const hasPhoto = Boolean(photoUrl)

    return (
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/10">
        {hasPhoto ? (
          <div className="relative h-48 overflow-hidden bg-teal-50 sm:h-52">
            <DoctorPhoto fullName={fullName} photoUrl={photoUrl} className="size-full rounded-none text-lg" sizes={sizes} />
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/20 to-transparent" />
          </div>
        ) : (
          <div className="flex items-center gap-4 border-b border-slate-100 px-5 pb-4 pt-5">
            <DoctorPhoto fullName={fullName} className="size-[72px] rounded-2xl text-base" />
            <div className="min-w-0">
              <p className="inline-flex rounded-full bg-[#CCFBF1] px-2.5 py-1 text-xs font-semibold text-[#0F766E]">{specialty}</p>
              <h2 className="mt-2 break-words text-xl font-semibold tracking-tight text-slate-900">{fullName}</h2>
            </div>
          </div>
        )}
        <div className="flex flex-1 flex-col p-5">
          {hasPhoto ? (
            <>
              <p className="inline-flex w-fit rounded-full bg-[#CCFBF1] px-2.5 py-1 text-xs font-semibold text-[#0F766E]">{specialty}</p>
              <h2 className="mt-3 break-words text-xl font-semibold tracking-tight text-slate-900">{fullName}</h2>
            </>
          ) : null}
          <p className={cn("line-clamp-2 min-h-10 text-sm leading-5 text-slate-600", hasPhoto ? "mt-3" : "mt-0")}>{bio}</p>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <span className="text-sm font-semibold text-slate-700">{fee === "Contact clinic" ? fee : `Rs. ${fee}`}</span>
            <Link href={`/doctors/${doctor.id}`} className={cn(buttonVariants(), "min-h-10 shrink-0 rounded-xl bg-[#0F766E] px-3 hover:bg-[#0D5F59]")}>View availability</Link>
          </div>
        </div>
      </article>
    )
  }

  return <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-900/10"><div className="relative aspect-[4/3] overflow-hidden bg-teal-50"><DoctorPhoto fullName={fullName} photoUrl={photoUrl} className="size-full rounded-none text-lg" sizes={sizes} /><div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/20 to-transparent" /></div><div className="flex flex-1 flex-col p-5"><p className="text-sm font-semibold text-[#0F766E]">{specialty}</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{fullName}</h2><p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{bio}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4"><span className="text-sm font-semibold text-slate-700">{fee === "Contact clinic" ? fee : `Rs. ${fee}`}</span><Link href={`/doctors/${doctor.id}`} className={cn(buttonVariants(), "shrink-0 rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]")}>View availability</Link></div></div></article>
}
