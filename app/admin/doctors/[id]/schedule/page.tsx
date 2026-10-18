import Link from "next/link"
import { notFound } from "next/navigation"

import { addAdminDoctorAvailability, removeAdminDoctorAvailability, updateAdminDoctorAvailability } from "@/app/admin/actions"
import { AvailabilityManager } from "@/components/doctor/availability-manager"
import { isoDate, pakistanBookingWindowEnd, pakistanToday } from "@/lib/slots"
import { createClient } from "@/lib/supabase/server"

export default async function DoctorSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const minDate = isoDate(pakistanToday())
  const maxDate = isoDate(pakistanBookingWindowEnd())
  const [{ data: doctor }, { data: overrides, error }] = await Promise.all([
    supabase.from("doctors").select("id,full_name").eq("id", id).maybeSingle(),
    supabase.from("doctor_availability_overrides").select("id,override_date,start_time,end_time,slot_minutes").eq("doctor_id", id).gte("override_date", minDate).lte("override_date", maxDate).order("override_date"),
  ])
  if (!doctor) notFound()

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <Link href="/admin/doctors" className="text-sm font-semibold text-[#0F766E] hover:underline">← Doctors</Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[.18em] text-[#0F766E]">Availability</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{doctor.full_name}</h1>
      <p className="mt-2 text-slate-600">Patients can book this doctor only on the dates opened below.</p>
      {error ? <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t load this doctor&apos;s dates. Please refresh and try again.</p> : null}
      <div className="mt-8">
        <AvailabilityManager
          overrides={overrides ?? []}
          minDate={minDate}
          maxDate={maxDate}
          title="Doctor availability"
          description="Choose the dates this doctor will see patients, then set the hours."
          actions={{
            add: addAdminDoctorAvailability.bind(null, id),
            update: updateAdminDoctorAvailability.bind(null, id),
            remove: removeAdminDoctorAvailability.bind(null, id),
          }}
        />
      </div>
    </main>
  )
}
